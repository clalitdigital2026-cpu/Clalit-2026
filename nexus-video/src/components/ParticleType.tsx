/**
 * Particle typography: text and logos that assemble out of data particles,
 * morph into the next shape and dissolve back into the stream.
 * Everything is a pure function of time `t` (seconds), so renders are reproducible.
 */
import React, {useMemo} from 'react';
import {FONTS, FX} from '../config/config';
import {clamp01, easeInCubic, easeInOutCubic, lerp, rgba} from '../lib/anim';
import {drawDot, drawGlow, SceneCanvas} from '../lib/canvas';
import {useFontsReady} from '../lib/fonts';
import {fontString, isRTL, Pt, sampleImage, sampleText, TextStyle} from '../lib/points';
import {hash01, snoise} from '../lib/random';

export type ShapeSpec = {
  text?: string;
  style?: TextStyle;
  image?: HTMLImageElement | null;
  imageWidth?: number;
  x: number;
  y: number;
  /** assemble from t0 → t1, hold, start leaving at t2 */
  t0: number;
  t1: number;
  t2: number;
  /** particle colours (picked per particle) – ignored for images (pixel colour) */
  palette?: string[];
  /** crisp fill: solid colour or [left, right] gradient */
  fill?: string | [string, string];
  crisp?: boolean;
  /** glow colour behind crisp text (dark scenes) */
  glowColor?: string;
};

export type EntryMode = 'scatter' | 'left' | 'right' | 'center' | 'below' | 'deep' | 'split';
export type ExitMode = 'scatter' | 'left' | 'right' | 'up' | 'down' | 'implode' | 'forward';

export type Prepared = {
  shapes: (ShapeSpec & {pts: Pt[]; width: number})[];
  n: number;
};

const sortPts = (pts: Pt[]) => [...pts].sort((a, b) => a.x - b.x || a.y - b.y);

export const prepareShapes = (shapes: ShapeSpec[], maxPoints: number): Prepared => {
  const out = shapes.map((s) => {
    let pts: Pt[] = [];
    let width = 0;
    if (s.text && s.style) {
      pts = sampleText(s.text, s.style, maxPoints);
      const c = document.createElement('canvas').getContext('2d')!;
      c.font = fontString(s.style);
      width = c.measureText(s.text).width;
    } else if (s.image) {
      pts = sampleImage(s.image, s.imageWidth ?? 400, maxPoints);
      width = s.imageWidth ?? 400;
    }
    return {...s, pts: sortPts(pts), width};
  });
  const n = Math.max(1, ...out.map((s) => s.pts.length));
  return {shapes: out, n};
};

type Opts = {
  t: number;
  seed?: number;
  mode?: 'dark' | 'light';
  entry?: EntryMode;
  exit?: ExitMode;
  exitDur?: number;
  /** particle radius multiplier */
  size?: number;
  /** origin for 'center' / 'implode' */
  focus?: {x: number; y: number};
  /** how visible particles stay once the crisp text is in (0..1) */
  residual?: number;
};

const entryPos = (mode: EntryMode, i: number, seed: number, target: Pt, focus: {x: number; y: number}) => {
  const a = hash01(seed, i * 3 + 1);
  const b = hash01(seed, i * 3 + 2);
  const c = hash01(seed, i * 3 + 3);
  switch (mode) {
    case 'left':
      return {x: -200 - a * 900, y: target.y + (b - 0.5) * 700};
    case 'right':
      return {x: 2120 + a * 900, y: target.y + (b - 0.5) * 700};
    case 'split': {
      // green pixels arrive from the left, blue from the right (the NEXUS streams)
      const h = target.c ?? '#00ff00';
      const g = parseInt(h.slice(3, 5), 16);
      const bl = parseInt(h.slice(5, 7), 16);
      const fromLeft = g >= bl;
      return {x: fromLeft ? -300 - a * 700 : 2220 + a * 700, y: 540 + (b - 0.5) * 260 + (fromLeft ? 1 : -1) * (c - 0.5) * 300};
    }
    case 'below':
      return {x: target.x + (a - 0.5) * 900, y: 1200 + b * 500};
    case 'center':
      return {x: focus.x + (a - 0.5) * 40, y: focus.y + (b - 0.5) * 40};
    case 'deep': {
      const ang = a * Math.PI * 2;
      const r = 900 + b * 900;
      return {x: 960 + Math.cos(ang) * r, y: 540 + Math.sin(ang) * r * 0.6};
    }
    default: {
      const ang = a * Math.PI * 2;
      const r = 250 + Math.pow(b, 0.6) * 1100;
      return {x: target.x + Math.cos(ang) * r, y: target.y + Math.sin(ang) * r * 0.7 + (c - 0.5) * 120};
    }
  }
};

