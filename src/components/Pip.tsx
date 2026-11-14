import type { CSSProperties, ReactNode } from 'react';
import type { Tone } from '../game/mentor';
import { O } from './outline';

export type PipMood = 'happy' | 'worried' | 'cheer';

/** Pip the robot. */
export function Pip({ mood }: { mood: PipMood }) {
  const mouth = {
    happy: <path d="M43 62q7 6 14 0" {...O} fill="none" />,
    worried: <path d="M43 66q7-6 14 0" {...O} fill="none" />,
    cheer: <path d="M42 60q8 12 16 0z" fill="#ff6a4d" {...O} />,
  }[mood];
  // Note: the original wrote stroke-width="6" after the outline's stroke-width, and HTML keeps the
  // first copy of a repeated attribute, so the arms were really drawn at 2.6. We keep that look.
  const arms = mood === 'cheer'
    ? <path d="M24 94L10 68M76 94L90 68" {...O} fill="none" />
    : <path d="M26 96L16 108M74 96L84 108" {...O} fill="none" />;
  const eye = mood === 'cheer' ? 5 : 4;
  return (
    <svg viewBox="0 0 100 130" role="img" aria-label={`Pip the robot looks ${mood}`}>
      {arms}
      <rect x="30" y="84" width="40" height="36" rx="10" fill="#ff6a4d" {...O} />
      <rect x="40" y="96" width="20" height="10" rx="3" fill="#ffc93c" {...O} />
      <path d="M50 16V5" {...O} />
      <circle cx="50" cy="5" r="4" fill={mood === 'worried' ? '#ffc93c' : '#4fd1a1'} {...O} />
      <rect x="16" y="16" width="68" height="66" rx="28" fill="#fff" {...O} />
      <rect x="25" y="29" width="50" height="40" rx="18" fill="#222c63" {...O} />
      <circle cx="40" cy="46" r={eye} fill="#6ec3ff" />
      <circle cx="60" cy="46" r={eye} fill="#6ec3ff" />
      {mouth}
    </svg>
  );
}

/**
 * Pip plus a speech bubble. `tone` tints the bubble for good news, warnings and failures
 * (the words always say it too, so colour is never the only clue).
 */
export function PipSays({ mood, children, className, style, live, tone }: {
  mood: PipMood; children: ReactNode; className?: string; style?: CSSProperties; live?: boolean; tone?: Tone;
}) {
  return (
    <div className={['talk', className].filter(Boolean).join(' ')} style={style}>
      <Pip mood={mood} />
      <div className={['say', tone].filter(Boolean).join(' ')} aria-live={live ? 'polite' : undefined}>{children}</div>
    </div>
  );
}
