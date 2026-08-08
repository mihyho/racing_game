'use client';

import { PixelSprite } from '@/components/PixelSprite';
import { flattenCells, vehicleColors, vehicleDims, vehicleSideGrid } from '@/lib/sprites';
import { VEHICLE_LIST } from '@/lib/vehicles';
import { useGameStore } from '@/store/useGameStore';
import type { Vehicle } from '@/types/game';

const CELL_SIZE = 3;

const POWER_RANGE = statRange(VEHICLE_LIST, (v) => v.power);
const SPEED_RANGE = statRange(VEHICLE_LIST, (v) => v.topSpeed);
const HANDLING_RANGE = statRange(VEHICLE_LIST, (v) => v.handling);

function statRange(vehicles: Vehicle[], pick: (v: Vehicle) => number) {
  const values = vehicles.map(pick);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function toBarCount(value: number, range: { min: number; max: number }): number {
  if (range.max === range.min) return 5;
  const t = (value - range.min) / (range.max - range.min);
  return Math.round(1 + 9 * t);
}

function StatBar({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div className="pixel-font" style={{ color: 'var(--ink-dim)', fontSize: 7, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 1 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            style={{ width: 9, height: 6, background: i < count ? 'var(--accent)' : 'var(--outline)' }}
          />
        ))}
      </div>
    </div>
  );
}

export function VehicleSelect() {
  const vehicleIdx = useGameStore((s) => s.vehicleIdx);
  const selectVehicle = useGameStore((s) => s.selectVehicle);
  const backToMap = useGameStore((s) => s.backToMap);
  const startRace = useGameStore((s) => s.startRace);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, minHeight: 0 }}>
      <div
        className="pixel-font"
        style={{ fontSize: 14, color: 'var(--accent)', letterSpacing: 1, marginBottom: 12 }}
      >
        VEHICLE SELECT
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
        {VEHICLE_LIST.map((v, i) => {
          const selected = i === vehicleIdx;
          const dims = vehicleDims(v.id);
          const cells = flattenCells(vehicleSideGrid(v.id), vehicleColors(v.id), CELL_SIZE);
          return (
            <div
              key={v.id}
              onClick={() => selectVehicle(i)}
              style={{
                background: selected ? 'var(--bg-panel2)' : 'var(--bg-panel)',
                border: `3px solid ${selected ? 'var(--accent)' : 'var(--outline)'}`,
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 64,
                  background: '#c9c2a6',
                  border: '2px solid var(--outline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 0 8px',
                  boxSizing: 'border-box',
                }}
              >
                <PixelSprite cells={cells} width={dims.w * CELL_SIZE} height={dims.h * CELL_SIZE} />
              </div>
              <div className="pixel-font" style={{ fontSize: 10, color: 'var(--ink)', marginBottom: 4 }}>
                {v.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginBottom: 6, lineHeight: 1.15 }}>
                {v.desc}
              </div>
              <StatBar label="파워 POWER" count={toBarCount(v.power, POWER_RANGE)} />
              <StatBar label="속도 SPEED" count={toBarCount(v.topSpeed, SPEED_RANGE)} />
              <StatBar label="핸들링 HANDLING" count={toBarCount(v.handling, HANDLING_RANGE)} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <div
          onClick={backToMap}
          className="pixel-font clip-btn"
          style={{ fontSize: 12, color: 'var(--ink)', background: 'var(--bg-panel2)', padding: '12px 20px' }}
        >
          &lt; 맵
        </div>
        <div
          onClick={startRace}
          className="pixel-font clip-btn"
          style={{ fontSize: 12, color: 'var(--outline)', background: 'var(--accent)', padding: '12px 20px' }}
        >
          레이스 시작
        </div>
      </div>
    </div>
  );
}
