export type VehicleId = 'compact' | 'sedan' | 'sports' | 'truck';

export interface Vehicle {
  id: VehicleId;
  name: string;
  desc: string;
  power: number;
  topSpeed: number;
  handling: number;
}

export type MapId = 'mountain' | 'city' | 'town' | 'alley';

export type EventKind = 'rockfall' | 'signal' | 'pedestrian' | 'obstacle';

export type TerrainCategory = 'uphill' | 'flat' | 'downhill';

export interface TerrainZone {
  category: TerrainCategory;
  // Signed grade: positive = uphill, negative = downhill, 0 = flat.
  grade: number;
}

export interface MapDef {
  id: MapId;
  name: string;
  trait: string;
  eventKinds: EventKind[];
  eventChance: number;
  baseRecoverTime: number;
  // Raw weights for the random terrain generator (see generateTerrain in
  // lib/terrain.ts) — normalized internally, so only their ratios matter.
  weights: { flat: number; uphill: number; downhill: number };
  // Narrow-road maps (alley) cap how fast the car can go before it clips
  // nearby structures — see the collision handling in gameLogic.tick.
  speedCap?: number;
}

export type GearMode = number | 'auto';

export type Grade = 'S' | 'A' | 'B' | 'C';

export type WeatherId = 'clear' | 'rain' | 'snow';

export interface WeatherDef {
  id: WeatherId;
  name: string;
  desc: string;
  // Multiplies the computed target speed every tick.
  speedMultiplier: number;
  // Multiplies the hazard reaction window (see hazardWindowFor) — <1 means
  // the player must press the hazard button faster or crash.
  hazardWindowMultiplier: number;
  // On uphill ground, scales an extra speed penalty for cars with weak
  // `power` (0 = no penalty, e.g. clear/rain).
  snowPowerPenalty: number;
}

export interface RaceState {
  distance: number;
  speed: number;
  gearMode: GearMode;
  activeGearIdx: number;
  weatherId: WeatherId;
  terrain: TerrainZone[];
  currentGrade: number;
  time: number;
  eventActive: boolean;
  eventKind: EventKind | null;
  recoverElapsed: number;
  recoverDuration: number;
  laneOffset: number;
  eventsCount: number;
  hazardActive: boolean;
  hazardElapsed: number;
  hazardWindow: number;
  crashed: boolean;
  crashElapsed: number;
  crashDuration: number;
  crashCount: number;
  collisionActive: boolean;
  collisionElapsed: number;
  collisionCount: number;
  finished: boolean;
  grade: Grade | null;
}

export type Screen = 'vehicle' | 'map' | 'race' | 'result';
