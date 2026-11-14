import type { Change, ShiftReport } from '../game/mentor';
import { Icon, Star, type IconName } from './Icon';

const ICON: Record<Exclude<Change['kind'], 'sci'>, IconName> = { power: 'battery', life: 'drop', shield: 'shield', storm: 'warn' };
const MARK = { good: '✓', warn: '!', bad: '✗' } as const;

/**
 * What goes inside Pip's bubble after a shift: headline, a friendly sentence, what changed
 * (one line per resource), and then the fun fact, kept apart so it doesn't hide the result.
 */
export function PipReport({ r }: { r: ShiftReport }) {
  return <>
    <span className="say-h"><span className="say-m" aria-hidden="true">{MARK[r.tone]}</span>{r.title}</span>
    <span className="say-d">{r.detail}</span>
    {r.changes.length > 0 && (
      <ul className="say-c" aria-label="What changed">
        {r.changes.map((c, i) => (
          <li key={i} className={c.warn ? 'w' : undefined}>
            {c.kind === 'sci' ? <Star on /> : <Icon name={ICON[c.kind]} size={22} />}
            <span>{c.text}</span>
          </li>
        ))}
      </ul>
    )}
    {r.end && <span className="say-e">{r.end}</span>}
    {r.fact && <span className="say-f"><b>Fun fact:</b> {r.fact}</span>}
  </>;
}
