/**
 * Scene 1 – "A world that never stops producing data" (00:00–00:08)
 * A single green heartbeat in deep space. Every beat releases data; blue joins;
 * the void fills, the camera starts to fly and particles condense into the
 * places where care happens. Words assemble from the stream and return to it.
 */
import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CUES, FX, TEXT} from '../config/config';
import {ParticleType, ShapeSpec} from '../components/ParticleType';
import {Vignette} from '../components/Finish';
import {clamp01, easeInOutCubic, easeOutExpo, flash, lerp, ramp} from '../lib/anim';
import {fog, project} from '../lib/camera';
import {drawGlow, drawStreak, SceneCanvas, Stage} from '../lib/canvas';
import {drawIcon, IconName} from '../lib/icons';
import {hash01} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('pulse');
const BEATS = CUES.heartbeats.map(at);
const DEPTH = 5200;

type P = {x: number; y: number; z: number; birth: number; blue: boolean; size: number};

const useField = () =>
  useMemo(() => {
    const n = Math.round(4200 * FX.particleDensity);
    const out: P[] = [];
    for (let i = 0; i < n; i++) {
      // births cluster on heartbeats and grow exponentially in number
      const u = Math.pow(hash01(1, i), 0.45);
      const beatIdx = Math.min(BEATS.length - 1, Math.floor(u * BEATS.length));
      const birth = BEATS[beatIdx] + hash01(2, i) * 0.12;
      const blueChance = clamp01((beatIdx - 1) / 6) * 0.55;
      const r = 60 + Math.pow(hash01(3, i), 1.1) * 2200;
      const a = hash01(4, i) * Math.PI * 2;
      out.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r * 0.62,
        z: 200 + hash01(5, i) * DEPTH,
        birth,
        blue: hash01(6, i) < blueChance,
        size: 0.8 + hash01(7, i) * 1.8,
      });
    }
    return out;
  }, []);

const ICON_NODES: {icon: IconName; x: number; y: number; z: number; t: number}[] = [
  {icon: 'hospital', x: -560, y: -170, z: 2600, t: 3.0},
  {icon: 'lab', x: 520, y: 180, z: 3300, t: 3.6},
  {icon: 'clinic', x: 430, y: -260, z: 4300, t: 4.4},
  {icon: 'record', x: -460, y: 240, z: 5000, t: 5.0},
  {icon: 'phone', x: -120, y: -330, z: 5900, t: 5.6},
  {icon: 'tube', x: 320, y: 300, z: 6600, t: 6.2},
];

const camZ = (t: number) => {
  // still → gentle drift → accelerating flight
  const drift = t * 40;
  const fly = Math.pow(clamp01((t - 2.6) / 5.4), 2.2) * 6200;
  return drift + fly;
};

