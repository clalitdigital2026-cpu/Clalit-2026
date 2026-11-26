/**
 * Scene 5 – How it works (00:33–00:49)
 * We dive into the heart of the NEXUS symbol and travel right-to-left through
 * the four layers of the architecture, riding the event flow:
 *   01 Source systems → Kafka (event streaming)
 *   02 Processing, unification & data quality
 *   03 Unified data layer – MongoDB
 *   04 Kafka → consuming systems: Google Cloud · Microsoft Azure · AWS · Clalit infrastructure
 * Kafka is drawn only as the event-streaming backbone; the refinement happens in layer 02.
 */
import React, {useMemo} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ASSETS, COLORS, CUES, FONTS, FX, TEXT} from '../config/config';
import {Vignette} from '../components/Finish';
import {Center, WordReveal} from '../components/Kinetic';
import {clamp01, easeInOutQuint, interp, lerp, mixHex, ramp, rgba} from '../lib/anim';
import {Camera, fog, project, Vec3} from '../lib/camera';
import {drawGlow, SceneCanvas, Stage} from '../lib/canvas';
import {drawIcon, IconName} from '../lib/icons';
import {hash01, snoise} from '../lib/random';
import {cueIn, useSceneTime} from '../lib/time';
import {Easing} from 'remotion';

const at = cueIn('architecture');
const L = CUES.layers.map(at); // [1.5, 5.2, 8.9, 12.6]
const WIDE = 15.0;

// world layout (x decreases right → left, the reading direction)
const X = {src: 1500, bus1a: 1180, bus1b: 760, g1: 640, g2: 500, g3: 360, mongo: -500, bus2a: -880, bus2b: -1250, dst: -1640};
const SOURCE_ICONS: IconName[] = ['hospital', 'clinic', 'lab', 'pill', 'scan', 'calendar', 'phone', 'server'];
const DEST_ICONS: IconName[] = ['cloud', 'cloud', 'cloud', 'server'];

const sources = TEXT.architecture.sources.map((label, k) => ({
  label,
  icon: SOURCE_ICONS[k],
  p: {x: X.src + Math.abs(k - 3.5) * 40, y: -300 + k * 92, z: (k % 2) * 140} as Vec3,
}));
const dests = TEXT.architecture.destinations.map((label, k) => ({
  label,
  icon: DEST_ICONS[k],
  p: {x: X.dst - Math.abs(k - 1.5) * 50, y: -215 + k * 165, z: (k % 2) * 120} as Vec3,
}));

const camKeys = {
  t: [0, 1.2, L[1] - 0.75, L[1] + 0.1, L[2] - 0.75, L[2] + 0.1, L[3] - 0.75, L[3] + 0.1, WIDE, WIDE + 0.9],
  x: [1250, 1180, 1150, 520, 470, -420, -470, -1330, -1380, -80],
  z: [-500, -1150, -1250, -1150, -1220, -1000, -1080, -1150, -1250, -2700],
  yaw: [0.2, 0.16, 0.12, 0.1, 0.06, 0.04, 0, -0.04, -0.08, 0],
};
const camAt = (t: number): Camera => ({
  x: interp(t, camKeys.t, camKeys.x, Easing.inOut(Easing.cubic)),
  y: -20 + Math.sin(t * 0.4) * 18,
  z: interp(t, camKeys.t, camKeys.z, Easing.inOut(Easing.cubic)),
  yaw: interp(t, camKeys.t, camKeys.yaw, Easing.inOut(Easing.cubic)),
  pitch: 0.06,
  focal: 1000,
});

type Path = {pts: Vec3[]; cum: number[]; len: number};
const mkPath = (pts: Vec3[]): Path => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
  }
  return {pts, cum, len: cum[cum.length - 1]};
};
const along = (p: Path, s: number): Vec3 => {
  const d = s * p.len;
  let i = 1;
  while (i < p.cum.length - 1 && p.cum[i] < d) i++;
  const a = p.pts[i - 1];
  const b = p.pts[i];
  const e = (d - p.cum[i - 1]) / Math.max(1e-6, p.cum[i] - p.cum[i - 1]);
  return {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e)};
};

