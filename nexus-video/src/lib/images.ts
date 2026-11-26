import {continueRender, delayRender, staticFile} from 'remotion';
import {useEffect, useState} from 'react';

const cache = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<HTMLImageElement>>();

const load = (path: string) => {
  if (!pending.has(path)) {
    pending.set(
      path,
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          cache.set(path, img);
          resolve(img);
        };
        img.onerror = reject;
        img.src = staticFile(path);
      })
    );
  }
  return pending.get(path)!;
};

/** Loads an image from /public for canvas use (blocks rendering until ready). */
export const useCanvasImage = (path: string) => {
  const [img, setImg] = useState<HTMLImageElement | null>(cache.get(path) ?? null);
  useEffect(() => {
    if (img) return;
    const h = delayRender(`image ${path}`);
    load(path).then((i) => {
      setImg(i);
      continueRender(h);
    });
  }, [img, path]);
  return img;
};
