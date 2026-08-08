import type { MapDef, TerrainZone } from '@/types/game';

// The track is divided into fixed zones; each is independently rolled as
// uphill/flat/downhill using the map's weights, so the layout comes out
// different (and alternates back and forth) every race.
export const ZONE_COUNT = 20;

const UPHILL_GRADE_RANGE: [number, number] = [0.3, 0.85];
const DOWNHILL_GRADE_RANGE: [number, number] = [0.3, 0.85];

export function generateTerrain(map: MapDef, rng: () => number = Math.random): TerrainZone[] {
  const { flat, uphill, downhill } = map.weights;
  const total = flat + uphill + downhill;
  const pFlat = flat / total;
  const pUphill = uphill / total;

  const zones: TerrainZone[] = [];
  for (let i = 0; i < ZONE_COUNT; i++) {
    const r = rng();
    if (r < pFlat) {
      zones.push({ category: 'flat', grade: 0 });
    } else if (r < pFlat + pUphill) {
      const grade = UPHILL_GRADE_RANGE[0] + rng() * (UPHILL_GRADE_RANGE[1] - UPHILL_GRADE_RANGE[0]);
      zones.push({ category: 'uphill', grade });
    } else {
      const magnitude = DOWNHILL_GRADE_RANGE[0] + rng() * (DOWNHILL_GRADE_RANGE[1] - DOWNHILL_GRADE_RANGE[0]);
      zones.push({ category: 'downhill', grade: -magnitude });
    }
  }
  return zones;
}

export function gradeAt(terrain: TerrainZone[], distanceFrac: number): number {
  if (terrain.length === 0) return 0;
  const idx = Math.min(Math.max(Math.floor(distanceFrac * terrain.length), 0), terrain.length - 1);
  return terrain[idx].grade;
}
