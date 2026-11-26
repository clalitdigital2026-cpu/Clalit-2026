import {Easing, interpolate} from 'remotion';

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t: number) => Math.pow(clamp01(t), 3);
export const easeInOutCubic = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const easeInExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * clamp01(t) - 10));
export const easeInOutQuint = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2;
};
export const easeOutBack = (t: number, s = 1.70158) => {
  t = clamp01(t) - 1;
  return t * t * ((s + 1) * t + s) + 1;
};

/** 0→1 between a and b (seconds), clamped, eased. */
export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = easeInOutCubic) =>
  ease(clamp01((t - a) / (b - a)));

/** In/out window: rises over [a, a+inDur], falls over [b-outDur, b]. */
export const window01 = (
  t: number,
  a: number,
  b: number,
  inDur = 0.3,
  outDur = 0.3,
  ease: (x: number) => number = easeInOutCubic
) => ramp(t, a, a + inDur, ease) * (1 - ramp(t, b - outDur, b, ease));

/** Remotion-style interpolate with clamping by default. */
export const interp = (t: number, input: number[], output: number[], easing = Easing.linear) =>
  interpolate(t, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Damped spring response (deterministic, frame-based). */
export const springAt = (t: number, {stiffness = 120, damping = 14, mass = 1} = {}) => {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
  }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
};

/** Short decaying flash at time `at`. */
export const flash = (t: number, at: number, decay = 0.35) => (t < at ? 0 : Math.exp(-(t - at) / decay));

/** Hex → rgba string. */
export const rgba = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

export const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(lerp(v, pb[i], clamp01(t))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};
