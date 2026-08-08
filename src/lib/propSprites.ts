// Roadside scenery icons for the race screen, one style per map theme. Same
// offscreen-canvas + drawImage technique as vehicleTopCanvas/effectSprites —
// keeps scaled/tiled icons free of seams.

const TREE_ROWS = ['...f...', '..fff..', '.fffff.', '..fff..', '.fffff.', 'fffffff', '...b...', '...b...'];
const TREE_COLORS: Record<string, string> = { f: '#4a5a34', b: '#5c4326' };

const BUILDING_ROWS = [
  'wwwwwww',
  'w.l.l.w',
  'wwwwwww',
  'w.l.l.w',
  'wwwwwww',
  'w.l.l.w',
  'wwwwwww',
  'w.l.l.w',
  'wwwwwww',
  'w.l.l.w',
  'wwwwwww',
];
const BUILDING_COLORS: Record<string, string> = { w: '#454a56', l: '#e8d9a0' };

const HUT_ROWS = ['....r....', '...rrr...', '..rrrrr..', '.rrrrrrr.', 'wwwwwwwww', 'w.......w', 'w..dd...w', 'w..dd...w', 'wwwwwwwww'];
const HUT_COLORS: Record<string, string> = { r: '#8a4a3a', w: '#c9b98a', d: '#5c4326' };

const BRICK_TILE_ROWS = ['bbbb.bbb', 'bbbb.bbb', 'bb.bbbb.', 'bb.bbbb.'];
const BRICK_TILE_COLORS: Record<string, string> = { b: '#565c68' };

const iconCache = new Map<string, HTMLCanvasElement>();

function buildIconCanvas(key: string, rows: string[], colors: Record<string, string>): HTMLCanvasElement {
  const cached = iconCache.get(key);
  if (cached) return cached;
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const code = rows[y][x];
      if (code === '.') continue;
      const color = colors[code];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  iconCache.set(key, canvas);
  return canvas;
}

export function treeCanvas(): HTMLCanvasElement {
  return buildIconCanvas('tree', TREE_ROWS, TREE_COLORS);
}

export function buildingCanvas(): HTMLCanvasElement {
  return buildIconCanvas('building', BUILDING_ROWS, BUILDING_COLORS);
}

export function hutCanvas(): HTMLCanvasElement {
  return buildIconCanvas('hut', HUT_ROWS, HUT_COLORS);
}

export function brickTileCanvas(): HTMLCanvasElement {
  return buildIconCanvas('brickTile', BRICK_TILE_ROWS, BRICK_TILE_COLORS);
}
