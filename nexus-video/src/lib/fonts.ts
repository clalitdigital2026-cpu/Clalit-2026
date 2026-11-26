import {loadFont} from '@remotion/fonts';
import {continueRender, delayRender, staticFile} from 'remotion';
import {useEffect, useState} from 'react';

const HEBREW_RANGE = 'U+0307-0308, U+0590-05FF, U+200C-2010, U+20AA, U+25CC, U+FB1D-FB4F';
const LATIN_RANGE =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

const WEIGHTS = [300, 400, 500, 700, 800, 900];

let loaded = false;

export const fontsLoaded: Promise<void> = Promise.all(
  WEIGHTS.flatMap((w) => [
    loadFont({family: 'Heebo', url: staticFile(`fonts/heebo-hebrew-${w}-normal.woff2`), weight: String(w), unicodeRange: HEBREW_RANGE}),
    loadFont({family: 'Heebo', url: staticFile(`fonts/heebo-latin-${w}-normal.woff2`), weight: String(w), unicodeRange: LATIN_RANGE}),
    loadFont({family: 'Inter', url: staticFile(`fonts/inter-latin-${w}-normal.woff2`), weight: String(w)}),
  ])
).then(() => {
  loaded = true;
});

/** True once all brand fonts are available for canvas text sampling. */
export const useFontsReady = () => {
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    if (ready) return;
    const h = delayRender('fonts');
    fontsLoaded.then(() => {
      setReady(true);
      continueRender(h);
    });
  }, [ready]);
  return ready;
};