const exitDelta = (mode: ExitMode, i: number, seed: number, p: Pt, focus: {x: number; y: number}) => {
  const a = hash01(seed + 99, i * 2 + 1);
  const b = hash01(seed + 99, i * 2 + 2);
  switch (mode) {
    case 'left':
      return {x: -900 - a * 1400, y: (b - 0.5) * 260};
    case 'right':
      return {x: 900 + a * 1400, y: (b - 0.5) * 260};
    case 'up':
      return {x: (a - 0.5) * 300, y: -700 - b * 700};
    case 'down':
      return {x: (a - 0.5) * 300, y: 700 + b * 700};
    case 'implode':
      return {x: focus.x - p.x + (a - 0.5) * 10, y: focus.y - p.y + (b - 0.5) * 10};
    case 'forward': {
      const dx = p.x - 960;
      const dy = p.y - 540;
      return {x: dx * (1.5 + a * 2), y: dy * (1.5 + a * 2)};
    }
    default: {
      const ang = a * Math.PI * 2;
      const r = 300 + b * 900;
      return {x: Math.cos(ang) * r, y: Math.sin(ang) * r * 0.7};
    }
  }
};

/** Position + alpha of particle i at time t. */
const particleAt = (prep: Prepared, i: number, t: number, o: Required<Omit<Opts, 'focus'>> & {focus: {x: number; y: number}}) => {
  const {shapes, n} = prep;
  const seed = o.seed;
  const targetOf = (k: number): Pt => {
    const s = shapes[k];
    const len = s.pts.length;
    if (!len) return {x: s.x, y: s.y};
    const p = s.pts[Math.min(len - 1, Math.floor((i * len) / n))];
    return {x: s.x + p.x, y: s.y + p.y, c: p.c};
  };
  // stagger in reading order (RTL for Hebrew)
  const stagger = (k: number) => {
    const s = shapes[k];
    const len = s.pts.length || 1;
    const p = s.pts[Math.min(len - 1, Math.floor((i * len) / n))] ?? {x: 0, y: 0};
    const w = s.width || 1;
    let ord = clamp01(p.x / w + 0.5);
    if (s.text && isRTL(s.text)) ord = 1 - ord;
    return clamp01(ord * 0.65 + hash01(seed + k, i) * 0.35);
  };
  const arc = (from: Pt, to: Pt, e: number, k: number) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const curl = (hash01(seed + 17 + k, i) - 0.5) * 0.55;
    const s = Math.sin(Math.PI * e) * curl;
    return {x: lerp(from.x, to.x, e) - dy * s, y: lerp(from.y, to.y, e) + dx * s};
  };

  for (let k = 0; k < shapes.length; k++) {
    const s = shapes[k];
    const target = targetOf(k);
    if (t < s.t1) {
      const from =
        k === 0 ? entryPos(o.entry, i, seed, target, o.focus) : targetOf(k - 1);
      const span = s.t1 - s.t0;
      const d = stagger(k) * span * 0.45;
      const e = easeInOutCubic(clamp01((t - s.t0 - d) / (span * 0.55)));
      const pos = arc(from, target, e, k);
      const alpha = k === 0 ? clamp01((t - s.t0 + 0.25) / 0.35) : 1;
      return {...pos, c: target.c, alpha, settle: e, k};
    }
    if (t < s.t2 || k < shapes.length - 1) {
      if (t < s.t2) {
        const br = 1.2;
        return {
          x: target.x + snoise(seed + i, t * 0.8) * br,
          y: target.y + snoise(seed + i + 5000, t * 0.8) * br,
          c: target.c,
          alpha: 1,
          settle: 1,
          k,
        };
      }
      continue; // morph into next shape
    }
    // exit of last shape
    const span = o.exitDur;
    const d = stagger(k) * span * 0.4;
    const e = easeInCubic(clamp01((t - s.t2 - d) / (span * 0.6)));
    const dv = exitDelta(o.exit, i, seed, target, o.focus);
    const wob = Math.sin(e * Math.PI) * 40;
    return {
      x: target.x + dv.x * e + snoise(seed + i, t * 2) * wob,
      y: target.y + dv.y * e + snoise(seed + i + 7, t * 2) * wob,
      c: target.c,
      alpha: 1 - clamp01((e - 0.55) / 0.45),
      settle: 1 - e,
      k,
    };
  }
  return {x: 0, y: 0, c: undefined as string | undefined, alpha: 0, settle: 0, k: 0};
};

/** Crisp-type opacity for shape k at time t. */
export const crispAlpha = (s: ShapeSpec, t: number, isLast: boolean, exitDur: number) => {
  const inA = clamp01((t - (s.t1 - 0.22)) / 0.3);
  const outEnd = isLast ? s.t2 + exitDur * 0.25 : s.t2 + 0.12;
  const outA = 1 - clamp01((t - s.t2 + 0.05) / Math.max(0.05, outEnd - s.t2 + 0.05));
  return inA * outA;
};

