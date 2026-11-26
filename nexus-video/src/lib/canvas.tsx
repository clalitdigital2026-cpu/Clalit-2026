import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {VIDEO} from '../config/config';
import {rgba} from './anim';

export const W = VIDEO.width;
export const H = VIDEO.height;

/** Ratio between the output resolution and the 1920×1080 design space. */
export const useUnit = () => useVideoConfig().width / VIDEO.width;

/**
 * Design-space stage: children are laid out in 1920×1080 and scaled to the
 * output resolution (DOM stays vector-crisp, canvases render natively).
 */
export const Stage: React.FC<{children: React.ReactNode; background?: string}> = ({children, background}) => {
  const u = useUnit();
  return (
    <AbsoluteFill style={{background: background ?? 'transparent', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: W,
          height: H,
          transform: `scale(${u})`,
          transformOrigin: '0 0',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export type DrawFn = (ctx: CanvasRenderingContext2D) => void;

/** Full-frame canvas inside a <Stage>. `draw` runs synchronously on every frame. */
export const SceneCanvas: React.FC<{draw: DrawFn; style?: React.CSSProperties}> = ({draw, style}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const u = useUnit();
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(u, 0, 0, u, 0, 0);
    draw(ctx);
  });
  return (
    <canvas
      ref={ref}
      width={Math.round(W * u)}
      height={Math.round(H * u)}
      style={{position: 'absolute', left: 0, top: 0, width: W, height: H, ...style}}
    />
  );
};

// ---------------------------------------------------------------------------
// Glow sprites (pre-rendered radial gradients → fast additive particles)
// ---------------------------------------------------------------------------
const spriteCache = new Map<string, HTMLCanvasElement>();

export const glowSprite = (color: string, hot = false) => {
  const key = `${color}|${hot}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const s = 128;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  if (hot) {
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.12, rgba(color, 1));
    grad.addColorStop(0.3, rgba(color, 0.35));
    grad.addColorStop(0.6, rgba(color, 0.08));
    grad.addColorStop(1, rgba(color, 0));
  } else {
    grad.addColorStop(0, rgba(color, 1));
    grad.addColorStop(0.25, rgba(color, 0.55));
    grad.addColorStop(0.55, rgba(color, 0.12));
    grad.addColorStop(1, rgba(color, 0));
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  spriteCache.set(key, c);
  return c;
};

export const drawGlow = (
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  r: number,
  alpha = 1,
  hot = false
) => {
  if (alpha <= 0.003 || r <= 0.05) return;
  ctx.globalAlpha = alpha > 1 ? 1 : alpha;
  ctx.drawImage(glowSprite(color, hot), x - r, y - r, r * 2, r * 2);
};

/** Solid round dot (for light backgrounds where additive glow disappears). */
export const drawDot = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, r: number, alpha = 1) => {
  if (alpha <= 0.003 || r <= 0.05) return;
  ctx.globalAlpha = alpha > 1 ? 1 : alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

/** Thin streak (fake motion blur) from (x0,y0) to (x1,y1). */
export const drawStreak = (
  ctx: CanvasRenderingContext2D,
  color: string,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  alpha = 1
) => {
  if (alpha <= 0.003) return;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, alpha > 1 ? 1 : alpha));
  ctx.globalAlpha = 1;
  ctx.strokeStyle = g;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
};
