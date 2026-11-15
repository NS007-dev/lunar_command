/**
 * Scenario tests (GitHub issue #6): each of the three Sun events played on purpose, shift by shift.
 * Generic rules (costs, caps, the every-plan search) live in mechanics.test.ts; this file checks what each
 * event's own settings (storm shifts, shelter needed, hill shadow) do to a mission.
 * Run with:  npm test
 */
import { describe, expect, it } from 'vitest';
import { init, plan, step } from './engine';
import { hint, shiftReport, stormNews } from './mentor';
import { K, SC, type ActionId, type Gadget } from './scenarios';
import { finish } from './scoring';
import { JAN26_LATE_SHELTER, JANUARY_2026, MARCH_2024, SEPTEMBER_2017, WINS, play, type ScriptedMission } from './testMissions';
import type { GameState, ShiftRecord } from './types';
import { initialUI, uiReducer, type UIAction } from './uiState';

// ---------- the three events, written out by hand ----------
// Kept as literals on purpose: if a scenario's settings change, these tests say so.
const EVENTS = [
  { k: MARCH_2024, name: 'March 23, 2024', date: 'March 23, 2024', first: 5, last: 6, len: 2, req: 2, shadow: '3 to 4', jobs: { walls: 1, plain: 1 } },
  { k: SEPTEMBER_2017, name: 'September 10, 2017', date: 'September 10, 2017', first: 4, last: 5, len: 2, req: 3, shadow: '6 to 7', jobs: { walls: 1, plain: 2 } },
  { k: JANUARY_2026, name: 'January 19, 2026', date: 'January 19, 2026', first: 5, last: 7, len: 3, req: 4, shadow: '2', jobs: { walls: 2, plain: 2 } },
] as const;
const WIN_OF = { [MARCH_2024]: WINS.mar24, [SEPTEMBER_2017]: WINS.sep17, [JANUARY_2026]: WINS.jan26 };

