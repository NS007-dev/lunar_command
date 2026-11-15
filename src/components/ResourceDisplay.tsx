import type { ReactNode } from 'react';
import { K, SC, sunAt } from '../game/scenarios';
import type { GameState } from '../game/types';
import { Icon, Star } from './Icon';

/** The values a previewed action would lead to (shown as "→ n" and dashed segments). */
export interface Preview {
  power: number;
  life: number;
  shield: number;
  sci: number;
}

/**
 * Segment bar for supplies and shelter. Dashed segments show what a previewed action would lose (gl) or gain (gb).
 * `was` is the value before the shift that just played: new segments pop in (chg) and used ones fade out (gone).
 */
function Segments({ cur, tot, pr, cls, low, was }: { cur: number; tot: number; pr?: number; cls?: string; low?: number; was?: number }) {
  const c: ReactNode[] = [];
  for (let i = 0; i < tot; i++) {
    let k = '';
    if (pr != null && pr < cur && i >= pr && i < cur) k = 'gl';
    else if (pr != null && pr > cur && i >= cur && i < pr) k = 'gb';
    else if (i < cur) { k = low && cur <= low ? 'lo' : 'on'; if (was != null && i >= was) k += ' chg'; }
    else if (was != null && i < was) k = 'gone';
    c.push(<i key={i} className={k}></i>);
  }
  return <div className={`sg ${cls || ''}`} aria-hidden="true">{c}</div>;
}

/** Battery cells. `prev` is the power before the last shift, so changed cells flash. */
function BatteryCells({ s, pr, prev }: { s: GameState; pr?: number; prev: number | null }) {
  const cur = s.power, pv = prev, c: ReactNode[] = [];
  for (let i = 1; i <= s.cap; i++) {
    let k = '';
    if (pr != null && pr < cur && i > pr && i <= cur) k = 'gl';
    else if (pr != null && pr > cur && i > cur && i <= pr) k = 'gb';
    else if (i <= cur) { k = cur <= K.upkeep + 1 ? 'lo' : 'on'; if (pv != null && pv < cur && i > pv) k += ' chg'; }
    else if (pv != null && i <= pv) k = 'chg';
    c.push(<i key={i} className={k}></i>);
  }
  return <div className="cells" role="img" aria-label={`Battery power: ${cur} of ${s.cap}`}>{c}</div>;
}

/** "→ new value" when a preview changes it (screen readers hear "will be" instead of "right arrow"). */
const Arrow = ({ a, b }: { a: number; b?: number }) => (b != null && b !== a ? <> <span aria-hidden="true">→</span><span className="sr-only">will be</span> <b>{b}</b></> : null);

/** The four resource panels: power, crew supplies, crew protection, science stars. */
export function ResourceDisplay({ s, preview, prev, tx }: { s: GameState; preview: Preview | null; prev: number | null; tx: boolean }) {
  const sc = SC[s.sc], pr: Partial<Preview> = preview || {}, sun = sunAt(sc, s.turn);
  // The shift that just played (only right after "Do it!"), so only what really changed flashes.
  const last = tx ? s.history[s.history.length - 1] : undefined;
  const lifeWas = last?.lifeStart, shieldWas = last ? (s.history[s.history.length - 2]?.shield ?? 0) : undefined, newStars = last?.sci ?? 0;
  const stars: ReactNode[] = [];
  for (let i = 0; i < K.sciMax; i++) stars.push(<Star key={i} on={i < s.science} className={i < s.science && i >= s.science - newStars ? 'new' : ''} />);
  return <>
    <div className="stat wide">
      <div className="ro"><Icon name="battery" size={34} /><span><span className="l">Battery power</span><b>{s.power}</b> <span className="l" style={{ display: 'inline' }}>of {s.cap}<Arrow a={s.power} b={pr.power} /></span></span></div>
      <BatteryCells s={s} pr={pr.power} prev={tx ? prev : null} />
      <span className="l" style={{ marginTop: 6 }}>This shift: the sun adds {sun}{sun < K.sun ? " (a hill's shadow blocks some sun)" : ''}, and the base uses {K.upkeep} to keep running.</span>
    </div>
    <div className="stat s2">
      <div className="ro"><Icon name="drop" size={30} /><span><span className="l">Crew supplies</span><b>{s.life}</b> <span className="l" style={{ display: 'inline' }}>of {K.lifeCap}<Arrow a={s.life} b={pr.life} /></span></span></div>
      <Segments cur={s.life} tot={K.lifeCap} pr={pr.life} low={2} was={lifeWas} />
      <span className="l">Air, water and food. The crew uses 1 each shift.</span>
    </div>
    <div className="stat s1">
      <div className="ro"><Icon name="shield" size={30} /><span><span className="l">Storm shelter</span><b>{s.shield}</b><span className="l" style={{ display: 'inline' }}> layers<Arrow a={s.shield} b={pr.shield} /> · storm needs {sc.req}</span></span></div>
      <Segments cur={s.shield} tot={K.shieldCap} pr={pr.shield} cls="sh" was={shieldWas} />
      <span className="l">Thick layers block some radiation. Reach {sc.req} before the storm!</span>
    </div>
    <div className="stat s3">
      <span className="l">Science stars: {s.science} of {K.sciMax}<Arrow a={s.science} b={pr.sci} /> (goal: {K.goal})</span>
      <div className="stars" role="img" aria-label={`${s.science} of ${K.sciMax} science stars`}>{stars}</div>
    </div>
  </>;
}
