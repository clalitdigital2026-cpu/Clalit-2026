/**
 * Scene 6 – The power of event-driven architecture (00:49–01:02)
 * One clear example: a lab result becomes an event, enters NEXUS and splits
 * into parallel streams; each system reacts on its own.
 * Presented explicitly as a possible future scenario.
 */
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ASSETS, COLORS, CUES, FONTS, TEXT} from '../config/config';
import {Vignette} from '../components/Finish';
import {Center, WordReveal} from '../components/Kinetic';
import {clamp01, easeInOutCubic, easeOutBack, easeOutCubic, easeOutExpo, flash, lerp, ramp, rgba} from '../lib/anim';
import {drawGlow, SceneCanvas, Stage} from '../lib/canvas';
import {Icon, IconName} from '../lib/icons';
import {hash01} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('eventDriven');
const EVENT_T = at(CUES.labEvent);
const TO_HUB = at(CUES.pulseToHub);
const SPLIT = at(CUES.split);
const TARGET_T = CUES.targets.map(at);
const BEATS = CUES.edBeats.map(at);
const TITLE = at(CUES.eventDrivenTitle);

const HUB = {x: 960, y: 470};
const TARGETS = [
  {x: 1500, y: 300},
  {x: 1560, y: 640},
  {x: 960, y: 820},
  {x: 360, y: 640},
  {x: 420, y: 300},
];

const TUBE = {x: 1180, y: 520};
const CHIP = {x: 960, y: 250};

/** Bezier from hub to target i at e∈[0,1]. */
const branch = (i: number, e: number) => {
  const tg = TARGETS[i];
  const cx = lerp(HUB.x, tg.x, 0.5) + (tg.y - HUB.y) * 0.25;
  const cy = lerp(HUB.y, tg.y, 0.5) - (tg.x - HUB.x) * 0.12;
  const u = 1 - e;
  return {x: u * u * HUB.x + 2 * u * e * cx + e * e * tg.x, y: u * u * HUB.y + 2 * u * e * cy + e * e * tg.y};
};