// ---------- helpers ----------
const WALLS: Gadget[] = ['walls', 'battery'], PLAIN: Gadget[] = ['lab', 'battery'];
const fresh = (k: number, g: Gadget[]): GameState => {
  const r = init(k, g);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const ok = (s: GameState, a: ActionId) => {
  const r = step(s, a);
  if (!r.ok) throw new Error(`${a} was refused on shift ${s.turn}: ${r.error}`);
  return r;
};
/** Replays a scripted mission, keeping the state before and after every shift. */
const replay = (m: ScriptedMission) => {
  let s = fresh(m.sc, m.gadgets);
  return m.actions.map(a => {
    const before = s, { rec, state } = ok(s, a);
    s = state;
    return { before, rec, after: state };
  });
};
const rests = (n: number): ActionId[] => Array.from({ length: n }, () => 'rest');
const stormRows = (h: ShiftRecord[]) => h.filter(r => r.storm).map(r => [r.turn, r.storm!.n, r.storm!.of, r.storm!.ok]);
const allOk = (e: (typeof EVENTS)[number]) => Array.from({ length: e.len }, (_, i) => [e.first + i, i + 1, e.len, true]);

/**
 * Plays from the shift just before the storm to the shift just after it, starting with the given shelter.
 * Lab + Big Battery (shelter jobs add 2) and plenty of power and supplies, so only the shelter decides the result.
 */
function aroundStorm(k: number, shield: number, actions: ActionId[]) {
  let s: GameState = { ...fresh(k, PLAIN), turn: SC[k].at - 1, shield, power: 8, life: 9 };
  const recs = actions.map(a => {
    const r = ok(s, a);
    s = r.state;
    return r.rec;
  });
  return { s, recs };
}

describe('the three Sun events', () => {
  it('each event has the storm shifts, shelter need and hill shadow written above', () => {
    for (const e of EVENTS) {
      const sc = SC[e.k];
      expect([sc.date, sc.at, sc.at + sc.len - 1, sc.len, sc.req], e.name).toEqual([e.date, e.first, e.last, e.len, e.req]);
    }
    expect(SC.map(s => s.id)).toEqual(['mar24', 'sep17', 'jan26']);
  });
});

// ---------- 1. winning missions ----------
describe('a scripted winning mission for each event', () => {
  const SCORE = { [MARCH_2024]: 70, [SEPTEMBER_2017]: 69, [JANUARY_2026]: 67 };
  for (const e of EVENTS) {
    const m = WIN_OF[e.k];
    describe(e.name, () => {
      it(`ends in success: no exposure, all ${e.len} storm shifts protected, at least ${K.goal} stars`, () => {
        const s = play(m);
        expect([s.ended, s.outcome, s.exposure, s.protectedShifts]).toEqual([true, 'success', 0, e.len]);
        expect(s.science).toBeGreaterThanOrEqual(K.goal);
        expect(s.history).toHaveLength(K.shifts);
        expect(s.score!.total).toBe(SCORE[e.k]);
        expect([s.score!.survive, s.score!.protect]).toEqual([25, 25]);
      });
      it('every shift matches the hand-worked power, supplies, shelter and stars', () => {
        let stars = 0;
        const got = play(m).history.map(h => [h.turn, h.action, h.powerEnd, h.lifeEnd, h.shield, (stars += h.sci)]);
        expect(got).toEqual(m.trace);
      });
      it(`the storm is recorded on shifts ${e.first} to ${e.last}, and the shelter was enough each time`, () => {
        expect(stormRows(play(m).history)).toEqual(allOk(e));
      });
      it('plays out the same through the mission screen, ending on the results screen', () => {
        const doIt = (k: ActionId): UIAction[] => [{ type: 'pick', k }, { type: 'confirm' }, { type: 'resolve' }];
        const steps: UIAction[] = [
          { type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: e.k }, ...m.gadgets.map(k => ({ type: 'up', k }) as UIAction), { type: 'launch' },
          ...m.actions.flatMap(doIt), { type: 'results' },
        ];
        const u = steps.reduce(uiReducer, initialUI);
        expect([u.screen, u.game?.outcome]).toEqual(['debrief', 'success']);
        expect(u.game).toEqual(play(m));
      });
    });
  }
});

// ---------- 2. shelter requirements ----------
describe('shelter requirements', () => {
  for (const e of EVENTS) {
    it(`${e.name}: shelter ${e.req} takes ${e.jobs.walls} job(s) with Thick Walls and ${e.jobs.plain} without`, () => {
      for (const [g, per, want] of [[WALLS, 3, e.jobs.walls], [PLAIN, 2, e.jobs.plain]] as const) {
        let s = fresh(e.k, [...g]), jobs = 0;
        while (s.shield < e.req) { s = ok(s, 'shelter').state; jobs++; }
        expect(jobs, g.join('+')).toBe(want);
        expect(s.shield).toBe(per * jobs);
        expect(per * (jobs - 1)).toBeLessThan(e.req); // one job fewer is not enough
      }
    });
  }
  // The shelter values a player can actually build: 2, 4, 6 (plain) or 3, 6 (Thick Walls), plus 1 below the smallest need.
  const ENOUGH: Record<number, Record<number, boolean>> = {
    [MARCH_2024]: { 1: false, 2: true, 3: true, 4: true, 6: true },
    [SEPTEMBER_2017]: { 1: false, 2: false, 3: true, 4: true, 6: true },
    [JANUARY_2026]: { 1: false, 2: false, 3: false, 4: true, 6: true },
  };
  for (const e of EVENTS) {
    it(`${e.name}: shelter ${e.req - 1} leaves the crew exposed, shelter ${e.req} or more protects them`, () => {
      for (const [shield, safe] of Object.entries(ENOUGH[e.k])) {
        const r = ok({ ...fresh(e.k, PLAIN), turn: e.first, shield: Number(shield), power: 8, life: 8 }, 'rest');
        expect(r.rec.storm, `shelter ${shield}`).toEqual({ req: e.req, shield: Number(shield), ok: safe, n: 1, of: e.len });
        expect([r.state.protectedShifts, r.state.exposure]).toEqual(safe ? [1, 0] : [0, 1]);
      }
    });
  }
});

// ---------- 3. storm timing and boundaries ----------
describe('storm timing', () => {
  for (const e of EVENTS) {
    describe(e.name, () => {
      // Lab + Big Battery: each shelter job adds 2, so starting at need − 2 means exactly one job is missing.
      const short = e.req - 2;
      it(`shelter finished on shift ${e.first - 1} (just before the storm) protects every storm shift`, () => {
        const { s, recs } = aroundStorm(e.k, short, ['shelter', ...rests(e.len + 1)]);
        expect(recs[0].storm).toBe(null); // the shift before the storm is not a storm shift
        expect(recs[recs.length - 1].storm).toBe(null); // nor is the shift after it
        expect(stormRows(recs)).toEqual(allOk(e));
        expect([s.protectedShifts, s.exposure]).toEqual([e.len, 0]);
      });
      it(`shelter built on shift ${e.first} (the first storm shift) still counts for that shift`, () => {
        const { s, recs } = aroundStorm(e.k, short, ['rest', 'shelter', ...rests(e.len)]);
        expect(recs[1].storm).toEqual({ req: e.req, shield: e.req, ok: true, n: 1, of: e.len });
        expect([s.protectedShifts, s.exposure]).toEqual([e.len, 0]);
      });
      it(`shelter built on shift ${e.last} (the final storm shift) protects only that shift`, () => {
        const { s, recs } = aroundStorm(e.k, short, ['rest', ...rests(e.len - 1), 'shelter', 'rest']);
        expect(stormRows(recs)).toEqual(allOk(e).map((row, i) => (i < e.len - 1 ? [...row.slice(0, 3), false] : row)));
        expect([s.protectedShifts, s.exposure]).toEqual([1, e.len - 1]);
      });
      it(`shelter ${e.req - 1} all the way through means exposure on all ${e.len} storm shifts`, () => {
        const { s, recs } = aroundStorm(e.k, e.req - 1, rests(e.len + 2));
        expect(stormRows(recs)).toEqual(allOk(e).map(row => [...row.slice(0, 3), false]));
        expect([s.protectedShifts, s.exposure]).toEqual([0, e.len]);
      });
    });
  }
  it('January 19, 2026: one shelter job too late gives 1 exposed and 2 protected shifts, so only a survival', () => {
    const s = play(JAN26_LATE_SHELTER);
    let stars = 0;
    expect(s.history.map(h => [h.turn, h.action, h.powerEnd, h.lifeEnd, h.shield, (stars += h.sci)])).toEqual(JAN26_LATE_SHELTER.trace);
    expect(stormRows(s.history)).toEqual([[5, 1, 3, false], [6, 2, 3, true], [7, 3, 3, true]]);
    expect([s.outcome, s.exposure, s.protectedShifts, s.science]).toEqual(['survival', 1, 2, 4]);
  });
});

// ---------- 4. resources the event settings change ----------
describe('resources that depend on the event', () => {
  it('sunlight over a whole mission: the hill-shadow shifts add no power', () => {
    // Resting every shift from an empty battery (and full supplies, so the crew lasts all 8 shifts).
    const POWER = { [MARCH_2024]: [1, 2, 2, 2, 3, 4, 5, 6], [SEPTEMBER_2017]: [1, 2, 3, 4, 5, 5, 5, 6], [JANUARY_2026]: [1, 1, 2, 3, 4, 5, 6, 7] };
    for (const e of EVENTS) {
      let s: GameState = { ...fresh(e.k, ['lab', 'garden']), power: 0, life: 10 };
      const got: number[] = [];
      for (let t = 1; t <= K.shifts; t++) { s = ok(s, 'rest').state; got.push(s.power); }
      expect(got, e.name).toEqual(POWER[e.k]);
    }
  });
  it('experiments are only possible outside each storm', () => {
    const OPEN = { [MARCH_2024]: [1, 2, 3, 4, 7, 8], [SEPTEMBER_2017]: [1, 2, 3, 6, 7, 8], [JANUARY_2026]: [1, 2, 3, 4, 8] };
    for (const e of EVENTS) {
      const open = Array.from({ length: K.shifts }, (_, i) => i + 1).filter(t => !plan({ ...fresh(e.k, PLAIN), turn: t }, 'science').error);
      expect(open, e.name).toEqual(OPEN[e.k]);
    }
  });
  it('protection points: each storm shift is worth 25 ÷ its storm length (12.5 for 2 shifts, 8.3 for 3)', () => {
    for (const e of EVENTS) {
      for (let p = 0; p <= e.len; p++) {
        const f = finish({ ...fresh(e.k, PLAIN), turn: 8, protectedShifts: p, exposure: e.len - p });
        expect(f.score!.protect, `${e.name}, ${p} protected`).toBeCloseTo(25 * p / e.len, 10);
        expect(f.outcome).toBe('survival'); // no stars, so never a success
      }
    }
    const jan = (p: number) => finish({ ...fresh(JANUARY_2026, PLAIN), turn: 8, protectedShifts: p, exposure: 3 - p }).score!.protect;
    expect([jan(1), jan(2)].map(x => x.toFixed(1))).toEqual(['8.3', '16.7']);
  });
});

// ---------- 5. what Pip says about each storm ----------
describe('storm messages for each event', () => {
  for (const e of EVENTS) {
    it(`${e.name}: the storm news counts ${e.len} storm shifts and names shelter ${e.req}`, () => {
      const news = replay(WIN_OF[e.k]).map(x => stormNews(x.before)?.text ?? null);
      // news[i] is what the screen shows at the start of shift i + 1
      expect(news[e.first - 2]).toMatch(e.k === JANUARY_2026 ? `get your shelter ready (it needs ${e.req} layers)` : `starts next shift. It needs ${e.req} shelter layers`);
      expect(news[e.first - 1]).toMatch(new RegExp(`^The radiation storm is here! Storm shift 1 of ${e.len}\\. .*the storm needs ${e.req}\\.`));
      for (let n = 2; n <= e.len; n++) expect(news[e.first + n - 2]).toMatch(new RegExp(`^The radiation storm goes on\\. Storm shift ${n} of ${e.len}\\.`));
      expect(news[e.last]).toBe(`The storm is over! The crew can go outside again, so experiments are allowed. Your shelter kept the crew safe for ${e.len} of ${e.len} storm shifts.`);
    });
    it(`${e.name}: the hint gives the storm shifts, before and after Earth replies`, () => {
      const s = { ...fresh(e.k, PLAIN), turn: 2 };
      expect(hint(s)).toContain(`The radiation storm may come around shifts ${e.first - 1} to ${e.last + 1}. Ask Earth to find out exactly.`);
      expect(hint({ ...s, msgAt: 1 })).toContain(`The radiation storm covers shifts ${e.first} to ${e.last}.`);
      expect(hint({ ...s, msgAt: 1 })).toContain(`The storm needs ${e.req} shelter layers and you have 0.`);
      // the hill shadow is named with the right grammar ("shift 2", "shifts 3 to 4")
      expect(hint(s)).toContain(`On shift${e.shadow.includes(' ') ? 's' : ''} ${e.shadow}, a hill's shadow means the sun only adds ${K.shadowSun} power.`);
    });
  }
  it('January 19, 2026: the storm news and shift reports use "of 3" all the way through', () => {
    const shifts = replay(WINS.jan26);
    expect(shifts.slice(4, 7).map(x => stormNews(x.before)!.text)).toEqual([
      'The radiation storm is here! Storm shift 1 of 3. Stay inside! Your shelter has 3 layers and the storm needs 4. Build more shelter!',
      'The radiation storm goes on. Storm shift 2 of 3. Stay inside! Your shelter has 6 layers and the storm needs 4. The crew is safe.',
      'The radiation storm goes on. Storm shift 3 of 3. Stay inside! Your shelter has 6 layers and the storm needs 4. The crew is safe.',
    ]);
    const stormLine = (x: (typeof shifts)[number]) => shiftReport(x.before, x.rec, x.after).changes.find(c => c.kind === 'storm')?.text;
    expect(shifts.map(stormLine).filter(Boolean)).toEqual([1, 2, 3].map(n => `Storm shift ${n} of 3: your shelter (6) was strong enough (4 needed). The crew stayed safe!`));
    expect(stormLine(replay(JAN26_LATE_SHELTER)[4])).toBe('Storm shift 1 of 3: your shelter (3) was not strong enough (4 needed). The crew got extra radiation and will need a health check.');
  });
});
