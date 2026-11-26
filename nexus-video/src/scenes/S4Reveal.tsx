/**
 * Scene 4 – NEXUS revealed (00:25–00:33)
 * A green stream and a blue stream race in from opposite ends of space, cross
 * and connect. The meeting releases an energy wave that floods the frame with
 * light, and the streams settle into the NEXUS symbol – then the wordmark.
 */
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ASSETS, COLORS, CUES, FX, TEXT} from '../config/config';
import {Center, WordReveal} from '../components/Kinetic';
import {ParticleType, ShapeSpec} from '../components/ParticleType';
import {clamp01, easeInCubic, easeInOutCubic, easeOutCubic, easeOutExpo, flash, lerp, ramp, rgba} from '../lib/anim';
import {drawGlow, drawStreak, SceneCanvas, Stage} from '../lib/canvas';
import {useCanvasImage} from '../lib/images';
import {hash01, snoise} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('reveal');
const MEET = at(CUES.streamsMeet);
const WORD = at(CUES.wordmark);
const SUB = at(CUES.revealSubtitle);
const ERA = at(CUES.revealEra);

// cubic bezier helper
const bz = (p0: number, p1: number, p2: number, p3: number, e: number) => {
  const u = 1 - e;
  return u * u * u * p0 + 3 * u * u * e * p1 + 3 * u * e * e * p2 + e * e * e * p3;
};

const GREEN_PATH = {x: [-900, -100, 500, 960], y: [1150, 1000, 520, 540]};
const BLUE_PATH = {x: [2820, 2020, 1420, 960], y: [-70, 80, 560, 540]};

const SYMBOL_W = 620;
const SYMBOL_H = (SYMBOL_W * 400) / 610;

