import { ACT } from '../data/scienceFacts';
import { check, plan } from '../game/engine';
import { effects, reason } from '../game/mentor';
import type { ActionId } from '../game/scenarios';
import type { GameState } from '../game/types';
import { Icon } from './Icon';

/**
 * One of the six shift jobs. When it can't be done right now it shows the reason and is marked
 * aria-disabled (not `disabled`), so keyboard and screen-reader users can still reach it and hear why.
 * Pressing it anyway makes Pip explain; the reducer refuses it, so it never reaches "Do it!".
 * The corner shows the power cost and the badges show everything else the job adds or uses, both read from the
 * engine's plan() (so gadgets are included).
 */
export function ActionButton({ s, a, pressed, resolving, onPick }: {
  s: GameState; a: ActionId; pressed: boolean; resolving: boolean; onPick: (a: ActionId) => void;
}) {
  const pl = plan(s, a), r = check(s, a), [title, desc, icon] = ACT[a], fx = effects(s, a);
  return (
    <button className="act" aria-pressed={pressed} aria-disabled={r.ok ? undefined : true} disabled={resolving} onClick={() => onPick(a)}>
      <Icon name={icon} />
      <span>
        <h3>{title}</h3>
        <small>{desc}</small>
        {fx.length > 0 && (
          <small className="fx">
            <span className="sr-only">This job: </span>
            {fx.map((f, i) => <span key={f} className="chip">{f}{i < fx.length - 1 && <span className="sr-only">, </span>}</span>)}
          </small>
        )}
        {!r.ok && <small className="why">{reason(r.error, s)}</small>}
      </span>
      <span className="c">{pl.error ? '' : '−' + pl.cost}<small><br />power</small></span>
    </button>
  );
}
