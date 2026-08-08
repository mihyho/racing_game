import { create } from 'zustand';
import { createInitialRaceState, tick } from '@/lib/gameLogic';
import { MAP_LIST } from '@/lib/maps';
import { VEHICLE_LIST } from '@/lib/vehicles';
import { pickRandomWeather, WEATHERS } from '@/lib/weather';
import type { GearMode, RaceState, Screen } from '@/types/game';

interface GameStore {
  screen: Screen;
  vehicleIdx: number;
  mapIdx: number;
  race: RaceState;

  selectVehicle: (idx: number) => void;
  selectMap: (idx: number) => void;
  goToVehicle: () => void;
  backToMap: () => void;
  setGear: (gear: GearMode) => void;
  startRace: () => void;
  stepRace: (dtSec: number) => void;
  pressHazard: () => void;
  retryRace: () => void;
  changeVehicle: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'map',
  vehicleIdx: 0,
  mapIdx: 0,
  race: createInitialRaceState({ map: MAP_LIST[0] }),

  selectVehicle: (idx) => set({ vehicleIdx: idx }),
  selectMap: (idx) => set({ mapIdx: idx }),
  goToVehicle: () => set({ screen: 'vehicle' }),
  backToMap: () => set({ screen: 'map' }),
  setGear: (gear) =>
    set((s) => ({ race: { ...s.race, gearMode: gear } })),

  startRace: () =>
    set((s) => ({
      screen: 'race',
      race: createInitialRaceState({
        map: MAP_LIST[s.mapIdx],
        gearMode: s.race.gearMode,
        weatherId: pickRandomWeather().id,
      }),
    })),

  stepRace: (dtSec) => {
    const s = get();
    if (s.screen !== 'race' || s.race.finished) return;
    const car = VEHICLE_LIST[s.vehicleIdx];
    const map = MAP_LIST[s.mapIdx];
    const weather = WEATHERS[s.race.weatherId];
    const nextRace = tick(s.race, car, map, dtSec, Math.random, weather);
    set({ race: nextRace, screen: nextRace.finished ? 'result' : 'race' });
  },

  pressHazard: () => {
    const s = get();
    if (s.screen !== 'race' || !s.race.hazardActive) return;
    set({ race: { ...s.race, hazardActive: false, hazardElapsed: 0, hazardWindow: 0 } });
  },

  retryRace: () =>
    set((s) => ({
      screen: 'race',
      race: createInitialRaceState({
        map: MAP_LIST[s.mapIdx],
        gearMode: s.race.gearMode,
        weatherId: pickRandomWeather().id,
      }),
    })),

  changeVehicle: () => set({ screen: 'vehicle' }),
}));
