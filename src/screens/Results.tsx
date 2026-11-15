import { useEffect, useRef } from 'react';
import { Confetti } from '../components/Confetti';
import { HistoryBars } from '../components/HistoryBars';
import { PipSays, type PipMood } from '../components/Pip';
import { Sources } from '../components/Sources';
import { EVT } from '../data/scienceFacts';
import { failure } from '../game/mentor';
import { K, SC, UP } from '../game/scenarios';
import type { GameState, Outcome } from '../game/types';
import { RESTART_ASK } from '../game/uiState';

/** Mission debrief: outcome, score breakdown, charts and what we learned. */
export function Results({ s, asking = false, onRestart, onRestartYes, onRestartNo, onOtherEvent }: {
  s: GameState;
  /** Pip is asking whether to restart */
  asking?: boolean;
  onRestart: () => void; onRestartYes: () => void; onRestartNo: () => void; onOtherEvent: () => void;
}) {
  // After "No, keep my results", put keyboard focus back on "Play again" so keyboard users keep their place.
  const restartBtn = useRef<HTMLButtonElement>(null), wasAsking = useRef(asking);
  useEffect(() => {
    if (wasAsking.current && !asking) restartBtn.current?.focus();
    wasAsking.current = asking;
  }, [asking]);
  const o = s.outcome as Outcome, sco = s.score!, e = SC[s.sc], ex = s.exposure;
  // Why a critical mission stopped: power or supplies, with the real numbers from the last shift.
  const lastShift = s.history[s.history.length - 1], f = o === 'critical' && lastShift && !lastShift.safe ? failure(lastShift) : null;
  const T: Record<Outcome, [string, string, string, PipMood]> = {
    critical: ['Mission stopped', f ? f.title : 'Oh no! The base could not keep going', `${f ? f.detail : 'The crew could not keep going, so the mission stopped.'} That is okay! Look at the bars, then try a different plan.`, 'worried'],
    success: ['Mission success', 'You did it, Commander!', 'The crew survived, stayed protected for the whole radiation storm, and you won the science stars. Great planning!', 'cheer'],
    survival: ex > 0
      ? ['Crew survived', 'The crew survived, but not fully protected', `Everyone survived. But in ${ex} storm shift${ex > 1 ? 's' : ''}, your shelter was too weak, so the crew got extra radiation and would need a health check. You get points for surviving, and separate points for staying safe in the storm.`, 'worried']
      : ['Crew survived', 'The crew is safe and protected!', `Everyone survived and stayed protected, but you did not get all ${K.goal} science stars. Try again!`, 'happy'],
  };
  const t = T[o], g = s.history.find(x => x.action === 'grow'), sci = s.history.filter(x => x.action === 'science').length;
  const pts: string[] = [];
  pts.push(o === 'critical' && s.protectedShifts + ex < e.len
    ? 'The mission ended before the storm was over.'
    : ex
      ? `The radiation storm lasted ${e.len} shift${e.len > 1 ? 's' : ''}. Your shelter was strong enough for ${s.protectedShifts} and too weak for ${ex}. Next time, start building earlier. Each shelter job costs power!`
      : `The radiation storm lasted ${e.len} shift${e.len > 1 ? 's' : ''} and your shelter (${s.shield} layers) was strong enough every time. Great job!`);
  pts.push('A flare is a super-bright flash of light and X-rays. A radiation storm is a shower of tiny fast bits. Scientists measure them in different ways, so a flare\'s X number does not tell you how much radiation reached the crew.');
  pts.push(g ? `You planted food on shift ${g.turn}. Food takes 3 shifts to grow, and then adds crew supplies.` : 'You never planted food. Growing food uses power and water now, but gives supplies later.');
  pts.push(`A hill's shadow cut the sun on ${e.shadow[1] > e.shadow[0] ? `shifts ${e.shadow[0]} to ${e.shadow[1]}` : `shift ${e.shadow[0]}`}. You did ${sci} experiment${sci === 1 ? '' : 's'} for ${s.science} science star${s.science === 1 ? '' : 's'}. You can't do everything, so crews plan ahead!`);
  // Labels only: the points themselves come straight from the score (scoring.ts).
  const rows: [string, number, number][] = [['Crew survived', sco.survive, 25], ['Safe in the storm', sco.protect, 25], ['Crew supplies left', sco.supplies, 20], ['Battery power left', sco.power, 10], ['Science stars', sco.science, 20]];

  return (
    <section style={{ paddingTop: '3vh' }}>
      {o === 'success' && <Confetti />}
      <span className="tag">{t[0]}</span>
      <h2 style={{ margin: '14px 0' }}>{t[1]}</h2>
      <PipSays mood={t[3]} tone={o === 'critical' ? 'bad' : o === 'survival' && ex > 0 ? 'warn' : 'good'} style={{ maxWidth: 720 }}>{t[2]}</PipSays>
      <div className="cols">
        <div className="card">
          <h3>Score: {sco.total} out of 100</h3>
          <p style={{ margin: '0 0 6px' }}>You win points for each part of the mission. A fuller bar means more points! Crew supplies and battery power you still have at the end give extra points.</p>
          {rows.map(r => {
            const val = r[1].toFixed(r[1] % 1 ? 1 : 0);
            return (
              <div key={r[0]} className="score"><span>{r[0]}</span><span className="t"><i style={{ width: `${r[1] / r[2] * 100}%` }}></i></span>
                <span><span aria-hidden="true">{val}/{r[2]}</span><span className="sr-only">{val} out of {r[2]} points</span></span></div>
            );
          })}
          <p style={{ marginBottom: 0 }}>Gadgets: <b>{s.loadout.map(k => UP[k]).join(' and ')}</b></p>
        </div>
        <div className="card">
          <h3>What happened each shift</h3>
          <HistoryBars s={s} field="powerEnd" max={s.cap} label="Battery power" />
          <HistoryBars s={s} field="lifeEnd" max={K.lifeCap} label="Crew supplies" />
        </div>
      </div>
      <div className="cols">
        <div className="card" style={{ background: '#d3f5e8' }}><h3>What we learned</h3>{pts.map((p, i) => <p key={i}>{p}</p>)}</div>
        <div className="card" style={{ background: '#fff' }}>
          <h3>Real record: {e.date}</h3>
          <p><span className="tg n">Flare</span>{EVT[e.id].flare}</p>
          <p><span className="tg n">Storm</span>{EVT[e.id].storm}</p>
          <p><span className="tg r">Game</span>Shelter needs {e.req} layers, and the storm lasts {e.len} shifts. These are made-up game numbers, not real radiation measurements.</p>
        </div>
      </div>
      <div style={{ marginTop: 20 }}><Sources /></div>
      {asking ? (
        <div className="pop" role="group" aria-labelledby="restart-q" style={{ marginTop: 26 }}>
          <PipSays mood="worried" tone="warn" style={{ maxWidth: 720 }}><span id="restart-q">{RESTART_ASK}</span></PipSays>
          <p style={{ marginTop: 18 }}>
            <button className="btn g" onClick={onRestartYes}>Yes, new mission!</button>{'   '}
            {/* The safe choice gets focus first. */}
            <button className="btn w" onClick={onRestartNo} autoFocus>No, keep my results</button>
          </p>
        </div>
      ) : (
        <p style={{ marginTop: 26 }}>
          <button className="btn" ref={restartBtn} onClick={onRestart}>Play again <span aria-hidden="true">↻</span></button>{'   '}
          <button className="btn w" onClick={onOtherEvent}>Try another Sun event</button>
        </p>
      )}
    </section>
  );
}
