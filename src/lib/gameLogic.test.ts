import { describe, expect, it } from 'vitest';
import { bestAutoGear, createInitialRaceState, hazardWindowFor, targetSpeedForGear, tick } from './gameLogic';
import { MAPS } from './maps';
import { VEHICLES } from './vehicles';
import { WEATHERS } from './weather';

const noEvent = () => 1; // rng that never triggers an event (chance checks are `< eventChance`)

function makeState(map = MAPS.city, gearMode: 'auto' | number = 'auto') {
  return createInitialRaceState({ map, gearMode });
}

describe('targetSpeedForGear', () => {
  it('flat ground uses topSpeed * speedFrac[gear]', () => {
    const car = VEHICLES.sedan;
    const target = targetSpeedForGear(car, 5, 0.02);
    expect(target).toBeCloseTo(car.topSpeed * 1.0, 5);
  });

  it('uphill clamps the power/grade ratio at 1.3', () => {
    // Truck has power 1.0; at low gear (high powerMult) and a shallow slope, the raw
    // ratio would exceed 1.3, so the formula should clamp to topSpeed * 1.3 * 0.8.
    const car = VEHICLES.truck;
    const gearIdx = 0; // powerMult 1.7
    const grade = 0.1;
    const target = targetSpeedForGear(car, gearIdx, grade);
    expect(target).toBeCloseTo(Math.min(car.topSpeed * 0.3, car.topSpeed * 1.3 * 0.8), 5);
  });

  it('downhill (negative grade) boosts speed above the flat target, capped', () => {
    const car = VEHICLES.sedan;
    const gearIdx = 5;
    const flatTarget = targetSpeedForGear(car, gearIdx, 0);
    const downhillTarget = targetSpeedForGear(car, gearIdx, -0.6);
    expect(downhillTarget).toBeGreaterThan(flatTarget);
    expect(downhillTarget).toBeLessThanOrEqual(car.topSpeed * 1.25 + 1e-6);
  });
});

describe('bestAutoGear', () => {
  it('picks the gear with the highest target speed', () => {
    const car = VEHICLES.compact;
    const grade = 0.02;
    const { gearIdx, target } = bestAutoGear(car, grade);
    // On flat ground target is monotonically increasing with speedFrac, so gear 6 (idx 5) wins.
    expect(gearIdx).toBe(5);
    expect(target).toBeCloseTo(car.topSpeed, 5);
  });
});

describe('tick', () => {
  it('never triggers an event when rng always returns 1', () => {
    const car = VEHICLES.sedan;
    const map = MAPS.city;
    let state = makeState(map);
    for (let i = 0; i < 20; i++) {
      state = tick(state, car, map, 0.1, noEvent);
    }
    expect(state.eventActive).toBe(false);
    expect(state.eventsCount).toBe(0);
    expect(state.speed).toBeGreaterThan(0);
  });

  it('clamps recovery duration to [0.8, 6] and applies the speed penalty', () => {
    const car = VEHICLES.compact; // handling 0.9
    const map = MAPS.alley;
    let state = makeState(map);
    state = { ...state, speed: 40 }; // below alley's speedCap so the collision system stays out of the way
    const forceEventRng = () => 0; // 0 < eventChance always triggers
    const next = tick(state, car, map, 0.1, forceEventRng);
    expect(next.eventActive).toBe(true);
    expect(next.recoverDuration).toBeGreaterThanOrEqual(0.8);
    expect(next.recoverDuration).toBeLessThanOrEqual(6);
    expect(Math.abs(next.laneOffset)).toBeGreaterThanOrEqual(0.7);
    expect(Math.abs(next.laneOffset)).toBeLessThanOrEqual(1.0);
  });

  it('finishes the race and assigns a grade once distance reaches 1000', () => {
    const car = VEHICLES.sports;
    const map = MAPS.city;
    let state = makeState(map);
    let iterations = 0;
    while (!state.finished && iterations < 5000) {
      state = tick(state, car, map, 0.1, noEvent);
      iterations++;
    }
    expect(state.finished).toBe(true);
    expect(state.distance).toBe(1000);
    expect(state.grade).not.toBeNull();
    expect(['S', 'A', 'B', 'C']).toContain(state.grade);
  });

  it('is a pure function: does not mutate the input state', () => {
    const car = VEHICLES.sedan;
    const map = MAPS.mountain;
    const state = makeState(map);
    const snapshot = { ...state };
    tick(state, car, map, 0.1, noEvent);
    expect(state).toEqual(snapshot);
  });
});

describe('hazardWindowFor', () => {
  it('is longer at low speed and shorter near topSpeed', () => {
    const topSpeed = 60;
    const atZero = hazardWindowFor(0, topSpeed);
    const atTop = hazardWindowFor(topSpeed, topSpeed);
    expect(atZero).toBeCloseTo(2.4, 5);
    expect(atTop).toBeCloseTo(0.6, 5);
    expect(atZero).toBeGreaterThan(atTop);
  });
});

