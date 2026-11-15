import { Icon } from '../components/Icon';
import { PipSays } from '../components/Pip';
import { ICO, SLV, UPD } from '../data/scienceFacts';
import { SC, UP, type Gadget } from '../game/scenarios';
import { GADGETS, PICK_HELP, TOO_MANY_GADGETS } from '../game/uiState';

/**
 * Pick exactly two gadgets, then blast off. Choices that aren't possible yet are marked aria-disabled
 * (they stay reachable by keyboard); pressing one makes Pip say why. `message` is Pip's latest answer.
 */
export function GadgetSelection({ sc, sel, message, onToggle, onLaunch, onChangeEvent }: {
  sc: number; sel: Gadget[]; message: string; onToggle: (k: Gadget) => void; onLaunch: () => void; onChangeEvent: () => void;
}) {
  const n = sel.length, e = SC[sc], full = n >= GADGETS;
  return (
    <section style={{ paddingTop: '4vh' }}>
      <span className="tag">{`${e.date} · ${SLV[e.s][0].toUpperCase()}${SLV[e.s].slice(1)} storm (S${e.s})`}</span>
      <h2 style={{ margin: '14px 0' }}>Pick exactly 2 gadgets!</h2>
      <PipSays mood={message ? 'worried' : n === 2 ? 'cheer' : 'happy'} style={{ maxWidth: 640 }} live>
        {message || (n === 2 ? 'Great picks! Press "Blast off!" when you are ready.' : n === 1 ? 'Nice! Pick one more.' : PICK_HELP)}
      </PipSays>
      <div className="gad">
        {(Object.keys(UP) as Gadget[]).map(k => {
          const picked = sel.includes(k), blocked = full && !picked;
          return (
            <button key={k} aria-pressed={picked} aria-disabled={blocked || undefined} onClick={() => onToggle(k)}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Icon name={ICO[k]} size={52} /><h3>{UP[k]}</h3></div>
              <small>{UPD[k]}</small>
              {blocked && <small className="why">{TOO_MANY_GADGETS}</small>}
            </button>
          );
        })}
      </div>
      <p>Gadgets picked: <b>{n}</b> of {GADGETS}</p>
      <button className="btn g" onClick={onLaunch} aria-disabled={n !== GADGETS || undefined}>Blast off! <span aria-hidden="true">▶</span></button>{'   '}
      <button className="lnk" onClick={onChangeEvent}>Change event</button>
    </section>
  );
}
