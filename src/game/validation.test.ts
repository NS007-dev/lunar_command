/**
 * Invalid-action tests (GitHub issue #3).
 * Invalid actions must be refused, explained clearly, and must never change the game state,
 * whether they reach the engine directly or come through the screen buttons.
 * Run with:  npm test
 */
import { describe, expect, it } from 'vitest';
import { SCI } from '../data/scienceFacts';
import { check, init, plan, step } from './engine';
import { GENERIC_REFUSAL, reason } from './mentor';
import { ACTS, K, SC, UP, inStorm, type ActionId, type Gadget } from './scenarios';
import type { GameState } from './types';
import { TOO_MANY_GADGETS, initialUI, uiReducer, type Screen, type UIAction, type UIState } from './uiState';

// ---------- helpers ----------
const start = (sc: number, g: Gadget[]): GameState => {
  const r = init(sc, g);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const LG: Gadget[] = ['lab', 'garden'], BW: Gadget[] = ['battery', 'walls'], WG: Gadget[] = ['walls', 'garden'];
const GADGETS = Object.keys(UP) as Gadget[];
const PAIRS: Gadget[][] = GADGETS.flatMap((a, i) => GADGETS.slice(i + 1).map(b => [a, b]));
const run = (acts: UIAction[], from: UIState = initialUI) => acts.reduce(uiReducer, from);
const toEvent = () => run([{ type: 'go-brief' }, { type: 'go-event' }]);
const toPrep = (picks: Gadget[] = []) => run([{ type: 'ev', k: 0 }, ...picks.map(k => ({ type: 'up', k }) as UIAction)], toEvent());
const ready = () => run([{ type: 'launch' }], toPrep(['walls', 'garden']));
const finished = () => {
  let u = ready();
  for (let i = 0; i < 12 && !u.game?.ended; i++) u = run([{ type: 'pick', k: 'rest' }, { type: 'confirm' }, { type: 'resolve' }], u);
  return uiReducer(u, { type: 'results' }); // Issue #4: the last report shows first
};
/** A mission screen showing the given game. */
const onMission = (g: GameState): UIState => ({ ...ready(), game: g });
function rng(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
}

/** One state for every way the engine can refuse an action, with the engine's exact message. */
const REFUSALS: { name: string; s: GameState; a: ActionId; error: string }[] = [
  { name: 'experiment during a storm', s: { ...start(0, LG), turn: SC[0].at }, a: 'science', error: 'Stay inside! Going outside in a radiation storm is risky.' },
  { name: 'experiment with all stars', s: { ...start(0, LG), science: K.sciMax }, a: 'science', error: 'You already have all the stars!' },
  { name: 'recycle with full supplies', s: { ...start(0, LG), life: K.lifeCap }, a: 'recycle', error: 'Crew supplies are already full.' },
  { name: 'plant while a garden grows', s: { ...start(0, LG), plant: 4 }, a: 'grow', error: 'Your garden is already growing.' },
  { name: 'plant on the harvest shift', s: { ...start(0, LG), plant: 1 }, a: 'grow', error: 'Your garden is already growing.' },
  { name: 'plant too late', s: { ...start(0, LG), turn: K.shifts - K.growIn + 1 }, a: 'grow', error: 'Too late! Food needs 3 shifts to grow.' },
  { name: 'shelter at its maximum', s: { ...start(0, LG), shield: K.shieldCap }, a: 'shelter', error: 'The shelter is as strong as it can be.' },
  { name: 'second message to Earth', s: { ...start(0, LG), turn: 2, msgAt: 1 }, a: 'message', error: 'Earth already got your message.' },
  { name: 'experiment with too few supplies', s: { ...start(0, LG), life: 2 }, a: 'science', error: 'Crew supplies are too low for this.' },
  { name: 'plant with too few supplies', s: { ...start(0, LG), life: 2 }, a: 'grow', error: 'Crew supplies are too low for this.' },
  { name: 'job that costs more power than is left', s: { ...start(0, LG), power: 0 }, a: 'shelter', error: 'Not enough power: this costs 2 but only 1 is left after the base is looked after.' },
  { name: 'any job after the mission ended', s: { ...start(0, LG), ended: true }, a: 'rest', error: 'Mission is over.' },
  { name: 'an unknown job', s: start(0, LG), a: 'dance' as ActionId, error: 'Unknown action.' },
];

// ---------- 1. the engine refuses, and changes nothing ----------
describe('engine refusals', () => {
  for (const c of REFUSALS) {
    it(`refuses: ${c.name}, without changing the state`, () => {
      const before = structuredClone(c.s), json = JSON.stringify(c.s);
      expect(step(c.s, c.a)).toEqual({ ok: false, error: c.error });
      expect(check(c.s, c.a)).toEqual({ ok: false, error: c.error });
      expect(c.s).toEqual(before);
      expect(JSON.stringify(c.s)).toBe(json);
    });
  }
  it('check() agrees with step() on every action of many random missions, and never changes the state', () => {
    const rand = rng(7);
    for (let k = 0; k < SC.length; k++) for (const p of PAIRS) for (let m = 0; m < 20; m++) {
      let s = start(k, p);
      while (!s.ended) {
        const json = JSON.stringify(s);
        for (const a of ACTS) expect(check(s, a).ok).toBe(step(s, a).ok);
        expect(JSON.stringify(s)).toBe(json);
        const ok = ACTS.filter(a => check(s, a).ok), r = step(s, ok[Math.floor(rand() * ok.length)]);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
      }
    }
  });
});

// ---------- 2. resource limits ----------
describe('resource limits', () => {
  it('power, supplies, shelter and stars stay inside their limits on every shift of many random missions', () => {
    const rand = rng(99);
    for (let k = 0; k < SC.length; k++) for (const p of PAIRS) for (let m = 0; m < 40; m++) {
      let s = start(k, p);
      while (!s.ended) {
        const ok = ACTS.filter(a => check(s, a).ok), r = step(s, ok[Math.floor(rand() * ok.length)]);
        if (!r.ok) throw new Error(r.error);
        s = r.state;
        expect(s.power).toBeGreaterThanOrEqual(0); expect(s.power).toBeLessThanOrEqual(s.cap);
        expect(s.life).toBeGreaterThanOrEqual(0); expect(s.life).toBeLessThanOrEqual(K.lifeCap);
        expect(s.shield).toBeGreaterThanOrEqual(0); expect(s.shield).toBeLessThanOrEqual(K.shieldCap);
        expect(s.science).toBeGreaterThanOrEqual(0); expect(s.science).toBeLessThanOrEqual(K.sciMax);
      }
    }
  });
  it('a full battery stays full when resting (10 normal, 14 Big Battery)', () => {
    const r1 = step({ ...start(0, LG), power: 10 }, 'rest'), r2 = step({ ...start(0, BW), power: 14 }, 'rest');
    expect(r1.ok && r1.state.power).toBe(10);
    expect(r2.ok && r2.state.power).toBe(14);
  });
  it('Thick Walls stops at 6 layers, and stars stop at 6', () => {
    const w = step({ ...start(0, WG), shield: 5 }, 'shelter'), sci = step({ ...start(0, LG), science: 4 }, 'science');
    expect(w.ok && w.state.shield).toBe(K.shieldCap);
    expect(sci.ok && sci.state.science).toBe(K.sciMax);
  });
  it('recycling on a harvest shift still stops at 10 supplies before the crew uses 1', () => {
    const r = step({ ...start(0, LG), life: 9, plant: 1 }, 'recycle');
    expect(r.ok && [r.rec.harvest, r.state.life]).toEqual([K.harvest, K.lifeCap - K.use]);
  });
});

// ---------- 3. storm and garden rules (unchanged) ----------
describe('storm rules', () => {
  it('during every storm shift, only experiments are refused because of the storm; shelter is always allowed', () => {
    SC.forEach((sc, k) => {
      for (let t = 1; t <= K.shifts; t++) {
        if (!inStorm(sc, t)) continue;
        const s: GameState = { ...start(k, BW), turn: t, power: 8 };
        expect(plan(s, 'science').error).toMatch(/Stay inside/);
        for (const a of ['shelter', 'recycle', 'message', 'rest'] as ActionId[]) expect(check(s, a)).toEqual({ ok: true });
        const g = plan(s, 'grow').error; // planting is only ever refused for being too late, never for the storm
        expect(g === undefined || g.startsWith('Too late')).toBe(true);
      }
    });
  });
});

describe('garden rules', () => {
  it('a second garden is refused until the first is harvested, then planting works again', () => {
    let s = start(0, LG);
    for (const a of ['grow', 'rest', 'rest'] as ActionId[]) {
      const r = step(s, a);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
      if (s.turn < 4) expect(check(s, 'grow')).toEqual({ ok: false, error: 'Your garden is already growing.' });
    }
    expect([s.turn, s.plant]).toEqual([4, 4]);
    expect(check(s, 'grow').ok).toBe(false); // harvest shift: the garden is still busy
    expect(reason('Your garden is already growing.', s)).toMatch(/ready to pick this shift/);
    const h = step(s, 'rest');
    expect(h.ok && [h.rec.harvest, h.state.plant]).toEqual([K.harvest, null]);
    if (h.ok) expect(check(h.state, 'grow')).toEqual({ ok: true });
  });
});

// ---------- 4. clear messages ----------
describe('explanations', () => {
  it('every engine refusal gets a specific explanation, never the generic one', () => {
    for (const c of REFUSALS) {
      const text = reason(c.error, c.s);
      expect(text, c.name).not.toBe(GENERIC_REFUSAL);
      expect(text.length).toBeGreaterThan(10);
    }
  });
  it('the power explanation keeps the cost and the power left', () => {
    expect(reason('Not enough power: this costs 2 but only 1 is left after the base is looked after.'))
      .toBe('Not enough battery power! This job needs 2. After the sun charges the battery and the base uses its 2, you will only have 1. Try a cheaper job, or Rest: it costs nothing, and the sun still charges the battery.');
  });
  it('the storm explanation says experiments wait for the storm to end', () => {
    expect(reason(REFUSALS[0].error)).toMatch(/wait until the storm is over/);
  });
  it('messages the game does not know fall back to the friendly generic sentence', () => {
    expect(reason('Something odd')).toBe(GENERIC_REFUSAL);
  });
});

// ---------- 5. buttons on the wrong screen are ignored ----------
describe('screen guards', () => {
  const SCREENS: Record<Screen, () => UIState> = {
    launch: () => initialUI, brief: () => run([{ type: 'go-brief' }]), event: toEvent, prep: () => toPrep(['walls', 'garden']),
    mission: ready, debrief: finished,
  };
  const ALLOWED: Record<UIAction['type'], Screen[]> = {
    'go-brief': ['launch'], 'go-event': ['brief', 'prep', 'debrief'], ev: ['event'], up: ['prep'], launch: ['prep'],
    pick: ['mission'], cancel: ['mission'], confirm: ['mission'], resolve: ['mission'], hint: ['mission'], expl: ['mission'], sq: ['mission'], rq: ['mission'],
    results: ['mission'], restart: ['debrief'], 'restart-no': ['debrief'], 'restart-yes': ['debrief'],
  };
  const ACTIONS: UIAction[] = [
    { type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: 1 }, { type: 'up', k: 'lab' }, { type: 'launch' }, { type: 'pick', k: 'rest' },
    { type: 'cancel' }, { type: 'confirm' }, { type: 'resolve' }, { type: 'hint' }, { type: 'expl' }, { type: 'sq', k: 0 }, { type: 'rq', k: 0 }, { type: 'results' },
    { type: 'restart' }, { type: 'restart-no' }, { type: 'restart-yes' },
  ];
  for (const [screen, make] of Object.entries(SCREENS) as [Screen, () => UIState][]) {
    it(`on the ${screen} screen, buttons from other screens change nothing`, () => {
      const u = make();
      expect(u.screen).toBe(screen);
      for (const a of ACTIONS) if (!ALLOWED[a.type].includes(screen)) expect(uiReducer(u, a), `${a.type} on ${screen}`).toBe(u);
    });
  }
  it('"launch" or "Yes, restart!" during a mission cannot restart it', () => {
    const mid = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }, { type: 'resolve' }], ready());
    expect(uiReducer(mid, { type: 'launch' })).toBe(mid);
    expect(uiReducer(mid, { type: 'restart-yes' })).toBe(mid);
    expect(uiReducer(mid, { type: 'go-event' })).toBe(mid);
    expect(mid.game?.history.length).toBe(1);
  });
  it('"resolve" without "Do it!" does not play a shift', () => {
    const u = run([{ type: 'pick', k: 'shelter' }], ready());
    expect(uiReducer(u, { type: 'resolve' })).toBe(u);
  });
});

