/**
 * Scene 7 – What it will enable (01:02–01:15)
 * Fast, precise cuts on the beat. Every benefit gets its own visual idea,
 * alternating night and day; then the four keywords hit like drums.
 */
import React, {useMemo} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ASSETS, COLORS, CUES, FONTS, FX, TEXT} from '../config/config';
import {Center, WordReveal} from '../components/Kinetic';
import {clamp01, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, flash, lerp, ramp, rgba} from '../lib/anim';
import {drawDot, drawGlow, SceneCanvas, Stage} from '../lib/canvas';
import {drawIcon, IconName} from '../lib/icons';
import {hash01, snoise} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('benefits');
const BT = CUES.benefits.map(at); // starts
const KW = CUES.keywords.map(at);
const ITEMS = TEXT.benefits.items;
const ends = BT.map((b, k) => (k < BT.length - 1 ? BT[k + 1] : KW[0]));
const isDark = (k: number) => k % 2 === 0;
const DARK_BG = '#061A3A';
const LIGHT_BG = COLORS.pearl;

type Ctx = CanvasRenderingContext2D;

// ---------------------------------------------------------------------------
// 1. Real-time – a wave of information lights up every endpoint
// ---------------------------------------------------------------------------
const drawRealtime = (ctx: Ctx, lt: number) => {
  const cols = 26;
  const rows = 12;
  const R = easeOutCubic(clamp01(lt / 1.45)) * 1300;
  const node = (i: number, j: number) => ({
    x: 960 + (i - (cols - 1) / 2) * 76 + (j % 2) * 38 + snoise(i * 31 + j, lt) * 6,
    y: 430 + (j - (rows - 1) / 2) * 62,
  });
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const p = node(i, j);
      const d = Math.hypot(p.x - 960, (p.y - 430) * 1.6);
      const front = Math.exp(-Math.pow((d - R) / 90, 2));
      const lit = d < R ? 0.45 : 0;
      const a = 0.12 + lit + front;
      if (i < cols - 1) {
        const q = node(i + 1, j);
        ctx.globalAlpha = Math.min(1, a * 0.5);
        ctx.strokeStyle = COLORS.turquoise;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      if (j < rows - 1) {
        const q = node(i, j + 1);
        ctx.globalAlpha = Math.min(1, a * 0.4);
        ctx.strokeStyle = COLORS.glowGreen;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      drawGlow(ctx, (i + j) % 3 ? COLORS.turquoise : COLORS.glowGreen, p.x, p.y, 10 + front * 26, Math.min(1, a * 1.4), front > 0.4);
    }
  }
  // the wave itself
  ctx.globalAlpha = 0.6 * (1 - clamp01(lt / 1.4));
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(960, 430, R, R / 1.6, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawGlow(ctx, '#ffffff', 960, 430, 60 + flash(lt, 0, 0.3) * 200, 0.9, true);
};

// ---------------------------------------------------------------------------
// 2. Less complexity – a tangle resolves into one clean infrastructure
// ---------------------------------------------------------------------------
const drawSimplicity = (ctx: Ctx, lt: number) => {
  const n = 46;
  const e = easeInOutCubic(clamp01((lt - 0.25) / 0.85));
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ay = 160 + hash01(1, i) * 560;
    const by = 160 + hash01(2, i) * 560;
    const lane = 330 + (i / (n - 1)) * 220;
    const y0 = lerp(ay, lerp(220, 660, i / (n - 1)), e);
    const y3 = lerp(by, lerp(220, 660, i / (n - 1)), e);
    const c1x = lerp(200 + hash01(3, i) * 1500, 760, e);
    const c1y = lerp(hash01(4, i) * 900, lane, e);
    const c2x = lerp(200 + hash01(5, i) * 1500, 1160, e);
    const c2y = lerp(hash01(6, i) * 900, lane, e);
    const col = i % 3 === 0 ? COLORS.emerald : i % 3 === 1 ? COLORS.skyBlue : COLORS.navy;
    ctx.globalAlpha = lerp(0.35, 0.75, e);
    ctx.strokeStyle = col;
    ctx.lineWidth = lerp(1.5, 2.4, e);
    ctx.beginPath();
    ctx.moveTo(140, y0);
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, 1780, y3);
    ctx.stroke();
  }
  // the unified spine
  ctx.globalAlpha = e;
  const g = ctx.createLinearGradient(760, 0, 1160, 0);
  g.addColorStop(0, COLORS.emerald);
  g.addColorStop(1, COLORS.deepBlue);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(lerp(960, 760, e), 318, lerp(0, 400, e), 244, 122);
  ctx.globalAlpha = e * 0.14;
  ctx.fill();
  ctx.globalAlpha = e;
  ctx.strokeStyle = g;
  ctx.lineWidth = 3;
  ctx.stroke();
  for (const x of [140, 1780]) {
    for (let j = 0; j < 9; j++) drawDot(ctx, j % 2 ? COLORS.skyBlue : COLORS.emerald, x, 200 + j * 60, 8, 0.9);
  }
};

