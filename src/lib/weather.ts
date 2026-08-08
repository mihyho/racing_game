import type { WeatherDef, WeatherId } from '@/types/game';

export const WEATHERS: Record<WeatherId, WeatherDef> = {
  clear: {
    id: 'clear',
    name: '맑음',
    desc: '디메리트 없음',
    speedMultiplier: 1,
    hazardWindowMultiplier: 1,
    snowPowerPenalty: 0,
  },
  rain: {
    id: 'rain',
    name: '비',
    desc: '속도 상승 · 이벤트에 더 빠르게 반응해야 함',
    speedMultiplier: 1.15,
    hazardWindowMultiplier: 0.65,
    snowPowerPenalty: 0,
  },
  snow: {
    id: 'snow',
    name: '눈',
    desc: '오르막에서 파워가 약할수록 감속 · 이벤트에 더 빠르게 반응해야 함',
    speedMultiplier: 1,
    hazardWindowMultiplier: 0.65,
    snowPowerPenalty: 0.6,
  },
};

export const WEATHER_LIST: WeatherDef[] = Object.values(WEATHERS);

export function pickRandomWeather(rng: () => number = Math.random): WeatherDef {
  const idx = Math.min(Math.floor(rng() * WEATHER_LIST.length), WEATHER_LIST.length - 1);
  return WEATHER_LIST[idx];
}
