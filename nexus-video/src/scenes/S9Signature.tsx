/**
 * Scene 9 – Brand signature (01:24–01:30)
 * The whole network gathers into two streams, green and blue, which meet and
 * become the NEXUS symbol. Light floods in; the original logo is assembled
 * exactly as designed, followed by the slogan and the Clalit signature.
 */
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ASSETS, COLORS, CUES, FONTS, FX, TEXT} from '../config/config';
import lockup from '../config/lockup.json';
import {Center, WordReveal} from '../components/Kinetic';
import {ParticleType, ShapeSpec} from '../components/ParticleType';
import {clamp01, easeInOutCubic, easeOutExpo, flash, lerp, ramp, rgba} from '../lib/anim';
import {drawGlow, SceneCanvas, Stage} from '../lib/canvas';
import {useCanvasImage} from '../lib/images';
import {hash01} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('signature');
const MEET = at(CUES.finalMeet);
const SLOGAN = at(CUES.slogan);
const CLALIT = at(CUES.clalitLogo);

// lockup geometry in the original artwork's pixel space
const SYM = lockup['nexus-symbol.png'];
const WORD = lockup['nexus-clalit-word.png'];
const MARK = lockup['nexus-wordmark.png'];
const LOCK_TOP = SYM[1];
const LOCK_CX = (MARK[0] + MARK[2]) / 2;
// final lockup scale: wordmark 820px wide
const K = 760 / (MARK[2] - MARK[0]);
const LOCK_Y0 = 150; // screen y of the lockup top
const place = (b: number[]) => ({
  left: 960 + (b[0] - LOCK_CX) * K,
  top: LOCK_Y0 + (b[1] - LOCK_TOP) * K,
  width: (b[2] - b[0]) * K,
});
const SYM_FINAL = place(SYM);
const SYM_START_W = 560;

