import { known } from '../game/engine';
import { SC, inStorm } from '../game/scenarios';
import type { GameState } from '../game/types';

/** The row of 8 shift circles, with the (expected) storm and hill shadow marked. */
export function ShiftPath({ s }: { s: GameState }) {
  const e = SC[s.sc], t = s.turn, kn = known(s);
  const label = `Shift ${t} of 8. ${kn ? 'Radiation storm on shifts ' + e.at + ' to ' + (e.at + e.len - 1) : 'Radiation storm expected around shifts ' + (e.at - 1) + ' to ' + (e.at + e.len)}. Hill shadow on shifts ${e.shadow[0]} to ${e.shadow[1]}.`;
  return (
    <div className="path" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map(x => {
        const win = kn ? inStorm(e, x) : (x >= e.at - 1 && x <= e.at + e.len), sh = x >= e.shadow[0] && x <= e.shadow[1];
        const first = kn ? x === e.at : x === e.at - 1;
        return (
          <i key={x} className={`${x < t ? 'done' : x === t ? 'now' : ''} ${win ? 'st' : ''} ${sh ? 'shd' : ''}`}>
            {x}
            {win && first && <u>{kn ? 'storm' : 'storm?'}</u>}
            {sh && x === e.shadow[0] && <s>shadow</s>}
          </i>
        );
      })}
    </div>
  );
}
