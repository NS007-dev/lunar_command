import type { ReactNode } from 'react';
import { O } from './outline';

const P = {
  flask: <><path d="M15 5h10M17 5v11L7 33a3 3 0 0 0 3 5h20a3 3 0 0 0 3-5L23 16V5" fill="#4fd1a1" {...O} /><circle cx="17" cy="30" r="2" fill="#fff" /></>,
  moon: <path d="M26 5a15 15 0 1 0 9 26A12 12 0 0 1 26 5z" fill="#ffc93c" {...O} />,
  recycle: <><path d="M8 20a12 12 0 0 1 20-8M32 20a12 12 0 0 1-20 8" fill="none" {...O} /><path d="M27 5l2 8-8 1M13 35l-2-8 8-1" fill="#6ec3ff" {...O} /></>,
  sprout: <><path d="M20 36V18" fill="none" {...O} /><path d="M20 20c-10 0-12-8-12-12 8 0 12 4 12 12z" fill="#4fd1a1" {...O} /><path d="M20 24c8 0 12-6 12-10-8 0-12 4-12 10z" fill="#4fd1a1" {...O} /></>,
  shield: <><rect x="3" y="23" width="16" height="11" fill="#c9c3b0" {...O} /><rect x="21" y="23" width="16" height="11" fill="#c9c3b0" {...O} /><rect x="12" y="10" width="16" height="11" fill="#e0dac6" {...O} /></>,
  radio: <><path d="M6 30a17 17 0 0 1 26-15z" fill="#6ec3ff" {...O} /><path d="M18 24l8 12M30 8l4-4" fill="none" {...O} /></>,
  battery: <><rect x="3" y="11" width="30" height="18" rx="4" fill="#4fd1a1" {...O} /><path d="M36 17v6M12 15v10M18 15v10M24 15v10" {...O} /></>,
  sun: <><circle cx="20" cy="20" r="8" fill="#ffc93c" {...O} /><path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3 3M29 29l3 3M8 32l3-3M29 11l3-3" {...O} /></>,
  drop: <path d="M20 4C12 16 8 21 8 27a12 12 0 0 0 24 0C32 21 28 16 20 4z" fill="#6ec3ff" {...O} />,
  warn: <><path d="M20 4L37 35H3z" fill="#ffc93c" {...O} /><path d="M20 15v10M20 29v1" {...O} /></>,
  tick: <path d="M6 21l9 9 19-21" fill="none" {...O} />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof P;

/** Small cartoon icon. `size` (px) is optional; without it CSS decides the size. */
export function Icon({ name, size }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 40 40" className="i" style={size ? { width: size, height: size, flex: 'none' } : undefined} aria-hidden="true">
      {P[name]}
    </svg>
  );
}

/** A science star (filled when `on`). */
export function Star({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className || ''} aria-hidden="true">
      <path d="M20 3l5 12h13l-10 8 4 13-12-8-12 8 4-13L2 15h13z" fill={on ? '#ffc93c' : '#fff1cf'} {...O} opacity={on ? undefined : '.5'} />
    </svg>
  );
}