export const drawParticleShapes = (ctx: CanvasRenderingContext2D, prep: Prepared, opts: Opts) => {
  const o = {
    seed: 1,
    mode: 'dark' as const,
    entry: 'scatter' as EntryMode,
    exit: 'scatter' as ExitMode,
    exitDur: 0.8,
    size: 1,
    focus: {x: 960, y: 540},
    residual: 0.18,
    ...opts,
  };
  const {t} = o;
  const first = prep.shapes[0];
  const last = prep.shapes[prep.shapes.length - 1];
  if (!first || t < first.t0 - 0.3 || t > last.t2 + o.exitDur + 0.1) return;
  const dark = o.mode === 'dark';

  // crisp layers first (particles sparkle on top)
  prep.shapes.forEach((s, k) => {
    if (s.crisp === false) return;
    const a = crispAlpha(s, t, k === prep.shapes.length - 1, o.exitDur);
    if (a <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = a;
    if (s.text && s.style) {
      ctx.font = fontString(s.style);
      if (s.style.letterSpacing) (ctx as unknown as {letterSpacing: string}).letterSpacing = `${s.style.letterSpacing}px`;
      ctx.direction = isRTL(s.text) ? 'rtl' : 'ltr';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fill = s.fill ?? (dark ? '#ffffff' : '#00163C');
      if (Array.isArray(fill)) {
        const g = ctx.createLinearGradient(s.x - s.width / 2, 0, s.x + s.width / 2, 0);
        g.addColorStop(0, fill[0]);
        g.addColorStop(1, fill[1]);
        ctx.fillStyle = g;
      } else ctx.fillStyle = fill;
      if (dark && s.glowColor) {
        ctx.shadowColor = rgba(s.glowColor, 0.85 * FX.glow);
        ctx.shadowBlur = 36 * FX.glow;
      }
      ctx.fillText(s.text, s.x, s.y);
      ctx.shadowBlur = 0;
      if (s.style.letterSpacing) (ctx as unknown as {letterSpacing: string}).letterSpacing = '0px';
    } else if (s.image) {
      const w = s.imageWidth ?? 400;
      const h = (s.image.naturalHeight / s.image.naturalWidth) * w;
      ctx.drawImage(s.image, s.x - w / 2, s.y - h / 2, w, h);
    }
    ctx.restore();
  });

  ctx.save();
  if (dark) ctx.globalCompositeOperation = 'lighter';
  const n = prep.n;
  const sz = o.size;
  for (let i = 0; i < n; i++) {
    const p = particleAt(prep, i, t, o);
    if (p.alpha <= 0.01) continue;
    const s = prep.shapes[p.k];
    const pal = s.palette ?? (dark ? ['#25D366', '#00B1DF', '#ffffff'] : ['#00A44C', '#0079D5', '#00163C']);
    const color = p.c ?? pal[Math.floor(hash01(o.seed + 3, i) * pal.length)];
    // once crisp type is visible the particles thin out into a shimmer
    const ca = s.crisp === false ? 0 : crispAlpha(s, t, p.k === prep.shapes.length - 1, o.exitDur);
    const shimmer = 0.5 + 0.5 * Math.sin(t * 6 + i * 1.7);
    const vis = p.alpha * lerp(1, o.residual * shimmer, ca);
    const r = (1.1 + hash01(o.seed + 5, i) * 1.4) * sz;
    if (dark) {
      drawGlow(ctx, color, p.x, p.y, r * 3.2, vis * 0.9, hash01(o.seed + 9, i) > 0.93);
    } else {
      drawDot(ctx, color, p.x, p.y, r * 0.95, vis);
    }
  }
  ctx.restore();
};

/** Self-contained particle-type layer. */
export const ParticleType: React.FC<{shapes: ShapeSpec[]} & Opts & {maxPoints?: number}> = ({
  shapes,
  maxPoints,
  ...opts
}) => {
  const ready = useFontsReady();
  const imagesReady = shapes.every((s) => !('image' in s) || s.image);
  const key = shapes.map((s) => `${s.text ?? ''}|${s.style ? fontString(s.style) : ''}|${s.image?.src ?? ''}|${s.imageWidth ?? ''}`).join('#');
  const prep = useMemo(
    () => (ready && imagesReady ? prepareShapes(shapes, Math.round((maxPoints ?? FX.textParticles) * FX.particleDensity)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, imagesReady, key, maxPoints]
  );
  // positions may be animated by the caller – update without resampling
  if (prep) prep.shapes.forEach((s, k) => Object.assign(s, {x: shapes[k].x, y: shapes[k].y, t0: shapes[k].t0, t1: shapes[k].t1, t2: shapes[k].t2}));
  return <SceneCanvas draw={(ctx) => prep && drawParticleShapes(ctx, prep, opts)} />;
};

export const HEBREW_DISPLAY: TextStyle = {size: 150, weight: 800, family: FONTS.stack};
