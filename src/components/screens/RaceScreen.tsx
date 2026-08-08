'use client';

import type { CSSProperties } from 'react';
import { HazardButton } from '@/components/HazardButton';
import { RaceCanvas } from '@/components/RaceCanvas';
import { useGameLoop } from '@/hooks/useGameLoop';
import { formatRaceTime } from '@/lib/format';
import { MAP_LIST } from '@/lib/maps';
import { VEHICLE_LIST } from '@/lib/vehicles';
import { WEATHERS } from '@/lib/weather';
import { useGameStore } from '@/store/useGameStore';
import type { GearMode, TerrainCategory, WeatherId } from '@/types/game';

const GEAR_OPTIONS: GearMode[] = [0, 1, 2, 3, 4, 5, 'auto'];

const TERRAIN_LABEL: Record<TerrainCategory, string> = {
  uphill: '▲ 오르막',
  flat: '● 평지',
  downhill: '▼ 내리막',
};
const TERRAIN_COLOR: Record<TerrainCategory, string> = {
  uphill: '#e0503a',
  flat: '#9aa0b0',
  downhill: '#6ea8d9',
};

function terrainCategoryFor(currentGrade: number): TerrainCategory {
  if (currentGrade > 0.05) return 'uphill';
  if (currentGrade < -0.05) return 'downhill';
  return 'flat';
}

const WEATHER_ICON: Record<WeatherId, string> = {
  clear: '☀',
  rain: '☔',
  snow: '❄',
};
const WEATHER_COLOR: Record<WeatherId, string> = {
  clear: '#d9a63e',
  rain: '#6ea8d9',
  snow: '#c9c2a6',
};

const HUD_BADGE_STYLE: CSSProperties = {
  position: 'absolute',
  top: 8,
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 10,
  padding: '6px 8px',
  background: 'rgba(20,24,33,0.8)',
  border: '2px solid var(--outline)',
};

export function RaceScreen() {
  useGameLoop();

  const race = useGameStore((s) => s.race);
  const vehicleIdx = useGameStore((s) => s.vehicleIdx);
  const mapIdx = useGameStore((s) => s.mapIdx);
  const setGear = useGameStore((s) => s.setGear);

  const vehicle = VEHICLE_LIST[vehicleIdx];
  const map = MAP_LIST[mapIdx];
  const weather = WEATHERS[race.weatherId];
  const progress = Math.round(Math.min((race.distance / 1000) * 100, 100));
  const gearLabel =
    race.gearMode === 'auto' ? `AUTO(${race.activeGearIdx + 1})` : String((race.gearMode as number) + 1);
  const terrainCategory = terrainCategoryFor(race.currentGrade);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 16px', minHeight: 0 }}>
      <div className="pixel-font" style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>
        {formatRaceTime(race.time)}
      </div>
      <div
        className="pixel-font"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 8,
          color: 'var(--ink-dim)',
          marginBottom: 8,
        }}
      >
        <div>차량: {vehicle.name}</div>
        <div>맵: {map.name}</div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 14, background: 'var(--outline)', marginBottom: 12 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${progress}%`, background: 'var(--accent)' }} />
        <div
          className="pixel-font"
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', fontSize: 8 }}
        >
          {progress}%
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 'fit-content' }}>
          <RaceCanvas />
          <div
            className="pixel-font"
            style={{ ...HUD_BADGE_STYLE, left: 8, color: WEATHER_COLOR[race.weatherId] }}
            title={weather.desc}
          >
            <span>{WEATHER_ICON[race.weatherId]}</span>
            <span>{weather.name}</span>
          </div>
          <div
            className="pixel-font"
            style={{ ...HUD_BADGE_STYLE, right: 8, color: TERRAIN_COLOR[terrainCategory] }}
          >
            {TERRAIN_LABEL[terrainCategory]}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1, background: 'var(--bg-panel2)', border: '3px solid var(--outline)', padding: '8px 10px' }}>
          <div className="pixel-font" style={{ fontSize: 8, color: 'var(--ink-dim)', marginBottom: 4 }}>
            SPEED
          </div>
          <div className="pixel-font" style={{ fontSize: 18, color: 'var(--accent)' }}>
            {Math.round(race.speed)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)' }}>km/h</div>
        </div>
        <div style={{ flex: 1, background: 'var(--bg-panel2)', border: '3px solid var(--outline)', padding: '8px 10px' }}>
          <div className="pixel-font" style={{ fontSize: 8, color: 'var(--ink-dim)', marginBottom: 4 }}>
            GEAR
          </div>
          <div className="pixel-font" style={{ fontSize: 18, color: 'var(--ink)' }}>
            {gearLabel}
          </div>
        </div>
        <HazardButton />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
        {GEAR_OPTIONS.map((g) => {
          const active = race.gearMode === g;
          return (
            <div
              key={String(g)}
              onClick={() => setGear(g)}
              className="pixel-font clip-btn-sm"
              style={{
                flex: '1 1 22%',
                textAlign: 'center',
                fontSize: 11,
                padding: '11px 2px',
                background: active ? 'var(--accent)' : 'var(--bg-panel2)',
                color: active ? 'var(--outline)' : 'var(--ink)',
              }}
            >
              {g === 'auto' ? 'AUTO' : String((g as number) + 1)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
