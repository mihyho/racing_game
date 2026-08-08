'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

const TICK_MS = 100;
const TICK_SEC = TICK_MS / 1000;

export function useGameLoop() {
  const screen = useGameStore((s) => s.screen);
  const finished = useGameStore((s) => s.race.finished);
  const stepRace = useGameStore((s) => s.stepRace);

  useEffect(() => {
    if (screen !== 'race' || finished) return;
    const id = setInterval(() => stepRace(TICK_SEC), TICK_MS);
    return () => clearInterval(id);
  }, [screen, finished, stepRace]);
}