// ---------- 6. unavailable jobs never reach "Do it!" ----------
describe('unavailable jobs', () => {
  for (const c of REFUSALS) {
    it(`picking it is refused with a reason and the game is untouched: ${c.name}`, () => {
      const u = onMission(c.s), json = JSON.stringify(c.s);
      const p = uiReducer(u, { type: 'pick', k: c.a });
      expect(p.game).toBe(u.game);
      expect(JSON.stringify(p.game)).toBe(json);
      expect([p.pending, p.resolving, p.mentor]).toEqual([null, false, reason(c.error, c.s)]);
      // and "Do it!" plus the timer's "resolve" can't sneak it through
      const after = run([{ type: 'confirm' }, { type: 'resolve' }], p);
      expect(after.game).toBe(u.game);
      expect(after.resolving).toBe(false);
    });
  }
  it('a refused pick replaces an earlier valid preview instead of keeping it', () => {
    const g = start(0, LG), u = run([{ type: 'pick', k: 'rest' }], onMission({ ...g, shield: K.shieldCap }));
    expect(u.pending).toBe('rest');
    expect(uiReducer(u, { type: 'pick', k: 'shelter' }).pending).toBe(null);
  });
  it('"Do it!" checks the job again and refuses it if it is no longer possible', () => {
    const picked = run([{ type: 'pick', k: 'shelter' }], ready());
    const stale: UIState = { ...picked, game: { ...picked.game!, shield: K.shieldCap } };
    const c = uiReducer(stale, { type: 'confirm' });
    expect([c.resolving, c.pending, c.game]).toEqual([false, null, stale.game]);
    expect(c.mentor).toMatch(/as strong as it can be/);
  });
  it('refusals keep the screen in place (no redraw, no focus jump) so the reason can be read out', () => {
    const u = onMission({ ...start(0, LG), shield: K.shieldCap }), p = uiReducer(u, { type: 'pick', k: 'shelter' });
    expect([p.renderId, p.focusHeading]).toEqual([u.renderId, false]);
  });
});

