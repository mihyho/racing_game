'use client';

import { useGameStore } from '@/store/useGameStore';

function TriLayer({ size, color, ratio = 0.87 }: { size: number; color: string; ratio?: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size * ratio,
        background: color,
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      }}
    />
  );
}

export function HazardButton() {
  const hazardActive = useGameStore((s) => s.race.hazardActive);
  const hazardElapsed = useGameStore((s) => s.race.hazardElapsed);
  const hazardWindow = useGameStore((s) => s.race.hazardWindow);
  const crashed = useGameStore((s) => s.race.crashed);
  const pressHazard = useGameStore((s) => s.pressHazard);

  const remainingFrac = hazardWindow > 0 ? Math.max(0, 1 - hazardElapsed / hazardWindow) : 0;

  return (
    <div
      style={{
        width: 68,
        background: 'var(--bg-panel2)',
        border: `3px solid ${hazardActive ? '#e0503a' : 'var(--outline)'}`,
        padding: '6px 6px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        onClick={pressHazard}
        role="button"
        aria-label="비상등"
        style={{
          position: 'relative',
          width: 48,
          height: 40,
          background: crashed ? '#3a1410' : hazardActive ? '#2c1810' : '#141821',
          border: '2px solid #05060a',
          cursor: hazardActive ? 'pointer' : 'default',
          animation: hazardActive ? 'blinkEvent 0.35s steps(2) infinite' : 'none',
        }}
      >
        <TriLayer size={30} color="#e0503a" />
        <TriLayer size={22} color="#c9c2a6" />
        <TriLayer size={14} color="#e08a3e" />
      </div>
      <div style={{ width: '100%', height: 4, background: 'var(--outline)' }}>
        {hazardActive && (
          <div
            style={{
              width: `${Math.round(remainingFrac * 100)}%`,
              height: '100%',
              background: remainingFrac < 0.35 ? '#e0503a' : '#d9a63e',
            }}
          />
        )}
      </div>
    </div>
  );
}