describe('hazard-light crash minigame', () => {
  const forceEventRng = () => 0; // 0 < eventChance always triggers on the first eligible tick

  it('crashes and stalls the car if the hazard window elapses without a press', () => {
    const car = VEHICLES.compact;
    const map = MAPS.mountain;
    let state = makeState(map);
    state = { ...state, speed: car.topSpeed }; // fastest -> shortest hazard window (0.6s)
    state = tick(state, car, map, 0.1, forceEventRng);
    expect(state.hazardActive).toBe(true);
    expect(state.crashed).toBe(false);

    for (let i = 0; i < 10 && !state.crashed; i++) {
      state = tick(state, car, map, 0.1, noEvent);
    }
    expect(state.crashed).toBe(true);
    expect(state.speed).toBe(0);
    expect(state.crashCount).toBe(1);
    expect(state.eventActive).toBe(false);
  });

  it('does not crash when the hazard window is cleared before it elapses (a press)', () => {
    const car = VEHICLES.compact;
    const map = MAPS.mountain;
    let state = makeState(map);
    state = { ...state, speed: car.topSpeed };
    state = tick(state, car, map, 0.1, forceEventRng);
    expect(state.hazardActive).toBe(true);
    // simulate the store's pressHazard() clearing the window
    state = { ...state, hazardActive: false, hazardElapsed: 0, hazardWindow: 0 };

    for (let i = 0; i < 20; i++) {
      state = tick(state, car, map, 0.1, noEvent);
    }
    expect(state.crashed).toBe(false);
    expect(state.crashCount).toBe(0);
  });

  it('holds speed at 0 while crashed, then resumes driving after crashDuration', () => {
    const car = VEHICLES.compact;
    const map = MAPS.mountain;
    let state = makeState(map);
    state = { ...state, speed: car.topSpeed };
    state = tick(state, car, map, 0.1, forceEventRng);
    for (let i = 0; i < 10 && !state.crashed; i++) {
      state = tick(state, car, map, 0.1, noEvent);
    }
    expect(state.crashed).toBe(true);

    const ticksToRecover = Math.ceil(state.crashDuration / 0.1);
    for (let i = 0; i < ticksToRecover - 1; i++) {
      state = tick(state, car, map, 0.1, noEvent);
      expect(state.speed).toBe(0);
    }
    state = tick(state, car, map, 0.1, noEvent);
    expect(state.crashed).toBe(false);
  });

  it('rain shrinks the hazard window and boosts target speed', () => {
    const car = VEHICLES.compact;
    const map = MAPS.mountain;
    let state = makeState(map);
    state = { ...state, speed: 30 };
    const clearTick = tick(state, car, map, 0.1, forceEventRng, WEATHERS.clear);
    const rainTick = tick(state, car, map, 0.1, forceEventRng, WEATHERS.rain);
    expect(rainTick.hazardWindow).toBeLessThan(clearTick.hazardWindow);
  });
});

describe('createInitialRaceState terrain generation', () => {
  it('generates a terrain zone list covering the whole track', () => {
    const state = createInitialRaceState({ map: MAPS.mountain, rng: () => 0.99 });
    expect(state.terrain.length).toBeGreaterThan(0);
    // rng always near 1 -> every zone rolls past flat+uphill weight -> downhill
    expect(state.terrain.every((z) => z.category === 'downhill')).toBe(true);
  });

  it('mountain rolls uphill/downhill zones more often than alley for the same rng', () => {
    const rng = () => 0.5; // fixed roll, only the per-map weights differ
    const mountain = createInitialRaceState({ map: MAPS.mountain, rng });
    const alley = createInitialRaceState({ map: MAPS.alley, rng });
    const mountainHillFrac = mountain.terrain.filter((z) => z.category !== 'flat').length / mountain.terrain.length;
    const alleyHillFrac = alley.terrain.filter((z) => z.category !== 'flat').length / alley.terrain.length;
    expect(mountainHillFrac).toBeGreaterThanOrEqual(alleyHillFrac);
  });
});

describe('alley narrow-road collision', () => {
  it('triggers a collision and brakes hard when speed overshoots the speed cap', () => {
    const car = VEHICLES.sports; // topSpeed 82, easily exceeds alley's cap
    const map = MAPS.alley;
    let state = makeState(map, 5);
    state = { ...state, speed: (map.speedCap ?? 0) * 1.3 };
    const next = tick(state, car, map, 0.1, noEvent);
    expect(next.collisionActive).toBe(true);
    expect(next.collisionCount).toBe(1);
    expect(next.speed).toBeLessThan(state.speed);
  });

  it('does not trigger a collision on maps without a speed cap', () => {
    const car = VEHICLES.sports;
    const map = MAPS.city;
    let state = makeState(map, 5);
    state = { ...state, speed: car.topSpeed };
    const next = tick(state, car, map, 0.1, noEvent);
    expect(next.collisionActive).toBe(false);
  });
});