export const S1Pulse: React.FC = () => {
  const t = useSceneTime();
  const field = useField();
  const lines = TEXT.pulse.lines;
  const T = CUES.pulseTexts.map(at);

  const shapes: ShapeSpec[][] = lines.map((line, k) => [
    {
      text: line,
      style: {size: k === 2 ? 150 : 132, weight: 800},
      x: 960,
      y: 540,
      t0: T[k],
      t1: T[k] + 0.62,
      t2: k === 2 ? 7.25 : T[k] + 1.45,
      fill: k === 2 ? [COLORS.glowGreen, COLORS.turquoise] : '#FFFFFF',
      glowColor: k === 2 ? COLORS.turquoise : COLORS.emerald,
      palette: [COLORS.glowGreen, COLORS.turquoise, '#ffffff', COLORS.skyBlue],
    },
  ]);

  const whiteOut = ramp(t, 7.55, 8.0, easeInOutCubic);

  const draw = (ctx: CanvasRenderingContext2D) => {
    const cz = camZ(t);
    const cam = {x: Math.sin(t * 0.35) * 60, y: Math.cos(t * 0.3) * 30, z: cz, roll: Math.sin(t * 0.25) * 0.04 * ramp(t, 3, 6), focal: 900};
    const camPrev = {...cam, z: camZ(t - (1 / 60) * 4 * FX.streaks)};
    ctx.globalCompositeOperation = 'lighter';

    // --- the heart: a green point that beats --------------------------------
    const heartFade = 1 - ramp(t, 3.2, 4.6);
    let pulseAmt = 0;
    for (const b of BEATS) pulseAmt = Math.max(pulseAmt, flash(t, b, 0.16));
    if (heartFade > 0) {
      const r0 = 7 + pulseAmt * 18;
      drawGlow(ctx, COLORS.glowGreen, 960, 540, r0 * 9, 0.55 * heartFade * FX.glow);
      drawGlow(ctx, COLORS.glowGreen, 960, 540, r0 * 2.6, 1 * heartFade, true);
      // expanding rings
      for (const b of BEATS) {
        const age = t - b;
        if (age < 0 || age > 1.6) continue;
        const rr = easeOutExpo(age / 1.6) * 520;
        ctx.globalAlpha = (1 - age / 1.6) * 0.5 * heartFade;
        ctx.strokeStyle = b > BEATS[3] ? COLORS.turquoise : COLORS.glowGreen;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(960, 540, rr, rr, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // --- data particles ------------------------------------------------------
    for (let i = 0; i < field.length; i++) {
      const p = field[i];
      const age = t - p.birth;
      if (age < 0) continue;
      const e = easeOutExpo(clamp01(age / 1.4));
      // wrap depth so the flight never runs out of particles
      let wz = p.z;
      const rel = wz - cz;
      if (rel < 40) wz += Math.ceil((40 - rel) / DEPTH) * DEPTH;
      // born at the heart (projected centre), travel to their home in space
      const home = {x: p.x, y: p.y, z: wz};
      const pr = project(home, cam);
      if (!pr) continue;
      const sx = lerp(960, pr.x, e);
      const sy = lerp(540, pr.y, e);
      const f = fog(pr.z, 600, DEPTH * 0.95);
      const col = p.blue ? (i % 3 === 0 ? COLORS.skyBlue : COLORS.turquoise) : i % 4 === 0 ? COLORS.mint : COLORS.glowGreen;
      const r = Math.min(26, p.size * pr.s * 3.2);
      const a = f * clamp01(age / 0.2) * 0.95;
      const speed = cz - camPrev.z;
      if (speed > 18 && e >= 1) {
        const pp = project(home, camPrev);
        if (pp) drawStreak(ctx, col, pp.x, pp.y, sx, sy, Math.max(0.6, r * 0.45), a * 0.8);
      }
      drawGlow(ctx, col, sx, sy, r * 2.2, a, i % 17 === 0);
    }

    // --- places of care condense out of the stream ----------------------------
    for (const node of ICON_NODES) {
      const k = ramp(t, node.t, node.t + 0.7, easeOutExpo);
      if (k <= 0) continue;
      const pr = project({x: node.x, y: node.y, z: node.z}, cam);
      if (!pr) continue;
      const f = fog(pr.z, 400, 4200) * clamp01((pr.z - 60) / 260);
      const size = 120 * pr.s;
      if (size > 900) continue;
      const blue = node.icon === 'lab' || node.icon === 'phone' || node.icon === 'tube';
      const col = blue ? COLORS.turquoise : COLORS.glowGreen;
      drawGlow(ctx, col, pr.x, pr.y, size * 1.4, 0.22 * f * k * FX.glow);
      // converging sparks
      for (let s = 0; s < 22; s++) {
        const ang = hash01(40, s + node.t * 10) * Math.PI * 2;
        const d = (1 - k) * size * 2.2 + size * 0.62;
        drawGlow(ctx, col, pr.x + Math.cos(ang) * d, pr.y + Math.sin(ang) * d, 3 * pr.s + 2, f * (0.3 + 0.7 * (1 - k)), true);
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = f * k;
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(1, 2 * pr.s);
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, size * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k);
      ctx.stroke();
      ctx.restore();
      drawIcon(ctx, node.icon, pr.x, pr.y, size * 0.62, '#ffffff', f * k, 2.6);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  return (
    <Stage>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 50%, #0A2350 0%, ${COLORS.navyDeep} 55%, ${COLORS.space} 100%)`,
        }}
      />
      <SceneCanvas draw={draw} />
      {shapes.map((s, k) => (
        <ParticleType key={k} shapes={s} t={t} seed={10 + k} entry="deep" exit="forward" exitDur={0.6} maxPoints={4200} />
      ))}
      <Vignette />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${whiteOut}) ${whiteOut * 70}%, rgba(244,248,251,${whiteOut}) 100%)`,
          opacity: whiteOut,
        }}
      />
    </Stage>
  );
};
