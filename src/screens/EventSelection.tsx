import { EVT } from '../data/scienceFacts';
import { SC } from '../game/scenarios';

/** Choose one of the three real space-weather events. */
export function EventSelection({ onPick }: { onPick: (i: number) => void }) {
  return (
    <section style={{ paddingTop: '4vh' }}>
      <span className="tag">Real NOAA records</span>
      <h2 style={{ margin: '14px 0' }}>Which Sun event do you face?</h2>
      <p style={{ maxWidth: '60ch' }}>Each event had a flare (a flash of light and X-rays) and a radiation storm (fast particles). They are measured separately. Higher S numbers mean stronger storms, so we made the shelter harder to build for them.</p>
      <div className="evs">
        {SC.map((e, i) => (
          <button key={e.id} onClick={() => onPick(i)}>
            <h3 style={{ margin: '0 0 6px' }}>{e.date}</h3>
            <p style={{ margin: '.3em 0' }}><span className="tg n">Real record</span><b>Flare:</b> {EVT[e.id].flare}</p>
            <p style={{ margin: '.3em 0' }}><span className="tg n">Real record</span><b>Radiation storm:</b> {EVT[e.id].storm}</p>
            <p style={{ margin: '.6em 0 0' }}><span className="tg r">Game rule</span>Shelter needed: <b>{e.req}</b> · Storm lasts <b>{e.len}</b> shift{e.len > 1 ? 's' : ''} · Hill shadow on shift {e.shadow[0]}{e.shadow[1] > e.shadow[0] ? '–' + e.shadow[1] : ''}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
