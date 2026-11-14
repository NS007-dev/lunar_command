import type { ReactNode } from 'react';
import { K, SC, inStorm, sunAt } from '../game/scenarios';
import type { GameState } from '../game/types';

const INK = '#14193a';

/** The 60 background stars. Same fixed random seed as the original, so they are always in the same place. */
const STARS: ReactNode[] = (() => {
  let r = 11;
  const rn = () => (r = (r * 1103515245 + 12345) % 2147483648) / 2147483648;
  const out: ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const x = (rn() * 1600) | 0, y = (rn() * 420) | 0, b = rn();
    out.push(b > .85
      ? <path key={i} d={`M${x} ${y - 8}l2.5 5.5 5.5 2.5-5.5 2.5L${x} ${y + 8}l-2.5-5.5-5.5-2.5 5.5-2.5z`} fill="#fff1cf" style={{ animation: `tw ${2 + b * 2}s ease-in-out infinite alternate` }} />
      : <circle key={i} cx={x} cy={y} r={1 + b * 1.6} fill="#fff1cf" opacity=".8" />);
  }
  return out;
})();

/** Three solar panels on the right. */
const PANELS = [0, 1, 2].map(i => (
  <g key={i} transform={`translate(${1230 + i * 130} 0)`}>
    <path d="M0 548V620" stroke={INK} strokeWidth="8" />
    <path d="M-54 566L52 554L62 506L-44 518Z" fill="#6ec3ff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
    <path d="M-22 562L-12 512M8 559L18 509M34 556L44 506" stroke={INK} strokeWidth="3" />
  </g>
));

/**
 * The cartoon Moon outpost. Its look is driven by the real game state (walls, garden, dish, storm).
 * `full` adds the "RADIATION STORM!" banner (used in the mission window, not the background).
 */
