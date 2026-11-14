import { ACT } from '../data/scienceFacts';
import { plan, step } from '../game/engine';
import { kidErr } from '../game/mentor';
import type { ActionId } from '../game/scenarios';
import type { GameState } from '../game/types';
import { Icon } from './Icon';

/** One of the six shift jobs. Disabled (with the reason) when it can't be done right now. */
export function ActionButton({ s, a, pressed, resolving, onPick }: {
  s: GameState; a: ActionId; pressed: boolean; resolving: boolean; onPick: (a: ActionId) => void;
}) {
  const pl = plan(s, a), r = step(s, a), [title, desc, icon] = ACT[a];
  return (
    <button className="act" aria-pressed={pressed} disabled={!(r.ok && !resolving)} onClick={() => onPick(a)}>
      <Icon name={icon} />
      <span>
        <h3>{title}</h3>
        <small>{desc}</small>
        {!r.ok && <small className="why">{kidErr(r.error)}</small>}
      </span>
      <span className="c">{pl.error ? '' : '−' + pl.cost}<small><br />power</small></span>
    </button>
  );
}
