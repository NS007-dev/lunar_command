import { Icon } from '../components/Icon';
import { PipSays } from '../components/Pip';
import { ICO, SLV, UPD } from '../data/scienceFacts';
import { SC, UP, type Gadget } from '../game/scenarios';

/** Pick exactly two gadgets, then blast off. */
export function GadgetSelection({ sc, sel, onToggle, onLaunch, onChangeEvent }: {
  sc: number; sel: Gadget[]; onToggle: (k: Gadget) => void; onLaunch: () => void; onChangeEvent: () => void;
}) {
  const n = sel.length, e = SC[sc];
  return (
    <section style={{ paddingTop: '4vh' }}>
      <span className="tag">{`${e.date} · S${e.s} ${SLV[e.s]} storm`}</span>
      <h2 style={{ margin: '14px 0' }}>Pick exactly 2 gadgets!</h2>
      <PipSays mood={n === 2 ? 'cheer' : 'happy'} style={{ maxWidth: 640 }} live>
        {n === 2 ? 'Great picks! Ready to go?' : n === 1 ? 'Nice! Pick one more.' : 'Each gadget costs 2 credits. You have 4, so you can pick 2.'}
      </PipSays>
      <div className="gad">
        {(Object.keys(UP) as Gadget[]).map(k => (
          <button key={k} aria-pressed={sel.includes(k)} onClick={() => onToggle(k)}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Icon name={ICO[k]} size={52} /><h3>{UP[k]}</h3></div>
            <small>{UPD[k]}</small>
          </button>
        ))}
      </div>
      <p>Credits left: <b>{4 - 2 * n}</b> of 4</p>
      <button className="btn g" onClick={onLaunch} disabled={n !== 2}>Blast off! <span aria-hidden="true">▶</span></button>{'   '}
      <button className="lnk" onClick={onChangeEvent}>Change event</button>
    </section>
  );
}
