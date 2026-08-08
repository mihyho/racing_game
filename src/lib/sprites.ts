// Procedural pixel-grid sprite generators, ported from the imported Claude Design
// prototype (`sprites.js`). Grids are plain 2D arrays of single/short color-code
// strings; `flattenCells` turns a grid into a flat list of colored squares that a
// Canvas 2D renderer can draw with `fillRect`.

import type { MapId, VehicleId } from '@/types/game';

export interface Cell {
  left: number;
  top: number;
  size: number;
  color: string;
}

type Grid = string[][];
type ColorMap = Record<string, string>;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface SideCarParams {
  w: number;
  h: number;
  noseX: number;
  hoodTopY: number;
  windshieldX: number;
  roofFrontX: number;
  roofBackX: number;
  rearWindowX: number;
  trunkEndX: number;
  beltY: number;
  roofY: number;
  groundY: number;
  wheel1X: number;
  wheel2X: number;
  wheelR: number;
  spoiler?: boolean;
  cargoBed?: boolean;
  cargoStartX?: number;
  bedTopY?: number;
}

function buildSideCar(p: SideCarParams): Grid {
  const {
    w, h, noseX, hoodTopY, windshieldX, roofFrontX, roofBackX, rearWindowX, trunkEndX,
    beltY, roofY, groundY, wheel1X, wheel2X, wheelR, spoiler, cargoBed, cargoStartX, bedTopY,
  } = p;
  const grid: Grid = Array.from({ length: h }, () => new Array(w).fill('.'));
  for (let x = noseX; x <= trunkEndX; x++) {
    let topY: number;
    let isGlass = false;
    if (cargoBed && cargoStartX !== undefined && x >= cargoStartX) {
      topY = bedTopY as number;
    } else if (x < windshieldX) {
      topY = Math.round(lerp(hoodTopY, beltY, (x - noseX) / Math.max(1, windshieldX - noseX)));
    } else if (x < roofFrontX) {
      topY = Math.round(lerp(beltY, roofY, (x - windshieldX) / Math.max(1, roofFrontX - windshieldX)));
      isGlass = true;
    } else if (x <= roofBackX) {
      topY = roofY;
      isGlass = true;
    } else if (x < rearWindowX) {
      topY = Math.round(lerp(roofY, beltY, (x - roofBackX) / Math.max(1, rearWindowX - roofBackX)));
      isGlass = true;
    } else {
      topY = beltY;
    }
    for (let y = Math.max(0, topY); y < groundY; y++) {
      let code = 'b';
      if (y === topY) code = 'k';
      else if (isGlass && y < beltY) code = 'w';
      if (cargoBed && cargoStartX !== undefined && x >= cargoStartX) code = y === topY ? 'k' : 'g';
      grid[y][x] = code;
    }
  }
  const hlY = Math.round(lerp(hoodTopY, beltY, 0.3));
  if (grid[hlY]) grid[hlY][noseX + 1] = 'hl';
  const tlY = beltY - 1;
  if (grid[tlY]) grid[tlY][trunkEndX - 1] = 'tl';
  if (spoiler) {
    for (let x = rearWindowX; x <= trunkEndX - 1; x++) {
      if (grid[roofY - 1]) grid[roofY - 1][x] = 'B';
    }
  }
  function drawWheel(cx: number) {
    for (let dy = -Math.ceil(wheelR); dy <= Math.ceil(wheelR); dy++) {
      for (let dx = -Math.ceil(wheelR); dx <= Math.ceil(wheelR); dx++) {
        const y = groundY - 1 + dy;
        const x = Math.round(cx + dx);
        if (y < 0 || y >= h || x < 0 || x >= w) continue;
        const dist = (dx * dx) / (wheelR * wheelR) + (dy * dy) / (wheelR * wheelR * 0.9);
        if (dist <= 1) grid[y][x] = dist <= 0.35 ? 'm' : 't';
      }
    }
  }
  drawWheel(wheel1X);
  drawWheel(wheel2X);
  return grid;
}