// ---------------------------------------------------------------------------
// 3. Faster development – modules snap together into a new service
// ---------------------------------------------------------------------------
const cube = (ctx: Ctx, x: number, y: number, s: number, top: string, left: string, right: string, a: number) => {
  const h = s * 0.5;
  ctx.globalAlpha = a;
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h + s * 0.9);
  ctx.lineTo(x - s, y + s * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(x + s, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h + s * 0.9);
  ctx.lineTo(x + s, y + s * 0.9);
  ctx.closePath();
  ctx.fill();
};
const drawModular = (ctx: Ctx, lt: number) => {
  const s = 62;
  const cells: {i: number; j: number; k: number}[] = [];
  for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (k === 0 || (i > 0 && i < 3 && j > 0 && j < 3)) cells.push({i, j, k});
  cells.sort((a, b) => a.k - b.k || a.i + a.j - (b.i + b.j));
  cells.forEach((c, n) => {
    const tx = 960 + (c.i - c.j) * s;
    const ty = 420 + (c.i + c.j) * s * 0.5 - c.k * s * 0.9 - 60;
    const d = 0.05 + n * 0.035;
    const e = easeOutBack(clamp01((lt - d) / 0.45), 1.4);
    const ang = hash01(12, n) * Math.PI * 2;
    const x = lerp(tx + Math.cos(ang) * 900, tx, e);
    const y = lerp(ty + Math.sin(ang) * 600, ty, e);
    const green = (c.i + c.j + c.k) % 2 === 0;
    cube(ctx, x, y, s * 0.94, green ? COLORS.glowGreen : COLORS.turquoise, green ? COLORS.emeraldDeep : COLORS.deepBlue, green ? COLORS.emerald : COLORS.ocean, clamp01(e * 1.5));
  });
  const done = flash(lt, 1.05, 0.4);
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, COLORS.turquoise, 960, 470, 300 + done * 200, done * 0.8);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = ramp(lt, 1.0, 1.25);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.ellipse(960, 520, 360, 200, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
};

// ---------------------------------------------------------------------------
// 4. Smarter operations – thousands of points become one clear picture
// ---------------------------------------------------------------------------
const opsTargets = (() => {
  const pts: {x: number; y: number; c: string}[] = [];
  const heights = [0.45, 0.7, 0.55, 0.85, 0.65, 0.95, 0.75];
  heights.forEach((h, b) => {
    for (let y = 0; y < Math.round(h * 26); y++)
      for (let x = 0; x < 5; x++) pts.push({x: 360 + b * 92 + x * 13, y: 650 - y * 15, c: b % 2 ? COLORS.skyBlue : COLORS.emerald});
  });
  for (let k = 0; k < 280; k++) {
    const a = -Math.PI / 2 + (k / 280) * Math.PI * 2 * 0.78;
    const r = 175 + (k % 4) * 14;
    pts.push({x: 1340 + Math.cos(a) * r, y: 440 + Math.sin(a) * r, c: k % 2 ? COLORS.turquoise : COLORS.deepBlue});
  }
  for (let k = 0; k < 90; k++) pts.push({x: 1130 + k * 4.6, y: 720 + Math.sin(k * 0.25) * 22, c: COLORS.emerald});
  return pts;
})();
const drawOperations = (ctx: Ctx, lt: number) => {
  opsTargets.forEach((p, i) => {
    const d = hash01(21, i) * 0.35;
    const e = easeInOutCubic(clamp01((lt - 0.1 - d) / 0.7));
    const sx = hash01(22, i) * 1920;
    const sy = 80 + hash01(23, i) * 760;
    drawDot(ctx, p.c, lerp(sx, p.x, e), lerp(sy, p.y, e), lerp(3, 5, e), lerp(0.45, 0.95, e));
  });
  ctx.globalAlpha = ramp(lt, 0.8, 1.1);
  ctx.strokeStyle = rgba(COLORS.navy, 0.25);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(330, 668);
  ctx.lineTo(1010, 668);
  ctx.stroke();
};