// ---------- 7. gadgets, events and Pip's questions ----------
describe('gadget choice', () => {
  it('a third gadget is refused with a message, and the first two stay picked', () => {
    const u = toPrep(['walls', 'garden']), r = uiReducer(u, { type: 'up', k: 'lab' });
    expect(r.sel).toEqual(['walls', 'garden']);
    expect(r.mentor).toBe(TOO_MANY_GADGETS);
    expect(r.mentor).toMatch(/only bring 2/);
    expect([r.renderId, r.focusHeading]).toEqual([u.renderId, false]);
  });
  it('removing a pick clears the message and lets another gadget be chosen', () => {
    const r = run([{ type: 'up', k: 'lab' }, { type: 'up', k: 'walls' }, { type: 'up', k: 'lab' }], toPrep(['walls', 'garden']));
    expect([r.sel, r.mentor]).toEqual([['garden', 'lab'], '']);
  });
  it('gadgets that do not exist are ignored', () => {
    const u = toPrep(['walls']);
    for (const k of ['nope', 'toString', 'constructor', '', 3]) expect(uiReducer(u, { type: 'up', k: k as Gadget })).toBe(u);
  });
  it('blast off with too few gadgets explains what is missing', () => {
    const none = uiReducer(toPrep(), { type: 'launch' }), one = uiReducer(toPrep(['lab']), { type: 'launch' });
    expect([none.screen, none.game]).toEqual(['prep', null]);
    expect(none.mentor).toBe('Pick 2 gadgets before blast off. You have not picked any yet. Tap a gadget to pick it.');
    expect([one.screen, one.game, one.mentor]).toEqual(['prep', null, 'Pick 1 more gadget before blast off.']);
  });
  it('the launch message is cleared on the mission screen', () => {
    const u = run([{ type: 'launch' }, { type: 'up', k: 'walls' }, { type: 'up', k: 'garden' }, { type: 'launch' }], toPrep());
    expect([u.screen, u.mentor]).toEqual(['mission', '']);
  });
});

describe('event and question choices', () => {
  it('events that do not exist are ignored', () => {
    const u = toEvent();
    for (const k of [-1, SC.length, 1.5, NaN, '0']) expect(uiReducer(u, { type: 'ev', k: k as number })).toBe(u);
    expect(uiReducer(u, { type: 'ev', k: SC.length - 1 }).sc).toBe(SC.length - 1);
  });
  it('questions to Pip that do not exist are ignored instead of crashing', () => {
    const u = ready();
    for (const k of [-1, SCI.length, 0.5, NaN]) expect(() => uiReducer(u, { type: 'sq', k })).not.toThrow();
    for (const k of [-1, SCI.length, 0.5, NaN]) expect(uiReducer(u, { type: 'sq', k })).toBe(u);
    expect(uiReducer(u, { type: 'sq', k: 0 }).mentor).toBe(SCI[0].a);
  });
});
