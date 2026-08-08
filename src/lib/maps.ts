import type { MapDef, MapId } from '@/types/game';

// Flat weight is identical across every map. Uphill/downhill weights rank
// mountain > town > city > alley (both use the same values, so a map's
// total climbing distance always equals its total descending distance).
export const MAPS: Record<MapId, MapDef> = {
  mountain: {
    id: 'mountain',
    name: '산',
    trait: '오르막 · 내리막 굴곡 심함 · 낙석 주의',
    eventKinds: ['rockfall'],
    eventChance: 0.02,
    baseRecoverTime: 2.2,
    weights: { flat: 25, uphill: 40, downhill: 40 },
  },
  city: {
    id: 'city',
    name: '도시',
    trait: '대체로 평지 · 신호등 변경',
    eventKinds: ['signal'],
    eventChance: 0.012,
    baseRecoverTime: 1.6,
    weights: { flat: 25, uphill: 20, downhill: 20 },
  },
  town: {
    id: 'town',
    name: '작은마을',
    trait: '완만한 굴곡 · 보행자 출현',
    eventKinds: ['pedestrian'],
    eventChance: 0.02,
    baseRecoverTime: 2.0,
    weights: { flat: 25, uphill: 30, downhill: 30 },
  },
  alley: {
    id: 'alley',
    name: '골목길',
    trait: '좁은 길 · 이벤트 빈발 · 과속 시 충돌',
    eventKinds: ['pedestrian', 'obstacle'],
    eventChance: 0.035,
    baseRecoverTime: 3.0,
    weights: { flat: 25, uphill: 10, downhill: 10 },
    speedCap: 48,
  },
};

export const MAP_LIST: MapDef[] = Object.values(MAPS);
