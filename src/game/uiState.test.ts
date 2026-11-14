/** Screen-state tests: buttons must not be able to break a mission. */
import { describe, expect, it } from 'vitest';
import { check, init, step } from './engine';
import { hint, kidErr, reportText } from './mentor';
import { RESTART_ASK, RESTART_KEPT, initialUI, uiReducer, type UIAction, type UIState } from './uiState';
import { K, SC, type ActionId, type Gadget } from './scenarios';

const run = (acts: UIAction[], from: UIState = initialUI) => acts.reduce(uiReducer, from);
const ready = (sc = 0): UIState => run([{ type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: sc }, { type: 'up', k: 'walls' }, { type: 'up', k: 'garden' }, { type: 'launch' }]);

describe('screen flow', () => {
  it('launch -> brief -> event -> prep -> mission', () => {
    expect(ready().screen).toBe('mission');
    expect(ready().game?.turn).toBe(1);
  });
  it('exactly two gadgets can be picked, and the mission cannot start with fewer', () => {
    let u = run([{ type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: 0 }, { type: 'up', k: 'lab' }]);
    expect(uiReducer(u, { type: 'launch' }).screen).toBe('prep');
    u = run([{ type: 'up', k: 'walls' }, { type: 'up', k: 'garden' }], u);
    expect(u.sel).toEqual(['lab', 'walls']);
    expect(uiReducer(u, { type: 'up', k: 'lab' }).sel).toEqual(['walls']);
  });
  it('choosing an event clears earlier gadget picks', () => {
    // Issue #3: events can only be chosen on the event screen, so go back there from gadget picking first.
    const picked = run([{ type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: 0 }, { type: 'up', k: 'walls' }, { type: 'up', k: 'garden' }]);
    const u = run([{ type: 'go-event' }, { type: 'ev', k: 1 }], picked);
    expect([u.sel, u.screen, u.sc]).toEqual([[], 'prep', 1]);
  });
});

describe('confirming a shift', () => {
  it('"Do it!" pressed twice plays the shift only once', () => {
    const u = run([{ type: 'pick', k: 'recycle' }, { type: 'confirm' }, { type: 'confirm' }, { type: 'resolve' }], ready());
    expect(u.game?.history.length).toBe(1);
    expect(u.game?.turn).toBe(2);
  });
  it('the shift plays exactly what the engine says (same as the preview)', () => {
    const before = ready(), shown = step(before.game!, 'shelter');
    const u = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }, { type: 'resolve' }], before);
    expect(shown.ok && JSON.stringify(u.game)).toBe(shown.ok && JSON.stringify(shown.state));
  });
  it('while the shift is playing out, other buttons cannot change which action happens', () => {
    const waiting = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }], ready());
    expect(waiting.resolving).toBe(true);
    for (const intruder of [{ type: 'pick', k: 'rest' }, { type: 'cancel' }, { type: 'hint' }, { type: 'expl' }, { type: 'sq', k: 0 }] as UIAction[]) {
      const u = run([intruder, { type: 'resolve' }], waiting);
      expect(u.game?.history.length).toBe(1);
      expect(u.game?.history[0].action).toBe('shelter');
      expect(u.game?.turn).toBe(2);
    }
  });
  it('cancel before confirming spends nothing', () => {
    const u = run([{ type: 'pick', k: 'shelter' }, { type: 'cancel' }], ready());
    expect([u.pending, u.game?.history.length]).toEqual([null, 0]);
  });
  it('the animation flag only lasts for the render right after a shift', () => {
    const u = run([{ type: 'pick', k: 'rest' }, { type: 'confirm' }, { type: 'resolve' }], ready());
    expect(u.tx).toBe(true);
    expect(uiReducer(u, { type: 'hint' }).tx).toBe(false);
    expect(u.prev).toBe(ready().game!.power);
  });
});

describe('end of the mission', () => {
  const finished = () => {
    let u = ready();
    for (let i = 0; i < 12 && !u.game?.ended; i++) u = run([{ type: 'pick', k: 'rest' }, { type: 'confirm' }, { type: 'resolve' }], u);
    // Issue #4: the last shift's report stays on the mission screen until "See your results".
    return uiReducer(u, { type: 'results' });
  };
  it('a finished mission shows the debrief', () => {
    const u = finished();
    expect(u.screen).toBe('debrief');
    expect(u.game?.ended).toBe(true);
  });
  it('choosing another event drops the old mission', () => {
    expect(uiReducer(finished(), { type: 'go-event' }).game).toBe(null);
  });
});

