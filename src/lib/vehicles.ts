import type { Vehicle, VehicleId } from '@/types/game';

export const VEHICLES: Record<VehicleId, Vehicle> = {
  compact: {
    id: 'compact',
    name: '경차',
    desc: '가볍고 민첩한 소형차',
    power: 0.55,
    topSpeed: 55,
    handling: 0.9,
  },
  sedan: {
    id: 'sedan',
    name: '중형차',
    desc: '안정적인 만능 세단',
    power: 0.65,
    topSpeed: 62,
    handling: 0.75,
  },
  sports: {
    id: 'sports',
    name: '스포츠카',
    desc: '낮고 빠른 고속 머신',
    power: 0.5,
    topSpeed: 82,
    handling: 0.55,
  },
  truck: {
    id: 'truck',
    name: '특수차량',
    desc: '크고 무거운 화물차',
    power: 1.0,
    topSpeed: 40,
    handling: 0.4,
  },
};

export const VEHICLE_LIST: Vehicle[] = Object.values(VEHICLES);