// ---------------------------------------------------------------------------
// 5. Connected care – clinical systems connect around the patient's picture
// ---------------------------------------------------------------------------
const CLIN: IconName[] = ['hospital', 'lab', 'scan', 'pill', 'clinic', 'record', 'team', 'bell'];
const drawClinical = (ctx: Ctx, lt: number) => {
  const cx = 960;
  const cy = 440;
  const rot = lt * 0.3;
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, COLORS.teal, cx, cy, 260, 0.6);
  CLIN.forEach((ic, k) => {
    const a = rot + (k / CLIN.length) * Math.PI * 2;
    const e = easeOutExpo(clamp01((lt - k * 0.06) / 0.6));
    const r = lerp(700, 300, e);
    const x = cx + Math.cos(a) * r * 1.35;
    const y = cy + Math.sin(a) * r * 0.75;
    const link = easeOutCubic(clamp01((lt - 0.45 - k * 0.05) / 0.4));
    if (link > 0) {
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = k % 2 ? COLORS.turquoise : COLORS.glowGreen;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lerp(x, cx, link * 0.78), lerp(y, cy, link * 0.78));
      ctx.stroke();
      // flowing dot
      const f = (lt * 1.4 + k * 0.13) % 1;
      drawGlow(ctx, '#ffffff', lerp(x, cx, f * 0.78 * link), lerp(y, cy, f * 0.78 * link), 10, 0.9, true);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = e;
    ctx.fillStyle = '#0B2E5C';
    ctx.strokeStyle = k % 2 ? COLORS.turquoise : COLORS.glowGreen;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    drawIcon(ctx, ic, x, y, 50, '#ffffff', e, 2.6);
    ctx.globalCompositeOperation = 'lighter';
  });
  // the patient at the centre (abstract, anonymous)
  ctx.globalCompositeOperation = 'source-over';
  const ring = easeOutExpo(clamp01((lt - 0.7) / 0.5));
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fill();
  drawIcon(ctx, 'person', cx, cy, 104, COLORS.navy, 1, 3);
  ctx.strokeStyle = COLORS.glowGreen;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, -Math.PI / 2, -Math.PI / 2 + ring * Math.PI * 2);
  ctx.stroke();
};