interface TopCarOpts {
  windshield?: [number, number];
  roof?: [number, number];
  rearWindow?: [number, number];
  cargo?: [number, number];
  wheels?: [number, number];
}

function buildTopCar(halfW: number, h: number, opts: TopCarOpts = {}): Grid {
  const noseRows = Math.max(2, Math.round(h * 0.16));
  const rearRows = Math.max(2, Math.round(h * 0.13));
  const wheelFracs = opts.wheels || [0.25, 0.78];
  const rows: Grid = [];
  for (let y = 0; y < h; y++) {
    let hwFrac = 1;
    if (y < noseRows) hwFrac = 0.18 + 0.82 * ((y + 1) / noseRows);
    else if (y >= h - rearRows) hwFrac = 0.18 + 0.82 * ((h - y) / rearRows);
    const hw = Math.max(1, Math.round(halfW * hwFrac));
    const bodyStart = halfW - hw;
    const rowHalf: string[] = new Array(halfW).fill('.');
    const frac = y / (h - 1);
    const wheelBulge = wheelFracs.some((wf) => Math.abs(frac - wf) < 0.045);
    for (let x = bodyStart; x < halfW; x++) {
      let fill = 'b';
      if (x === bodyStart) fill = 'k';
      else if (y < 2) fill = 'hl';
      else if (y >= h - 2) fill = 'r';
      else if (opts.cargo && frac >= opts.cargo[0] && frac <= opts.cargo[1]) fill = 'g';
      else if (opts.windshield && frac >= opts.windshield[0] && frac <= opts.windshield[1]) fill = 'w';
      else if (opts.rearWindow && frac >= opts.rearWindow[0] && frac <= opts.rearWindow[1]) fill = 'w';
      else if (opts.roof && frac >= opts.roof[0] && frac <= opts.roof[1]) fill = 'B';
      rowHalf[x] = fill;
    }
    if (wheelBulge) {
      if (bodyStart > 0) rowHalf[bodyStart - 1] = 't';
      if (bodyStart > 1) rowHalf[bodyStart - 2] = 't';
    }
    rows.push(rowHalf.concat(rowHalf.slice(0, -1).reverse()));
  }
  return rows;
}

const CAR_BASE_COLORS: ColorMap = {
  k: '#141821', w: '#a9cdd9', hl: '#e8d9a0', tl: '#7a2a1c', r: '#7a2a1c', t: '#0d0f14', m: '#9aa0b0',
};

interface VehicleSprite {
  w: number;
  h: number;
  grid: Grid;
  gridTop: Grid;
  colors: ColorMap;
}

const VEHICLE_SPRITES: Record<VehicleId, VehicleSprite> = {
  compact: {
    w: 30,
    h: 16,
    grid: buildSideCar({ w: 30, h: 16, noseX: 2, hoodTopY: 7, windshieldX: 7, roofFrontX: 10, roofBackX: 17, rearWindowX: 21, trunkEndX: 25, beltY: 9, roofY: 3, groundY: 13, wheel1X: 8, wheel2X: 20, wheelR: 3 }),
    gridTop: buildTopCar(6, 22, { windshield: [0.16, 0.28], roof: [0.28, 0.58], rearWindow: [0.58, 0.74], wheels: [0.24, 0.76] }),
    colors: { b: '#8a9a6b', B: '#6f7d55' },
  },
  sedan: {
    w: 34,
    h: 17,
    grid: buildSideCar({ w: 34, h: 17, noseX: 2, hoodTopY: 8, windshieldX: 9, roofFrontX: 13, roofBackX: 21, rearWindowX: 25, trunkEndX: 31, beltY: 10, roofY: 4, groundY: 14, wheel1X: 10, wheel2X: 26, wheelR: 3 }),
    gridTop: buildTopCar(6, 26, { windshield: [0.14, 0.26], roof: [0.26, 0.6], rearWindow: [0.6, 0.74], wheels: [0.22, 0.78] }),
    colors: { b: '#5c6b8a', B: '#4a5670' },
  },
  sports: {
    w: 33,
    h: 15,
    grid: buildSideCar({ w: 33, h: 15, noseX: 1, hoodTopY: 9, windshieldX: 14, roofFrontX: 17, roofBackX: 22, rearWindowX: 25, trunkEndX: 30, beltY: 10, roofY: 6, groundY: 13, wheel1X: 9, wheel2X: 27, wheelR: 3, spoiler: true }),
    gridTop: buildTopCar(7, 20, { windshield: [0.18, 0.32], roof: [0.32, 0.52], rearWindow: [0.52, 0.64], wheels: [0.22, 0.74] }),
    colors: { b: '#b5432c', B: '#8f3220' },
  },
  truck: {
    w: 35,
    h: 18,
    grid: buildSideCar({ w: 35, h: 18, noseX: 2, hoodTopY: 8, windshieldX: 6, roofFrontX: 8, roofBackX: 12, rearWindowX: 14, trunkEndX: 32, beltY: 9, roofY: 2, groundY: 15, wheel1X: 8, wheel2X: 27, wheelR: 3.5, cargoBed: true, cargoStartX: 14, bedTopY: 8 }),
    gridTop: buildTopCar(6, 28, { windshield: [0.1, 0.2], roof: [0.2, 0.3], cargo: [0.34, 0.88], wheels: [0.3, 0.82] }),
    colors: { b: '#c08a3e', B: '#9c6f30', g: '#7d7563' },
  },
};