const usePackets = () =>
  useMemo(() => {
    const n = Math.round(900 * FX.particleDensity);
    return Array.from({length: n}, (_, i) => {
      const s = sources[i % sources.length];
      const d = dests[Math.floor(hash01(70, i) * dests.length)];
      const lane = Math.floor(hash01(71, i) * 7) - 3;
      const pts: Vec3[] = [
        s.p,
        {x: X.bus1a + 120, y: lerp(s.p.y, lane * 18, 0.5), z: s.p.z * 0.5},
        {x: X.bus1a, y: lane * 18, z: 0},
        {x: X.bus1b, y: lane * 18, z: 0},
        {x: X.g1 + 40, y: lane * 30, z: 0},
        {x: X.g3 - 40, y: lane * 46, z: 0},
        {x: X.g3 - 240, y: lane * 46, z: 0},
        {x: X.mongo + 120, y: lane * 8, z: 0},
        {x: X.mongo, y: 0, z: 0},
        {x: X.mongo - 130, y: lane * 8, z: 0},
        {x: X.bus2a, y: lane * 18, z: 0},
        {x: X.bus2b, y: lane * 18, z: 0},
        {x: X.bus2b - 120, y: lerp(lane * 18, d.p.y, 0.5), z: d.p.z * 0.5},
        d.p,
      ];
      return {path: mkPath(pts), lane, off: hash01(72, i), speed: 0.055 + hash01(73, i) * 0.02, i};
    });
  }, []);

// Mongo: a slowly turning sphere of linked documents
const useDocSphere = () =>
  useMemo(() => {
    const n = 140;
    const pts: Vec3[] = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * 2.399963;
      pts.push({x: Math.cos(th) * r, y, z: Math.sin(th) * r});
    }
    const links: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const ds = pts
        .map((q, j) => ({j, d: (q.x - pts[i].x) ** 2 + (q.y - pts[i].y) ** 2 + (q.z - pts[i].z) ** 2}))
        .filter((o) => o.j > i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      for (const o of ds) links.push([i, o.j]);
    }
    return {pts, links};
  }, []);

const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, a: number, weight = 600, latin = false) => {
  if (a <= 0.01) return;
  ctx.globalAlpha = Math.min(1, a);
  ctx.fillStyle = color;
  ctx.font = `${weight} ${Math.round(size)}px ${latin ? FONTS.latinStack : FONTS.stack}`;
  ctx.direction = /[֐-׿]/.test(text) ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
};