export const S6EventDriven: React.FC = () => {
  const t = useSceneTime();
  const stage1 = 1 - ramp(t, TO_HUB - 0.1, TO_HUB + 0.5); // tube + card
  const hubIn = easeOutBack(clamp01((t - (TO_HUB - 0.2)) / 0.6));
  const dimForBeats = ramp(t, BEATS[0] - 0.4, BEATS[0]);
  const dark = easeInOutCubic(clamp01((t - (TITLE - 0.5)) / 0.6));

  const draw = (ctx: CanvasRenderingContext2D) => {
    // --- the sample ---------------------------------------------------------
    if (stage1 > 0) {
      const spin = t * 1.6;
      const x = TUBE.x + (1 - easeOutCubic(clamp01(t / 0.9))) * 200;
      const y = TUBE.y;
      ctx.save();
      ctx.globalAlpha = stage1 * clamp01(t / 0.4);
      ctx.translate(x, y);
      ctx.rotate(0.18 + Math.sin(t * 0.8) * 0.04);
      const w = 92;
      const h = 430;
      // shadow
      ctx.fillStyle = rgba(COLORS.navy, 0.08);
      ctx.beginPath();
      ctx.ellipse(0, h / 2 + 40, 110, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      // sample (rises as the analysis completes)
      const lvl = 0.55 + 0.05 * Math.sin(t * 2);
      const liquid = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      liquid.addColorStop(0, '#7A1028');
      liquid.addColorStop(0.45 + 0.25 * Math.sin(spin), '#C3304A');
      liquid.addColorStop(1, '#6A0C22');
      ctx.fillStyle = liquid;
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 6, -h / 2 + h * (1 - lvl), w - 12, h * lvl - 6, [0, 0, w / 2, w / 2]);
      ctx.fill();
      // glass
      const glass = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      const hl = 0.3 + 0.25 * Math.sin(spin);
      glass.addColorStop(0, 'rgba(255,255,255,0.15)');
      glass.addColorStop(Math.max(0.05, hl - 0.08), 'rgba(255,255,255,0.15)');
      glass.addColorStop(hl, 'rgba(255,255,255,0.85)');
      glass.addColorStop(Math.min(0.95, hl + 0.08), 'rgba(255,255,255,0.2)');
      glass.addColorStop(1, 'rgba(200,220,240,0.35)');
      ctx.fillStyle = glass;
      ctx.strokeStyle = rgba(COLORS.navy, 0.45);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, [0, 0, w / 2, w / 2]);
      ctx.fill();
      ctx.stroke();
      // cap
      const cap = ctx.createLinearGradient(-w / 2 - 8, 0, w / 2 + 8, 0);
      cap.addColorStop(0, COLORS.emeraldDeep);
      cap.addColorStop(0.4 + 0.2 * Math.sin(spin), COLORS.glowGreen);
      cap.addColorStop(1, COLORS.emeraldDeep);
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.roundRect(-w / 2 - 8, -h / 2 - 70, w + 16, 82, 12);
      ctx.fill();
      // label band (no patient data – just a barcode-like pattern)
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(-w / 2 + 4, -h / 2 + 40, w - 8, 120);
      ctx.fillStyle = rgba(COLORS.navy, 0.8);
      for (let k = 0; k < 14; k++) {
        const bw = hash01(91, k) > 0.5 ? 3 : 1.5;
        ctx.fillRect(-w / 2 + 14 + k * 4.6, -h / 2 + 60, bw, 60);
      }
      ctx.restore();
    }

    // --- event pulse travels to NEXUS ---------------------------------------
    if (t > TO_HUB - 0.2 && t < SPLIT + 0.3) {
      const e = easeInOutCubic(clamp01((t - TO_HUB) / (SPLIT - TO_HUB)));
      const x = lerp(CHIP.x, HUB.x, e);
      const y = lerp(CHIP.y + 30, HUB.y, e);
      ctx.globalCompositeOperation = 'source-over';
      for (let q = 0; q < 14; q++) {
        const ee = clamp01(e - q * 0.03);
        drawGlow(ctx, COLORS.turquoise, lerp(CHIP.x, HUB.x, ee), lerp(CHIP.y + 30, HUB.y, ee), 26 - q, 0.5 * (1 - q / 14));
      }
      drawGlow(ctx, COLORS.skyBlue, x, y, 60, 0.9, true);
    }

    // --- split into parallel streams ------------------------------------------
    TARGETS.forEach((tg, i) => {
      const t0 = SPLIT;
      const t1 = TARGET_T[i];
      const grow = easeOutCubic(clamp01((t - t0) / (t1 - t0)));
      if (grow <= 0) return;
      const col = i % 2 ? COLORS.skyBlue : COLORS.emerald;
      const fade = 1 - dimForBeats * 0.65;
      // track
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.9 * fade;
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let q = 0; q <= 40; q++) {
        const p = branch(i, (q / 40) * grow);
        if (q === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      // head pulse
      if (grow < 1) {
        const h = branch(i, grow);
        drawGlow(ctx, col, h.x, h.y, 40, 1, true);
      }
      // continuous flow afterwards
      if (grow >= 1) {
        for (let k = 0; k < 4; k++) {
          const e = ((t - t1) * 0.7 + k / 4) % 1;
          const p = branch(i, e);
          drawGlow(ctx, col, p.x, p.y, 16, 0.85 * fade, true);
        }
      }
    });
    // split shockwave
    const sw = t - SPLIT;
    if (sw > 0 && sw < 0.9) {
      ctx.globalAlpha = 1 - sw / 0.9;
      ctx.strokeStyle = COLORS.turquoise;
      ctx.lineWidth = 6 * (1 - sw / 0.9) + 1;
      ctx.beginPath();
      ctx.arc(HUB.x, HUB.y, 90 + easeOutExpo(sw / 0.9) * 340, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  // event chip
  const chipIn = easeOutExpo(clamp01((t - EVENT_T) / 0.5));
  const chipOut = ramp(t, TO_HUB - 0.05, TO_HUB + 0.35);
  const chipPing = flash(t, EVENT_T, 0.4);

  return (
    <Stage>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 90% 80% at 50% 45%, #FFFFFF 0%, ${COLORS.pearl} 55%, ${COLORS.mist} 100%)`}} />
      <AbsoluteFill style={{filter: `blur(${dimForBeats * 6}px)`, opacity: 1 - dimForBeats * 0.55}}>
        <SceneCanvas draw={draw} />
        {/* digital result card – abstract, no real values */}
        <ResultCard t={t} visible={stage1} />
        {/* NEXUS hub */}
        {hubIn > 0 && (
          <div
            style={{
              position: 'absolute',
              left: HUB.x - 120,
              top: HUB.y - 120,
              width: 240,
              height: 240,
              borderRadius: 120,
              background: '#fff',
              boxShadow: `0 20px 60px ${rgba(COLORS.ocean, 0.25)}, 0 0 0 ${2 + flash(t, SPLIT, 0.3) * 20}px ${rgba(COLORS.turquoise, 0.25)}`,
              transform: `scale(${hubIn})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Img src={staticFile(ASSETS.nexusSymbol)} style={{width: 150}} />
          </div>
        )}
        {TEXT.eventDriven.targets.map((tg, i) => (
          <TargetCard key={i} i={i} t={t} label={tg.label} sub={'sub' in tg ? tg.sub : undefined} icon={tg.icon as IconName} />
        ))}
      </AbsoluteFill>
      {/* the event */}
      {chipIn > 0 && chipOut < 1 && (
        <div
          style={{
            position: 'absolute',
            left: CHIP.x,
            top: CHIP.y,
            transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, chipIn) * lerp(1, 0.15, easeInOutCubic(chipOut))})`,
            opacity: 1 - chipOut * 0.6,
            padding: '20px 40px',
            borderRadius: 60,
            background: COLORS.navy,
            color: '#fff',
            fontFamily: FONTS.latinStack,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: lerp(0.4, 0.12, chipIn) + 'em',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            boxShadow: `0 0 ${20 + chipPing * 80}px ${rgba(COLORS.turquoise, 0.4 + chipPing * 0.5)}, 0 18px 40px ${rgba(COLORS.navy, 0.3)}`,
          }}
        >
          <span style={{width: 18, height: 18, borderRadius: 9, background: COLORS.glowGreen, boxShadow: `0 0 20px ${COLORS.glowGreen}`}} />
          {TEXT.eventDriven.event}
        </div>
      )}
      {/* future-scenario disclaimer */}
      <Center y={1010}>
        <div
          style={{
            direction: 'rtl',
            fontFamily: FONTS.stack,
            fontSize: 26,
            fontWeight: 500,
            color: rgba(COLORS.navy, 0.65),
            opacity: ramp(t, SPLIT, SPLIT + 0.5) * (1 - ramp(t, TITLE - 0.6, TITLE - 0.3)),
            border: `1.5px solid ${rgba(COLORS.navy, 0.2)}`,
            borderRadius: 30,
            padding: '8px 26px',
            whiteSpace: 'nowrap',
          }}
        >
          {TEXT.eventDriven.disclaimer}
        </div>
      </Center>
      {/* beats */}
      {TEXT.eventDriven.beats.map((b, k) => (
        <Center key={k} y={500}>
          <WordReveal
            text={b}
            t={t}
            at={BEATS[k]}
            out={k < 2 ? BEATS[k + 1] - 0.12 : TITLE - 0.55}
            outDur={0.2}
            size={k === 2 ? 168 : 156}
            weight={900}
            color={COLORS.navy}
            gradient={k === 2 ? `linear-gradient(90deg, ${COLORS.emerald}, ${COLORS.deepBlue})` : undefined}
            variant={(['zoom', 'rise', 'blur'] as const)[k]}
            inDur={0.45}
          />
        </Center>
      ))}
      {/* EVENT-DRIVEN: the frame turns to night around it */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 50%, #0B2A55 0%, #05173A 55%, ${COLORS.space} 100%)`,
          WebkitMaskImage: `radial-gradient(circle at 50% 47%, black ${dark * 1500 - 100}px, transparent ${dark * 1500}px)`,
          maskImage: `radial-gradient(circle at 50% 47%, black ${dark * 1500 - 100}px, transparent ${dark * 1500}px)`,
        }}
      />
      {dark > 0 && <Vignette strength={0.5 * dark} />}
      <EventDrivenTitle t={t} />
    </Stage>
  );
};

const ResultCard: React.FC<{t: number; visible: number}> = ({t, visible}) => {
  const p = easeOutExpo(clamp01((t - 0.6) / 0.7));
  if (visible <= 0 || p <= 0) return null;
  const rows = [0.72, 0.48, 0.86, 0.6];
  return (
    <div
      style={{
        position: 'absolute',
        left: 560,
        top: 380,
        width: 440,
        padding: 34,
        borderRadius: 28,
        background: 'rgba(255,255,255,0.9)',
        boxShadow: `0 30px 80px ${rgba(COLORS.navy, 0.14)}`,
        border: `1.5px solid ${rgba(COLORS.ocean, 0.15)}`,
        opacity: visible * p,
        transform: `translateX(${(1 - p) * 80}px) perspective(1200px) rotateY(${(1 - p) * -20 - 8}deg)`,
        direction: 'rtl',
        fontFamily: FONTS.stack,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26}}>
        <Icon name="lab" size={44} color={COLORS.emerald} stroke={3} />
        <div style={{fontSize: 34, fontWeight: 800, color: COLORS.navy}}>{TEXT.eventDriven.resultLabel}</div>
      </div>
      {rows.map((r, k) => {
        const g = easeOutCubic(clamp01((t - 0.9 - k * 0.12) / 0.6));
        return (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14}}>
            <div style={{width: 70, height: 10, borderRadius: 5, background: rgba(COLORS.navy, 0.12)}} />
            <div style={{flex: 1, height: 10, borderRadius: 5, background: rgba(COLORS.navy, 0.06)}}>
              <div style={{width: `${r * g * 100}%`, height: '100%', borderRadius: 5, background: k % 2 ? COLORS.skyBlue : COLORS.emerald}} />
            </div>
          </div>
        );
      })}
      <div
        style={{
          marginTop: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: COLORS.emerald,
          fontWeight: 700,
          fontSize: 24,
          opacity: ramp(t, EVENT_T - 0.2, EVENT_T + 0.1),
        }}
      >
        <Icon name="shield" size={30} color={COLORS.emerald} stroke={3} />
        <span>הושלם</span>
      </div>
    </div>
  );
};

