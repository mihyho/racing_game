'use client';

import { useEffect, useRef } from 'react';
import { obstacleCanvas, pedestrianCanvas, rockCanvas, signalCanvas } from '@/lib/effectSprites';
import { MAP_LIST } from '@/lib/maps';
import { brickTileCanvas, buildingCanvas, hutCanvas, treeCanvas } from '@/lib/propSprites';
import { RACE_THEMES, type PropKind } from '@/lib/raceTheme';
import { vehicleTopCanvas } from '@/lib/sprites';
import { VEHICLE_LIST } from '@/lib/vehicles';
import { useGameStore } from '@/store/useGameStore';
import type { EventKind } from '@/types/game';

const SHOULDER_W = 46;
const ROAD_W = 290;
const CANVAS_W = SHOULDER_W * 2 + ROAD_W;
const CANVAS_H = 420;
const CELL_TOP = 4;
const LANE_OFFSET_SCALE = 90;
const DASH_LEN = 24;
const DASH_GAP = 24;
const DASH_PERIOD = DASH_LEN + DASH_GAP;

const EVENT_MESSAGES: Record<EventKind, string> = {
  rockfall: '! 낙석 발생',
  signal: '! 신호 변경 감지',
  pedestrian: '! 보행자 출현',
  obstacle: '! 장애물 발견',
};

