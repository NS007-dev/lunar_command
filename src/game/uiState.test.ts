/** Screen-state tests: buttons must not be able to break a mission. */
import { describe, expect, it } from 'vitest';
import { step } from './engine';
import { explain, hint, kidErr } from './mentor';
import { initialUI, uiReducer, type UIAction, type UIState } from './uiState';
import { SC } from './scenarios';

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

describe('end of the mission and replay', () => {
  const finished = () => {
    let u = ready();
    for (let i = 0; i < 12 && u.screen === 'mission'; i++) u = run([{ type: 'pick', k: 'rest' }, { type: 'confirm' }, { type: 'resolve' }], u);
    return u;
  };
  it('a finished mission shows the debrief', () => {
    const u = finished();
    expect(u.screen).toBe('debrief');
    expect(u.game?.ended).toBe(true);
  });
  it('replay fully resets the mission and keeps the chosen event', () => {
    const u = uiReducer(finished(), { type: 'replay' });
    expect([u.screen, u.game, u.sel, u.pending, u.prev, u.sc]).toEqual(['prep', null, [], null, null, 0]);
  });
  it('choosing another event drops the old mission', () => {
    expect(uiReducer(finished(), { type: 'go-event' }).game).toBe(null);
  });
});

describe("Pip's words", () => {
  it('"What happened?" quotes the real numbers from the record', () => {
    const u = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }, { type: 'resolve' }], ready());
    const h = u.game!.history[0], text = explain(u.game!);
    expect(text).toContain(`Battery ${h.powerStart} → ${h.powerEnd}`);
    expect(text).toContain(`Crew supplies ${h.lifeStart} → ${h.lifeEnd}`);
    expect(u.mentor).toBe(text);
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
