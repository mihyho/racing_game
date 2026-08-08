'use client';

import { PixelSprite } from '@/components/PixelSprite';
import { flattenCells, mapColors, mapDims, mapGrid } from '@/lib/sprites';
import { MAP_LIST } from '@/lib/maps';
import { useGameStore } from '@/store/useGameStore';

const CELL_SIZE = 6;

export function MapSelect() {
  const mapIdx = useGameStore((s) => s.mapIdx);
  const selectMap = useGameStore((s) => s.selectMap);
  const goToVehicle = useGameStore((s) => s.goToVehicle);
  const colors = mapColors();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, minHeight: 0 }}>
      <div
        className="pixel-font"
        style={{ fontSize: 14, color: 'var(--accent)', letterSpacing: 1, marginBottom: 12 }}
      >
        MAP SELECT
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        {MAP_LIST.map((m, i) => {
          const selected = i === mapIdx;
          const dims = mapDims(m.id);
          const cells = flattenCells(mapGrid(m.id), colors, CELL_SIZE);
          return (
            <div
              key={m.id}
              onClick={() => selectMap(i)}
              style={{
                background: selected ? 'var(--bg-panel2)' : 'var(--bg-panel)',
                border: `3px solid ${selected ? 'var(--accent)' : 'var(--outline)'}`,
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  background: '#c9c2a6',
                  border: '2px solid var(--outline)',
                  padding: 5,
                  marginBottom: 8,
                  boxSizing: 'border-box',
                }}
              >
                <PixelSprite cells={cells} width={dims.w * CELL_SIZE} height={dims.h * CELL_SIZE} />
              </div>
              <div className="pixel-font" style={{ fontSize: 10, color: 'var(--ink)', marginBottom: 6 }}>
                {m.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-dim)', textAlign: 'center', lineHeight: 1.2 }}>
                {m.trait}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <div
          onClick={goToVehicle}
          className="pixel-font clip-btn"
          style={{ fontSize: 12, color: 'var(--outline)', background: 'var(--accent)', padding: '12px 22px' }}
        >
          다음 &gt;
        </div>
      </div>
    </div>
  );
}
