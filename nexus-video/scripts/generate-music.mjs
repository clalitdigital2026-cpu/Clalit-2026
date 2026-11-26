/**
 * NEXUS – original score, synthesised from scratch (no samples, no third-party audio).
 * Every hit, pulse and silence is driven by the same cue sheet the visuals use
 * (src/config/cues.json), so music and picture stay locked together.
 *
 *   node scripts/generate-music.mjs  →  public/audio/nexus-score.wav (48 kHz, 16-bit, stereo)
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cues = JSON.parse(fs.readFileSync(path.join(root, 'src/config/cues.json'), 'utf8'));

const SR = 48000;
const TOTAL = cues.scenes.reduce((a, s) => a + s.seconds, 0);
const N = Math.ceil(TOTAL * SR);
const BEAT = 60 / cues.bpm;

// buses
const L = new Float32Array(N);
const R = new Float32Array(N);
const revL = new Float32Array(N); // reverb sends
const revR = new Float32Array(N);
const padL = new Float32Array(N); // sidechained bus
const padR = new Float32Array(N);

// ---------------------------------------------------------------- utilities
let seed = 1234567;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pan = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
const NOTE = {C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11};
const n = (name, oct) => NOTE[name] + 12 * (oct + 1);

const write = (bus, i, l, r) => {
  if (i < 0 || i >= N) return;
  bus[0][i] += l;
  bus[1][i] += r;
};
const MAIN = [L, R];
const REV = [revL, revR];
const PAD = [padL, padR];

/** Chamberlin state-variable filter factory. */
const svf = () => {
  let low = 0;
  let band = 0;
  return (x, cutoff, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * clamp(cutoff, 20, SR / 6)) / SR);
    low += f * band;
    const high = x - low - (1 / q) * band;
    band += f * high;
    return {low, band, high};
  };
};

/** Generic voice renderer. gen(tSec, i) → sample; env(tSec) → amp. */
const voice = (start, dur, gen, {gain = 1, p = 0, send = 0.2, bus = MAIN} = {}) => {
  const s0 = Math.floor(start * SR);
  const len = Math.floor(dur * SR);
  const [gl, gr] = pan(p);
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const v = gen(t, k) * gain;
    write(bus, s0 + k, v * gl, v * gr);
    if (send) write(REV, s0 + k, v * gl * send, v * gr * send);
  }
};

const adsr = (t, dur, a, d, s, r) => {
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur - r) return s;
  return Math.max(0, s * (1 - (t - (dur - r)) / r));
};

// ---------------------------------------------------------------- instruments
const kick = (t0, g = 1, {f0 = 140, f1 = 44, decay = 0.38, click = 0.4} = {}) => {
  let ph = 0;
  voice(t0, decay * 2.2, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t / 0.035);
    ph += (2 * Math.PI * f) / SR;
    const body = Math.sin(ph) * Math.exp(-t / decay);
    const c = (rnd() * 2 - 1) * Math.exp(-t / 0.004) * click;
    return Math.tanh((body + c) * 1.6) * 0.9;
  }, {gain: g, send: 0.04});
};

const heartbeat = (t0, g = 1) => {
  kick(t0, 0.9 * g, {f0: 90, f1: 40, decay: 0.22, click: 0.05});
  kick(t0 + 0.2, 0.6 * g, {f0: 80, f1: 38, decay: 0.2, click: 0.03});
};

const clap = (t0, g = 1, p = 0) => {
  const f = svf();
  voice(t0, 0.4, (t) => {
    const x = rnd() * 2 - 1;
    const env = (t < 0.03 ? (Math.floor(t / 0.01) % 2 ? 0.6 : 1) : 1) * Math.exp(-t / 0.11);
    const tone = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.05) * 0.4;
    return (f(x, 1600, 1.2).band * 2 + tone) * env * 0.7;
  }, {gain: g, p, send: 0.3});
};

const hat = (t0, g = 1, open = false, p = 0) => {
  const f = svf();
  voice(t0, open ? 0.35 : 0.08, (t) => f(rnd() * 2 - 1, 9000, 0.8).high * Math.exp(-t / (open ? 0.12 : 0.025)) * 0.5, {gain: g, p, send: 0.08});
};

const saw = (ph) => 2 * (ph - Math.floor(ph + 0.5));

