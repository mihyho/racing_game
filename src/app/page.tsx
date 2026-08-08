'use client';

import { MapSelect } from '@/components/screens/MapSelect';
import { RaceScreen } from '@/components/screens/RaceScreen';
import { ResultScreen } from '@/components/screens/ResultScreen';
import { VehicleSelect } from '@/components/screens/VehicleSelect';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 414,
          height: 736,
          background: 'var(--bg)',
          border: '8px solid var(--outline)',
          boxShadow: '0 0 0 3px var(--khaki) inset',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {screen === 'vehicle' && <VehicleSelect />}
        {screen === 'map' && <MapSelect />}
        {screen === 'race' && <RaceScreen />}
        {screen === 'result' && <ResultScreen />}
      </div>
    </div>
  );
}