describe("Pip's words", () => {
  it('"What happened?" quotes the real numbers from the record', () => {
    const u = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }, { type: 'resolve' }], ready());
    const h = u.game!.history[0], text = reportText(u.report!);
    expect(text).toContain(`Power ${h.powerStart} → ${h.powerEnd}`);
    expect(text).toContain(`Crew supplies ${h.lifeStart} → ${h.lifeEnd}`);
    const again = uiReducer(uiReducer(u, { type: 'hint' }), { type: 'expl' });
    expect([again.showReport, again.report, again.announce]).toEqual([true, u.report, text]);
  });
  it('the hint mentions the right storm shifts once Earth has replied', () => {
    const replied = run([{ type: 'pick', k: 'message' }, { type: 'confirm' }, { type: 'resolve' }], ready()).game!;
    expect(hint(replied)).toContain(`shifts ${SC[0].at} to ${SC[0].at + SC[0].len - 1}`);
  });
  it('every engine refusal turns into a short kid-friendly sentence', () => {
    expect(kidErr('Not enough power: this costs 2 but only 1 is left after the base is looked after.')).toBe('Not enough power left for this.');
    expect(kidErr('Stay inside! Going outside in a radiation storm is risky.')).toContain('Stay inside');
    expect(kidErr('Something odd')).toBe('You cannot do this now.');
  });
});

