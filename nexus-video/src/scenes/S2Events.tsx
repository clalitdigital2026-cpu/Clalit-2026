/**
 * Scene 2 – "Every moment is an event" (00:08–00:17)
 * A bright, clean space. The camera sweeps right-to-left past six moments of
 * care; each action fires a pulse of light that becomes a data packet. The
 * packets gather into the word "מידע", which breaks apart and re-forms as EVENT.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CUES, FONTS, TEXT} from '../config/config';
import {Center, WordReveal} from '../components/Kinetic';
import {ParticleType, ShapeSpec} from '../components/ParticleType';
import {clamp01, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, lerp, ramp, rgba} from '../lib/anim';
import {project} from '../lib/camera';
import {SceneCanvas, Stage} from '../lib/canvas';
import {drawIcon, IconName} from '../lib/icons';
import {hash01} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('events');
const MOMENTS = TEXT.events.moments.map((m, k) => ({
  ...m,
  t: at(CUES.moments[k]),
  wx: -k * 620,
  wy: k % 2 === 0 ? -40 : 60,
  wz: 1000 + (k % 3) * 180,
}));
const HEAD = at(CUES.eventsHeadline);
const MORPH = at(CUES.eventMorph);
const CLOSE = at(CUES.eventsClosing);

const NAVY = COLORS.navy;

const camAt = (t: number) => {
  // centre moment k at its action time; ease between them
  const ts = MOMENTS.map((m) => m.t);
  let x = MOMENTS[0].wx + 260;
  if (t <= ts[0]) x = lerp(MOMENTS[0].wx + 520, MOMENTS[0].wx, easeOutCubic(clamp01((t + 0.1) / (ts[0] + 0.1))));
  else if (t >= ts[ts.length - 1]) x = MOMENTS[ts.length - 1].wx - easeInOutCubic(clamp01((t - ts[ts.length - 1]) / 1.2)) * 200;
  else {
    for (let k = 0; k < ts.length - 1; k++) {
      if (t >= ts[k] && t < ts[k + 1]) {
        const p = (t - ts[k]) / (ts[k + 1] - ts[k]);
        x = lerp(MOMENTS[k].wx, MOMENTS[k + 1].wx, easeInOutCubic(p));
      }
    }
  }
  // pull back for the headline
  const back = easeInOutCubic(clamp01((t - (HEAD - 0.9)) / 1.2));
  return {x: x, y: -30 + back * -80, z: 0 - back * 900, yaw: lerp(-0.08, 0, back), focal: 1000};
};

/** The extra motion that makes each moment "happen". */
const drawMoment = (
  ctx: CanvasRenderingContext2D,
  m: (typeof MOMENTS)[number],
  x: number,
  y: number,
  s: number,
  t: number,
  alpha: number
) => {
  const local = t - m.t;
  const size = 210 * s;
  const act = easeOutExpo(clamp01((local + 0.25) / 0.45));
  const accent = MOMENTS.indexOf(m) % 2 === 0 ? COLORS.emerald : COLORS.skyBlue;
  ctx.save();
  // soft disc
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x, y, 0, x, y, size * 0.95);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba(NAVY, 0.08);
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  // progress arc = the action
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * act);
  ctx.stroke();

  const icon = m.icon as IconName;
  if (icon === 'tube') {
    // spinning test tube with rising sample
    const spin = Math.cos(local * 5);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.35 + Math.sin(local * 2) * 0.08);
    ctx.scale(0.55 + 0.45 * Math.abs(spin), 1);
    const lvl = 0.25 + act * 0.5;
    ctx.fillStyle = rgba(COLORS.emerald, 0.85 * alpha);
    const tw = 8 * (size / 48);
    const th = 33 * (size / 48);
    ctx.beginPath();
    ctx.roundRect(-tw / 2, -size / 2 + 4 * (size / 48) + th * (1 - lvl), tw, th * lvl, tw / 2);
    ctx.fill();
    drawIcon(ctx, 'tube', 0, 0, size, NAVY, alpha, 2.2);
    ctx.restore();
  } else {
    drawIcon(ctx, icon, x, y, size, NAVY, alpha, 2.2);
  }
  if (icon === 'rx' || icon === 'record') {
    // lines of the document being written
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3 * s;
    const k = size / 48;
    const lines = icon === 'rx' ? [[17, 35, 31]] : [[16, 18, 30]];
    for (const [lx, ly, lx2] of lines) {
      ctx.beginPath();
      ctx.moveTo(x - size / 2 + lx * k, y - size / 2 + ly * k);
      ctx.lineTo(x - size / 2 + lerp(lx, lx2, act) * k, y - size / 2 + ly * k);
      ctx.stroke();
    }
  }
  if (icon === 'phone') {
    const k = size / 48;
    ctx.globalAlpha = alpha * act;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(x - size / 2 + 24.5 * k, y - size / 2 + 19.5 * k, 3.5 * k, 3.5 * k, 1 * k);
    ctx.fill();
  }
  if (icon === 'scan') {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3 * s;
    const k = size / 48;
    const a0 = local * 4;
    ctx.beginPath();
    ctx.arc(x, y - size / 2 + 22 * k, 13 * k, a0, a0 + 1.4);
    ctx.stroke();
  }
  if (icon === 'bed') {
    // the discharge arrow keeps moving out
    ctx.globalAlpha = alpha * act;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3 * s;
    const k = size / 48;
    const off = ((local * 1.5) % 1) * 6 * k;
    ctx.beginPath();
    ctx.moveTo(x - size / 2 + 28 * k + off, y - size / 2 + 6 * k);
    ctx.lineTo(x - size / 2 + 40 * k + off, y - size / 2 + 6 * k);
    ctx.stroke();
  }
  // pulse ring at the moment of action
  if (local > 0 && local < 1.2) {
    const p = local / 1.2;
    ctx.globalAlpha = (1 - p) * 0.9 * alpha;
    ctx.strokeStyle = accent;
    ctx.lineWidth = (6 - 5 * p) * s;
    ctx.beginPath();
    ctx.arc(x, y, size * (0.72 + easeOutExpo(p) * 1.1), 0, Math.PI * 2);
    ctx.stroke();
  }
  // label
  ctx.globalAlpha = alpha * ramp(local, -0.3, 0.1);
  ctx.fillStyle = NAVY;
  ctx.font = `600 ${Math.round(30 * s)}px ${FONTS.stack}`;
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(m.label, x, y + size * 1.05);
  ctx.restore();
};

