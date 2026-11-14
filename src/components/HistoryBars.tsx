import type { GameState } from '../game/types';

/** Bar chart of one value (battery or supplies) at the end of each shift. Red bars = the shift that failed. */
export function HistoryBars({ s, field, max, label }: { s: GameState; field: 'powerEnd' | 'lifeEnd'; max: number; label: string }) {
  const v = (h: GameState['history'][number]) => h[field] ?? 0;
  return <>
    <p style={{ margin: '10px 0 0' }}><b>{label}</b></p>
    <div className="bars" style={{ height: 90 }} role="img" aria-label={`${label} each shift: ${s.history.map(v).join(', ')}`}>
      {s.history.map((h, i) => (
        <div key={i} style={{ fontSize: '.85rem' }}>{v(h)}<i className={h.safe ? '' : 'f'} style={{ height: Math.max(3, v(h) / max * 60) }}></i></div>
      ))}
    </div>
    <div className="lab">{s.history.map((h, i) => <span key={i}>{h.turn}</span>)}</div>
  </>;
}
