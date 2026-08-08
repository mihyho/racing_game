import type { MapId } from '@/types/game';

export type PropKind = 'tree' | 'building' | 'hut' | 'brick';

export interface RaceTheme {
  shoulderColor: string;
  roadColor: string;
  propKind: PropKind;
}

export const RACE_THEMES: Record<MapId, RaceTheme> = {
  mountain: { shoulderColor: '#2f3a24', roadColor: '#232a3d', propKind: 'tree' },
  city: { shoulderColor: '#33373f', roadColor: '#26303f', propKind: 'building' },
  town: { shoulderColor: '#5a6a3e', roadColor: '#2a3347', propKind: 'hut' },
  alley: { shoulderColor: '#3d434e', roadColor: '#20242c', propKind: 'brick' },
};
