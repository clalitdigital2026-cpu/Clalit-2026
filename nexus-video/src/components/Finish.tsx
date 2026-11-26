/** Cinematic finishing layer: vignette + deterministic film grain. */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {FX} from '../config/config';
import {hash01} from '../lib/random';
import {SceneCanvas} from '../lib/canvas';

let grainTile: HTMLCanvasElement[] | null = null;
const tiles = () => {
  if (grainTile) return grainTile;
  grainTile = Array.from({length: 8}, (_, k) => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d')!;
    const img = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) {
      const v = Math.floor(hash01(k + 1, i) * 255);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  });
  return grainTile;
};

export const Finish: React.FC<{vignette?: number; grain?: number}> = ({vignette = 0, grain = FX.grain}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {vignette > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,6,20,${vignette * 0.75}) 100%)`,
          }}
        />
      )}
      {grain > 0 && (
        <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: grain * 2.2}}>
          <SceneCanvas
            draw={(ctx) => {
              const t = tiles()[frame % 8];
              const ox = Math.floor(hash01(3, frame) * 256);
              const oy = Math.floor(hash01(4, frame) * 256);
              ctx.globalAlpha = 1;
              for (let x = -ox; x < 1920; x += 256) for (let y = -oy; y < 1080; y += 256) ctx.drawImage(t, x, y);
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/** Dark-scene vignette (light scenes stay clean). */
export const Vignette: React.FC<{strength?: number}> = ({strength = FX.vignette}) => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,4,14,${strength * 0.85}) 100%)`,
    }}
  />
);