const bass = (t0, dur, midi, g = 1, cutoff = 600) => {
  const f = svf();
  const fr = mtof(midi);
  let p1 = 0;
  let p2 = 0;
  voice(t0, dur, (t) => {
    p1 += fr / SR;
    p2 += (fr * 1.005) / SR;
    const x = saw(p1) * 0.6 + saw(p2) * 0.4 + Math.sin(2 * Math.PI * p1) * 0.8;
    const c = cutoff * (0.5 + 1.5 * Math.exp(-t / 0.08));
    return f(x, c, 1.1).low * adsr(t, dur, 0.004, 0.1, 0.7, 0.04) * 0.55;
  }, {gain: g, send: 0.02});
};

/** Supersaw pad chord into the sidechained bus. */
const pad = (t0, dur, notes, g = 1, {cut = 1400, attack = 0.8, release = 1.2, bright = 0} = {}) => {
  notes.forEach((m, ni) => {
    const f = svf();
    const fr = mtof(m);
    const phs = Array.from({length: 5}, () => rnd());
    const det = [-0.012, -0.005, 0, 0.006, 0.013];
    const p = ((ni % 2) * 2 - 1) * 0.4;
    voice(t0, dur + release, (t) => {
      let x = 0;
      for (let k = 0; k < 5; k++) {
        phs[k] += (fr * (1 + det[k])) / SR;
        x += saw(phs[k]);
      }
      x /= 5;
      const lfo = 1 + 0.25 * Math.sin(2 * Math.PI * 0.18 * (t0 + t));
      const c = cut * lfo * (1 + bright * Math.min(1, t / dur));
      const env = t < attack ? t / attack : t < dur ? 1 : Math.max(0, 1 - (t - dur) / release);
      return f(x, c, 0.8).low * env * 0.22;
    }, {gain: g / Math.sqrt(notes.length), p, send: 0.55, bus: PAD});
  });
};

const pluck = (t0, midi, g = 1, p = 0, decay = 0.18, cut = 3500) => {
  const f = svf();
  const fr = mtof(midi);
  let ph = 0;
  voice(t0, decay * 4, (t) => {
    ph += fr / SR;
    const x = saw(ph) * 0.7 + (ph % 1 < 0.5 ? 0.3 : -0.3);
    return f(x, 200 + cut * Math.exp(-t / (decay * 0.6)), 1.4).low * Math.exp(-t / decay) * 0.45;
  }, {gain: g, p, send: 0.35});
};

/** FM bell – events, pings, the signature. */
const bell = (t0, midi, g = 1, p = 0, decay = 1.2, ratio = 3.5, index = 2.2) => {
  const fr = mtof(midi);
  voice(t0, decay * 3, (t) => {
    const mod = Math.sin(2 * Math.PI * fr * ratio * t) * index * Math.exp(-t / (decay * 0.4));
    return Math.sin(2 * Math.PI * fr * t + mod) * Math.exp(-t / decay) * Math.min(1, t / 0.002) * 0.4;
  }, {gain: g, p, send: 0.5});
};

const sparkle = (t0, g = 1) => {
  const m = 84 + Math.floor(rnd() * 5) * [2, 3, 2, 5, 3][Math.floor(rnd() * 5)];
  bell(t0, m, 0.25 * g, rnd() * 1.6 - 0.8, 0.25, 2, 0.8);
};

/** Filtered-noise whoosh; `dir` +1 rising, -1 falling; pans from p0 to p1. */
const whoosh = (t0, dur, g = 1, {dir = 1, p0 = -0.6, p1 = 0.6, f0 = 300, f1 = 6000} = {}) => {
  const f = svf();
  const s0 = Math.floor(t0 * SR);
  const len = Math.floor(dur * SR);
  for (let k = 0; k < len; k++) {
    const u = k / len;
    const e = dir > 0 ? u : 1 - u;
    const c = f0 * Math.pow(f1 / f0, e);
    const env = Math.sin(Math.PI * Math.pow(u, dir > 0 ? 1.6 : 0.6));
    const v = f(rnd() * 2 - 1, c, 2.2).band * env * 0.5 * g;
    const [gl, gr] = pan(p0 + (p1 - p0) * u);
    write(MAIN, s0 + k, v * gl, v * gr);
    write(REV, s0 + k, v * gl * 0.4, v * gr * 0.4);
  }
};