// ---------------------------------------------------------------------------
// 6. Advanced research – data points become patterns and insight (helix)
// ---------------------------------------------------------------------------
const drawResearch = (ctx: Ctx, lt: number) => {
  const n = 64;
  const e = easeInOutCubic(clamp01((lt - 0.1) / 0.8));
  const ph = lt * 2.2;
  for (let strand = 0; strand < 2; strand++) {
    for (let i = 0; i < n; i++) {
      const x = 260 + (i / (n - 1)) * 1400;
      const a = i * 0.32 + ph + strand * Math.PI;
      const hy = 440 + Math.sin(a) * 150;
      const depth = (Math.cos(a) + 1) / 2;
      const id = strand * n + i;
      const sx = hash01(31, id) * 1920;
      const sy = 100 + hash01(32, id) * 700;
      const px = lerp(sx, x, e);
      const py = lerp(sy, hy, e);
      if (strand === 0 && e > 0.6 && i % 2 === 0) {
        const b = 440 + Math.sin(a + Math.PI) * 150;
        ctx.globalAlpha = (e - 0.6) * 2 * 0.35;
        ctx.strokeStyle = COLORS.navy;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, b);
        ctx.stroke();
      }
      drawDot(ctx, strand ? COLORS.skyBlue : COLORS.emerald, px, py, lerp(4, 5 + depth * 6, e), lerp(0.5, 0.45 + depth * 0.55, e));
    }
  }
  // insight markers
  [0.22, 0.5, 0.78].forEach((u, k) => {
    const p = easeOutBack(clamp01((lt - 0.85 - k * 0.1) / 0.35));
    if (p <= 0) return;
    const x = 260 + u * 1400;
    ctx.globalAlpha = p;
    ctx.strokeStyle = COLORS.navy;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, 440, 48 * p, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, 440 - 48 * p);
    ctx.lineTo(x, 250);
    ctx.stroke();
    drawDot(ctx, COLORS.glowGreen, x, 250, 9 * p, 1);
  });
};

