import { EVT } from '../data/scienceFacts';
import { SC } from '../game/scenarios';

/** The hill-shadow shifts in words: "shift 2" or "shifts 3 and 4". */
const shadowText = (sh: [number, number]) =>
  sh[1] > sh[0] ? `shifts ${sh[0]}${sh[1] - sh[0] > 1 ? ' to ' : ' and '}${sh[1]}` : `shift ${sh[0]}`;

/** Choose one of the three real space-weather events. */
export function EventSelection({ onPick }: { onPick: (i: number) => void }) {
  return (
    <section style={{ paddingTop: '4vh' }}>
      <span className="tag">Real Sun events</span>
      <h2 style={{ margin: '14px 0' }}>Which Sun event do you face?</h2>
      <p style={{ maxWidth: '60ch' }}>Pick one real Sun event. A <b>solar flare</b> is a super-bright flash of light and X-rays. A <b>radiation storm</b> is a shower of tiny, fast bits from the Sun. Scientists measure the two in different ways. The March 2024 and September 2017 events show both. The January 2026 event in this game shows the radiation storm only.</p>
      <p style={{ maxWidth: '60ch' }}>Radiation storms get an <b>S number</b>, from S1 (minor) up to S5 (extreme). The bigger the number, the stronger the storm. In our game, stronger storms need more shelter layers!</p>
      <div className="evs">
        {SC.map((e, i) => (
          <button key={e.id} onClick={() => onPick(i)}>
            <h3 style={{ margin: '0 0 6px' }}>{e.date}</h3>
            <p style={{ margin: '.3em 0' }}><span className="tg n">Real record</span><b>Flare:</b> {EVT[e.id].flare}</p>
            <p style={{ margin: '.3em 0' }}><span className="tg n">Real record</span><b>Radiation storm:</b> {EVT[e.id].storm}</p>
            {/* One fact per line, so the game numbers are easy to scan. */}
            <p style={{ margin: '.6em 0 .2em' }}><span className="tg r">Game rule</span>Shelter needed: <b>{e.req} layers</b></p>
            <p style={{ margin: '.2em 0' }}><span className="tg r">Game rule</span>Storm lasts: <b>{e.len} shift{e.len > 1 ? 's' : ''}</b></p>
            <p style={{ margin: '.2em 0 0' }}><span className="tg r">Game rule</span>Hill shadow: <b>{shadowText(e.shadow)}</b></p>
          </button>
        ))}
      </div>
    </section>
  );
}