/** Riser: noise + upward sine sweep, ends exactly at t1. */
const riser = (t0, t1, g = 1) => {
  const f = svf();
  let ph = 0;
  const dur = t1 - t0;
  voice(t0, dur, (t) => {
    const u = t / dur;
    ph += (120 * Math.pow(16, u)) / SR;
    const nz = f(rnd() * 2 - 1, 400 * Math.pow(20, u), 3).band;
    return (nz * 0.5 + Math.sin(2 * Math.PI * ph) * 0.15) * Math.pow(u, 2.2);
  }, {gain: g, send: 0.4});
};

/** Big cinematic impact. */
const impact = (t0, g = 1, {sub = 34, tail = 2.2} = {}) => {
  kick(t0, 1.0 * g, {f0: 160, f1: sub, decay: 0.9, click: 0.6});
  const f = svf();
  voice(t0, tail, (t) => f(rnd() * 2 - 1, 2500 * Math.exp(-t / 0.4) + 200, 0.9).low * Math.exp(-t / 0.5) * 0.7, {gain: g, send: 0.9});
  // tonal body
  [n('D', 2), n('A', 2), n('D', 3)].forEach((m, i) => {
    voice(t0, tail, (t) => Math.sin(2 * Math.PI * mtof(m) * t) * Math.exp(-t / (0.8 + i * 0.3)) * 0.25, {gain: g, send: 0.6, p: (i - 1) * 0.4});
  });
};

/** Reverse-swell into a downbeat (sucking sound before a hit). */
const reverseSwell = (t1, dur, g = 1) => {
  const f = svf();
  voice(t1 - dur, dur, (t) => {
    const u = t / dur;
    return f(rnd() * 2 - 1, 800 + 6000 * u, 0.7).low * Math.pow(u, 3) * 0.6;
  }, {gain: g, send: 0.5});
};

// ---------------------------------------------------------------- harmony
const PROG = [
  {root: n('D', 1), chord: [n('D', 3), n('F', 3), n('A', 3), n('D', 4)]},
  {root: n('Bb', 0), chord: [n('Bb', 2), n('D', 3), n('F', 3), n('Bb', 3)]},
  {root: n('F', 1), chord: [n('F', 3), n('A', 3), n('C', 4), n('F', 4)]},
  {root: n('C', 1), chord: [n('C', 3), n('E', 3), n('G', 3), n('C', 4)]},
];
const chordAt = (t) => PROG[Math.floor(t / 2) % 4];
const ARP = [0, 2, 1, 3, 2, 1, 3, 2];

// helpers for grooves
const groove = (a, b, {kickG = 0.8, clapG = 0.5, hatG = 0.35, bassG = 0.8, arpG = 0.3, halfTime = false, sixteenth = true, cutoff = 700} = {}) => {
  for (let t = Math.ceil(a / (BEAT / 4) - 1e-6) * (BEAT / 4); t < b - 1e-6; t += BEAT / 4) {
    const step = Math.round(t / (BEAT / 4)) % 16;
    const c = chordAt(t);
    if (kickG && (halfTime ? step === 0 || step === 10 : step % 4 === 0)) kick(t, kickG);
    if (clapG && (halfTime ? step === 8 : step === 4 || step === 12)) clap(t, clapG, 0.05);
    if (hatG && (sixteenth || step % 2 === 0)) hat(t, hatG * (step % 4 === 2 ? 1 : 0.55), step % 8 === 6, step % 2 ? 0.3 : -0.3);
    if (bassG && step % 2 === 0) bass(t, BEAT / 2 - 0.02, c.root + (step % 8 === 6 ? 12 : 0), bassG, cutoff);
    if (arpG) pluck(t, c.chord[ARP[step % 8] % 4] + 12, arpG, Math.sin(t * 2) * 0.6, 0.14, 2600);
  }
};
const pads = (a, b, g = 1, opts = {}) => {
  for (let t = Math.floor(a / 2) * 2; t < b; t += 2) {
    const s = Math.max(a, t);
    const e = Math.min(b, t + 2);
    if (e - s > 0.1) pad(s, e - s, chordAt(t).chord, g, {attack: s === a ? 1.2 : 0.05, release: e === b ? 1.5 : 0.08, ...opts});
  }
};

