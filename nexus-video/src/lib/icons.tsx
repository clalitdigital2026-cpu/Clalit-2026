/** Original line-icon set (48×48 grid) used in canvas and SVG. */
import React from 'react';

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const ICONS = {
  hospital: 'M8 42V14h32v28 M4 42h40 M20 42v-8h8v8 M24 18v10 M19 23h10 M14 14V8h20v6',
  clinic: 'M6 22L24 8l18 14 M10 19v23h28V19 M24 24v10 M19 29h10',
  tube: 'M17 4h14 M20 4v31a4 4 0 0 0 8 0V4 M20 22h8 M23 28h2',
  lab: 'M19 4h10 M21 4v12L9 40a3 3 0 0 0 3 4h24a3 3 0 0 0 3-4L27 16V4 M14 31h20',
  record: 'M12 4h18l8 8v32H12z M30 4v8h8 M16 28h5l3-6 4 12 3-6h3',
  phone: 'M15 4h18a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z M21 38h6 M17 12h14v14H17z M17 17h14 M21 21h2 M25 21h2',
  rx: 'M12 4h24v40H12z M18 13v14 M18 13h5a3.5 3.5 0 0 1 0 7h-5 M21 20l8 9 M29 22l-6 6 M17 35h14',
  bed: 'M4 38V16 M4 30h40v8 M44 30v-6a4 4 0 0 0-4-4H20v10 ' + circle(13, 25, 3) + ' M28 6h12 M36 2l4 4-4 4',
  scan: circle(24, 22, 17) + ' ' + circle(24, 22, 9) + ' M24 13v18 M15 22h18 M8 44h32',
  database: 'M8 10c0-3 7-6 16-6s16 3 16 6-7 6-16 6-16-3-16-6z M8 10v28c0 3 7 6 16 6s16-3 16-6V10 M8 19c0 3 7 6 16 6s16-3 16-6 M8 28c0 3 7 6 16 6s16-3 16-6',
  server: 'M6 6h36v10H6z M6 19h36v10H6z M6 32h36v10H6z M11 11h3 M11 24h3 M11 37h3 M30 11h8 M30 24h8 M30 37h8',
  cloud: 'M14 38h22a9 9 0 0 0 1-18 12 12 0 0 0-23-2 9 9 0 0 0 0 20z',
  bell: 'M12 34V22a12 12 0 0 1 24 0v12l4 4H8z M20 42a4 4 0 0 0 8 0 M24 6v4',
  ai:
    [circle(24, 8, 3), circle(9, 24, 3), circle(39, 24, 3), circle(24, 40, 3), circle(24, 24, 4)].join(' ') +
    ' M24 11v9 M12 24h8 M28 24h8 M24 28v9 M11 22l11-12 M37 22L26 10 M11 26l11 12 M37 26L26 38',
  chart: 'M6 42h36 M11 42V28 M19 42V18 M27 42V24 M35 42V10 M9 20l10-8 8 6 10-12',
  person: circle(24, 14, 7) + ' M11 43v-5a13 13 0 0 1 26 0v5',
  pill: 'M10 30l20-20a7 7 0 0 1 10 10L20 40a7 7 0 0 1-10-10z M20 20l10 10',
  calendar: 'M8 10h32v32H8z M8 18h32 M16 6v8 M32 6v8 M15 26h5 M28 26h5 M15 34h5 M28 34h5',
  gear: circle(24, 24, 7) + ' ' + circle(24, 24, 15) + ' M24 3v6 M24 39v6 M3 24h6 M39 24h6 M9 9l4 4 M35 35l4 4 M39 9l-4 4 M13 35l-4 4',
  molecule:
    [circle(12, 14, 4), circle(36, 12, 4), circle(24, 28, 5), circle(10, 38, 3), circle(38, 38, 4)].join(' ') +
    ' M15 17l6 7 M33 15l-6 9 M20 32l-8 5 M28 32l7 4',
  team: circle(17, 16, 5) + ' ' + circle(32, 16, 5) + ' M7 40v-4a10 10 0 0 1 20 0v4 M22 40v-4a10 10 0 0 1 20 0v4',
  shield: 'M24 4l16 6v12c0 10-7 18-16 22-9-4-16-12-16-22V10z M17 24l5 5 9-10',
};

export type IconName = keyof typeof ICONS;

const pathCache = new Map<string, Path2D>();
const path2d = (name: IconName) => {
  let p = pathCache.get(name);
  if (!p) {
    p = new Path2D(ICONS[name]);
    pathCache.set(name, p);
  }
  return p;
};

/** Stroke an icon centred at (x, y), `size` px wide. */
export const drawIcon = (
  ctx: CanvasRenderingContext2D,
  name: IconName,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
  lineWidth = 2.4
) => {
  if (alpha <= 0.003 || size <= 1) return;
  const k = size / 48;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(k, k);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke(path2d(name));
  ctx.restore();
};

export const Icon: React.FC<{name: IconName; size: number; color: string; stroke?: number; style?: React.CSSProperties}> = ({
  name,
  size,
  color,
  stroke = 2.4,
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={style}>
    <path d={ICONS[name]} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
