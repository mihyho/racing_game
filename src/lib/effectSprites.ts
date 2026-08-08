// Small pixel-icon sprites for in-race event effects (rockfall, pedestrian,
// obstacle, signal). Same offscreen-canvas + drawImage technique as the
// vehicle sprites (see vehicleTopCanvas in sprites.ts) so scaled/animated
// icons never show seams between cells.

const ROCK_ROWS = ['..bb..', '.bbbb.', 'bbdddb', 'bddddb', '.bbbb.', '..bb..'];
const ROCK_COLORS: Record<string, string> = { b: '#8a7a5c', d: '#5a4a38' };

const PEDESTRIAN_ROWS = ['.hh.', '.hh.', 'ssss', 'ssss', 'ssss', '.ll.', '.ll.', 'l..l', 'l..l'];
const PEDESTRIAN_COLORS: Record<string, string> = { h: '#e0b98a', s: '#d9a63e', l: '#232a3d' };

const OBSTACLE_ROWS = ['..cc..', '.cccc.', '.cccc.', 'cccccc', 'cccccc', '.dddd.', '.dddd.'];
const OBSTACLE_COLORS: Record<string, string> = { c: '#c85a2c', d: '#3a3d38' };

const SIGNAL_ROWS = ['bbbbb', 'brrrb', 'byyyb', 'bgggb', 'bbbbb', '..b..', '..b..'];
const SIGNAL_COLORS: Record<string, string> = { b: '#232622', r: '#e0503a', y: '#4a4630', g: '#3a4a30' };

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

export function rockCanvas(): HTMLCanvasElement {
  return buildIconCanvas('rock', ROCK_ROWS, ROCK_COLORS);
}

export function pedestrianCanvas(): HTMLCanvasElement {
  return buildIconCanvas('pedestrian', PEDESTRIAN_ROWS, PEDESTRIAN_COLORS);
}

export function obstacleCanvas(): HTMLCanvasElement {
  return buildIconCanvas('obstacle', OBSTACLE_ROWS, OBSTACLE_COLORS);
}

export function signalCanvas(): HTMLCanvasElement {
  return buildIconCanvas('signal', SIGNAL_ROWS, SIGNAL_COLORS);
}