// =================================================================== SCORE
const C = cues;

// 1 · Pulse (0–8): a heartbeat in the void
C.heartbeats.forEach((h, i) => heartbeat(h, 0.35 + i * 0.035));
pad(0.8, 7.2, [n('D', 2), n('A', 2), n('D', 3)], 0.5, {cut: 500, attack: 4, release: 0.5, bright: 1.5});
for (let i = 0; i < 70; i++) {
  const t = 1.2 + Math.pow(rnd(), 0.6) * 6.6;
  sparkle(t, 0.4 + (t / 8) * 0.8);
}
C.pulseTexts.forEach((t) => bell(t, n('A', 5), 0.25, 0, 1.5, 2, 1));
riser(5.2, 8.0, 0.55);
whoosh(7.1, 1.0, 0.8, {f0: 500, f1: 9000, p0: 0, p1: 0});

// 2 · Events (8–17): every moment pulses
bell(8.0, n('D', 6), 0.35, 0, 2, 2, 1.5); // into the light
groove(8, 17, {kickG: 0.55, clapG: 0.25, hatG: 0.22, bassG: 0.6, arpG: 0.18, sixteenth: false, cutoff: 500});
pads(8, 17, 0.55, {cut: 1100});
C.moments.forEach((t, i) => {
  bell(t, [n('D', 5), n('F', 5), n('A', 5), n('C', 6), n('D', 6), n('F', 6)][i], 0.38, i % 2 ? 0.5 : -0.5, 0.8, 3, 1.5);
  whoosh(t + 0.05, 0.6, 0.25, {f0: 1500, f1: 7000, p0: i % 2 ? 0.5 : -0.5, p1: 0});
});
impact(C.eventsHeadline, 0.45, {tail: 1.4});
reverseSwell(C.eventMorph, 0.6, 0.6);
for (let k = 0; k < 6; k++) bell(C.eventMorph + k * 0.06, n('A', 5) + k * 2, 0.15, (k % 2) * 1.2 - 0.6, 0.2, 5, 3); // digital stutter
kick(C.eventMorph, 0.7);
pad(C.eventsClosing, 2, [n('F', 3), n('A', 3), n('C', 4), n('E', 4)], 0.5, {cut: 2200});

// 3 · Challenge (17–25): rising complexity, then silence
groove(17, C.freeze, {kickG: 0.6, clapG: 0.35, hatG: 0.3, bassG: 0.0, arpG: 0, halfTime: true});
for (let t = 17; t < C.freeze; t += BEAT / 2) bass(t, BEAT / 2 - 0.02, n('D', 1), 0.7, 400 + (t - 17) * 120);
pad(17, C.freeze - 17, [n('D', 3), n('Eb', 3), n('A', 3), n('C', 4)], 0.55, {cut: 700, attack: 1.5, release: 0.05, bright: 2});
{
  // ever-denser, slightly detuned arps – the tangle
  let t = 17.25;
  while (t < C.freeze) {
    const dens = 0.25 - ((t - 17) / (C.freeze - 17)) * 0.18;
    pluck(t, [n('D', 5), n('Eb', 5), n('A', 5), n('C', 6), n('G', 5)][Math.floor(rnd() * 5)], 0.18, rnd() * 1.6 - 0.8, 0.1, 2000);
    t += dens;
  }
}
C.challengeWords.forEach((t) => clap(t, 0.35, 0));
// freeze: everything stops; one thin tone hangs in the air
voice(C.freeze + 0.15, 2.2, (t) => Math.sin(2 * Math.PI * mtof(n('A', 6)) * t) * Math.min(1, t / 0.4) * Math.max(0, 1 - t / 2.2) * 0.07, {send: 0.8});
riser(C.riserStart, C.streamsMeet, 0.9);
for (let i = 0; i < 24; i++) {
  // accelerating snare roll into the meeting
  const u = i / 24;
  clap(25.0 + (1 - Math.pow(1 - u, 1.8)) * 2.0 - 0.02, 0.12 + u * 0.35, 0);
}
whoosh(25.0, 2.0, 0.6, {f0: 200, f1: 5000, p0: -0.95, p1: 0});
whoosh(25.1, 1.9, 0.6, {f0: 220, f1: 5200, p0: 0.95, p1: 0});

