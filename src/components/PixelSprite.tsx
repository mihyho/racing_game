import type { Cell } from '@/lib/sprites';

interface PixelSpriteProps {
  cells: Cell[];
  width: number;
  height: number;
}

export function PixelSprite({ cells, width, height }: PixelSpriteProps) {
  return (
    <div style={{ position: 'relative', width, height }}>
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: c.left,
            top: c.top,
            width: c.size,
            height: c.size,
            background: c.color,
          }}
        />
      ))}
    </div>
  );
}
