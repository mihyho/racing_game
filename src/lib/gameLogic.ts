import type { GearMode, Grade, MapDef, RaceState, Vehicle, WeatherDef, WeatherId } from '@/types/game';
import { GEAR_COUNT, POWER_MULT, SPEED_FRAC } from './gearTable';
import { generateTerrain, gradeAt } from './terrain';
import { WEATHERS } from './weather';

const FLAT_THRESHOLD = 0.05;
const SPEED_SMOOTHING = 0.18;
const EVENT_SPEED_PENALTY = 0.45;
const RECOVER_MIN = 0.8;
const RECOVER_MAX = 6;
const TRACK_LENGTH = 1000;

// Downhill grades give a speed bonus instead of the uphill power/steepness cost.
const DOWNHILL_BONUS_SCALE = 0.4;
const DOWNHILL_SPEED_CAP_RATIO = 1.25;

// Hazard-light reaction minigame: an event opens a reaction window sized by how
// fast the car was going when it happened. Missing the window causes a crash
// that stalls the car for CRASH_DURATION seconds.
const HAZARD_WINDOW_MAX = 2.4; // seconds allowed to react at speed 0
const HAZARD_WINDOW_MIN = 0.6; // seconds allowed to react at topSpeed
const CRASH_DURATION = 2.5;

// Narrow-road maps (alley): quietly cap target speed at map.speedCap, but if
// actual speed still overshoots it by a lot, that's a "hit" — flash a warning
// and brake hard for a moment.
const COLLISION_TRIGGER_RATIO = 1.15;
const COLLISION_IMPACT_TARGET_RATIO = 0.5;
const COLLISION_HOLD_TARGET_RATIO = 0.7;
const COLLISION_DURATION = 1.2;

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function targetSpeedForGear(car: Vehicle, gearIdx: number, grade: number): number {
  const powerMult = POWER_MULT[gearIdx];
  const speedFrac = SPEED_FRAC[gearIdx];
  if (grade > FLAT_THRESHOLD) {
    const effPower = car.power * powerMult;
    const need = grade * 1.3;
    const ratio = Math.min(effPower / need, 1.3);
    return Math.min(car.topSpeed * speedFrac, car.topSpeed * ratio * 0.8);
  }
  if (grade < -FLAT_THRESHOLD) {
    const boost = 1 + Math.min(-grade, 1) * DOWNHILL_BONUS_SCALE;
    return Math.min(car.topSpeed * DOWNHILL_SPEED_CAP_RATIO, car.topSpeed * speedFrac * boost);
  }
  return car.topSpeed * speedFrac;
}

export function bestAutoGear(car: Vehicle, grade: number): { gearIdx: number; target: number } {
  let bestIdx = 0;
  let bestTarget = -Infinity;
  for (let gearIdx = 0; gearIdx < GEAR_COUNT; gearIdx++) {
    const target = targetSpeedForGear(car, gearIdx, grade);
    if (target > bestTarget) {
      bestTarget = target;
      bestIdx = gearIdx;
    }
  }
  return { gearIdx: bestIdx, target: bestTarget };
}

export function hazardWindowFor(speed: number, topSpeed: number): number {
  const ratio = clamp(speed / topSpeed, 0, 1);
  return HAZARD_WINDOW_MAX + (HAZARD_WINDOW_MIN - HAZARD_WINDOW_MAX) * ratio;
}

function resolveGrade(time: number): Grade {
  if (time < 45) return 'S';
  if (time < 65) return 'A';
  if (time < 90) return 'B';
  return 'C';
}

export function createInitialRaceState(options: {
  map: MapDef;
  gearMode?: GearMode;
  weatherId?: WeatherId;
  rng?: () => number;
}): RaceState {
  const { map, gearMode = 'auto', weatherId = 'clear', rng = Math.random } = options;
  return {
    distance: 0,
    speed: 0,
    gearMode,
    activeGearIdx: 0,
    weatherId,
    terrain: generateTerrain(map, rng),
    currentGrade: 0,
    time: 0,
    eventActive: false,
    eventKind: null,
    recoverElapsed: 0,
    recoverDuration: 0,
    laneOffset: 0,
    eventsCount: 0,
    hazardActive: false,
    hazardElapsed: 0,
    hazardWindow: 0,
    crashed: false,
    crashElapsed: 0,
    crashDuration: 0,
    crashCount: 0,
    collisionActive: false,
    collisionElapsed: 0,
    collisionCount: 0,
    finished: false,
    grade: null,
  };
}

