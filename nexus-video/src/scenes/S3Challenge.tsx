/**
 * Scene 3 – The challenge (00:17–00:25)
 * The camera pulls back to reveal many systems, each in its own orbit of data.
 * Point-to-point links multiply and tangle. Everything freezes. The question.
 */
import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {COLORS, CUES, FONTS, FX, TEXT} from '../config/config';
import {Vignette} from '../components/Finish';
import {Center, WordReveal} from '../components/Kinetic';
import {clamp01, easeInOutCubic, easeOutExpo, lerp, ramp, rgba} from '../lib/anim';
import {fog, project} from '../lib/camera';
import {drawGlow, SceneCanvas, Stage} from '../lib/canvas';
import {drawIcon, IconName} from '../lib/icons';
import {hash01, snoise} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';

const at = cueIn('challenge');
const WORDS_T = CUES.challengeWords.map(at);
const FREEZE = at(CUES.freeze);
const QUESTION = at(CUES.question);

const ICONS: IconName[] = ['database', 'server', 'cloud', 'hospital', 'lab', 'pill', 'calendar', 'phone', 'record', 'scan', 'clinic', 'database', 'server'];
const HUES = [COLORS.turquoise, COLORS.glowGreen, COLORS.skyBlue, '#7FA6C9', COLORS.mint, '#4F7CAC'];

type Sys = {x: number; y: number; z: number; icon: IconName; hue: string; appear: number; ph: number};

const useSystems = () =>
  useMemo(() => {
    const out: Sys[] = [];
    const n = 30;
    for (let i = 0; i < n; i++) {
      const ring = i < 6 ? 0.45 : 1;
      out.push({
        x: (hash01(31, i) - 0.5) * 3600 * ring,
        y: (hash01(32, i) - 0.5) * 1800 * ring,
        z: 500 + hash01(33, i) * 2600,
        icon: ICONS[i % ICONS.length],
        hue: HUES[i % HUES.length],
        appear: i < 6 ? 0 : 0.3 + (i / n) * 3.6,
        ph: hash01(34, i) * 10,
      });
    }
    return out;
  }, []);

const useLinks = (n: number) =>
  useMemo(() => {
    const out: {a: number; b: number; born: number; bend: number; seed: number}[] = [];
    for (let i = 0; i < 170; i++) {
      const a = Math.floor(hash01(41, i) * n);
      let b = Math.floor(hash01(42, i) * n);
      if (b === a) b = (b + 1) % n;
      out.push({a, b, born: 0.4 + Math.pow(i / 170, 0.8) * 4.8, bend: (hash01(43, i) - 0.5) * 1.6, seed: i});
    }
    return out;
  }, [n]);

