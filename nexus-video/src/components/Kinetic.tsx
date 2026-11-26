/** DOM kinetic typography (RTL-safe: words are laid out by the browser's bidi engine). */
import React from 'react';
import {FONTS} from '../config/config';
import {clamp01, easeOutCubic, easeOutExpo, lerp} from '../lib/anim';
import {isRTL} from '../lib/points';

export type RevealStyle = 'rise' | 'blur' | 'track' | 'drop' | 'zoom';

export const WordReveal: React.FC<{
  text: string;
  t: number;
  at: number;
  out?: number;
  outDur?: number;
  inDur?: number;
  stagger?: number;
  size: number;
  weight?: number;
  color?: string;
  gradient?: string;
  variant?: RevealStyle;
  style?: React.CSSProperties;
  latin?: boolean;
  glow?: string;
  letterSpacing?: string;
  exit?: 'up' | 'blur' | 'scale' | 'fade';
}> = ({
  text,
  t,
  at,
  out,
  outDur = 0.35,
  inDur = 0.55,
  stagger = 0.08,
  size,
  weight = 800,
  color = '#fff',
  gradient,
  variant = 'rise',
  style,
  latin,
  glow,
  letterSpacing,
  exit = 'blur',
}) => {
  const rtl = isRTL(text);
  const words = text.split(' ');
  const outP = out === undefined ? 0 : clamp01((t - out) / outDur);
  if (t < at - 0.05 || outP >= 1) return null;
  return (
    <div
      style={{
        direction: rtl ? 'rtl' : 'ltr',
        fontFamily: latin ? FONTS.latinStack : FONTS.stack,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.08,
        color,
        letterSpacing: letterSpacing ?? (rtl ? '-0.01em' : '-0.02em'),
        whiteSpace: 'nowrap',
        textAlign: 'center',
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = easeOutExpo(clamp01((t - at - i * stagger) / inDur));
        const op = easeOutCubic(clamp01((t - at - i * stagger) / (inDur * 0.6)));
        let tf = '';
        let filter = '';
        let clip = false;
        switch (variant) {
          case 'rise':
            tf = `translateY(${(1 - p) * 105}%)`;
            clip = true;
            break;
          case 'drop':
            tf = `translateY(${(p - 1) * 105}%)`;
            clip = true;
            break;
          case 'blur':
            filter = `blur(${(1 - p) * 18}px)`;
            tf = `scale(${lerp(1.25, 1, p)})`;
            break;
          case 'track':
            tf = `translateX(${(1 - p) * (rtl ? -60 : 60)}px)`;
            filter = `blur(${(1 - p) * 10}px)`;
            break;
          case 'zoom':
            tf = `scale(${lerp(2.2, 1, p)})`;
            filter = `blur(${(1 - p) * 14}px)`;
            break;
        }
        const ep = easeOutCubic(outP);
        if (exit === 'up') tf += ` translateY(${-ep * 60}px)`;
        if (exit === 'scale') tf += ` scale(${lerp(1, 1.4, ep)})`;
        if (exit === 'blur') filter += ` blur(${ep * 16}px)`;
        const wordStyle: React.CSSProperties = {
          display: 'inline-block',
          transform: tf,
          filter: filter || undefined,
          opacity: (clip ? 1 : op) * (1 - ep),
          background: gradient,
          WebkitBackgroundClip: gradient ? 'text' : undefined,
          backgroundClip: gradient ? 'text' : undefined,
          color: gradient ? 'transparent' : undefined,
          textShadow: glow && !gradient ? `0 0 40px ${glow}` : undefined,
          paddingBottom: '0.08em',
        };
        return (
          <React.Fragment key={i}>
            {i > 0 ? ' ' : null}
            <span style={{display: 'inline-block', overflow: clip ? 'hidden' : 'visible', verticalAlign: 'top', paddingTop: clip ? '0.06em' : 0}}>
              <span style={wordStyle}>{w}</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Centered absolutely positioned wrapper. */
export const Center: React.FC<{x?: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  x = 960,
  y,
  children,
  style,
}) => (
  <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', ...style}}>{children}</div>
);
