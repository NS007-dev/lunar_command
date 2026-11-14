import { ActionButton } from '../components/ActionButton';
import { Icon } from '../components/Icon';
import { MoonScene } from '../components/MoonScene';
import { PipSays } from '../components/Pip';
import { ResourceDisplay, type Preview } from '../components/ResourceDisplay';
import { ShiftPath } from '../components/ShiftPath';
import { SCI } from '../data/scienceFacts';
import { known, step } from '../game/engine';
import { ACTS, K, SC, inStorm, sunAt, type ActionId } from '../game/scenarios';
import type { GameState } from '../game/types';

const smallBtn = { fontSize: '1rem', padding: '6px 16px', boxShadow: '0 4px 0 var(--ink)' };

/** The main game screen: one shift at a time. */
export function Mission({ s, pending, resolving, mentor, prev, tx, onPick, onConfirm, onCancel, onHint, onExplain, onAsk }: {
  s: GameState; pending: ActionId | null; resolving: boolean; mentor: string; prev: number | null; tx: boolean;
  onPick: (a: ActionId) => void; onConfirm: () => void; onCancel: () => void; onHint: () => void; onExplain: () => void; onAsk: (i: number) => void;
}) {
  const e = SC[s.sc], t = s.turn, pv = pending ? step(s, pending) : null, ok = !!(pv && pv.ok && pv.rec.safe), kn = known(s);
  const storm = inStorm(e, t), sun = sunAt(e, t), shade = sun < K.sun;
  const preview: Preview | null = ok && pv && pv.ok ? { power: pv.state.power, life: pv.state.life, shield: pv.state.shield, sci: pv.state.science } : null;
  const mood = storm || s.life <= 3 || s.power <= K.upkeep + 1 ? 'worried' : 'happy';

  let say = mentor || (storm ? 'A radiation storm is here! Fast particles from the Sun. Stay inside and check your shelter.' : shade ? "A hill's shadow is blocking some sun. Watch your battery!" : 'What should we do this shift?');
  if (pending && pv && pv.ok) say = pv.rec.safe
    ? `If you do this: battery ${pv.rec.powerStart} → ${pv.rec.powerEnd}, supplies ${pv.rec.lifeStart} → ${pv.rec.lifeEnd}, shelter ${pv.rec.shield}, stars ${pv.state.science}.${pv.rec.storm ? (pv.rec.storm.ok ? ` The storm needs ${pv.rec.storm.req} and you will have enough.` : ` The storm needs ${pv.rec.storm.req} but you would have ${pv.rec.storm.shield}. The crew would get extra radiation.`) : ''}`
    : `Uh oh! ${pv.rec.why === 'power' ? 'The base would be ' + pv.rec.shortfall + ' power short.' : 'Crew supplies would run out.'} The mission would end.`;

  const rad = s.protectedShifts + s.exposure === 0
    ? (t > e.at + e.len - 1 ? 'Radiation storm: over.' : 'Radiation storm: not yet.')
    : `Radiation storm so far: ${s.protectedShifts} shift${s.protectedShifts === 1 ? '' : 's'} protected, ${s.exposure} not protected.`;
  const earth = s.msgAt == null ? 'No message sent yet.' : kn ? `Reply: the radiation storm lasts shifts ${e.at} to ${e.at + e.len - 1}.` : 'Message sent. The team needs a shift to study the Sun.';
  const garden = s.plant == null ? 'Nothing planted.' : s.plant - t <= 0 ? 'Food is ready this shift!' : 'Growing. Ready in ' + (s.plant - t) + ' shifts.';

  return (
    <section className={tx ? 'tx' : ''}>
      <ShiftPath s={s} />
      {storm && <div className="alert" role="alert"><Icon name="warn" size={32} /><span>Radiation storm now (shift {t - e.at + 1} of {e.len})! Crew protection needs {e.req}. Stay inside.</span></div>}
      <div className="mis">
        <div>
          <div className="vp"><MoonScene s={s} full /></div>
          <div className="stats"><ResourceDisplay s={s} preview={preview} prev={prev} tx={tx} /></div>
          <div className="info">
            <div className="l2">{rad}</div>
            <div className="l2">Earth team: {earth}</div>
            <div className="l2">Garden: {garden}</div>
          </div>
        </div>
        <div>
          <PipSays mood={pending && pv && pv.ok && !pv.rec.safe ? 'worried' : mood} live>{say}</PipSays>
          <div className="acts">
            {ACTS.map(a => <ActionButton key={a} s={s} a={a} pressed={pending === a} resolving={resolving} onPick={onPick} />)}
          </div>
          {pending && pv && pv.ok && (
            <div className="pop">
              <button className="btn g" onClick={onConfirm} disabled={resolving}>Do it!</button>{'   '}
              <button className="btn w" onClick={onCancel} style={{ fontSize: '1.1rem' }}>Wait, no</button>
            </div>
          )}
          <p style={{ marginTop: 20 }}>
            <button className="btn w" onClick={onHint} style={smallBtn}>Hint</button>{' '}
            <button className="btn w" onClick={onExplain} style={smallBtn}>What happened?</button>
          </p>
          <p style={{ margin: '14px 0 4px' }}><b>Ask Pip:</b></p>
          {SCI.map((x, i) => <button key={i} className="lnk" onClick={() => onAsk(i)} style={{ display: 'block' }}>{x.q}</button>)}
        </div>
      </div>
    </section>
  );
}