function buildMapGrid(type: MapId, w: number, h: number): Grid {
  const rows: Grid = [];
  if (type === 'mountain') {
    for (let y = 0; y < h; y++) {
      const row: string[] = [];
      for (let x = 0; x < w; x++) {
        const back = Math.round(h * 0.2 + h * 0.3 * Math.abs(Math.sin((x / w) * Math.PI * 1.4)));
        const front = Math.round(h * 0.34 + h * 0.42 * Math.abs(Math.sin((x / w) * Math.PI * 2.2 + 1)));
        const backTop = h - back;
        const frontTop = h - front;
        const isTree = x % 6 === 2 && y === frontTop - 1;
        if (y === h - 1) row.push(Math.floor(x / 2) % 2 === 0 ? 'd2' : 'd');
        else if (isTree) row.push('tr');
        else if (y >= frontTop) row.push(y === frontTop ? 'c' : 'm2');
        else if (y >= backTop) row.push(y === backTop ? 'c' : 'm');
        else row.push('s');
      }
      rows.push(row);
    }
  } else if (type === 'city') {
    for (let y = 0; y < h; y++) {
      const row: string[] = [];
      for (let x = 0; x < w; x++) {
        const bh = 3 + ((x * 53 + 11) % 8);
        const top = h - 2 - bh;
        if (y === h - 1) row.push('d');
        else if (y === h - 2) row.push(x % 4 < 2 ? 'd2' : 'd');
        else if (y < top) row.push('s');
        else if (y === top) row.push('o2');
        else row.push((x * 7 + y * 3) % 4 === 0 ? 'w' : 'u');
      }
      rows.push(row);
    }
  } else if (type === 'town') {
    for (let y = 0; y < h; y++) {
      const row: string[] = [];
      for (let x = 0; x < w; x++) {
        const cyc = x % 5;
        const inHut = cyc < 3;
        if (y === h - 1) row.push('d');
        else if (inHut && y === h - 6) row.push('o');
        else if (inHut && y === h - 5) row.push('o');
        else if (inHut && y >= h - 4 && y <= h - 2) row.push((x + y) % 3 === 0 ? 'u3' : 'u');
        else if (!inHut && cyc === 3 && (y === h - 3 || y === h - 4)) row.push('tk');
        else if (!inHut && cyc === 4 && (y === h - 5 || y === h - 6)) row.push('lf');
        else row.push('s');
      }
      rows.push(row);
    }
  } else if (type === 'alley') {
    const wallW = Math.round(w * 0.27);
    for (let y = 0; y < h; y++) {
      const row: string[] = [];
      for (let x = 0; x < w; x++) {
        const inWall = x < wallW || x >= w - wallW;
        const midX = Math.floor(w / 2);
        if (inWall) {
          const brick = (x + Math.floor(y / 2)) % 3 === 0;
          const isWindow = (y % 5 === 2 || y % 5 === 3) && (x % 4 === 1 || x % 4 === 2) && y > 1 && y < h - 3;
          row.push(isWindow ? 'w' : brick ? 'u2' : 'u');
        } else if (y === 0) row.push('s');
        else if (y === h - 3 && Math.abs(x - midX) <= 1) row.push('md');
        else row.push('d');
      }
      rows.push(row);
    }
  }
  return rows;
}