export function MoonScene({ s, full }: { s: GameState | null; full: boolean }) {
  const sc = s ? SC[s.sc] : null;
  const storm = !!(s && sc && !s.ended && inStorm(sc, s.turn));
  const shade = !!(s && sc && !s.ended && sunAt(sc, s.turn) < K.sun);

  const blocks: ReactNode[] = [];
  if (s) for (let i = 0; i < s.shield; i++) {
    const c = i % 2, rw = (i / 2) | 0;
    blocks.push(
      <rect key={i} x={738 + c * 48} y={568 - rw * 32} width="46" height="30" rx="5" fill={rw % 2 ? '#e0dac6' : '#c9c3b0'} stroke={INK} strokeWidth="4">
        <animate attributeName="opacity" from="0" to="1" dur=".6s" />
      </rect>,
    );
  }

  let garden: ReactNode = null;
  if (s && s.plant != null) {
    const left = s.plant - s.turn, h = left >= 2 ? 14 : left === 1 ? 30 : 46;
    garden = <>
      <g stroke={INK} strokeWidth="4">
        <path d={`M1010 596v-${h}`} fill="none" />
        <path d={`M1010 ${596 - h}q-24 -6 -26 -26q22 0 26 26z`} fill="#4fd1a1" />
        <path d={`M1060 596v-${h}`} fill="none" />
        <path d={`M1060 ${596 - h}q24 -6 26 -26q-22 0 -26 26z`} fill="#4fd1a1" />
      </g>
      {left <= 0 && <circle cx="1035" cy="548" r="9" fill="#ff6a4d" stroke={INK} strokeWidth="4" />}
    </>;
  }

  const waves = s && s.msgAt != null && s.turn <= s.msgAt + 1
    ? <g fill="none" stroke="#6ec3ff" strokeWidth="5" strokeLinecap="round">
      <path d="M640 330q14-12 28 0" style={{ animation: 'tw 1s infinite alternate' }} />
      <path d="M630 312q24-22 48 0" style={{ animation: 'tw 1s .3s infinite alternate' }} />
    </g>
    : null;

  const stormLines = storm
    ? <g stroke="#ffc93c" strokeWidth="5" strokeLinecap="round" fill="none">
      {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${300 + i * 160} 0l-60 440`} style={{ animation: `sp .6s ${i * .08}s steps(2) infinite` }} />)}
    </g>
    : null;

  const label = 'Cartoon Moon outpost with a dome habitat, a dish, a garden dome, a rover and solar panels. '
    + (s ? `Shelter walls: ${s.shield}. ${s.plant != null ? 'Food is growing.' : ''}` : '')
    + (storm ? ' A solar storm is happening!' : '');

  return (
    <svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
      <style>{'@keyframes tw{from{opacity:.25}to{opacity:1}}@keyframes sp{50%{opacity:0}}'}</style>
      <rect width="1600" height="800" fill="#222c63" />
      <rect y="300" width="1600" height="200" fill="#2d3a7c" opacity=".7" />
      {STARS}{stormLines}
      {/* Sun */}
      <g>
        <circle cx="230" cy="170" r="62" fill="#ffc93c" stroke={INK} strokeWidth="5" />
        <g stroke="#ffc93c" strokeWidth="10" strokeLinecap="round"><path d="M230 70v-28M230 270v28M130 170h-28M330 170h28M158 98l-20-20M302 242l20 20M158 242l-20 20M302 98l20-20" /></g>
      </g>
      {/* Earth */}
      <g transform="translate(1330 180)">
        <circle r="70" fill="#3f9be0" stroke={INK} strokeWidth="5" />
        <path d="M-38-38q28-18 46 6q-12 28-38 18zM18 10q38-6 34 28q-22 22-38 4z" fill="#4fd1a1" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      </g>
      {/* Ground */}
      <path d="M0 560Q300 470 700 540T1600 520V800H0Z" fill="#fff1cf" stroke={INK} strokeWidth="6" />
      <path d="M0 680Q500 620 1000 670T1600 650V800H0Z" fill="#f1d9a6" stroke={INK} strokeWidth="5" />
      <g fill="#e8cd94" stroke={INK} strokeWidth="4">
        <ellipse cx="240" cy="630" rx="120" ry="24" /><ellipse cx="1380" cy="720" rx="120" ry="22" /><ellipse cx="620" cy="735" rx="80" ry="15" />
      </g>
      {/* Habitat dome with the dish */}
      <g>
        <path d="M470 560A130 130 0 0 1 730 560Z" fill="#fff" stroke={INK} strokeWidth="6" />
        <path d="M470 560h260v34H470z" fill="#ff6a4d" stroke={INK} strokeWidth="6" />
        <circle cx="545" cy="505" r="18" fill="#ffd9a0" stroke={INK} strokeWidth="4" />
        <circle cx="655" cy="505" r="18" fill="#ffd9a0" stroke={INK} strokeWidth="4" />
        <path d="M572 594v-42a28 28 0 0 1 56 0v42z" fill="#4fd1a1" stroke={INK} strokeWidth="5" />
        <path d="M600 432v-72" stroke={INK} strokeWidth="6" />
        <path d="M570 352q30-34 60 0z" fill="#6ec3ff" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      </g>
      {waves}
      {/* Flag */}
      <g>
        <path d="M440 592V470" stroke={INK} strokeWidth="6" />
        <path d="M443 472h56l-12 18 12 18h-56z" fill="#ff6a4d" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      </g>
      {blocks}
      {/* Rover */}
      <g transform="translate(870 600)">
        <rect x="0" y="-30" width="80" height="30" rx="9" fill="#ffc93c" stroke={INK} strokeWidth="5" />
        <rect x="34" y="-50" width="30" height="22" rx="6" fill="#6ec3ff" stroke={INK} strokeWidth="5" />
        <circle cx="16" cy="6" r="13" fill={INK} /><circle cx="64" cy="6" r="13" fill={INK} />
      </g>
      {/* Garden dome */}
      <g>
        <path d="M950 600A85 85 0 0 1 1120 600Z" fill="#4fd1a1" fillOpacity=".35" stroke={INK} strokeWidth="6" />
        <path d="M950 600h170" stroke={INK} strokeWidth="6" />
      </g>
      {garden}{PANELS}
      {shade && <path d="M1060 500L1600 500V780H900Z" fill={INK} opacity=".5" />}
      {full && storm && (
        <g transform="translate(800 70)">
          <rect x="-190" y="-34" width="380" height="54" rx="12" fill="#ffc93c" stroke={INK} strokeWidth="5" />
          <text y="4" textAnchor="middle" fontFamily="Fredoka,sans-serif" fontWeight="600" fontSize="30" fill={INK}>RADIATION STORM! Stay inside!</text>
        </g>
      )}
    </svg>
  );
}