export const S3Challenge: React.FC = () => {
  const t = useSceneTime();
  const systems = useSystems();
  const links = useLinks(systems.length);
  // motion time stops at the freeze
  const tm = Math.min(t, FREEZE);
  const frozen = ramp(t, FREEZE, FREEZE + 0.25);
  const dimEnd = ramp(t, 7.2, 8.0);

  const cam = {
    x: lerp(150, -120, easeInOutCubic(clamp01(tm / FREEZE))),
    y: lerp(40, -30, easeInOutCubic(clamp01(tm / FREEZE))),
    z: lerp(-100, -1050, easeInOutCubic(clamp01(tm / (FREEZE + 0.6)))),
    yaw: lerp(0.12, -0.06, easeInOutCubic(clamp01(tm / FREEZE))),
    roll: lerp(-0.03, 0.02, clamp01(tm / FREEZE)),
    focal: 950,
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const pos = systems.map((s) => {
      const wob = {x: s.x + snoise(s.ph, tm * 0.3) * 40, y: s.y + snoise(s.ph + 3, tm * 0.3) * 30, z: s.z};
      return {w: wob, p: project(wob, cam)};
    });
    const sat = 1 - frozen * 0.55;
    const glob = (1 - dimEnd * 0.9) * (1 - frozen * 0.35);

    // tangled point-to-point links
    ctx.globalCompositeOperation = 'lighter';
    for (const l of links) {
      const age = tm - l.born;
      if (age < 0) continue;
      const A = pos[l.a];
      const B = pos[l.b];
      if (!A.p || !B.p) continue;
      const grow = easeOutExpo(clamp01(age / 0.7));
      const mx = (A.p.x + B.p.x) / 2 - (B.p.y - A.p.y) * l.bend * 0.5 + snoise(l.seed, tm * 0.6) * 60;
      const my = (A.p.y + B.p.y) / 2 + (B.p.x - A.p.x) * l.bend * 0.5 + snoise(l.seed + 9, tm * 0.6) * 60;
      const col = HUES[l.seed % HUES.length];
      ctx.globalAlpha = 0.22 * glob * sat + 0.06;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(A.p.x, A.p.y);
      const steps = 24;
      for (let q = 1; q <= steps * grow; q++) {
        const e = q / steps;
        const u = 1 - e;
        ctx.lineTo(u * u * A.p.x + 2 * u * e * mx + e * e * B.p.x, u * u * A.p.y + 2 * u * e * my + e * e * B.p.y);
      }
      ctx.stroke();
      // packet travelling on the link
      if (grow >= 1) {
        const e = ((tm * 0.45 + hash01(44, l.seed)) % 1);
        const u = 1 - e;
        drawGlow(ctx, col, u * u * A.p.x + 2 * u * e * mx + e * e * B.p.x, u * u * A.p.y + 2 * u * e * my + e * e * B.p.y, 7, 0.8 * glob);
      }
    }

    // systems, each in its own bubble of data
    const order = systems.map((_, i) => i).sort((a, b) => systems[b].z - systems[a].z);
    for (const i of order) {
      const s = systems[i];
      const p = pos[i].p;
      if (!p) continue;
      const k = easeOutExpo(clamp01((tm - s.appear) / 0.8));
      if (k <= 0) continue;
      const f = fog(p.z, 800, 4800) * k * glob;
      const size = 110 * p.s;
      // private orbit
      for (let j = 0; j < 14; j++) {
        const a = hash01(s.ph * 100, j) * Math.PI * 2 + tm * (0.6 + hash01(5, j));
        const r = size * (0.95 + hash01(6, j) * 0.5);
        drawGlow(ctx, s.hue, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * 0.55, 3.2 * p.s + 1.5, 0.7 * f);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = f;
      ctx.fillStyle = rgba('#0B2A55', 0.75);
      ctx.strokeStyle = rgba(s.hue, 0.7);
      ctx.lineWidth = 1.6 * p.s;
      ctx.beginPath();
      ctx.roundRect(p.x - size / 2, p.y - size / 2, size, size, size * 0.22);
      ctx.fill();
      ctx.stroke();
      drawIcon(ctx, s.icon, p.x, p.y, size * 0.6, '#EAF4FF', f, 2.4);
      ctx.globalCompositeOperation = 'lighter';
    }

    // words floating inside the space
    ctx.globalCompositeOperation = 'source-over';
    TEXT.challenge.words.forEach((w, k) => {
      const t0 = WORDS_T[k];
      const life = t - t0;
      if (life < -0.1) return;
      const wpos = [
        {x: 520, y: -260, z: 900},
        {x: -560, y: 220, z: 1000},
        {x: 380, y: 330, z: 700},
        {x: -300, y: -330, z: 600},
      ][k];
      const p = project({x: wpos.x * 1.25 + cam.x, y: wpos.y * 1.1 + cam.y, z: cam.z + 560 + wpos.z * 0.45}, cam);
      if (!p) return;
      const inA = easeOutExpo(clamp01(life / 0.6));
      const outA = 1 - ramp(t, FREEZE + 0.1, FREEZE + 0.5);
      const a = inA * outA * (1 - dimEnd);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `800 ${Math.round(78 * p.s * lerp(1.3, 1, inA))}px ${FONTS.stack}`;
      ctx.direction = 'rtl';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = rgba(COLORS.turquoise, 0.6 * FX.glow);
      ctx.shadowBlur = 24;
      ctx.fillStyle = k === 3 ? '#FFFFFF' : '#D7E9FF';
      ctx.filter = `blur(${(1 - inA) * 8}px)`;
      ctx.fillText(w, p.x, p.y);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // the coming streams: faint green/blue light at the edges before the reveal
  const edges = ramp(t, 7.0, 8.0);

  return (
    <Stage>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 90% 80% at 50% 50%, #0B2550 0%, #061633 50%, ${COLORS.space} 100%)`,
        }}
      />
      <SceneCanvas draw={draw} style={{filter: `saturate(${1 - frozen * 0.6})`}} />
      {/* freeze: a cold, still veil */}
      <AbsoluteFill style={{background: rgba(COLORS.space, frozen * 0.55 + dimEnd * 0.35)}} />
      <Center y={540}>
        <WordReveal
          text={TEXT.challenge.question}
          t={t}
          at={QUESTION}
          stagger={0.13}
          inDur={0.8}
          size={112}
          weight={800}
          color="#FFFFFF"
          glow={rgba(COLORS.turquoise, 0.55)}
          variant="blur"
          out={7.75}
          outDur={0.25}
        />
      </Center>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 30% 60% at 0% 50%, ${rgba(COLORS.glowGreen, 0.35 * edges)} 0%, transparent 70%), radial-gradient(ellipse 30% 60% at 100% 50%, ${rgba(COLORS.turquoise, 0.35 * edges)} 0%, transparent 70%)`,
        }}
      />
      <Vignette />
      {/* dissolve in from the bright previous scene */}
      <AbsoluteFill style={{background: COLORS.pearl, opacity: 1 - ramp(t, 0, 0.45)}} />
    </Stage>
  );
};