const MAP_COLORS: ColorMap = {
  s: '#2b3550', m: '#5c5738', m2: '#4a4630', c: '#c9c2a6', d: '#232622', d2: '#3a3d38',
  u: '#454a52', u2: '#3d434e', u3: '#565c68', w: '#e8d9a0', o: '#8a4a3a', o2: '#5f5a52',
  g: '#8a8058', g2: '#736a48', y: '#d9a63e', tr: '#5f6b45', tk: '#6f5a3c', lf: '#6d7a4c', md: '#141821',
};

interface MapSprite {
  w: number;
  h: number;
  grid: Grid;
}

const MAP_DIMS = { w: 22, h: 14 };

const MAP_SPRITES: Record<MapId, MapSprite> = {
  mountain: { ...MAP_DIMS, grid: buildMapGrid('mountain', MAP_DIMS.w, MAP_DIMS.h) },
  city: { ...MAP_DIMS, grid: buildMapGrid('city', MAP_DIMS.w, MAP_DIMS.h) },
  town: { ...MAP_DIMS, grid: buildMapGrid('town', MAP_DIMS.w, MAP_DIMS.h) },
  alley: { ...MAP_DIMS, grid: buildMapGrid('alley', MAP_DIMS.w, MAP_DIMS.h) },
};

export function flattenCells(grid: Grid, colorMap: ColorMap, cellSize: number): Cell[] {
  const cells: Cell[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const code = grid[y][x];
      if (code === '.') continue;
      const color = colorMap[code];
      if (!color) continue;
      cells.push({ left: x * cellSize, top: y * cellSize, size: cellSize, color });
    }
  }
  return cells;
}

export function vehicleColors(id: VehicleId): ColorMap {
  return { ...CAR_BASE_COLORS, ...VEHICLE_SPRITES[id].colors };
}

export function vehicleSideGrid(id: VehicleId): Grid {
  return VEHICLE_SPRITES[id].grid;
}

export function vehicleTopGrid(id: VehicleId): Grid {
  return VEHICLE_SPRITES[id].gridTop;
}

const topCanvasCache = new Map<VehicleId, HTMLCanvasElement>();

// Renders the top-down sprite once onto an offscreen canvas at 1 device pixel
// per grid cell. Compositing that single bitmap with drawImage (nearest-neighbor
// scaling) avoids the hairline seams that appear between many adjacent
// fillRect() calls once the sprite is drawn at a fractional pixel offset (e.g.
// while swerving during an event).
export function vehicleTopCanvas(id: VehicleId): HTMLCanvasElement {
  const cached = topCanvasCache.get(id);
  if (cached) return cached;
  const grid = vehicleTopGrid(id);
  const colors = vehicleColors(id);
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const canvas = document.createElement('canvas');
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const code = grid[y][x];
      if (code === '.') continue;
      const color = colors[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  topCanvasCache.set(id, canvas);
  return canvas;
}

export function vehicleDims(id: VehicleId): { w: number; h: number } {
  const { w, h } = VEHICLE_SPRITES[id];
  return { w, h };
}

export function mapColors(): ColorMap {
  return MAP_COLORS;
}

export function mapGrid(id: MapId): Grid {
  return MAP_SPRITES[id].grid;
}

export function mapDims(id: MapId): { w: number; h: number } {
  const { w, h } = MAP_SPRITES[id];
  return { w, h };
}
