/**
 * Scene 8 – The rules of the game are changing (01:15–01:24)
 * We rise above an abstract, tilted map of Israel: nodes where care happens
 * light up and connect with green and blue arcs; the whole network pulses as one.
 * (Only points at approximate city locations – no borders are drawn.)
 */
import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CUES, FX, TEXT} from '../config/config';
import {Vignette} from '../components/Finish';
import {Center, WordReveal} from '../components/Kinetic';
import {ParticleType, ShapeSpec} from '../components/ParticleType';
import {clamp01, easeInOutCubic, easeOutExpo, flash, lerp, ramp, rgba} from '../lib/anim';
import {fog, project, Vec3} from '../lib/camera';
import {drawGlow, SceneCanvas, Stage} from '../lib/canvas';
import {hash01} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('gameChanger');
const PAIRS = CUES.pairs.map(at);
const STATEMENT = at(CUES.statement);
const PULSE = at(CUES.bigPulse);
const BPM_BEAT = 60 / CUES.bpm;

// approximate [lat, lon] of places across the country
const CITIES: [number, number][] = [
  [33.21, 35.57], [33.0, 35.1], [32.96, 35.5], [32.92, 35.3], [32.79, 34.99], [32.79, 35.53], [32.7, 35.3],
  [32.61, 35.29], [32.5, 35.5], [32.43, 34.92], [32.33, 34.86], [32.18, 34.91], [32.16, 34.84], [32.09, 34.88],
  [32.08, 34.78], [32.01, 34.78], [31.96, 34.8], [31.9, 35.01], [31.89, 34.81], [31.8, 34.65], [31.77, 35.21],
  [31.75, 34.99], [31.67, 34.57], [31.61, 34.76], [31.42, 34.59], [31.26, 35.21], [31.25, 34.79], [31.07, 35.03],
  [30.61, 34.8], [29.56, 34.95],
];
// upright map (north up) standing in a plane the camera orbits around
const toWorld = ([lat, lon]: [number, number]): Vec3 => ({x: (lon - 35.05) * 470, y: -(lat - 31.38) * 380, z: 0});

