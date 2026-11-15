import type { ReactNode } from 'react';
import { ActionButton } from '../components/ActionButton';
import { Icon } from '../components/Icon';
import { MoonScene } from '../components/MoonScene';
import { PipSays, type PipMood } from '../components/Pip';
import { PipReport } from '../components/PipReport';
import { ResourceDisplay, type Preview } from '../components/ResourceDisplay';
import { ShiftPath } from '../components/ShiftPath';
import { Spoken } from '../components/Spoken';
import { SCI } from '../data/scienceFacts';
import { known, step } from '../game/engine';
import { FIRST_SHIFT, NEXT_SHIFT, previewText, stormNews, type ShiftReport, type Tone } from '../game/mentor';
import { ACTS, K, SC, inStorm, sunAt, type ActionId } from '../game/scenarios';
import type { GameState } from '../game/types';

const smallBtn = { fontSize: '1rem', padding: '6px 16px', boxShadow: '0 4px 0 var(--ink)' };
const NEWS_ICON = { soon: 'warn', here: 'warn', over: 'tick' } as const;

/** The main game screen: one shift at a time. */
export function Mission({ s, pending, resolving, mentor, prev, tx, report, showReport, refused, onPick, onConfirm, onCancel, onHint, onExplain, onAsk, onResults }: {
  s: GameState; pending: ActionId | null; resolving: boolean; mentor: string; prev: number | null; tx: boolean;
  report: ShiftReport | null; showReport: boolean; refused: boolean;
  onPick: (a: ActionId) => void; onConfirm: () => void; onCancel: () => void; onHint: () => void; onExplain: () => void; onAsk: (i: number) => void;
  onResults: () => void;
}) {
  const e = SC[s.sc], t = s.turn, pv = pending ? step(s, pending) : null, ok = !!(pv && pv.ok && pv.rec.safe), kn = known(s);
  const storm = inStorm(e, t), sun = sunAt(e, t), shade = sun < K.sun, news = stormNews(s);
  const preview: Preview | null = ok && pv && pv.ok ? { power: pv.state.power, life: pv.state.life, shield: pv.state.shield, sci: pv.state.science } : null;
  // A shift that just played in this render (for the "what changed" flashes)
  const last = tx ? s.history[s.history.length - 1] : undefined;
  const shieldWas = last ? (s.history[s.history.length - 2]?.shield ?? 0) : undefined;

  let say: ReactNode = mentor || (t === 1 ? FIRST_SHIFT
    : storm ? 'A radiation storm is here! Tiny fast bits from the Sun are rushing past. Stay inside and check your shelter.'
      : shade ? "A hill's shadow is blocking some sun, so your battery charges less. Watch your power!" : NEXT_SHIFT);
  let tone: Tone | undefined = refused ? 'warn' : undefined;
  let mood: PipMood = refused || storm || s.life <= 3 || s.power <= K.upkeep + 1 ? 'worried' : 'happy';
  if (pending && pv) {
    say = previewText(s, pending); // the reducer refuses impossible jobs, but never show a silent preview
    tone = pv.ok && !pv.rec.safe ? 'bad' : undefined;
    if (tone) mood = 'worried';
  } else if (showReport && report) {
    say = <PipReport r={report} />;
    tone = report.tone;
    mood = report.tone === 'good' ? 'cheer' : 'worried';
  }

  const over = t > e.at + e.len - 1, seen = s.protectedShifts + s.exposure;
  const rad = seen === 0
    ? (over ? 'Radiation storm: over.' : 'Radiation storm: not yet.')
    : `Radiation storm${over ? ' is over' : ' so far'}: ${s.protectedShifts} shift${s.protectedShifts === 1 ? '' : 's'} protected, ${s.exposure} not protected.`;
  const earth = s.msgAt == null ? 'No message sent yet. Ask Earth to learn when the storm comes.' : kn ? `Reply: the radiation storm covers shifts ${e.at} to ${e.at + e.len - 1}.` : 'Message sent. Earth scientists need a shift to study the Sun.';
  const garden = s.plant == null ? 'Nothing planted.' : s.plant - t <= 0 ? 'Food is ready this shift!' : 'Growing. Ready in ' + (s.plant - t) + ' shifts.';

  return (
    <section className={tx ? 'tx' : ''}>
      <ShiftPath s={s} />
      {/* Storm news is read out by the live region when the shift starts, so this banner is not an alert itself
          (that made it shake and be read again on every click). It only shakes when the shift has just begun. */}
      {news && (
        <div className={`alert ${news.kind}${tx ? ' shake' : ''}`}>
          <Icon name={NEWS_ICON[news.kind]} size={32} /><span>{news.text}</span>
        </div>
      )}
      <div className="mis">
        <div>
          <div className="vp"><MoonScene s={s} full newFrom={shieldWas} /></div>
          <div className="stats"><ResourceDisplay s={s} preview={preview} prev={prev} tx={tx} /></div>
          <div className="info">
            <div className="l2">{rad}</div>
            <div className="l2">Earth team: {earth}</div>
            <div className="l2">Garden: {garden}</div>
          </div>
        </div>
        <div>
          <PipSays mood={mood} tone={tone}>{typeof say === 'string' ? <Spoken text={say} /> : say}</PipSays>
          {s.ended ? (
            <p className="pop" style={{ margin: '18px 0' }}>
              {/* After the last shift the jobs go away, and focus moves here so keyboard users can carry on. */}
              <button className="btn g" onClick={onResults} autoFocus>See your results <span aria-hidden="true">▶</span></button>
            </p>
          ) : <>
            <div className="acts">
              {ACTS.map(a => <ActionButton key={a} s={s} a={a} pressed={pending === a} resolving={resolving} onPick={onPick} />)}
            </div>
            {pending && pv && pv.ok && (
              <div className="pop">
                <button className="btn g" onClick={onConfirm} disabled={resolving}>Do it!</button>{'   '}
                <button className="btn w" onClick={onCancel} style={{ fontSize: '1.1rem' }}>Wait, no</button>
              </div>
            )}
          </>}
          <p style={{ marginTop: 20 }}>
            {!s.ended && <><button className="btn w" onClick={onHint} style={smallBtn}>Hint</button>{' '}</>}
            <button className="btn w" onClick={onExplain} style={smallBtn}>What just happened?</button>
          </p>
          <p style={{ margin: '14px 0 4px' }}><b>Ask Pip:</b></p>
          {SCI.map((x, i) => <button key={i} className="lnk" onClick={() => onAsk(i)} style={{ display: 'block' }}>{x.q}</button>)}
        </div>
      </div>
    </section>
  );
}