const TargetCard: React.FC<{i: number; t: number; label: string; sub?: string; icon: IconName}> = ({i, t, label, sub, icon}) => {
  const hit = TARGET_T[i];
  const appear = easeOutExpo(clamp01((t - (SPLIT - 0.2 + i * 0.06)) / 0.6));
  const lit = easeOutCubic(clamp01((t - hit) / 0.35));
  const ping = flash(t, hit, 0.35);
  if (appear <= 0) return null;
  const tg = TARGETS[i];
  const col = i % 2 ? COLORS.skyBlue : COLORS.emerald;
  return (
    <div
      style={{
        position: 'absolute',
        left: tg.x,
        top: tg.y,
        transform: `translate(-50%, -50%) scale(${lerp(0.85, 1, appear) * (1 + ping * 0.06)})`,
        opacity: appear,
        direction: 'rtl',
        fontFamily: FONTS.stack,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '20px 28px',
        borderRadius: 24,
        background: '#fff',
        border: `2px solid ${lit > 0 ? rgba(col, 0.3 + 0.7 * lit) : rgba(COLORS.navy, 0.1)}`,
        boxShadow: `0 16px 40px ${rgba(COLORS.navy, 0.1)}, 0 0 ${ping * 50}px ${rgba(col, 0.6 * ping)}`,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{width: 64, height: 64, borderRadius: 18, background: lit > 0 ? rgba(col, 0.12 * lit) : rgba(COLORS.navy, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Icon name={icon} size={42} color={lit > 0.5 ? col : rgba(COLORS.navy, 0.55)} stroke={3} />
      </div>
      <div>
        <div style={{fontSize: 32, fontWeight: 800, color: COLORS.navy}}>{label}</div>
        {sub && <div style={{fontSize: 21, fontWeight: 400, color: rgba(COLORS.navy, 0.6), marginTop: 2}}>{sub}</div>}
      </div>
    </div>
  );
};

/** Letters fly in from wide tracking; a light runs through them. */
const EventDrivenTitle: React.FC<{t: number}> = ({t}) => {
  const p = easeOutExpo(clamp01((t - TITLE) / 1.0));
  if (p <= 0) return null;
  const chars = TEXT.eventDriven.title.split('');
  const run = ((t - TITLE) * 0.6) % 1.4;
  return (
    <>
      <Center y={470}>
        <div style={{display: 'flex', direction: 'ltr', fontFamily: FONTS.latinStack, fontWeight: 900, fontSize: 196, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
          {chars.map((c, i) => {
            const off = (i - (chars.length - 1) / 2) * (1 - p) * 90;
            const lp = easeOutCubic(clamp01((t - TITLE - Math.abs(i - (chars.length - 1) / 2) * 0.03) / 0.6));
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  transform: `translateX(${off}px)`,
                  opacity: lp,
                  filter: `blur(${(1 - lp) * 12}px)`,
                  backgroundImage: `linear-gradient(100deg, transparent ${(run - 0.1) * 100}%, rgba(255,255,255,0.95) ${run * 100}%, transparent ${(run + 0.1) * 100}%), linear-gradient(90deg, ${COLORS.glowGreen}, ${COLORS.turquoise})`,
                  backgroundSize: `${chars.length * 100}% 100%`,
                  backgroundPosition: `${(i / (chars.length - 1)) * 100}% 0`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {c}
              </span>
            );
          })}
        </div>
      </Center>
      <Center y={640}>
        <WordReveal text={TEXT.eventDriven.tagline} t={t} at={TITLE + 0.7} size={64} weight={500} color="#E6F2FF" variant="rise" stagger={0.1} />
      </Center>
      <div
        style={{
          position: 'absolute',
          left: 960 - 500 * p,
          top: 572,
          width: 1000 * p,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${COLORS.glowGreen}, ${COLORS.turquoise}, transparent)`,
          opacity: 0.8,
        }}
      />
    </>
  );
};