export const S9Signature: React.FC = () => {
  const t = useSceneTime();
  const symbol = useCanvasImage(ASSETS.nexusSymbol);
  const toWhite = easeInOutCubic(clamp01((t - (MEET + 0.05)) / 0.55));
  const settle = easeInOutCubic(clamp01((t - (MEET + 0.45)) / 0.8));
  const burst = flash(t, MEET, 0.3);

  const symW = lerp(SYM_START_W, SYM_FINAL.width, settle);
  const symH = (symW * (SYM[3] - SYM[1])) / (SYM[2] - SYM[0]);
  const symCx = lerp(960, SYM_FINAL.left + SYM_FINAL.width / 2, settle);
  const symCy = lerp(540, SYM_FINAL.top + (SYM_FINAL.width * (SYM[3] - SYM[1])) / (SYM[2] - SYM[0]) / 2, settle);

  // two converging streams (the network gathered into green and blue)
  const draw = (ctx: CanvasRenderingContext2D) => {
    if (t > MEET + 0.6) return;
    ctx.globalCompositeOperation = 'lighter';
    const fade = 1 - ramp(t, MEET - 0.1, MEET + 0.4);
    const n = Math.round(900 * FX.particleDensity);
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i < n; i++) {
        // particles start scattered over the frame and are swept into a curve
        const a = hash01(s * 7 + 1, i);
        const b = hash01(s * 7 + 2, i);
        const e = easeInOutCubic(clamp01((t - a * 0.5) / (MEET - 0.2)));
        const sx = (s === 0 ? 0 : 960) + b * 960;
        const sy = hash01(s * 7 + 3, i) * 1080;
        const u = (a + t * 0.6) % 1;
        const cx = s === 0 ? lerp(-100, 940, u) : lerp(2020, 980, u);
        const cy = 540 + Math.sin(u * Math.PI) * (s === 0 ? 260 : -260) * (1 - u) + (b - 0.5) * 70 * (1 - u);
        const x = lerp(sx, cx, e);
        const y = lerp(sy, cy, e);
        const col = s === 0 ? (i % 3 ? COLORS.glowGreen : COLORS.mint) : i % 3 ? COLORS.turquoise : COLORS.skyBlue;
        drawGlow(ctx, col, x, y, 4 + e * 3, 0.85 * fade, i % 19 === 0);
      }
    }
    drawGlow(ctx, '#ffffff', 960, 540, 80 + burst * 700, (ramp(t, MEET - 0.6, MEET) * 0.6 + burst) * FX.glow, true);
    ctx.globalCompositeOperation = 'source-over';
  };

  const shapes: ShapeSpec[] = [
    {image: symbol, imageWidth: SYM_START_W, x: 960, y: 540, t0: 0.15, t1: MEET + 0.1, t2: 99},
  ];

  const wordIn = easeOutExpo(clamp01((t - (MEET + 0.85)) / 0.8));
  const clalitWordIn = easeOutExpo(clamp01((t - (MEET + 1.05)) / 0.8));
  const sign = easeOutExpo(clamp01((t - CLALIT) / 0.9));
  const shine = clamp01((t - 4.4) / 0.9);
  const word = place(WORD);
  const mark = place(MARK);

  return (
    <Stage>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 80% at 50% 50%, #0B2C5A 0%, #05173A 50%, ${COLORS.space} 100%)`}} />
      <SceneCanvas draw={draw} />
      <AbsoluteFill style={{opacity: 1 - ramp(t, MEET + 0.3, MEET + 0.6)}}>
        <ParticleType shapes={shapes} t={t} seed={91} mode="dark" residual={0} entry="split" maxPoints={5200} size={1.1} />
      </AbsoluteFill>
      {/* light floods the frame */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 45%, #FFFFFF 0%, #FFFFFF 50%, ${COLORS.pearl} 100%)`,
          opacity: toWhite,
        }}
      />
      {/* original NEXUS logo, assembled from its own pieces at exact proportions */}
      <div style={{position: 'absolute', left: symCx - symW / 2, top: symCy - symH / 2, width: symW, height: symH, opacity: ramp(t, MEET - 0.05, MEET + 0.25)}}>
        <Img src={staticFile(ASSETS.nexusSymbol)} style={{width: symW, height: symH}} />
        {shine > 0 && shine < 1 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(110deg, transparent ${shine * 160 - 50}%, rgba(255,255,255,0.7) ${shine * 160 - 35}%, transparent ${shine * 160 - 20}%)`,
              WebkitMaskImage: `url(${staticFile(ASSETS.nexusSymbol)})`,
              WebkitMaskSize: '100% 100%',
            }}
          />
        )}
      </div>
      <Img
        src={staticFile(ASSETS.nexusClalitWord)}
        style={{position: 'absolute', left: word.left, top: word.top, width: word.width, opacity: clalitWordIn, transform: `translateY(${(1 - clalitWordIn) * 14}px)`}}
      />
      <div
        style={{
          position: 'absolute',
          left: mark.left,
          top: mark.top,
          width: mark.width,
          opacity: wordIn,
          filter: `blur(${(1 - wordIn) * 8}px)`,
          transform: `scale(${lerp(1.06, 1, wordIn)})`,
          WebkitMaskImage: `linear-gradient(90deg, black ${wordIn * 130 - 20}%, transparent ${wordIn * 130}%)`,
        }}
      >
        <Img src={staticFile(ASSETS.nexusWordmark)} style={{width: mark.width}} />
      </div>
      {/* slogan */}
      <Center y={mark.top + ((MARK[3] - MARK[1]) * K) + 70}>
        <WordReveal text={TEXT.signature.slogan} t={t} at={SLOGAN} size={58} weight={500} color={COLORS.navy} variant="rise" stagger={0.1} letterSpacing="0.01em" />
      </Center>
      {/* Clalit signature */}
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 930,
          transform: `translate(-50%, -50%) translateY(${(1 - sign) * 20}px)`,
          opacity: sign,
          display: 'flex',
          direction: 'rtl',
          alignItems: 'center',
          gap: 34,
          whiteSpace: 'nowrap',
        }}
      >
        <Img src={staticFile(ASSETS.clalitLogo)} style={{height: 64}} />
        <div style={{width: 2, height: 56, background: rgba(COLORS.navy, 0.2)}} />
        <div style={{fontFamily: FONTS.stack, fontSize: 36, fontWeight: 500, color: COLORS.navy}}>{TEXT.signature.division}</div>
      </div>
      {/* closing rule – the two streams, at rest */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 300 * sign,
          width: 600 * sign,
          top: 870,
          height: 3,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${COLORS.emerald}, ${COLORS.turquoise}, ${COLORS.deepBlue})`,
          opacity: 0.8 * sign,
        }}
      />
      <AbsoluteFill style={{background: '#fff', opacity: burst * 0.6 * (1 - toWhite)}} />
    </Stage>
  );
};