// ---------------------------------------------------------------------------
// 7. AI – unified streams feed models; complementary DATA & AI & BI capabilities
// ---------------------------------------------------------------------------
const drawAI = (ctx: Ctx, lt: number) => {
  const layers = [4, 7, 7, 4];
  const lx = [1050, 880, 710, 540];
  const pos = (l: number, k: number) => ({x: lx[l], y: 440 + (k - (layers[l] - 1) / 2) * 76});
  ctx.globalCompositeOperation = 'lighter';
  // streams from NEXUS (right) into the network
  for (let i = 0; i < 160; i++) {
    const u = (hash01(41, i) + lt * 0.9) % 1;
    const lane = (hash01(42, i) - 0.5) * 180;
    const x = lerp(1560, 1080, u);
    const y = 440 + lane * (1 - u * 0.6) + Math.sin(u * 8 + i) * 6;
    drawGlow(ctx, i % 2 ? COLORS.glowGreen : COLORS.turquoise, x, y, 6, 0.9 * ramp(lt, 0, 0.3));
  }
  for (let l = 0; l < layers.length - 1; l++) {
    for (let a = 0; a < layers[l]; a++) {
      for (let b = 0; b < layers[l + 1]; b++) {
        const p = pos(l, a);
        const q = pos(l + 1, b);
        const act = Math.max(0, Math.sin(lt * 5 - l * 1.2 + a * 0.7 + b * 0.4));
        ctx.globalAlpha = 0.08 + act * 0.25 * ramp(lt, 0.2 + l * 0.15, 0.5 + l * 0.15);
        ctx.strokeStyle = (a + b) % 2 ? COLORS.turquoise : COLORS.glowGreen;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
    }
  }
  layers.forEach((n, l) => {
    for (let k = 0; k < n; k++) {
      const p = pos(l, k);
      const act = 0.4 + 0.6 * Math.max(0, Math.sin(lt * 5 - l * 1.2 + k));
      drawGlow(ctx, l % 2 ? COLORS.turquoise : COLORS.glowGreen, p.x, p.y, 14 + act * 12, act * ramp(lt, l * 0.12, l * 0.12 + 0.3), true);
    }
  });
  // outputs to complementary capabilities
  [330, 440, 550].forEach((y, k) => {
    const g = easeOutCubic(clamp01((lt - 0.6 - k * 0.1) / 0.4));
    ctx.globalAlpha = 0.6 * g;
    ctx.strokeStyle = COLORS.mint;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(540, 440 + (k - 1) * 76);
    ctx.lineTo(lerp(540, 430, g), y);
    ctx.stroke();
  });
  ctx.globalCompositeOperation = 'source-over';
};

const DRAW = [drawRealtime, drawSimplicity, drawModular, drawOperations, drawClinical, drawResearch, drawAI];

export const S7Benefits: React.FC = () => {
  const t = useSceneTime();

  // which benefit + incoming wipe
  const draw = (ctx: Ctx) => {
    for (let k = 0; k < ITEMS.length; k++) {
      const start = BT[k] - (k === 0 ? 0 : 0.22);
      if (t < start || t > ends[k] + 0.05) continue;
      const wipe = k === 0 ? 1 : easeInOutCubic(clamp01((t - start) / 0.3));
      ctx.save();
      // diagonal slice wipe, moving right → left (reading direction); angle varies
      const slope = [0, 260, -260, 200, -200, 300, -300][k];
      const edge = lerp(1920 + Math.abs(slope), -Math.abs(slope), wipe);
      ctx.beginPath();
      ctx.moveTo(1920, 0);
      ctx.lineTo(edge + slope, 0);
      ctx.lineTo(edge - slope, 1080);
      ctx.lineTo(1920, 1080);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = 1;
      if (isDark(k)) {
        const g = ctx.createRadialGradient(960, 450, 0, 960, 450, 1200);
        g.addColorStop(0, '#0C3366');
        g.addColorStop(0.55, DARK_BG);
        g.addColorStop(1, COLORS.space);
        ctx.fillStyle = g;
      } else {
        const g = ctx.createRadialGradient(960, 450, 0, 960, 450, 1200);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(1, COLORS.mist);
        ctx.fillStyle = g;
      }
      ctx.fillRect(0, 0, 1920, 1080);
      DRAW[k](ctx, t - BT[k]);
      ctx.restore();
      // bright cutting edge
      if (wipe > 0 && wipe < 1) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = k % 2 ? COLORS.glowGreen : COLORS.turquoise;
        ctx.lineWidth = 6;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.moveTo(edge + slope, 0);
        ctx.lineTo(edge - slope, 1080);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const aiStart = BT[6];

  return (
    <Stage>
      <AbsoluteFill style={{background: DARK_BG}} />
      <SceneCanvas draw={draw} />
      {/* AI scene: NEXUS source + complementary capabilities */}
      {t > aiStart - 0.2 && t < KW[0] + 0.05 && <AIOverlay t={t - aiStart} />}
      {ITEMS.map((it, k) => (
        <Center key={k} y={k === 6 ? 900 : 880}>
          <WordReveal
            text={it.title}
            t={t}
            at={BT[k] + 0.08}
            out={ends[k] - 0.16}
            outDur={0.14}
            inDur={0.4}
            stagger={0.06}
            size={k === 6 ? 84 : 112}
            weight={900}
            color={isDark(k) ? '#FFFFFF' : COLORS.navy}
            glow={isDark(k) ? rgba(COLORS.turquoise, 0.45) : undefined}
            variant={(['rise', 'blur', 'drop', 'track', 'zoom', 'rise', 'blur'] as const)[k]}
            exit="fade"
          />
        </Center>
      ))}
      <Keywords t={t} />
    </Stage>
  );
};

const AIOverlay: React.FC<{t: number}> = ({t}) => {
  const a = ramp(t, 0.05, 0.35);
  const caps = TEXT.benefits.aiCapabilities;
  return (
    <AbsoluteFill style={{opacity: a}}>
      <div style={{position: 'absolute', left: 1580, top: 440, transform: 'translate(-50%, -50%)', textAlign: 'center'}}>
        <Img src={staticFile(ASSETS.nexusSymbol)} style={{width: 190, filter: `drop-shadow(0 0 30px ${rgba(COLORS.turquoise, 0.5)})`}} />
        <div style={{marginTop: 12}}>
          <Img src={staticFile(ASSETS.nexusWordmarkWhite)} style={{width: 170}} />
        </div>
      </div>
      {/* the wider strategy: complementary capabilities, deliberately outside NEXUS */}
      <div
        style={{
          position: 'absolute',
          left: 50,
          top: 190,
          width: 450,
          height: 500,
          border: `2px dashed ${rgba(COLORS.mint, 0.55)}`,
          borderRadius: 30,
          direction: 'rtl',
          fontFamily: FONTS.stack,
          padding: '26px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{fontSize: 24, fontWeight: 700, color: COLORS.mint, lineHeight: 1.3}}>{TEXT.benefits.aiStrategy}</div>
        {caps.map((c, k) => {
          const p = easeOutExpo(clamp01((t - 0.55 - k * 0.12) / 0.5));
          const latin = !/[֐-׿]/.test(c);
          return (
            <div
              key={c}
              style={{
                opacity: p,
                transform: `translateX(${(1 - p) * -40}px)`,
                background: 'rgba(255,255,255,0.08)',
                border: `1.5px solid ${rgba(COLORS.turquoise, 0.6)}`,
                borderRadius: 18,
                padding: '18px 22px',
                fontFamily: latin ? FONTS.latinStack : FONTS.stack,
                fontSize: 31,
                fontWeight: 800,
                color: '#fff',
                direction: latin ? 'ltr' : 'rtl',
                textAlign: 'right',
              }}
            >
              {c}
            </div>
          );
        })}
        <div style={{fontSize: 22, fontWeight: 400, color: rgba('#DDEBFA', 0.8), marginTop: 'auto'}}>{TEXT.benefits.aiNote}</div>
      </div>
    </AbsoluteFill>
  );
};

/** REAL-TIME · CONNECTED · SCALABLE · AI-READY – one per beat. */
const Keywords: React.FC<{t: number}> = ({t}) => {
  if (t < KW[0] - 0.02) return null;
  const k = Math.max(0, Math.min(KW.length - 1, KW.filter((x) => t >= x).length - 1));
  const lt = t - KW[k];
  const words = TEXT.benefits.keywords;
  const themes = [
    {bg: COLORS.space, fg: '#FFFFFF', accent: COLORS.turquoise},
    {bg: '#FFFFFF', fg: COLORS.navy, accent: COLORS.emerald},
    {bg: `linear-gradient(120deg, ${COLORS.emeraldDeep}, ${COLORS.teal})`, fg: '#FFFFFF', accent: COLORS.glowGreen},
    {bg: `linear-gradient(120deg, ${COLORS.navy}, ${COLORS.deepBlue})`, fg: '#FFFFFF', accent: COLORS.turquoise},
  ];
  const th = themes[k];
  const p = easeOutExpo(clamp01(lt / 0.28));
  const hit = flash(lt, 0, 0.12);
  return (
    <AbsoluteFill style={{background: th.bg}}>
      <KeywordParticles t={t} k={k} lt={lt} color={th.accent} />
      <Center y={540}>
        <div
          style={{
            fontFamily: FONTS.latinStack,
            fontWeight: 900,
            fontSize: 250,
            letterSpacing: `${lerp(0.25, -0.02, p)}em`,
            color: th.fg,
            transform: `scale(${lerp(1.35, 1, p) + (k === 3 ? lt * 0.08 : 0)})`,
            filter: `blur(${(1 - p) * 14}px)`,
            whiteSpace: 'nowrap',
            textShadow: k === 1 ? 'none' : `0 0 ${60 * FX.glow}px ${rgba(th.accent, 0.5)}`,
          }}
        >
          {words[k]}
        </div>
      </Center>
      <AbsoluteFill style={{background: '#fff', opacity: hit * 0.5}} />
    </AbsoluteFill>
  );
};

const KeywordParticles: React.FC<{t: number; k: number; lt: number; color: string}> = ({k, lt, color}) => {
  const seeds = useMemo(() => Array.from({length: 220}, (_, i) => i), []);
  return (
    <SceneCanvas
      draw={(ctx) => {
        ctx.globalCompositeOperation = k === 1 ? 'source-over' : 'lighter';
        for (const i of seeds) {
          const a = hash01(60 + k, i) * Math.PI * 2;
          const sp = 300 + hash01(61 + k, i) * 1400;
          const r = 60 + easeOutCubic(clamp01(lt / 0.5)) * sp * 0.5;
          const x = 960 + Math.cos(a) * r * 1.4;
          const y = 540 + Math.sin(a) * r * 0.7;
          if (k === 1) drawDot(ctx, i % 2 ? COLORS.emerald : COLORS.skyBlue, x, y, 3, 0.5 * (1 - lt));
          else drawGlow(ctx, color, x, y, 8, 0.8 * (1 - lt * 1.2), i % 9 === 0);
        }
      }}
    />
  );
};