// 4 · Reveal (25–33): the meeting
impact(C.streamsMeet, 1.25, {sub: 32, tail: 3.2});
pad(C.streamsMeet, 2, [n('Bb', 2), n('D', 3), n('F', 3), n('Bb', 3), n('D', 4)], 0.95, {cut: 2600, attack: 0.02});
pad(C.streamsMeet + 2, 2, [n('F', 2), n('C', 3), n('F', 3), n('A', 3), n('C', 4)], 0.9, {cut: 2600, attack: 0.05});
pad(C.streamsMeet + 4, 2, [n('C', 3), n('G', 3), n('C', 4), n('E', 4)], 0.9, {cut: 2800, attack: 0.05, release: 0.6});
for (let t = C.streamsMeet; t < 33; t += BEAT) bass(t, BEAT * 0.9, chordAt(t + 1).root, 0.5, 300);
for (let t = C.streamsMeet + 0.5; t < 33; t += BEAT / 4) pluck(t, chordAt(t + 1).chord[ARP[Math.round(t * 8) % 8] % 4] + 24, 0.1, Math.sin(t * 3) * 0.7, 0.2, 4000);
bell(C.wordmark, n('D', 6), 0.4, 0, 2.5, 2, 1.2);
bell(C.revealSubtitle, n('A', 5), 0.25, -0.3, 1.5, 2, 1);
bell(C.revealEra, n('F', 6), 0.3, 0.3, 2, 2, 1);
riser(31.6, 33.0, 0.4);

// 5 · Architecture (33–49): the journey
whoosh(33.0, 1.5, 0.9, {dir: -1, f0: 150, f1: 8000, p0: 0, p1: 0});
kick(C.diveEnd, 0.9);
groove(C.diveEnd, 49, {kickG: 0.85, clapG: 0.5, hatG: 0.35, bassG: 0.85, arpG: 0.22, cutoff: 800});
pads(C.diveEnd, 49, 0.5, {cut: 1500});
C.layers.forEach((t, i) => {
  if (i > 0) whoosh(t - 0.8, 0.9, 0.55, {f0: 400, f1: 7000, p0: 0.8, p1: -0.8});
  bell(t + 0.15, [n('D', 6), n('F', 6), n('A', 6), n('C', 7)][i], 0.28, 0, 1.2, 2, 1);
});
riser(47.6, 49.0, 0.45);

// 6 · Event-driven (49–62)
kick(49, 0.8);
groove(49, C.split, {kickG: 0.5, clapG: 0, hatG: 0.25, bassG: 0.5, arpG: 0, sixteenth: false, cutoff: 450});
pads(49, 56, 0.4, {cut: 900});
bell(C.labEvent, n('A', 5), 0.6, 0, 1.5, 3.5, 2.5);
bell(C.labEvent + 0.12, n('E', 6), 0.4, 0.2, 1.2, 3.5, 2.5);
whoosh(C.pulseToHub - 0.1, 1.1, 0.6, {f0: 600, f1: 5000, p0: 0, p1: 0});
impact(C.split, 0.55, {tail: 1.5});
groove(C.split, 55.5, {kickG: 0.6, clapG: 0.3, hatG: 0.3, bassG: 0.6, arpG: 0.15, cutoff: 600});
C.targets.forEach((t, i) => pluck(t, [n('D', 5), n('F', 5), n('A', 5), n('C', 6), n('D', 6)][i], 0.5, [0.7, 0.8, 0, -0.8, -0.7][i], 0.4, 4500));
C.edBeats.forEach((t, i) => {
  kick(t, 1.0);
  clap(t, 0.6);
  bass(t, 0.45, [n('D', 1), n('Bb', 0), n('C', 1)][i], 1.0, 900);
  pad(t, 0.5, [PROG[0], PROG[1], PROG[3]][i].chord, 0.7, {cut: 3000, attack: 0.005, release: 0.4});
});
reverseSwell(C.eventDrivenTitle, 1.2, 0.8);
impact(C.eventDrivenTitle, 1.0, {tail: 2.5});
groove(C.eventDrivenTitle, 62, {kickG: 0.8, clapG: 0.45, hatG: 0.35, bassG: 0.8, arpG: 0.2, cutoff: 900});
pads(C.eventDrivenTitle, 62, 0.55, {cut: 2000});