export function tick(
  state: RaceState,
  car: Vehicle,
  map: MapDef,
  dtSec: number,
  rng: () => number = Math.random,
  weather: WeatherDef = WEATHERS.clear
): RaceState {
  if (state.finished) return state;

  if (state.crashed) {
    const crashElapsed = state.crashElapsed + dtSec;
    const time = state.time + dtSec;
    if (crashElapsed >= state.crashDuration) {
      return { ...state, crashed: false, crashElapsed: 0, speed: 0, time };
    }
    return { ...state, crashElapsed, speed: 0, time };
  }

  const distanceFrac = clamp(state.distance / TRACK_LENGTH, 0, 1);
  const grade = gradeAt(state.terrain, distanceFrac);

  const activeGearIdx =
    state.gearMode === 'auto'
      ? bestAutoGear(car, grade).gearIdx
      : clamp(Math.round(state.gearMode), 0, GEAR_COUNT - 1);

  let target = targetSpeedForGear(car, activeGearIdx, grade);
  target *= weather.speedMultiplier;
  if (weather.snowPowerPenalty > 0 && grade > FLAT_THRESHOLD) {
    const powerDeficiency = clamp(1 - car.power, 0, 1);
    target *= clamp(1 - powerDeficiency * weather.snowPowerPenalty * grade, 0, 1);
  }

  let eventActive = state.eventActive;
  let eventKind = state.eventKind;
  let recoverElapsed = state.recoverElapsed;
  let recoverDuration = state.recoverDuration;
  let laneOffset = state.laneOffset;
  let eventsCount = state.eventsCount;
  let hazardActive = state.hazardActive;
  let hazardElapsed = state.hazardElapsed;
  let hazardWindow = state.hazardWindow;
  let crashed = false;
  let crashElapsed = state.crashElapsed;
  let crashDuration = state.crashDuration;
  let crashCount = state.crashCount;
  let justTriggered = false;

  if (!eventActive && rng() < map.eventChance) {
    eventActive = true;
    eventKind = map.eventKinds[Math.floor(rng() * map.eventKinds.length)];
    const magnitude = 0.7 + rng() * 0.3;
    const sign = rng() < 0.5 ? -1 : 1;
    laneOffset = sign * magnitude;
    recoverElapsed = 0;
    recoverDuration = clamp(
      (map.baseRecoverTime * (state.speed / car.topSpeed)) / car.handling,
      RECOVER_MIN,
      RECOVER_MAX
    );
    eventsCount += 1;
    justTriggered = true;
    hazardActive = true;
    hazardElapsed = 0;
    hazardWindow = hazardWindowFor(state.speed, car.topSpeed) * weather.hazardWindowMultiplier;
  }

  if (hazardActive) {
    hazardElapsed += dtSec;
    if (hazardElapsed >= hazardWindow) {
      hazardActive = false;
      hazardElapsed = 0;
      hazardWindow = 0;
      crashed = true;
      crashElapsed = 0;
      crashDuration = CRASH_DURATION;
      crashCount += 1;
      eventActive = false;
      eventKind = null;
      recoverElapsed = 0;
      laneOffset = 0;
    }
  }

  if (eventActive) {
    recoverElapsed += dtSec;
    target *= EVENT_SPEED_PENALTY;
    if (!justTriggered) {
      laneOffset = laneOffset * (1 - dtSec / recoverDuration);
    }
    if (recoverElapsed >= recoverDuration) {
      eventActive = false;
      eventKind = null;
      recoverElapsed = 0;
      laneOffset = 0;
    }
  }

  let collisionActive = state.collisionActive;
  let collisionElapsed = state.collisionElapsed;
  let collisionCount = state.collisionCount;
  if (map.speedCap) {
    target = Math.min(target, map.speedCap);
    if (!collisionActive && state.speed > map.speedCap * COLLISION_TRIGGER_RATIO) {
      collisionActive = true;
      collisionElapsed = 0;
      collisionCount += 1;
      target = Math.min(target, map.speedCap * COLLISION_IMPACT_TARGET_RATIO);
    } else if (collisionActive) {
      target = Math.min(target, map.speedCap * COLLISION_HOLD_TARGET_RATIO);
    }
  }
  if (collisionActive && !crashed) {
    collisionElapsed += dtSec;
    if (collisionElapsed >= COLLISION_DURATION) {
      collisionActive = false;
      collisionElapsed = 0;
    }
  }

  const speed = crashed ? 0 : state.speed + (target - state.speed) * SPEED_SMOOTHING;
  let distance = state.distance + speed * dtSec * 0.5;
  const time = state.time + dtSec;

  let finished = false;
  let resultGrade: Grade | null = null;
  if (distance >= TRACK_LENGTH) {
    distance = TRACK_LENGTH;
    finished = true;
    resultGrade = resolveGrade(time);
    eventActive = false;
    eventKind = null;
    laneOffset = 0;
  }

  return {
    distance,
    speed,
    gearMode: state.gearMode,
    activeGearIdx,
    weatherId: state.weatherId,
    terrain: state.terrain,
    currentGrade: grade,
    time,
    eventActive,
    eventKind,
    recoverElapsed,
    recoverDuration,
    laneOffset,
    eventsCount,
    hazardActive,
    hazardElapsed,
    hazardWindow,
    crashed,
    crashElapsed,
    crashDuration,
    crashCount,
    collisionActive,
    collisionElapsed,
    collisionCount,
    finished,
    grade: resultGrade,
  };
}