describe('restart mission (issue #5)', () => {
  const doIt = (k: ActionId): UIAction[] => [{ type: 'pick', k }, { type: 'confirm' }, { type: 'resolve' }];
  /** A successful mission on event 2 that makes progress everywhere (science, shelter, garden, message, storm). */
  const WIN: ActionId[] = ['science', 'recycle', 'grow', 'shelter', 'shelter', 'message', 'rest', 'science'];
  const busy = (): UIState => {
    let u = ready(2);
    for (const a of WIN) {
      expect(check(u.game!, a).ok, a).toBe(true);
      u = run(doIt(a), u);
    }
    return uiReducer(u, { type: 'results' });
  };
  /** A mission where the crew runs out of supplies. */
  const critical = (): UIState => {
    const s = init(0, ['walls', 'garden']);
    if (!s.ok) throw new Error(s.error);
    const u = run(doIt('rest'), { ...ready(), game: { ...s.state, life: 1, turn: 2, science: 4, shield: 3 } });
    return uiReducer(u, { type: 'results' });
  };
  const endings: [string, () => UIState][] = [['a finished mission', busy], ['a critical failure', critical]];

  it('the test missions really end the way they say', () => {
    const b = busy().game!, c = critical().game!;
    expect([busy().screen, critical().screen]).toEqual(['debrief', 'debrief']);
    expect(c.outcome).toBe('critical');
    expect(b.outcome).toBe('success');
    expect(b.history.length).toBe(WIN.length);
    expect(b.science).toBeGreaterThan(0);
    expect(b.shield).toBeGreaterThan(0);
    expect(b.history.some(h => h.harvest > 0)).toBe(true); // food was planted and harvested
    expect(b.msgAt).not.toBe(null);
    expect(b.protectedShifts + b.exposure).toBeGreaterThan(0);
  });

  for (const [name, end] of endings) {
    describe(`after ${name}`, () => {
      it('"Restart mission" only asks first: the mission and results are untouched', () => {
        const d = end(), json = JSON.stringify(d.game);
        const u = uiReducer(d, { type: 'restart' });
        expect([u.screen, u.restartAsk, u.announce]).toEqual(['debrief', true, RESTART_ASK]);
        expect(u.game).toBe(d.game);
        expect(JSON.stringify(u.game)).toBe(json);
        expect([u.sel, u.sc, u.report, u.prev]).toEqual([d.sel, d.sc, d.report, d.prev]);
        // the screen is not redrawn and focus is not moved to the heading
        expect([u.renderId, u.focusHeading]).toEqual([d.renderId, false]);
      });
      it('"No, go back" closes the question and keeps the old mission exactly as it was', () => {
        const d = end(), json = JSON.stringify(d.game);
        const u = run([{ type: 'restart' }, { type: 'restart-no' }], d);
        expect([u.screen, u.restartAsk, u.announce]).toEqual(['debrief', false, RESTART_KEPT]);
        expect(u.game).toBe(d.game);
        expect(JSON.stringify(u.game)).toBe(json);
        // Everything except what the screen reader just heard is exactly as before (focusHeading is a one-off "move focus" flag).
        const { announce: _a, announceN: _n, focusHeading: _f, ...rest } = u, { announce: _b, announceN: _m, focusHeading: _g, ...before } = d;
        expect(rest).toEqual(before);
        // and the player can still ask again
        expect(uiReducer(u, { type: 'restart' }).restartAsk).toBe(true);
      });
      it('"Yes, restart!" drops the mission, the gadgets and the old feedback, and goes to choosing a Sun event', () => {
        const d = end();
        const u = run([{ type: 'restart' }, { type: 'restart-yes' }], d);
        expect(u.screen).toBe('event');
        expect([u.game, u.sel, u.pending, u.resolving, u.prev, u.report, u.showReport, u.mentor, u.announce, u.restartAsk])
          .toEqual([null, [], null, false, null, null, false, '', '', false]);
        expect(u.focusHeading).toBe(true);
        expect(u.renderId).toBeGreaterThan(d.renderId);
      });
      it('the next mission starts completely fresh, with nothing carried over', () => {
        const d = end(), old = d.game!;
        const picks: Gadget[] = ['lab', 'battery'];
        const restarted = run([{ type: 'restart' }, { type: 'restart-yes' }, { type: 'ev', k: 1 }], d);
        expect([restarted.screen, restarted.sc, restarted.sel]).toEqual(['prep', 1, []]);
        const u = run([...picks.map(k => ({ type: 'up', k }) as UIAction), { type: 'launch' }], restarted);
        const fresh = init(1, picks);
        expect(fresh.ok).toBe(true);
        expect(u.screen).toBe('mission');
        expect(u.game).toEqual(fresh.ok && fresh.state);
        const g = u.game!;
        expect([g.power, g.cap, g.life, g.shield, g.science, g.turn]).toEqual([7, 14, K.lifeStart, 0, 0, 1]);
        expect([g.history, g.plant, g.msgAt, g.protectedShifts, g.exposure, g.ended, g.outcome, g.score])
          .toEqual([[], null, null, 0, 0, false, null, null]);
        expect(g.loadout).toEqual(picks);
        expect([u.report, u.showReport, u.prev, u.pending, u.mentor, u.restartAsk]).toEqual([null, false, null, null, '', false]);
        expect(uiReducer(u, { type: 'expl' }).mentor).toMatch(/Nothing has happened yet/);
        // the old mission object is a different one and was never changed
        expect(g).not.toBe(old);
        expect(old.ended).toBe(true);
      });
      it('restarting with the same event and gadgets gives the same fresh start as a first mission', () => {
        const d = end(), sc = d.game!.sc;
        const u = run([{ type: 'restart' }, { type: 'restart-yes' }, { type: 'ev', k: sc }, { type: 'up', k: 'walls' }, { type: 'up', k: 'garden' }, { type: 'launch' }], d);
        expect(u.game).toEqual(ready(sc).game);
      });
    });
  }

  it('choosing a Sun event after restarting starts with no gadgets picked', () => {
    const u = run([{ type: 'restart' }, { type: 'restart-yes' }, { type: 'ev', k: 2 }], busy());
    expect(u.sel).toEqual([]);
    expect(uiReducer(u, { type: 'launch' }).screen).toBe('prep'); // can't blast off without picking again
  });
  it('"Yes, restart!" does nothing unless Pip asked first', () => {
    const d = busy();
    expect(uiReducer(d, { type: 'restart-yes' })).toBe(d);
    expect(uiReducer(d, { type: 'restart-no' })).toBe(d);
    expect(uiReducer(run([{ type: 'restart' }, { type: 'restart-no' }], d), { type: 'restart-yes' }).screen).toBe('debrief');
  });
  it('asking twice does not stack questions', () => {
    const u = uiReducer(busy(), { type: 'restart' });
    expect(uiReducer(u, { type: 'restart' })).toBe(u);
  });
  it('restart buttons are ignored on every other screen', () => {
    const mid = run(doIt('shelter'), ready());
    const others = [initialUI, run([{ type: 'go-brief' }]), run([{ type: 'go-brief' }, { type: 'go-event' }]),
      run([{ type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: 0 }, { type: 'up', k: 'lab' }]), ready(), mid];
    for (const u of others) for (const type of ['restart', 'restart-no', 'restart-yes'] as const) expect(uiReducer(u, { type }), `${type} on ${u.screen}`).toBe(u);
    // even if the flag were somehow left on, a running mission can't be thrown away
    const sneaky = { ...mid, restartAsk: true };
    expect(uiReducer(sneaky, { type: 'restart-yes' })).toBe(sneaky);
    expect(mid.game?.history.length).toBe(1);
  });
  it('restart buttons are ignored while a shift is playing out', () => {
    const waiting = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }], ready());
    for (const type of ['restart', 'restart-no', 'restart-yes'] as const) expect(uiReducer(waiting, { type })).toBe(waiting);
  });
  it('"Try another Sun event" still works, also while Pip is asking', () => {
    for (const d of [busy(), uiReducer(busy(), { type: 'restart' })]) {
      const u = uiReducer(d, { type: 'go-event' });
      expect([u.screen, u.game, u.restartAsk, u.focusHeading]).toEqual(['event', null, false, true]);
      const next = run([{ type: 'ev', k: 1 }, { type: 'up', k: 'lab' }, { type: 'up', k: 'walls' }, { type: 'launch' }], u);
      const fresh = init(1, ['lab', 'walls']);
      expect(next.game).toEqual(fresh.ok && fresh.state);
    }
  });
  it('a later mission\'s results never open with the old question showing', () => {
    let u = run([{ type: 'restart' }, { type: 'go-event' }, { type: 'ev', k: 0 }, { type: 'up', k: 'walls' }, { type: 'up', k: 'garden' }, { type: 'launch' }], busy());
    for (let i = 0; i < 12 && !u.game?.ended; i++) u = run(doIt('rest'), u);
    expect(uiReducer(u, { type: 'results' }).restartAsk).toBe(false);
  });
});
