/**
 * Scene 2 – "Every moment is an event" (00:08–00:17)
 * Six moments of care arrive as large glass cards in a 3×2 grid (in reading
 * order, right to left) and stay on screen together so every one can be read.
 * Each card's action completes, an EVENT tag lights up and a packet of light
 * flies from it to the centre, where the packets gather into the word "מידע",
 * which then breaks apart and re-forms as EVENT.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CUES, FONTS, TEXT} from '../config/config';
import {Center, WordReveal} from '../components/Kinetic';
import {ParticleType, ShapeSpec} from '../components/ParticleType';
import {clamp01, easeInCubic, easeInOutCubic, easeOutCubic, easeOutExpo, flash, lerp, ramp, rgba, springAt} from '../lib/anim';
import {drawGlow, SceneCanvas, Stage} from '../lib/canvas';
import {Icon, IconName} from '../lib/icons';
import {hash01} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('events');
const HEAD = at(CUES.eventsHeadline);
const MORPH = at(CUES.eventMorph);
const CLOSE = at(CUES.eventsClosing);

const NAVY = COLORS.navy;
const CARD_W = 540;
const CARD_H = 300;
const GATHER = {x: 960, y: 610};
const OUT0 = HEAD - 0.75; // cards begin to leave
const OUT1 = HEAD - 0.1;

const MOMENTS = TEXT.events.moments.map((m, k) => {
  const col = k % 3; // 0 = right (first in reading order)
  const row = Math.floor(k / 3);
  return {
    ...m,
    k,
    act: at(CUES.moments[k]), // the moment happens (beat-synced)
    appear: at(CUES.moments[k]) - 0.55,
    x: 960 + (1 - col) * 580,
    y: 395 + row * 350,
    green: k % 2 === 0,
  };
});

/** One moment of care: a glass card with a big icon, title, live status and its EVENT. */
const MomentCard: React.FC<{m: (typeof MOMENTS)[number]; t: number}> = ({m, t}) => {
  const local = t - m.appear;
  if (local < 0) return null;
  const sp = springAt(local, {stiffness: 140, damping: 16});
  const prog = easeInOutCubic(clamp01((t - m.appear - 0.1) / (m.act - m.appear - 0.1)));
  const done = t >= m.act;
  const ping = flash(t, m.act, 0.35);
  const out = easeInCubic(clamp01((t - (OUT0 + m.k * 0.05)) / (OUT1 - OUT0)));
  const c1 = m.green ? COLORS.emerald : COLORS.skyBlue;
  const c2 = m.green ? COLORS.teal : COLORS.deepBlue;
  // gentle 3D float, cards lean toward the centre
  const tiltY = (m.x - 960) / 960 * -14 + Math.sin(t * 0.8 + m.k) * 2;
  const tiltX = (m.y - 540) / 540 * 10;
  const leave = {x: (GATHER.x - m.x) * out * 0.6, y: (GATHER.y - m.y) * out * 0.6};
  return (
    <div
      style={{
        position: 'absolute',
        left: m.x - CARD_W / 2,
        top: m.y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        transform: `translate(${leave.x}px, ${leave.y}px) perspective(1400px) translateZ(${lerp(-500, 0, sp) - out * 300}px) rotateY(${tiltY}deg) rotateX(${tiltX}deg) scale(${1 + ping * 0.035})`,
        opacity: clamp01(local / 0.25) * (1 - out),
        filter: `blur(${(1 - clamp01(local / 0.35)) * 10 + out * 8}px)`,
        borderRadius: 36,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.97), rgba(255,255,255,0.82))',
        border: `1.5px solid ${done ? rgba(c1, 0.55) : 'rgba(255,255,255,0.9)'}`,
        boxShadow: `0 30px 70px ${rgba(NAVY, 0.13)}, 0 6px 18px ${rgba(NAVY, 0.06)}, 0 0 ${ping * 60}px ${rgba(c1, 0.45 * ping)}`,
        direction: 'rtl',
        fontFamily: FONTS.stack,
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: '34px 38px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* light sweep across the glass when the moment happens */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(110deg, transparent ${(t - m.act) * 260 - 40}%, ${rgba(c1, 0.12)} ${(t - m.act) * 260 - 20}%, transparent ${(t - m.act) * 260}%)`,
        }}
      />
      <div style={{display: 'flex', alignItems: 'center', gap: 28}}>
        <div
          style={{
            width: 118,
            height: 118,
            flex: 'none',
            borderRadius: 32,
            background: `linear-gradient(145deg, ${c1}, ${c2})`,
            boxShadow: `0 14px 30px ${rgba(c1, 0.35)}, inset 0 2px 0 rgba(255,255,255,0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${lerp(0.6, 1, springAt(local - 0.08, {stiffness: 160, damping: 12}))})`,
          }}
        >
          <Icon name={m.icon as IconName} size={70} color="#FFFFFF" stroke={2.8} />
        </div>
        <div style={{fontSize: 46, fontWeight: 800, color: NAVY, lineHeight: 1.12, letterSpacing: '-0.01em'}}>{m.label}</div>
      </div>
      <div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 30, fontWeight: 600, color: done ? c2 : rgba(NAVY, 0.45)}}>
            <Check on={done} t={t - m.act} color={c1} />
            <span>{done ? m.status : 'מתבצע…'}</span>
          </div>
          {/* the EVENT tag */}
          <div
            style={{
              direction: 'ltr',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 18px',
              borderRadius: 30,
              background: done ? NAVY : rgba(NAVY, 0.06),
              color: done ? '#fff' : rgba(NAVY, 0.35),
              fontFamily: FONTS.latinStack,
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: '0.16em',
              transform: `scale(${1 + ping * 0.15})`,
              boxShadow: done ? `0 0 ${10 + ping * 30}px ${rgba(c1, 0.6)}` : 'none',
            }}
          >
            <span style={{width: 10, height: 10, borderRadius: 5, background: done ? COLORS.glowGreen : rgba(NAVY, 0.2), boxShadow: done ? `0 0 10px ${COLORS.glowGreen}` : 'none'}} />
            EVENT
          </div>
        </div>
        {/* progress of the moment */}
        <div style={{height: 8, borderRadius: 4, background: rgba(NAVY, 0.07), overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${prog * 100}%`, borderRadius: 4, background: `linear-gradient(270deg, ${c1}, ${c2})`}} />
        </div>
      </div>
    </div>
  );
};

const Check: React.FC<{on: boolean; t: number; color: string}> = ({on, t, color}) => {
  const p = on ? easeOutCubic(clamp01(t / 0.3)) : 0;
  return (
    <svg width={34} height={34} viewBox="0 0 34 34">
      <circle cx={17} cy={17} r={15} fill={on ? color : 'none'} stroke={on ? color : rgba(NAVY, 0.25)} strokeWidth={2.5} />
      <path d="M10 17.5l5 5 9-10" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - p)} />
    </svg>
  );
};

export const S2Events: React.FC = () => {
  const t = useSceneTime();

  // packets of light: born at each card's EVENT tag, they fly to the centre
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.globalCompositeOperation = 'source-over';
    for (const m of MOMENTS) {
      const color = m.green ? COLORS.emerald : COLORS.skyBlue;
      // the tag sits at the card's lower-left corner (RTL layout)
      const ox = m.x - CARD_W / 2 + 110;
      const oy = m.y + CARD_H / 2 - 82;
      for (let j = 0; j < 5; j++) {
        const born = m.act + j * 0.07;
        const life = t - born;
        if (life < 0) continue;
        const dur = Math.max(0.8, HEAD + 0.2 - born);
        const e = easeInOutCubic(clamp01(life / dur));
        const ang = hash01(m.k, j) * Math.PI * 2 + t * 1.4;
        const r = 40 + hash01(m.k + 7, j) * 150;
        const tx = GATHER.x + Math.cos(ang) * r * 1.4 * (1 - ramp(t, HEAD - 0.2, HEAD + 0.3));
        const ty = GATHER.y + Math.sin(ang) * r * 0.4 * (1 - ramp(t, HEAD - 0.2, HEAD + 0.3));
        const cx1 = lerp(ox, tx, 0.5) + (hash01(m.k + 3, j) - 0.5) * 300;
        const cy1 = Math.min(oy, ty) - 160 - hash01(m.k + 5, j) * 160;
        const fade = 1 - ramp(t, HEAD + 0.15, HEAD + 0.55);
        if (fade <= 0) continue;
        const pt = (ee: number) => {
          const u = 1 - ee;
          return {x: u * u * ox + 2 * u * ee * cx1 + ee * ee * tx, y: u * u * oy + 2 * u * ee * cy1 + ee * ee * ty};
        };
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        for (let q = 0; q < 12; q++) {
          const a0 = pt(clamp01(e - q * 0.02));
          const a1 = pt(clamp01(e - (q + 1) * 0.02));
          ctx.globalAlpha = fade * 0.5 * (1 - q / 12);
          ctx.lineWidth = 5 * (1 - q / 12) + 0.5;
          ctx.beginPath();
          ctx.moveTo(a0.x, a0.y);
          ctx.lineTo(a1.x, a1.y);
          ctx.stroke();
        }
        const p = pt(e);
        drawGlow(ctx, color, p.x, p.y, 22, fade * 0.9, true);
      }
    }
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
      {/* fine dot grid for depth */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(${rgba(NAVY, 0.09)} 1.6px, transparent 1.6px)`,
          backgroundSize: '44px 44px',
          backgroundPosition: `${-t * 18}px 0px`,
          opacity: 1 - ramp(t, HEAD - 0.4, HEAD + 0.4) * 0.6,
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, black 30%, transparent 100%)',
        }}
      />
      {MOMENTS.map((m) => (
        <MomentCard key={m.k} m={m} t={t} />
      ))}
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