/** A data packet: glowing capsule. */
const drawPacket = (ctx: CanvasRenderingContext2D, x: number, y: number, ang: number, color: string, a: number, scale = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha = a * 0.35;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-22 * scale, -7 * scale, 44 * scale, 14 * scale, 7 * scale);
  ctx.fill();
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.roundRect(-14 * scale, -4 * scale, 28 * scale, 8 * scale, 4 * scale);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(8 * scale, 0, 2 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const S2Events: React.FC = () => {
  const t = useSceneTime();
  const cam = camAt(t);

  const draw = (ctx: CanvasRenderingContext2D) => {
    // perspective dot floor for depth
    ctx.fillStyle = NAVY;
    for (let gx = -16; gx <= 16; gx++) {
      for (let gz = 0; gz < 14; gz++) {
        const wx = Math.round(cam.x / 160) * 160 + gx * 160;
        const p = project({x: wx, y: 340, z: 500 + gz * 260}, cam);
        if (!p) continue;
        ctx.globalAlpha = 0.16 * (1 - gz / 14);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8 * p.s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // floating motes (parallax foreground / background)
    for (let i = 0; i < 160; i++) {
      const wx = cam.x + ((hash01(1, i) * 4000 - cam.x * (0.2 + hash01(2, i) * 0.5)) % 4000) - 2000;
      const p = project({x: wx, y: (hash01(3, i) - 0.5) * 1400, z: 300 + hash01(4, i) * 3000}, cam);
      if (!p) continue;
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = i % 2 ? COLORS.turquoise : COLORS.glowGreen;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2 * p.s, 0, Math.PI * 2);
      ctx.fill();
    }

    const gather = {x: 960, y: 610};
    const fadeMoments = 1 - ramp(t, HEAD - 0.6, HEAD + 0.2);
    // moments (far first)
    const order = [...MOMENTS].sort((a, b) => b.wz - a.wz);
    for (const m of order) {
      const p = project({x: m.wx, y: m.wy, z: m.wz}, cam);
      if (!p) continue;
      const appear = ramp(t, m.t - 0.9, m.t - 0.3, easeOutBack);
      drawMoment(ctx, m, p.x, p.y, p.s * lerp(0.7, 1, appear), t, clamp01(appear) * fadeMoments);
    }
    // packets: each action emits a burst of packets that flow to the centre
    MOMENTS.forEach((m, k) => {
      const color = k % 2 === 0 ? COLORS.emerald : COLORS.skyBlue;
      for (let j = 0; j < 6; j++) {
        const born = m.t + j * 0.05;
        const life = t - born;
        if (life < 0) continue;
        // origin follows the moment on screen
        const p0 = project({x: m.wx, y: m.wy, z: m.wz}, camAt(born));
        if (!p0) continue;
        const dur = Math.max(0.6, HEAD - born - 0.1);
        const e = easeInOutCubic(clamp01(life / dur));
        const orbitA = hash01(k, j) * Math.PI * 2 + t * 1.6;
        const orbitR = 120 + hash01(k + 9, j) * 160;
        const tx = gather.x + Math.cos(orbitA) * orbitR * 1.6;
        const ty = gather.y + Math.sin(orbitA) * orbitR * 0.45;
        const cx1 = p0.x + (hash01(k + 3, j) - 0.5) * 500;
        const cy1 = p0.y - 380 - hash01(k + 5, j) * 200;
        const u = 1 - e;
        const x = u * u * p0.x + 2 * u * e * cx1 + e * e * tx;
        const y = u * u * p0.y + 2 * u * e * cy1 + e * e * ty;
        const dx = 2 * u * (cx1 - p0.x) + 2 * e * (tx - cx1);
        const dy = 2 * u * (cy1 - p0.y) + 2 * e * (ty - cy1);
        const fade = 1 - ramp(t, HEAD + 0.1, HEAD + 0.6);
        // trail
        ctx.globalAlpha = 0.35 * fade;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let q = 0; q <= 10; q++) {
          const ee = clamp01(e - q * 0.025);
          const uu = 1 - ee;
          const qx = uu * uu * p0.x + 2 * uu * ee * cx1 + ee * ee * tx;
          const qy = uu * uu * p0.y + 2 * uu * ee * cy1 + ee * ee * ty;
          if (q === 0) ctx.moveTo(qx, qy);
          else ctx.lineTo(qx, qy);
        }
        ctx.stroke();
        drawPacket(ctx, x, y, Math.atan2(dy, dx), color, fade * clamp01(life / 0.15), 1 + (1 - e) * 0.5);
      }
    });
    ctx.globalAlpha = 1;
  };

  const leadOut = MORPH - 0.15;
  const wordShapes: ShapeSpec[] = [
    {
      text: TEXT.events.headlineWord,
      style: {size: 300, weight: 900},
      x: 960,
      y: 640,
      t0: HEAD,
      t1: HEAD + 0.8,
      t2: MORPH,
      fill: [COLORS.emerald, COLORS.skyBlue],
      palette: [COLORS.emerald, COLORS.skyBlue, COLORS.turquoise],
    },
    {
      text: TEXT.events.morphTo,
      style: {size: 290, weight: 900, family: FONTS.latinStack, letterSpacing: 18},
      x: 960,
      y: 540,
      t0: MORPH,
      t1: MORPH + 0.85,
      t2: CLOSE - 0.25,
      fill: [COLORS.emerald, COLORS.deepBlue],
      palette: [COLORS.emerald, COLORS.skyBlue, COLORS.turquoise],
    },
  ];

  return (
    <Stage>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 45%, #FFFFFF 0%, ${COLORS.pearl} 55%, ${COLORS.mist} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 20% 15%, ${rgba(COLORS.glowGreen, 0.12)} 0%, transparent 40%), radial-gradient(circle at 85% 85%, ${rgba(COLORS.turquoise, 0.14)} 0%, transparent 45%)`,
        }}
      />
      <SceneCanvas draw={draw} />
      <Center y={400}>
        <WordReveal
          text={TEXT.events.headlineLead}
          t={t}
          at={HEAD - 0.1}
          out={leadOut}
          size={118}
          weight={800}
          color={COLORS.navy}
          variant="rise"
          exit="up"
        />
      </Center>
      <ParticleType shapes={wordShapes} t={t} seed={21} mode="light" residual={0.06} entry="center" focus={{x: 960, y: 610}} exit="scatter" exitDur={0.7} maxPoints={4800} />
      <Center y={540}>
        <WordReveal
          text={TEXT.events.closing}
          t={t}
          at={CLOSE}
          stagger={0.09}
          size={104}
          weight={800}
          color={COLORS.navy}
          variant="blur"
          out={8.6}
          outDur={0.4}
          exit="blur"
        />
      </Center>
      {/* key word gets brand colour */}
      <ClosingUnderline t={t} />
    </Stage>
  );
};

const ClosingUnderline: React.FC<{t: number}> = ({t}) => {
  const p = easeOutExpo(clamp01((t - (CLOSE + 0.6)) / 0.9));
  const out = 1 - ramp(t, 8.6, 9.0);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 960 - 520 * p,
        width: 1040 * p,
        top: 625,
        height: 8,
        borderRadius: 4,
        opacity: out,
        background: `linear-gradient(90deg, ${COLORS.emerald}, ${COLORS.turquoise}, ${COLORS.deepBlue})`,
        boxShadow: `0 0 30px ${rgba(COLORS.turquoise, 0.6)}`,
      }}
    />
  );
};
