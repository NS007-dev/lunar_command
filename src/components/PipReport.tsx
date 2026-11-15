import type { Change, ShiftPreview, ShiftReport } from '../game/mentor';
import { Icon, Star, type IconName } from './Icon';
import { Spoken } from './Spoken';

const ICON: Record<Exclude<Change['kind'], 'sci'>, IconName> = { power: 'battery', life: 'drop', shield: 'shield', storm: 'warn' };
const MARK = { good: '✓', warn: '!', bad: '✗' } as const;

/** One line per resource that changes, with its icon (the same list for the preview and the report). */
function Changes({ changes, label }: { changes: Change[]; label: string }) {
  if (changes.length === 0) return null;
  return (
    <ul className="say-c" aria-label={label}>
      {changes.map((c, i) => (
        <li key={i} className={c.warn ? 'w' : undefined}>
          {c.kind === 'sci' ? <Star on /> : <Icon name={ICON[c.kind]} size={22} />}
          <span><Spoken text={c.text} /></span>
        </li>
      ))}
    </ul>
  );
}

/** What goes inside Pip's bubble while the player is looking at "Do it!": what would change, explained like the report. */
export function PipPreview({ p }: { p: ShiftPreview }) {
  return <>
    <span className="say-h">{p.intro}</span>
    <Changes changes={p.changes} label="What would change" />
    {p.storm && <span className="say-d">{p.storm}</span>}
    {p.confirm && <span className="say-e">{p.confirm}</span>}
  </>;
}

/**
 * What goes inside Pip's bubble after a shift: headline, a friendly sentence, what changed
 * (one line per resource), and then the fun fact, kept apart so it doesn't hide the result.
 */
export function PipReport({ r }: { r: ShiftReport }) {
  return <>
    <span className="say-h"><span className="say-m" aria-hidden="true">{MARK[r.tone]}</span>{r.title}</span>
    <span className="say-d">{r.detail}</span>
    <Changes changes={r.changes} label="What changed" />
    {r.end && <span className="say-e">{r.end}</span>}
    {r.fact && <span className="say-f"><b>Fun fact:</b> {r.fact}</span>}
  </>;
}