const COLOR_DASH = '#141821';
const COLOR_EVENT_BG = '#b5432c';
const COLOR_EVENT_TEXT = '#e8e3d3';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
function clamp01(v: number): number {
  return clamp(v, 0, 1);
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawRockfall(ctx: CanvasRenderingContext2D, frac: number, ts: number, laneCenterX: number, groundY: number) {
  const rock = rockCanvas();
  [-1, 0, 1].forEach((m, i) => {
    const fallFrac = clamp01(frac * 1.4 - i * 0.2);
    const size = i === 1 ? 20 : 14;
    const x = clamp(laneCenterX + m * 34 + Math.sin(ts / 90 + i) * 2, SHOULDER_W + 12, SHOULDER_W + ROAD_W - 12);
    if (fallFrac < 1) {
      const y = lerp(46, groundY - 10, fallFrac);
      ctx.drawImage(rock, Math.round(x - size / 2), Math.round(y), size, size);
    } else {
      ctx.fillStyle = 'rgba(20,24,33,0.35)';
      ctx.beginPath();
      ctx.ellipse(x, groundY - 6, size * 0.5, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawPedestrian(ctx: CanvasRenderingContext2D, frac: number, ts: number, groundY: number, recoverDuration: number) {
  const ped = pedestrianCanvas();
  const dir = Math.sin(recoverDuration * 12.9898) >= 0 ? 1 : -1;
  const xStart = dir > 0 ? SHOULDER_W + 14 : SHOULDER_W + ROAD_W - 14;
  const xEnd = dir > 0 ? SHOULDER_W + ROAD_W - 14 : SHOULDER_W + 14;
  const x = lerp(xStart, xEnd, frac);
  const y = groundY - 90 + Math.sin(ts / 120) * 2;
  const w = 16;
  const h = 36;
  ctx.drawImage(ped, Math.round(x - w / 2), Math.round(y), w, h);
}

function drawObstacle(ctx: CanvasRenderingContext2D, frac: number, laneCenterX: number, groundY: number) {
  const obs = obstacleCanvas();
  const appearAlpha = clamp01(frac / 0.2) * clamp01((1 - frac) / 0.2 + 1);
  const scale = lerp(0.6, 1.3, Math.min(frac, 1));
  const w = 6 * 4 * scale;
  const h = 7 * 4 * scale;
  const y = lerp(70, groundY - 30, frac);
  ctx.globalAlpha = clamp01(appearAlpha);
  ctx.drawImage(obs, Math.round(laneCenterX - w / 2), Math.round(y - h), w, h);
  ctx.globalAlpha = 1;
}

function drawSignal(ctx: CanvasRenderingContext2D, ts: number) {
  const sig = signalCanvas();
  const blink = Math.floor(ts / 300) % 2 === 0;
  const w = 5 * 4;
  const h = 7 * 4;
  const x = SHOULDER_W + ROAD_W / 2 - w / 2;
  const y = 46;
  ctx.globalAlpha = blink ? 1 : 0.45;
  ctx.drawImage(sig, Math.round(x), Math.round(y), w, h);
  ctx.globalAlpha = 1;
}

function drawBanner(ctx: CanvasRenderingContext2D, msg: string, bg: string, text: string) {
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textW = ctx.measureText(msg).width;
  const boxW = textW + 20;
  const boxH = 26;
  const boxX = SHOULDER_W + ROAD_W / 2 - boxW / 2;
  const boxY = 14;
  ctx.fillStyle = bg;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = text;
  ctx.fillText(msg, SHOULDER_W + ROAD_W / 2, boxY + boxH / 2 + 1);
}

function drawCrash(ctx: CanvasRenderingContext2D, ts: number, crashElapsed: number, carLeft: number, carTop: number, pixelW: number) {
  const impactFrac = clamp01(crashElapsed / 0.4);
  if (impactFrac < 1) {
    const cx = carLeft + pixelW / 2;
    const cy = carTop;
    const sparkCount = 6;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2;
      const dist = impactFrac * 24;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist * 0.6;
      ctx.fillStyle = `rgba(224,80,58,${(1 - impactFrac).toFixed(2)})`;
      ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 4, 4);
    }
  }
  if (Math.floor(ts / 220) % 2 === 0) {
    drawBanner(ctx, '! 사고 발생 - 정차 중', '#e0392a', '#ffffff');
  }
}

function drawCollision(ctx: CanvasRenderingContext2D, ts: number) {
  if (Math.floor(ts / 220) % 2 === 0) {
    drawBanner(ctx, '! 주변 구조물에 부딪혔습니다', '#8a4a3a', '#e8e3d3');
  }
}

function drawSceneryStrip(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  xCenter: number,
  propKind: PropKind,
  scrollY: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, 0, x1 - x0, CANVAS_H);
  ctx.clip();

  if (propKind === 'brick') {
    const tile = brickTileCanvas();
    const scale = 6;
    const tw = tile.width * scale;
    const th = tile.height * scale;
    for (let y = -th + (scrollY % th); y < CANVAS_H + th; y += th) {
      for (let x = x0 - tw; x < x1 + tw; x += tw) {
        ctx.drawImage(tile, Math.round(x), Math.round(y), tw, th);
      }
    }
  } else {
    let icon: HTMLCanvasElement;
    let scale: number;
    let spacing: number;
    if (propKind === 'tree') {
      icon = treeCanvas();
      scale = 4;
      spacing = 110;
    } else if (propKind === 'building') {
      icon = buildingCanvas();
      scale = 5;
      spacing = 140;
    } else {
      icon = hutCanvas();
      scale = 4;
      spacing = 100;
    }
    const w = icon.width * scale;
    const h = icon.height * scale;
    for (let y = -spacing + (scrollY % spacing); y < CANVAS_H + spacing; y += spacing) {
      ctx.drawImage(icon, Math.round(xCenter - w / 2), Math.round(y), w, h);
    }
  }

  ctx.restore();
}

export function RaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    let dashOffset = 0;
    let sceneryOffset = 0;
    let lastTs: number | null = null;
    let rafId = 0;

    function draw(ts: number) {
      if (lastTs == null) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.1);
      lastTs = ts;

      const { race, vehicleIdx, mapIdx } = useGameStore.getState();
      const vehicle = VEHICLE_LIST[vehicleIdx];
      const map = MAP_LIST[mapIdx];
      const theme = RACE_THEMES[map.id];

      dashOffset = (dashOffset + race.speed * dt * 2) % DASH_PERIOD;
      sceneryOffset = (sceneryOffset + race.speed * dt * 2) % 100000;

      ctx!.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx!.fillStyle = theme.shoulderColor;
      ctx!.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx!.fillStyle = theme.roadColor;
      ctx!.fillRect(SHOULDER_W, 0, ROAD_W, CANVAS_H);

      drawSceneryStrip(ctx!, 0, SHOULDER_W, SHOULDER_W / 2, theme.propKind, sceneryOffset);
      drawSceneryStrip(ctx!, CANVAS_W - SHOULDER_W, CANVAS_W, CANVAS_W - SHOULDER_W / 2, theme.propKind, sceneryOffset);

      ctx!.fillStyle = COLOR_DASH;
      const laneXs = [SHOULDER_W + ROAD_W * 0.33, SHOULDER_W + ROAD_W * 0.66];
      for (const lx of laneXs) {
        for (let y = -DASH_PERIOD + dashOffset; y < CANVAS_H + DASH_PERIOD; y += DASH_PERIOD) {
          ctx!.fillRect(lx, y, 6, DASH_LEN);
        }
      }

      const sprite = vehicleTopCanvas(vehicle.id);
      const pixelW = sprite.width * CELL_TOP;
      const pixelH = sprite.height * CELL_TOP;
      const carLeftBase = SHOULDER_W + ROAD_W / 2 - pixelW / 2;
      const carTop = CANVAS_H - 24 - pixelH;
      const carLeft = carLeftBase + race.laneOffset * LANE_OFFSET_SCALE;
      const laneCenterX = carLeftBase + pixelW / 2;

      ctx!.drawImage(sprite, Math.round(carLeft), Math.round(carTop), pixelW, pixelH);

      if (race.crashed) {
        drawCrash(ctx!, ts, race.crashElapsed, carLeft, carTop, pixelW);
      } else if (race.collisionActive) {
        drawCollision(ctx!, ts);
      } else if (race.eventActive && race.eventKind) {
        const frac = race.recoverDuration > 0 ? clamp01(race.recoverElapsed / race.recoverDuration) : 0;
        switch (race.eventKind) {
          case 'rockfall':
            drawRockfall(ctx!, frac, ts, laneCenterX, carTop);
            break;
          case 'pedestrian':
            drawPedestrian(ctx!, frac, ts, carTop, race.recoverDuration);
            break;
          case 'obstacle':
            drawObstacle(ctx!, frac, laneCenterX, carTop);
            break;
          case 'signal':
            drawSignal(ctx!, ts);
            break;
        }
        if (Math.floor(ts / 250) % 2 === 0) {
          drawBanner(ctx!, EVENT_MESSAGES[race.eventKind], COLOR_EVENT_BG, COLOR_EVENT_TEXT);
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        imageRendering: 'pixelated',
        display: 'block',
      }}
    />
  );
}