// 7 · Benefits (62–75): high gear
groove(62, C.keywords[0], {kickG: 0.95, clapG: 0.55, hatG: 0.4, bassG: 0.9, arpG: 0.26, cutoff: 1100});
pads(62, C.keywords[0], 0.55, {cut: 2200});
C.benefits.forEach((t, i) => {
  whoosh(t - 0.25, 0.32, 0.5, {f0: 1200, f1: 9000, p0: 0.9, p1: -0.9});
  bell(t, [n('D', 6), n('F', 6), n('A', 6), n('C', 7), n('D', 7), n('F', 6), n('A', 6)][i], 0.22, 0, 0.8, 2, 1);
  kick(t, 0.35);
});
C.keywords.forEach((t, i) => {
  kick(t, 1.0, {f0: 170, f1: 42, decay: 0.5, click: 0.7});
  clap(t, 0.7);
  bass(t, 0.45, [n('D', 1), n('F', 1), n('G', 1), n('A', 1)][i], 1.0, 1200);
  pad(t, 0.45, [n('D', 3) + [0, 3, 5, 7][i], n('A', 3) + [0, 3, 5, 7][i], n('D', 4) + [0, 3, 5, 7][i]], 0.8, {cut: 4000, attack: 0.003, release: 0.25});
});

// 8 · Game changer (75–84): anthem
impact(75.0, 0.8, {tail: 2.5});
const ANTHEM = [
  {t: 75, chord: [n('Bb', 2), n('F', 3), n('Bb', 3), n('D', 4)], root: n('Bb', 0)},
  {t: 77, chord: [n('F', 2), n('C', 3), n('F', 3), n('A', 3)], root: n('F', 1)},
  {t: 79, chord: [n('C', 3), n('G', 3), n('C', 4), n('E', 4)], root: n('C', 1)},
  {t: 81, chord: [n('D', 3), n('A', 3), n('D', 4), n('F', 4)], root: n('D', 1)},
];
ANTHEM.forEach((c, i) => {
  const dur = i === 3 ? C.bigPulse - c.t : 2;
  pad(c.t, dur, c.chord, 0.85, {cut: 2400, attack: 0.08, release: 0.1});
  for (let t = c.t; t < c.t + dur - 0.01; t += BEAT) bass(t, BEAT * 0.95, c.root, 0.7, 500);
});
for (let t = 75; t < C.statement; t += BEAT) {
  const step = Math.round((t - 75) / BEAT) % 4;
  if (step === 0 || step === 3) kick(t, 0.75);
  if (step === 2) clap(t, 0.5);
  hat(t + BEAT / 2, 0.25);
}
C.pairs.forEach((t) => bell(t + 0.4, n('A', 5), 0.3, 0, 1.5, 2, 1));
riser(C.statement, C.bigPulse, 0.9);
for (let i = 0; i < 16; i++) clap(C.statement + 0.9 + (1 - Math.pow(1 - i / 16, 1.6)) * 0.95, 0.1 + (i / 16) * 0.4);
impact(C.bigPulse, 1.3, {sub: 30, tail: 3});
pad(C.bigPulse, C.converge - C.bigPulse, [n('F', 2), n('C', 3), n('F', 3), n('A', 3), n('C', 4), n('F', 4)], 1.0, {cut: 3200, attack: 0.02, release: 0.4});
for (let t = C.bigPulse; t < C.converge; t += BEAT / 2) {
  bass(t, BEAT / 2 - 0.02, n('F', 1), 0.65, 700);
  if (Math.round((t - C.bigPulse) / (BEAT / 2)) % 2 === 0) kick(t, 0.7);
}

