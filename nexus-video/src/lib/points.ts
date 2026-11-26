/** Point sampling of text and images – targets for particle typography. */
import {hash01} from './random';

export type Pt = {x: number; y: number; c?: string; a?: number};

const textCache = new Map<string, Pt[]>();

export const isRTL = (s: string) => /[֐-׿]/.test(s);

export type TextStyle = {
  size: number;
  weight?: number;
  family?: string;
  letterSpacing?: number;
};

export const fontString = (st: TextStyle) =>
  `${st.weight ?? 800} ${st.size}px ${st.family ?? "'Heebo', 'Inter', sans-serif"}`;

/** Points filling the glyphs of `text`, centred on (0,0). */
export const sampleText = (text: string, st: TextStyle, maxPoints: number): Pt[] => {
  const key = `${text}|${fontString(st)}|${st.letterSpacing ?? 0}|${maxPoints}`;
  const hit = textCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  const g = c.getContext('2d', {willReadFrequently: true})!;
  g.font = fontString(st);
  if (st.letterSpacing) (g as unknown as {letterSpacing: string}).letterSpacing = `${st.letterSpacing}px`;
  const w = Math.ceil(g.measureText(text).width + st.size);
  const h = Math.ceil(st.size * 1.6);
  c.width = w;
  c.height = h;
  g.font = fontString(st);
  if (st.letterSpacing) (g as unknown as {letterSpacing: string}).letterSpacing = `${st.letterSpacing}px`;
  g.direction = isRTL(text) ? 'rtl' : 'ltr';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';
  g.fillText(text, w / 2, h / 2);
  const data = g.getImageData(0, 0, w, h).data;
  let filled = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) filled++;
  const step = Math.max(2, Math.sqrt(filled / maxPoints));
  const pts: Pt[] = [];
  let k = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const jx = x + (hash01(7, k) - 0.5) * step * 0.6;
      const jy = y + (hash01(11, k) - 0.5) * step * 0.6;
      k++;
      const ix = Math.min(w - 1, Math.max(0, Math.round(jx)));
      const iy = Math.min(h - 1, Math.max(0, Math.round(jy)));
      if (data[(iy * w + ix) * 4 + 3] > 128) pts.push({x: jx - w / 2, y: jy - h / 2});
    }
  }
  textCache.set(key, pts);
  return pts;
};

const imgCache = new Map<string, Pt[]>();

/** Points (with colour) covering the opaque pixels of an image drawn at width `drawW`, centred. */
export const sampleImage = (img: HTMLImageElement, drawW: number, maxPoints: number): Pt[] => {
  const key = `${img.src}|${drawW}|${maxPoints}`;
  const hit = imgCache.get(key);
  if (hit) return hit;
  const w = Math.round(drawW);
  const h = Math.round((img.naturalHeight / img.naturalWidth) * drawW);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', {willReadFrequently: true})!;
  g.drawImage(img, 0, 0, w, h);
  const data = g.getImageData(0, 0, w, h).data;
  let filled = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) filled++;
  const step = Math.max(2, Math.sqrt(filled / maxPoints));
  const pts: Pt[] = [];
  let k = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const jx = x + (hash01(5, k) - 0.5) * step * 0.6;
      const jy = y + (hash01(9, k) - 0.5) * step * 0.6;
      k++;
      const ix = Math.min(w - 1, Math.max(0, Math.round(jx)));
      const iy = Math.min(h - 1, Math.max(0, Math.round(jy)));
      const o = (iy * w + ix) * 4;
      if (data[o + 3] > 128) {
        const hex = '#' + [data[o], data[o + 1], data[o + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
        pts.push({x: jx - w / 2, y: jy - h / 2, c: hex});
      }
    }
  }
  imgCache.set(key, pts);
  return pts;
};
