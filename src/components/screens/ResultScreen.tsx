'use client';

import { formatRaceTime } from '@/lib/format';
import { MAP_LIST } from '@/lib/maps';
import { VEHICLE_LIST } from '@/lib/vehicles';
import { useGameStore } from '@/store/useGameStore';
import type { Grade } from '@/types/game';

const GRADE_COLORS: Record<Grade, string> = {
  S: '#d9a63e',
  A: '#8a9a6b',
  B: '#5c6b8a',
  C: '#b5432c',
};

export function ResultScreen() {
  const race = useGameStore((s) => s.race);
  const vehicleIdx = useGameStore((s) => s.vehicleIdx);
  const mapIdx = useGameStore((s) => s.mapIdx);
  const retryRace = useGameStore((s) => s.retryRace);
  const changeVehicle = useGameStore((s) => s.changeVehicle);

  const vehicle = VEHICLE_LIST[vehicleIdx];
  const map = MAP_LIST[mapIdx];
  const grade = race.grade ?? 'C';
  const gradeColor = GRADE_COLORS[grade];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <div className="pixel-font" style={{ fontSize: 16, color: 'var(--accent)', letterSpacing: 1 }}>
        RACE COMPLETE
      </div>
      <div
        style={{
          width: 130,
          height: 130,
          background: 'var(--bg-panel2)',
          border: `6px solid ${gradeColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="pixel-font" style={{ fontSize: 56, color: gradeColor }}>
          {grade}
        </div>
      </div>
      <div className="pixel-font" style={{ fontSize: 14, color: 'var(--ink)' }}>
        완주 시간: {formatRaceTime(race.time)}
      </div>
      <div style={{ fontSize: 16, color: 'var(--ink-dim)', textAlign: 'center', lineHeight: 1.6 }}>
        차량: {vehicle.name} · 맵: {map.name}
        <br />
        이벤트 발생: {race.eventsCount}회 · 사고: {race.crashCount}회
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div
          onClick={retryRace}
          className="pixel-font clip-btn"
          style={{ fontSize: 12, color: 'var(--outline)', background: 'var(--accent)', padding: '12px 20px' }}
        >
          다시 달리기
        </div>
        <div
          onClick={changeVehicle}
          className="pixel-font clip-btn"
          style={{ fontSize: 12, color: 'var(--ink)', background: 'var(--bg-panel2)', padding: '12px 20px' }}
        >
          차량 변경
        </div>
      </div>
    </div>
  );
}