// 9 · Signature (84–90)
whoosh(C.converge, C.finalMeet - C.converge, 0.8, {f0: 200, f1: 6000, p0: -0.9, p1: 0});
whoosh(C.converge + 0.05, C.finalMeet - C.converge - 0.05, 0.8, {f0: 220, f1: 6200, p0: 0.9, p1: 0});
reverseSwell(C.finalMeet, 1.0, 0.7);
// the signature: two tones – green and blue – meet and become one chord
bell(C.finalMeet, n('D', 5), 0.75, -0.5, 3.0, 2, 1.6);
bell(C.finalMeet + 0.14, n('A', 5), 0.7, 0.5, 3.0, 2, 1.6);
bell(C.finalMeet + 0.3, n('Gb', 6), 0.55, 0, 3.5, 3, 1.2);
kick(C.finalMeet, 0.9, {f0: 120, f1: 30, decay: 1.2, click: 0.2});
pad(C.finalMeet, TOTAL - C.finalMeet - 1.8, [n('D', 2), n('A', 2), n('D', 3), n('Gb', 3), n('A', 3), n('E', 4)], 0.8, {cut: 2600, attack: 0.3, release: 1.6});
bell(C.slogan, n('A', 6), 0.18, 0.3, 2, 2, 0.8);
bell(C.clalitLogo, n('D', 6), 0.2, -0.3, 2.5, 2, 0.8);

// =================================================================== MIX
// sidechain: the pad bus ducks under every kick-like transient of the main bus
{
  let env = 0;
  const att = Math.exp(-1 / (0.002 * SR));
  const rel = Math.exp(-1 / (0.18 * SR));
  const lp = svf();
  for (let i = 0; i < N; i++) {
    const low = Math.abs(lp((L[i] + R[i]) * 0.5, 120, 0.7).low);
    env = low > env ? att * env + (1 - att) * low : rel * env + (1 - rel) * low;
    const duck = 1 / (1 + env * 5);
    L[i] += padL[i] * duck;
    R[i] += padR[i] * duck;
    revL[i] += padL[i] * duck * 0.3;
    revR[i] += padR[i] * duck * 0.3;
  }
}

// reverb (Freeverb-style)
const reverb = (input, out, offset) => {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map((d) => ({buf: new Float32Array(Math.round((d + offset) * (SR / 44100))), i: 0, store: 0}));
  const aps = [556, 441, 341, 225].map((d) => ({buf: new Float32Array(Math.round((d + offset) * (SR / 44100))), i: 0}));
  const fb = 0.86;
  const damp = 0.3;
  const pre = Math.round(0.02 * SR);
  for (let s = 0; s < N; s++) {
    const x = (s >= pre ? input[s - pre] : 0) * 0.015;
    let y = 0;
    for (const c of combs) {
      const o = c.buf[c.i];
      c.store = o * (1 - damp) + c.store * damp;
      c.buf[c.i] = x + c.store * fb;
      c.i = (c.i + 1) % c.buf.length;
      y += o;
    }
    for (const a of aps) {
      const o = a.buf[a.i];
      a.buf[a.i] = y + o * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      y = o - y;
    }
    out[s] += y;
  }
};
reverb(revL, L, 0);
reverb(revR, R, 23);

// gentle master: high-pass rumble, soft clip, normalise, fade out
{
  const hpL = svf();
  const hpR = svf();
  let peak = 0;
  for (let i = 0; i < N; i++) {
    L[i] = hpL(L[i], 28, 0.7).high;
    R[i] = hpR(R[i], 28, 0.7).high;
    L[i] = Math.tanh(L[i] * 0.9);
    R[i] = Math.tanh(R[i] * 0.9);
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const g = 0.85 / peak;
  const fadeStart = (TOTAL - 1.2) * SR;
  for (let i = 0; i < N; i++) {
    const f = i > fadeStart ? Math.max(0, 1 - (i - fadeStart) / (1.2 * SR)) : 1;
    L[i] *= g * f;
    R[i] *= g * f;
  }
}

// write WAV
const out = Buffer.alloc(44 + N * 4);
out.write('RIFF', 0);
out.writeUInt32LE(36 + N * 4, 4);
out.write('WAVE', 8);
out.write('fmt ', 12);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32);
out.writeUInt16LE(16, 34);
out.write('data', 36);
out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  out.writeInt16LE(Math.round(clamp(L[i], -1, 1) * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(clamp(R[i], -1, 1) * 32767), 46 + i * 4);
}
const dest = path.join(root, 'public/audio/nexus-score.wav');
fs.mkdirSync(path.dirname(dest), {recursive: true});
fs.writeFileSync(dest, out);
console.log(`wrote ${dest} (${TOTAL}s)`);