export const S8GameChanger: React.FC = () => {
  const t = useSceneTime();

  const net = useMemo(() => {
    const hubs = CITIES.map(toWorld);
    // satellites around each hub = clinics, labs, pharmacies, teams
    const sats: {p: Vec3; hub: number}[] = [];
    hubs.forEach((h, i) => {
      const n = 6 + Math.floor(hash01(1, i) * 8);
      for (let k = 0; k < n; k++) {
        const a = hash01(2, i * 20 + k) * Math.PI * 2;
        const r = 14 + hash01(3, i * 20 + k) * 55;
        sats.push({p: {x: h.x + Math.cos(a) * r, y: h.y + Math.sin(a) * r, z: (hash01(4, i * 20 + k) - 0.5) * 60}, hub: i});
      }
    });
    const links: [number, number][] = [];
    hubs.forEach((h, i) => {
      const near = hubs
        .map((q, j) => ({j, d: (q.x - h.x) ** 2 + (q.y - h.y) ** 2}))
        .filter((o) => o.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      near.forEach((o) => {
        if (!links.some(([a, b]) => (a === i && b === o.j) || (a === o.j && b === i))) links.push([i, o.j]);
      });
    });
    // a few long-range arcs (e.g. north ↔ south, coast ↔ capital)
    links.push([0, 29], [4, 26], [14, 20], [9, 27], [2, 22]);
    return {hubs, sats, links};
  }, []);

  const rise = easeInOutCubic(clamp01(t / 5));
  const orbit = easeInOutCubic(clamp01(t / 9));
  // orbit around the map's centre
  const camZ = lerp(-700, -1650, rise);
  const yaw = lerp(-0.45, 0.32, orbit);
  const pitch = lerp(-0.18, 0.12, orbit);
  const cam = {
    x: camZ * Math.tan(yaw) + lerp(60, 0, rise),
    y: camZ * Math.tan(pitch) / Math.cos(yaw) + lerp(-120, 0, rise),
    z: camZ,
    pitch,
    yaw,
    roll: lerp(0.06, -0.02, orbit),
    focal: 1000,
  };

  const big = flash(t, PULSE, 0.45);
  const implode = ramp(t, 8.5, 9.0, easeInOutCubic);

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = 'lighter';
    const beat = Math.pow(Math.max(0, Math.cos(((t % BPM_BEAT) / BPM_BEAT) * Math.PI * 2)), 6);
    const light = (i: number) => ramp(t, 0.2 + hash01(9, i) * 2.8, 0.5 + hash01(9, i) * 2.8);
    const P = (v: Vec3) => project(v, cam);
    const fade = 1 - implode;

    // links as 3D arcs with travelling pulses
    net.links.forEach(([a, b], k) => {
      const A = net.hubs[a];
      const B = net.hubs[b];
      const on = Math.min(light(a), light(b));
      if (on <= 0) return;
      const dist = Math.hypot(A.x - B.x, A.y - B.y);
      const h = -Math.min(260, dist * 0.4);
      const col = k % 2 ? COLORS.turquoise : COLORS.glowGreen;
      ctx.globalAlpha = (0.35 + 0.35 * beat + big) * on * fade;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      let started = false;
      for (let q = 0; q <= 24; q++) {
        const e = q / 24;
        const p = P({x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), z: Math.sin(Math.PI * e) * h});
        if (!p) continue;
        if (!started) {
          ctx.moveTo(p.x, p.y);
          started = true;
        } else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      const e = (t * 0.5 + hash01(11, k)) % 1;
      const p = P({x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), z: Math.sin(Math.PI * e) * h});
      if (p) drawGlow(ctx, '#ffffff', p.x, p.y, 9 * p.s + 3, on * fade, true);
    });
    // satellites
    net.sats.forEach((s, i) => {
      const p = P(s.p);
      if (!p) return;
      const h = P(net.hubs[s.hub]);
      const on = light(s.hub) * ramp(t, 0.6 + hash01(12, i) * 3, 0.9 + hash01(12, i) * 3);
      if (on <= 0) return;
      if (h) {
        ctx.globalAlpha = 0.18 * on * fade;
        ctx.strokeStyle = COLORS.turquoise;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(h.x, h.y);
        ctx.stroke();
      }
      drawGlow(ctx, i % 3 ? COLORS.turquoise : COLORS.glowGreen, p.x, p.y, (5 + beat * 3) * p.s + 1.5, on * fog(p.z, 1200, 4200) * fade);
    });
    // hubs
    net.hubs.forEach((hb, i) => {
      const p = P(hb);
      if (!p) return;
      const on = light(i);
      const pop = flash(t, 0.2 + hash01(9, i) * 2.8 + 0.3, 0.3);
      const col = i % 2 ? COLORS.skyBlue : COLORS.glowGreen;
      drawGlow(ctx, col, p.x, p.y, (30 + beat * 18 + pop * 60 + big * 80) * p.s, (0.6 + big) * on * fade * FX.glow);
      drawGlow(ctx, '#ffffff', p.x, p.y, (7 + beat * 4) * p.s + 2, on * fade, true);
      // beacon
      const top = P({x: hb.x, y: hb.y, z: -70 - beat * 30});
      if (top) {
        ctx.globalAlpha = 0.5 * on * fade;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(top.x, top.y);
        ctx.stroke();
      }
    });
    // the great pulse
    const age = t - PULSE;
    if (age > 0 && age < 1.4) {
      const c = P({x: 0, y: 0, z: 0});
      if (c) {
        for (let r = 0; r < 3; r++) {
          const rr = easeOutExpo(clamp01((age - r * 0.08) / 1.2)) * 2200;
          ctx.globalAlpha = (1 - age / 1.4) * (0.9 - r * 0.25);
          ctx.strokeStyle = [COLORS.glowGreen, COLORS.turquoise, '#ffffff'][r];
          ctx.lineWidth = 5;
          ctx.beginPath();
          for (let q = 0; q <= 64; q++) {
            const a = (q / 64) * Math.PI * 2;
            const p = P({x: Math.cos(a) * rr, y: Math.sin(a) * rr, z: 0});
            if (!p) continue;
            if (q === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  const finale: ShapeSpec[] = [
    {
      text: TEXT.gameChanger.finale,
      style: {size: 116, weight: 900},
      x: 960,
      y: 540,
      t0: PULSE + 0.02,
      t1: PULSE + 0.7,
      t2: 8.45,
      fill: ['#FFFFFF', '#FFFFFF'],
      glowColor: COLORS.turquoise,
      palette: [COLORS.glowGreen, COLORS.turquoise, '#ffffff'],
    },
  ];

  return (
    <Stage>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 70% at 50% 35%, #0B2C5A 0%, #05173A 50%, ${COLORS.space} 100%)`}} />
      <SceneCanvas draw={draw} />
      <Vignette />
      {/* dim the map behind the words so they read */}
      <AbsoluteFill style={{background: `radial-gradient(ellipse 60% 30% at 50% 50%, ${rgba(COLORS.space, 0.55)} 0%, transparent 100%)`}} />
      {TEXT.gameChanger.pairs.map(([from, to], k) => {
        const T = PAIRS[k];
        const out = k < 2 ? PAIRS[k + 1] - 0.12 : STATEMENT - 0.12;
        return (
          <React.Fragment key={k}>
            <Center y={420}>
              <WordReveal text={from} t={t} at={T} out={out} outDur={0.18} size={84} weight={500} color={rgba('#FFFFFF', 0.82)} variant="rise" />
            </Center>
            <Center y={560}>
              <WordReveal
                text={to}
                t={t}
                at={T + 0.4}
                out={out}
                outDur={0.18}
                size={168}
                weight={900}
                gradient={`linear-gradient(90deg, ${COLORS.glowGreen}, ${COLORS.turquoise})`}
                variant={(['zoom', 'blur', 'rise'] as const)[k]}
                inDur={0.5}
              />
            </Center>
          </React.Fragment>
        );
      })}
      <Center y={540}>
        <WordReveal text={TEXT.gameChanger.statement} t={t} at={STATEMENT} out={PULSE - 0.06} outDur={0.16} size={84} weight={700} color="#FFFFFF" variant="blur" stagger={0.08} glow={rgba(COLORS.turquoise, 0.4)} exit="blur" />
      </Center>
      <ParticleType shapes={finale} t={t} seed={81} entry="center" exit="implode" exitDur={0.55} maxPoints={5200} />
      <AbsoluteFill style={{background: '#fff', opacity: big * 0.7}} />
    </Stage>
  );
};