export const S4Reveal: React.FC = () => {
  const t = useSceneTime();
  const symbol = useCanvasImage(ASSETS.nexusSymbol);
  const head = Math.pow(clamp01(t / MEET), 1.5);
  const burst = flash(t, MEET, 0.35);
  const wave = easeOutCubic(clamp01((t - MEET) / 0.9));
  const N = Math.round(1700 * FX.particleDensity);

  // symbol layout: big at centre, then rises to make room for the wordmark
  const lift = easeInOutCubic(clamp01((t - (WORD - 0.45)) / 0.8));
  const symW = lerp(SYMBOL_W, 380, lift);
  const symY = lerp(540, 300, lift);
  // end: everything but the symbol clears, symbol re-centres for the dive
  const prep = easeInOutCubic(clamp01((t - 7.35) / 0.65));
  const finalSymW = lerp(symW, 520, prep);
  const finalSymY = lerp(symY, 540, prep);

  const draw = (ctx: CanvasRenderingContext2D) => {
    if (t > MEET + 1.4) return;
    ctx.globalCompositeOperation = 'lighter';
    const fade = 1 - ramp(t, MEET + 0.2, MEET + 1.2);
    const streams = [
      {path: GREEN_PATH, cols: [COLORS.glowGreen, COLORS.emerald, COLORS.mint], seed: 1},
      {path: BLUE_PATH, cols: [COLORS.turquoise, COLORS.skyBlue, COLORS.deepBlue], seed: 2},
    ];
    for (const st of streams) {
      // ribbons of light
      for (let r = 0; r < 7; r++) {
        const off = (r - 3) * 14;
        ctx.globalAlpha = 0.25 * fade;
        ctx.strokeStyle = st.cols[r % 3];
        ctx.lineWidth = r === 3 ? 4 : 1.5;
        ctx.beginPath();
        for (let q = 0; q <= 60; q++) {
          const e = Math.max(0, head - 0.6) + (q / 60) * Math.min(0.6, head);
          const x = bz(st.path.x[0], st.path.x[1], st.path.x[2], st.path.x[3], e);
          const y = bz(st.path.y[0], st.path.y[1], st.path.y[2], st.path.y[3], e) + off * (1 - e) + snoise(st.seed * 10 + r, e * 4 + t) * 20 * (1 - e);
          if (q === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // particles along the stream
      for (let i = 0; i < N; i++) {
        const lag = Math.pow(hash01(st.seed, i), 1.4) * 0.75;
        const e = head - lag;
        if (e <= 0) continue;
        const spread = (hash01(st.seed + 4, i) - 0.5) * 2;
        const width = 170 * (1 - e) + 20;
        const ex = bz(st.path.x[0], st.path.x[1], st.path.x[2], st.path.x[3], e);
        const ey = bz(st.path.y[0], st.path.y[1], st.path.y[2], st.path.y[3], e);
        const e2 = Math.max(0, e - 0.02);
        const px = bz(st.path.x[0], st.path.x[1], st.path.x[2], st.path.x[3], e2);
        const py = bz(st.path.y[0], st.path.y[1], st.path.y[2], st.path.y[3], e2);
        const nx = -(ey - py);
        const ny = ex - px;
        const nl = Math.hypot(nx, ny) || 1;
        const sx = ex + (nx / nl) * spread * width + snoise(i, t * 2) * 12;
        const sy = ey + (ny / nl) * spread * width + snoise(i + 50, t * 2) * 12;
        const col = st.cols[i % 3];
        const z = 0.6 + hash01(st.seed + 8, i) * 1.2;
        // after the meeting the stream particles are blown outward by the wave
        const bx = (sx - 960) * wave * 1.6;
        const by = (sy - 540) * wave * 1.6;
        const a = fade * 0.9;
        drawStreak(ctx, col, sx - (ex - px) * 3 * FX.streaks, sy - (ey - py) * 3 * FX.streaks, sx + bx, sy + by, 1.4 * z, a * 0.5);
        drawGlow(ctx, col, sx + bx, sy + by, 4.5 * z, a, i % 23 === 0);
      }
    }
    // the meeting point
    if (t > MEET - 0.4) {
      const pre = ramp(t, MEET - 0.4, MEET);
      drawGlow(ctx, '#ffffff', 960, 540, 60 + pre * 140 + burst * 500, (pre * 0.6 + burst) * FX.glow, true);
      drawGlow(ctx, COLORS.turquoise, 960, 540, 300 + burst * 900, burst * 0.8 * FX.glow);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // energy wave → the frame floods with light
  const R = easeOutCubic(clamp01((t - MEET) / 1.1)) * 1500;
  const ringA = (1 - clamp01((t - MEET) / 1.1)) * (t > MEET ? 1 : 0);

  const symbolShapes: ShapeSpec[] = [
    {
      image: symbol,
      imageWidth: SYMBOL_W,
      x: 960,
      y: 540,
      t0: MEET - 0.45,
      t1: MEET + 0.9,
      t2: 99,
    },
  ];
  const particleOpacity = 1 - ramp(t, MEET + 1.0, MEET + 1.4);

  return (
    <Stage>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 80% at 50% 50%, #0B2550 0%, #061633 50%, ${COLORS.space} 100%)`}} />
      <SceneCanvas draw={draw} />
      {/* light floods in behind the wavefront */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 50%, #FFFFFF 0%, ${COLORS.pearl} 60%, ${COLORS.mist} 100%)`,
          WebkitMaskImage: `radial-gradient(circle at 50% 50%, black ${Math.max(0, R - 140)}px, transparent ${R}px)`,
          maskImage: `radial-gradient(circle at 50% 50%, black ${Math.max(0, R - 140)}px, transparent ${R}px)`,
        }}
      />
      <SceneCanvas
        draw={(ctx) => {
          if (ringA <= 0) return;
          ctx.globalCompositeOperation = 'source-over';
          for (let k = 0; k < 3; k++) {
            ctx.globalAlpha = ringA * (0.9 - k * 0.25);
            ctx.strokeStyle = [COLORS.turquoise, COLORS.glowGreen, COLORS.skyBlue][k];
            ctx.lineWidth = 10 - k * 3;
            ctx.shadowColor = COLORS.turquoise;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(960, 540, Math.max(1, R - 70 - k * 26), 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }}
      />
      {/* the symbol, built by the two streams */}
      <AbsoluteFill style={{opacity: particleOpacity}}>
        <ParticleType shapes={symbolShapes} t={t} seed={44} mode="light" residual={0} entry="split" maxPoints={5200} size={1.15} />
      </AbsoluteFill>
      {/* original logo artwork takes over, untouched */}
      <Img
        src={staticFile(ASSETS.nexusSymbol)}
        style={{
          position: 'absolute',
          width: finalSymW,
          left: 960 - finalSymW / 2,
          top: finalSymY - (finalSymW * SYMBOL_H) / SYMBOL_W / 2,
          opacity: ramp(t, MEET + 0.75, MEET + 1.1),
          filter: `drop-shadow(0 ${20 * (1 - prep)}px 50px ${rgba(COLORS.ocean, 0.22)})`,
        }}
      />
      <Wordmark t={t} out={1 - prep} />
      <Center y={812}>
        <div style={{opacity: 1 - prep}}>
          <WordReveal text={TEXT.reveal.subtitle} t={t} at={SUB} size={60} weight={500} color={COLORS.navy} variant="rise" stagger={0.07} />
        </div>
      </Center>
      <Center y={920}>
        <div style={{opacity: 1 - prep}}>
          <WordReveal
            text={TEXT.reveal.era}
            t={t}
            at={ERA}
            size={64}
            weight={800}
            gradient={`linear-gradient(90deg, ${COLORS.emerald}, ${COLORS.turquoise} 55%, ${COLORS.deepBlue})`}
            variant="blur"
            stagger={0.12}
          />
        </div>
      </Center>
    </Stage>
  );
};

/** NEXUS wordmark: light sweep reveal of the original artwork. */
const Wordmark: React.FC<{t: number; out: number}> = ({t, out}) => {
  const p = easeOutExpo(clamp01((t - WORD) / 1.0));
  if (p <= 0) return null;
  const w = 760;
  const h = (w * 174) / 952;
  const sweep = lerp(-20, 120, easeInOutCubic(clamp01((t - WORD) / 0.9)));
  return (
    <div
      style={{
        position: 'absolute',
        left: 960 - w / 2,
        top: 640 - h / 2,
        width: w,
        height: h,
        opacity: out,
        transform: `scale(${lerp(1.12, 1, p)})`,
        filter: `blur(${(1 - p) * 10}px)`,
        WebkitMaskImage: `linear-gradient(90deg, black ${sweep - 20}%, transparent ${sweep}%)`,
        maskImage: `linear-gradient(90deg, black ${sweep - 20}%, transparent ${sweep}%)`,
      }}
    >
      <Img src={staticFile(ASSETS.nexusWordmark)} style={{width: w, height: h}} />
      {/* specular sweep */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(100deg, transparent ${sweep - 30}%, rgba(255,255,255,0.75) ${sweep - 22}%, transparent ${sweep - 14}%)`,
          mixBlendMode: 'screen',
          WebkitMaskImage: `url(${staticFile(ASSETS.nexusWordmark)})`,
          WebkitMaskSize: '100% 100%',
        }}
      />
    </div>
  );
};