export const S5Architecture: React.FC = () => {
  const t = useSceneTime();
  const packets = usePackets();
  const sphere = useDocSphere();
  const cam = camAt(t);
  const worldIn = ramp(t, 0.85, 1.45);
  const active = t < L[1] ? 0 : t < L[2] ? 1 : t < L[3] ? 2 : 3;
  const layerFocus = (k: number) => {
    // brightness of each layer (the one we're at is lit; in the wide shot all are)
    const wide = ramp(t, WIDE, WIDE + 0.6);
    const near = k === active ? 1 : 0.35;
    return lerp(near, 1, wide);
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const P = (v: Vec3) => project(v, cam);
    ctx.globalAlpha = 1;

    // floor grid
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = COLORS.ocean;
    ctx.lineWidth = 1;
    for (let gx = -2200; gx <= 2200; gx += 200) {
      const a = P({x: gx, y: 520, z: -200});
      const b = P({x: gx, y: 520, z: 2400});
      if (!a || !b) continue;
      ctx.globalAlpha = 0.08 * worldIn;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let gz = -200; gz <= 2400; gz += 200) {
      const a = P({x: -2200, y: 520, z: gz});
      const b = P({x: 2200, y: 520, z: gz});
      if (!a || !b) continue;
      ctx.globalAlpha = 0.08 * worldIn * fog(a.z, 600, 3600);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Kafka buses – the event-streaming backbone (two segments)
    const bus = (xa: number, xb: number, k: number) => {
      const f = layerFocus(k) * worldIn;
      for (let lane = -3; lane <= 3; lane++) {
        const a = P({x: xa, y: lane * 18, z: 0});
        const b = P({x: xb, y: lane * 18, z: 0});
        if (!a || !b) continue;
        ctx.globalAlpha = 0.35 * f;
        ctx.strokeStyle = lane % 2 ? COLORS.turquoise : COLORS.glowGreen;
        ctx.lineWidth = 1.6 * a.s;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      // tube shell
      const a = P({x: xa, y: -80, z: 0});
      const b = P({x: xb, y: 80, z: 0});
      if (a && b) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.5 * f;
        ctx.strokeStyle = rgba(COLORS.turquoise, 0.8);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(Math.min(a.x, b.x), a.y, Math.abs(b.x - a.x), b.y - a.y, (b.y - a.y) / 2);
        ctx.stroke();
        ctx.fillStyle = rgba(COLORS.ocean, 0.08);
        ctx.fill();
        const m = P({x: (xa + xb) / 2, y: -128, z: 0});
        if (m) {
          label(ctx, 'Kafka', m.x, m.y, 40 * m.s, '#FFFFFF', f, 800, true);
          label(ctx, 'Event Streaming', m.x, m.y + 38 * m.s, 20 * m.s, COLORS.turquoise, f * 0.9, 500, true);
        }
        ctx.globalCompositeOperation = 'lighter';
      }
    };
    bus(X.bus1a, X.bus1b, 0);
    bus(X.bus2a, X.bus2b, 3);

    // processing gates (layer 02)
    const gateNames = ['עיבוד', 'איחוד', 'טיוב'];
    [X.g1, X.g2, X.g3].forEach((gx, k) => {
      const f = layerFocus(1) * worldIn;
      const corners = [
        P({x: gx, y: -230, z: -160}),
        P({x: gx, y: -230, z: 260}),
        P({x: gx, y: 230, z: 260}),
        P({x: gx, y: 230, z: -160}),
      ];
      if (corners.some((c) => !c)) return;
      const c = corners as NonNullable<(typeof corners)[number]>[];
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.16 * f;
      ctx.fillStyle = k === 2 ? COLORS.skyBlue : k === 1 ? COLORS.turquoise : COLORS.emerald;
      ctx.beginPath();
      c.forEach((q, j) => (j ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.7 * f;
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // scanning line
      const sy = -230 + ((t * 0.6 + k * 0.33) % 1) * 460;
      const s1 = P({x: gx, y: sy, z: -160});
      const s2 = P({x: gx, y: sy, z: 260});
      if (s1 && s2) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.8 * f;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(s1.x, s1.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      }
      const lp = P({x: gx, y: -280, z: 50});
      if (lp) label(ctx, gateNames[k], lp.x, lp.y, 30 * lp.s, '#FFFFFF', f, 700);
      ctx.globalCompositeOperation = 'lighter';
    });

    // MongoDB unified data layer (layer 03)
    {
      const f = layerFocus(2) * worldIn;
      const R = 210;
      const rot = t * 0.35;
      const sp = sphere.pts.map((q) => {
        const x = q.x * Math.cos(rot) - q.z * Math.sin(rot);
        const z = q.x * Math.sin(rot) + q.z * Math.cos(rot);
        const y = q.y * Math.cos(0.3) - z * Math.sin(0.3);
        const z2 = q.y * Math.sin(0.3) + z * Math.cos(0.3);
        return P({x: X.mongo + x * R, y: y * R, z: z2 * R});
      });
      const core = P({x: X.mongo, y: 0, z: 0});
      if (core) {
        const fill = ramp(t, L[2] - 0.3, L[2] + 1.6);
        drawGlow(ctx, COLORS.teal, core.x, core.y, 420 * core.s, 0.55 * f * FX.glow);
        drawGlow(ctx, COLORS.glowGreen, core.x, core.y, 160 * core.s * (0.6 + 0.4 * fill), (0.4 + 0.5 * fill) * f, true);
      }
      ctx.lineWidth = 1;
      for (const [a, b] of sphere.links) {
        const pa = sp[a];
        const pb = sp[b];
        if (!pa || !pb) continue;
        ctx.globalAlpha = 0.28 * f;
        ctx.strokeStyle = COLORS.turquoise;
        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.stroke();
      }
      sp.forEach((p, i) => {
        if (!p) return;
        // documents light up as the store fills with unified data
        const lit = ramp(t, L[2] - 0.2 + hash01(80, i) * 1.8, L[2] + 0.2 + hash01(80, i) * 1.8);
        const col = i % 3 === 0 ? COLORS.glowGreen : i % 3 === 1 ? COLORS.turquoise : COLORS.skyBlue;
        drawGlow(ctx, col, p.x, p.y, (4 + 4 * lit) * p.s, (0.35 + 0.65 * lit) * f, lit > 0.9 && i % 5 === 0);
      });
      const lp = P({x: X.mongo, y: 290, z: 0});
      if (lp) {
        label(ctx, 'MongoDB', lp.x, lp.y, 44 * lp.s, '#FFFFFF', f, 800, true);
        label(ctx, 'Unified Data Layer', lp.x, lp.y + 40 * lp.s, 21 * lp.s, COLORS.mint, f * 0.9, 500, true);
      }
    }

    // nodes: sources (01) and destinations (04)
    const node = (n: {label: string; icon: IconName; p: Vec3}, k: number, accent: string, i: number) => {
      const p = P(n.p);
      if (!p) return;
      const f = layerFocus(k) * worldIn;
      const size = 96 * p.s;
      const pulse = Math.max(0, Math.sin(t * 3 + i * 1.3)) ** 8;
      drawGlow(ctx, accent, p.x, p.y, size * (1.2 + pulse * 0.4), (0.25 + pulse * 0.35) * f * FX.glow);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = f;
      ctx.fillStyle = rgba('#0A2A55', 0.85);
      ctx.strokeStyle = rgba(accent, 0.9);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(p.x - size / 2, p.y - size / 2, size, size, size * 0.24);
      ctx.fill();
      ctx.stroke();
      drawIcon(ctx, n.icon, p.x, p.y, size * 0.58, '#FFFFFF', f, 2.4);
      const isLatin = !/[֐-׿]/.test(n.label);
      const dir = k === 0 ? 1 : -1;
      ctx.textAlign = 'center';
      label(ctx, n.label, p.x + dir * (size * 0.55 + (isLatin ? 120 : 90) * p.s), p.y, 26 * p.s, '#E8F3FF', f, 600, isLatin);
      ctx.globalCompositeOperation = 'lighter';
    };
    sources.forEach((s, i) => node(s, 0, i % 2 ? COLORS.turquoise : COLORS.glowGreen, i));
    dests.forEach((d, i) => node(d, 3, i % 2 ? COLORS.skyBlue : COLORS.turquoise, i));

    // the events themselves
    for (const pk of packets) {
      const s = (pk.off + t * pk.speed) % 1;
      const w = along(pk.path, s);
      // before the gates: raw, noisy, mixed; after: aligned, consistent, structured
      const raw = clamp01((w.x - X.g3) / (X.g1 - X.g3));
      const jitter = raw * 26;
      const v = {x: w.x, y: w.y + snoise(pk.i, t * 2.5) * jitter, z: w.z + snoise(pk.i + 9, t * 2.5) * jitter};
      const p = P(v);
      if (!p) continue;
      const rawCols = [COLORS.glowGreen, '#9FE8FF', '#FFFFFF', COLORS.skyBlue, COLORS.mint];
      const unified = mixHex(COLORS.glowGreen, COLORS.turquoise, (pk.lane + 3) / 6);
      const col = raw > 0.5 ? rawCols[pk.i % rawCols.length] : unified;
      const zone = w.x > X.g1 ? 0 : w.x > X.mongo + 100 ? 1 : w.x > X.bus2a + 60 ? 2 : 3;
      const f = lerp(0.45, 1, layerFocus(zone)) * worldIn * fog(p.z, 400, 4200);
      const r = (raw > 0.5 ? 2.4 + hash01(74, pk.i) * 2.4 : 3) * p.s;
      if (w.x < X.g3 && w.x > X.mongo + 60) {
        // structured records: small squares
        ctx.globalAlpha = 0.95 * f;
        ctx.fillStyle = col;
        ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        drawGlow(ctx, col, p.x, p.y, r * 4, 0.35 * f);
      } else {
        drawGlow(ctx, col, p.x, p.y, r * 3.2, f, pk.i % 11 === 0);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // dive into the symbol (white → into the dark overlap)
  const dive = easeInOutQuint(clamp01(t / 1.25));
  const diveScale = Math.pow(24, dive);
  const diveOpacity = 1 - ramp(t, 0.9, 1.3);
  const whiteOut = ramp(t, 15.55, 16.0);

  return (
    <Stage>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 100% 90% at 50% 45%, #0A2A52 0%, #05173A 45%, ${COLORS.space} 100%)`}} />
      <SceneCanvas draw={draw} />
      <Vignette strength={0.5} />
      {/* headlines */}
      {TEXT.architecture.layers.map((layer, k) => {
        const tin = L[k] + 0.15;
        const tout = k < 3 ? L[k + 1] - 0.2 : WIDE - 0.1;
        if (t < tin - 0.1 || t > tout + 0.5) return null;
        const chip = clamp01((t - tin) / 0.4) * (1 - clamp01((t - tout) / 0.3));
        return (
          <React.Fragment key={k}>
            <Center y={118}>
              <div
                style={{
                  direction: 'rtl',
                  fontFamily: FONTS.stack,
                  fontSize: 28,
                  fontWeight: 500,
                  color: COLORS.mint,
                  letterSpacing: '0.04em',
                  opacity: chip,
                  transform: `translateY(${(1 - chip) * 12}px)`,
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{fontFamily: FONTS.latinStack, fontWeight: 800, color: '#fff'}}>{layer.index}</span>
                <span style={{width: 40, height: 2, background: COLORS.mint}} />
                <span>{layer.name}</span>
              </div>
            </Center>
            <Center y={200}>
              <WordReveal text={layer.headline} t={t} at={tin + 0.1} out={tout} outDur={0.3} size={k === 3 ? 74 : 92} weight={800} color="#FFFFFF" variant={k % 2 ? 'blur' : 'rise'} glow={rgba(COLORS.turquoise, 0.4)} />
            </Center>
            <Center y={990}>
              <div style={{direction: 'rtl', fontFamily: FONTS.stack, fontSize: 30, fontWeight: 400, color: rgba('#DDEBFA', 0.85), opacity: chip, whiteSpace: 'nowrap'}}>
                {layer.caption}
              </div>
            </Center>
          </React.Fragment>
        );
      })}
      <Progress t={t} active={active} />
      {/* the dive: the symbol fills the frame, we enter through its core */}
      {diveOpacity > 0 && (
        <AbsoluteFill style={{background: COLORS.pearl, opacity: diveOpacity}}>
          <Img
            src={staticFile(ASSETS.nexusSymbol)}
            style={{
              position: 'absolute',
              width: 520,
              left: 960 - 260,
              top: 540 - (520 * 400) / 610 / 2,
              transform: `scale(${diveScale})`,
              filter: `blur(${dive * 6}px)`,
              transformOrigin: '50.2% 50.5%',
            }}
          />
          <AbsoluteFill style={{background: `radial-gradient(circle, ${COLORS.core} 0%, #05173A 120%)`, opacity: ramp(t, 0.4, 0.85)}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: COLORS.pearl, opacity: whiteOut}} />
    </Stage>
  );
};

/** Four-step progress indicator (RTL: 01 on the right). */
const Progress: React.FC<{t: number; active: number}> = ({t, active}) => {
  const vis = ramp(t, L[0], L[0] + 0.5) * (1 - ramp(t, WIDE + 0.2, WIDE + 0.6));
  if (vis <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 960 - 330, top: 1035, width: 660, height: 6, display: 'flex', flexDirection: 'row-reverse', gap: 12, opacity: vis}}>
      {[0, 1, 2, 3].map((k) => {
        const fill = k < active ? 1 : k === active ? clamp01((t - L[k]) / ((k < 3 ? L[k + 1] : WIDE) - L[k])) : 0;
        return (
          <div key={k} style={{flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', direction: 'rtl'}}>
            <div style={{width: `${fill * 100}%`, height: '100%', background: `linear-gradient(270deg, ${COLORS.glowGreen}, ${COLORS.turquoise})`}} />
          </div>
        );
      })}
    </div>
  );
};

