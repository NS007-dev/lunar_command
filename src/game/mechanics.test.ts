/**
 * Game mechanics tests (GitHub issue #2).
 * Each test checks one rule from the issue's "intended rules" list against the real engine.
 * Run with:  npm test
 */
import { describe, expect, it } from 'vitest';
import { init, known, plan, step } from './engine';
import { finish } from './scoring';
import { ACTS, K, SC, UP, inStorm, sunAt, type ActionId, type Gadget } from './scenarios';
import type { GameState } from './types';

// ---------- small helpers ----------
const start = (sc: number, g: Gadget[]): GameState => {
  const r = init(sc, g);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
/** Plays a list of actions in order. Throws if the engine refuses one. */
const play = (sc: number, g: Gadget[], acts: ActionId[]): GameState => {
  let s = start(sc, g);
  for (const a of acts) {
    const r = step(s, a);
    if (!r.ok) throw new Error(`${a} was refused on shift ${s.turn}: ${r.error}`);
    s = r.state;
  }
  return s;
};
/** Takes one step that must work, and returns the record of what happened. */
const one = (s: GameState, a: ActionId) => {
  const r = step(s, a);
  if (!r.ok) throw new Error(`${a} was refused: ${r.error}`);
  return r;
};
const LG: Gadget[] = ['lab', 'garden'], WG: Gadget[] = ['walls', 'garden'], BW: Gadget[] = ['battery', 'walls'];
const GADGETS = Object.keys(UP) as Gadget[];
const PAIRS: Gadget[][] = [];
for (let i = 0; i < GADGETS.length; i++) for (let j = i + 1; j < GADGETS.length; j++) PAIRS.push([GADGETS[i], GADGETS[j]]);

// ---------- 0. the rules table ----------
describe('rules table', () => {
  it('constants match the intended rules', () => {
    expect([K.shifts, K.sun, K.shadowSun, K.upkeep, K.use]).toEqual([8, 3, 2, 2, 1]);
    expect([K.lifeStart, K.lifeCap, K.shieldCap, K.goal, K.sciMax, K.growIn, K.harvest]).toEqual([6, 10, 6, 4, 6, 3, 4]);
  });
  it('normal battery starts at 5/10 and Big Battery starts at 7/14', () => {
    for (const g of PAIRS) {
      const s = start(0, g);
      expect([s.power, s.cap]).toEqual(g.includes('battery') ? [7, 14] : [5, 10]);
      expect([s.life, s.shield, s.science, s.turn]).toEqual([6, 0, 0, 1]);
    }
  });
  it('each scenario uses its own settings', () => {
    const pick = (i: number) => ({ s: SC[i].s, at: SC[i].at, len: SC[i].len, req: SC[i].req, shadow: SC[i].shadow });
    expect(pick(0)).toEqual({ s: 2, at: 5, len: 2, req: 2, shadow: [3, 4] });
    expect(pick(1)).toEqual({ s: 3, at: 4, len: 2, req: 3, shadow: [6, 7] });
    expect(pick(2)).toEqual({ s: 4, at: 5, len: 3, req: 4, shadow: [2, 2] });
  });
});

// ---------- 1. power ----------
describe('power', () => {
  it('sunlight is 3, and 2 only on the hill-shadow shifts', () => {
    SC.forEach(sc => {
      for (let t = 1; t <= K.shifts; t++) {
        const inShadow = t >= sc.shadow[0] && t <= sc.shadow[1];
        expect(sunAt(sc, t)).toBe(inShadow ? 2 : 3);
      }
    });
  });
  it('resting: new power = old power + sunlight - 2 (base upkeep), never above the battery size', () => {
    SC.forEach((_, k) => {
      for (const g of [LG, BW]) {
        for (let t = 1; t <= K.shifts; t++) {
          const base = start(k, g);
          for (let p = 0; p <= base.cap; p++) {
            const s: GameState = { ...base, turn: t, power: p };
            const rec = one(s, 'rest').rec;
            expect(rec.powerEnd).toBe(Math.min(base.cap, p + sunAt(SC[k], t) - K.upkeep));
          }
        }
      }
    });
  });
  it('the battery never goes over its capacity (10 normal, 14 Big Battery)', () => {
    expect(one({ ...start(0, LG), power: 10 }, 'rest').rec.powerEnd).toBe(10);
    expect(one({ ...start(0, BW), power: 14 }, 'rest').rec.powerEnd).toBe(14);
  });
  it('action costs: science 2 (1 with lab), recycle 2, grow 2 (1 with lamps), shelter 2, message 1, rest 0', () => {
    const none = start(0, ['battery', 'walls']);
    const cost = (s: GameState, a: ActionId) => plan(s, a).cost;
    expect([cost(none, 'science'), cost(none, 'recycle'), cost(none, 'grow'), cost(none, 'shelter'), cost(none, 'message'), cost(none, 'rest')]).toEqual([2, 2, 2, 2, 1, 0]);
    expect(cost(start(0, ['lab', 'walls']), 'science')).toBe(1);
    expect(cost(start(0, ['garden', 'walls']), 'grow')).toBe(1);
  });
  it('the power really drops by the action cost', () => {
    expect(one(start(0, BW), 'shelter').state.power).toBe(7 + 3 - 2 - 2);
    expect(one(start(0, BW), 'message').state.power).toBe(7 + 3 - 2 - 1);
    expect(one(start(0, LG), 'science').state.power).toBe(5 + 3 - 2 - 1);
  });
});

// ---------- 2. affording actions ----------
describe('affordability', () => {
  it('an action is allowed exactly when (power + sun - 2) covers its cost', () => {
    SC.forEach((_, k) => {
      for (let t = 1; t <= K.shifts; t++) {
        for (const a of ACTS) {
          const base = start(k, BW), s0: GameState = { ...base, turn: t };
          const c = plan(s0, a).cost;
          if (c === undefined) continue; // action not allowed for another reason at this shift
          const sun = sunAt(SC[k], t);
          const exact = c + K.upkeep - sun; // the smallest power that still pays for it
          if (exact >= 0) {
            const r = step({ ...s0, power: exact }, a);
            expect(r.ok).toBe(true);
            if (r.ok) expect(r.rec.powerEnd).toBe(0);
          }
          if (exact - 1 >= 0) {
            const poor: GameState = { ...s0, power: exact - 1 }, before = JSON.stringify(poor);
            const r = step(poor, a);
            expect(r.ok).toBe(false);
            if (!r.ok) expect(r.error).toMatch(/Not enough power/);
            expect(JSON.stringify(poor)).toBe(before); // refused actions change nothing
          }
        }
      }
    });
  });
  it('resting is always allowed while supplies last', () => {
    expect(step({ ...start(0, LG), power: 0 }, 'rest').ok).toBe(true);
  });
  it('step never changes the state it is given', () => {
    const s = start(1, LG), copy = JSON.stringify(s);
    for (const a of ACTS) step(s, a);
    expect(JSON.stringify(s)).toBe(copy);
  });
});

// ---------- 3. supplies ----------
describe('crew supplies', () => {
  it('the crew uses 1 supply every shift', () => {
    expect(one(start(0, LG), 'rest').state.life).toBe(5);
    expect(play(0, LG, ['rest', 'rest', 'rest']).life).toBe(3);
  });
  it('recycling costs 2 power and adds 3 supplies (the crew still uses 1)', () => {
    const s = { ...start(0, LG), life: 5 };
    const r = one(s, 'recycle');
    expect([r.state.life, r.rec.cost, r.state.power]).toEqual([5 + 3 - 1, 2, 5 + 3 - 2 - 2]);
  });
  it('supplies never go above 10, and recycling is refused when they are full', () => {
    expect(one({ ...start(0, LG), life: 9 }, 'recycle').state.life).toBe(9);
    expect(plan({ ...start(0, LG), life: 10 }, 'recycle').error).toBeTruthy();
    expect(step({ ...start(0, LG), life: 10 }, 'recycle').ok).toBe(false);
  });
  it('growing food: costs 2 (1 with lamps), uses 1 supply now, ready 3 shifts later', () => {
    const r = one(start(0, ['battery', 'walls']), 'grow');
    expect([r.rec.cost, r.state.life, r.state.plant]).toEqual([2, 4, 4]);
    expect(one(start(0, LG), 'grow').rec.cost).toBe(1);
  });
  it('harvest gives +4 supplies on exactly the ready shift (not before)', () => {
    const s = play(0, LG, ['grow', 'rest', 'rest']);
    expect(s.history.map(h => h.harvest)).toEqual([0, 0, 0]);
    const r = one(s, 'rest');
    expect(r.rec.harvest).toBe(4);
    expect(r.state.life).toBe(s.life + 4 - 1);
    expect(r.state.plant).toBe(null);
  });
  it('harvested food also respects the 10-supply limit', () => {
    const s: GameState = { ...start(0, LG), life: 9, plant: 1 };
    expect(one(s, 'rest').state.life).toBe(9);
  });
  it('only one garden at a time, and food planted too late is refused', () => {
    expect(plan(play(0, LG, ['grow']), 'grow').error).toBeTruthy();
    for (let t = 1; t <= K.shifts; t++) {
      const s: GameState = { ...start(0, LG), turn: t };
      expect(plan(s, 'grow').error === undefined).toBe(t + K.growIn <= K.shifts);
    }
  });
  it('food planted on shift 5 is harvested on the last shift (8) and counts', () => {
    const s: GameState = { ...start(0, LG), turn: 5, life: 5, power: 8 };
    let g = one(s, 'grow').state;
    expect(g.plant).toBe(8);
    for (let i = 0; i < 2; i++) g = one({ ...g, power: 8 }, 'recycle').state; // keep supplies up on shifts 6 and 7
    const last = one({ ...g, power: 8, life: 3 }, 'rest');
    expect([last.rec.harvest, last.state.life, last.state.ended]).toEqual([4, 3 + 4 - 1, true]);
  });
  it('running out of supplies ends the mission at once as a critical failure', () => {
    const r = one({ ...start(0, LG), life: 1 }, 'rest');
    expect([r.state.ended, r.state.outcome, r.rec.safe, r.rec.why]).toEqual([true, 'critical', false, 'life']);
  });
  it('experiments and planting that would leave 0 supplies are refused', () => {
    const s = { ...start(0, LG), life: 2 };
    expect(step(s, 'science').ok).toBe(false);
    expect(step(s, 'grow').ok).toBe(false);
    expect(step(s, 'recycle').ok).toBe(true);
  });
});

// ---------- 4. the six actions ----------
describe('actions', () => {
  it('shelter: costs 2, adds 2 layers, stops at 6', () => {
    const r = one(start(0, LG), 'shelter');
    expect([r.rec.cost, r.state.shield]).toEqual([2, 2]);
    const s: GameState = { ...start(0, LG), shield: 5 };
    expect(one(s, 'shelter').state.shield).toBe(6);
    expect(plan({ ...s, shield: 6 }, 'shelter').error).toBeTruthy();
  });
  it('science: costs 2, gives 2 stars and uses 1 extra supply', () => {
    const r = one(start(0, WG), 'science');
    expect([r.rec.cost, r.state.science, r.state.life]).toEqual([2, 2, 6 - 1 - 1]);
  });
  it('message: costs 1, reply is known from the next shift, and only one message is allowed', () => {
    const s0 = start(0, LG), r = one(s0, 'message');
    expect([r.rec.cost, r.state.msgAt, known(s0), known(r.state)]).toEqual([1, 1, false, true]);
    expect(plan(r.state, 'message').error).toBeTruthy();
  });
  it('rest: costs nothing and changes no stars, shelter or garden', () => {
    const r = one(start(0, LG), 'rest');
    expect([r.rec.cost, r.state.science, r.state.shield, r.state.plant, r.state.msgAt]).toEqual([0, 0, 0, null, null]);
  });
  it('unknown actions are refused', () => {
    expect(step(start(0, LG), 'dance' as ActionId).ok).toBe(false);
  });
  it('nothing can be done after the mission has ended', () => {
    const s = play(0, LG, ['rest', 'recycle', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest']);
    expect(s.ended).toBe(true);
    for (const a of ACTS) expect(step(s, a).ok).toBe(false);
  });
});

// ---------- 5. upgrades ----------
describe('upgrades', () => {
  const filler = (g: Gadget): Gadget[] => (g === 'battery' ? ['battery', 'garden'] : g === 'garden' ? ['garden', 'battery'] : [g, 'battery']);
  it('players must choose exactly two different, real upgrades', () => {
    for (const bad of [[], ['lab'], ['lab', 'lab'], ['lab', 'garden', 'walls'], ['lab', 'nope']] as Gadget[][]) expect(init(0, bad).ok).toBe(false);
    expect(init(7, LG).ok).toBe(false);
    for (const g of PAIRS) expect(init(1, g).ok).toBe(true);
  });
  it('names that only exist on every JavaScript object ("toString") are not accepted as upgrades', () => {
    expect(init(0, ['constructor', 'toString'] as unknown as Gadget[]).ok).toBe(false);
  });
  it('Big Battery only changes the starting power and the capacity (no job costs change)', () => {
    const s = start(0, ['battery', 'garden']); // Garden Lamps only touch planting
    expect([plan(s, 'science').cost, plan(s, 'recycle').cost, plan(s, 'shelter').cost, plan(s, 'message').cost, plan(s, 'rest').cost]).toEqual([2, 2, 2, 1, 0]);
    expect(plan(s, 'shelter').shield).toBe(2);
  });
  it('Thick Walls Kit: shelter adds 3 (not 2) and nothing else changes', () => {
    expect(one(start(0, ['walls', 'battery']), 'shelter').state.shield).toBe(3);
    expect(one(start(0, ['lab', 'battery']), 'shelter').state.shield).toBe(2);
    expect(plan(start(0, ['walls', 'battery']), 'science').cost).toBe(2);
  });
  it('Speedy Science Lab: science costs 1, still gives 2 stars, other jobs unchanged', () => {
    const r = one(start(0, ['lab', 'battery']), 'science');
    expect([r.rec.cost, r.state.science]).toEqual([1, 2]);
    expect(plan(start(0, ['lab', 'battery']), 'grow').cost).toBe(2);
    expect(plan(start(0, ['lab', 'battery']), 'shelter').cost).toBe(2);
  });
  it('Garden Lamps: planting costs 1, harvest is still +4 after 3 shifts, other jobs unchanged', () => {
    const s = play(0, ['garden', 'walls'], ['grow', 'rest', 'rest']);
    expect(s.plant).toBe(4);
    expect(one(s, 'rest').rec.harvest).toBe(4);
    expect(plan(start(0, ['garden', 'walls']), 'science').cost).toBe(2);
  });
  it('each upgrade works the same in every pair it is part of', () => {
    for (const g of GADGETS) for (const other of GADGETS.filter(x => x !== g)) {
      const s = start(0, [g, other]);
      if (g === 'walls') expect(plan(s, 'shelter').shield).toBe(3);
      if (g === 'lab') expect(plan(s, 'science').cost).toBe(1);
      if (g === 'garden') expect(plan(s, 'grow').cost).toBe(1);
      if (g === 'battery') expect([s.power, s.cap]).toEqual([7, 14]);
    }
    expect(filler('lab').length).toBe(2);
  });
});

// ---------- 6. storm timing and shelter ----------
describe('storms and shelter', () => {
  it('a storm is only recorded on its own shifts, with the right numbering', () => {
    SC.forEach((sc, k) => {
      for (let t = 1; t <= K.shifts; t++) {
        const s: GameState = { ...start(k, BW), turn: t, shield: 6, power: 10, life: 8 };
        const rec = one(s, 'rest').rec;
        if (t >= sc.at && t < sc.at + sc.len) expect(rec.storm).toEqual({ req: sc.req, shield: 6, ok: true, n: t - sc.at + 1, of: sc.len });
        else expect(rec.storm).toBe(null);
        expect(inStorm(sc, t)).toBe(rec.storm !== null);
      }
    });
  });
  it('storms start and end on the right shifts for every scenario', () => {
    const lists = SC.map((sc) => Array.from({ length: K.shifts }, (_, i) => i + 1).filter(t => inStorm(sc, t)));
    expect(lists).toEqual([[5, 6], [4, 5], [5, 6, 7]]);
  });
  it('the crew is protected exactly when shelter >= the storm requirement', () => {
    SC.forEach((sc, k) => {
      for (let shield = 0; shield <= K.shieldCap; shield++) {
        const s: GameState = { ...start(k, LG), turn: sc.at, shield, power: 8, life: 8 };
        const r = one(s, 'rest');
        expect(r.rec.storm?.ok).toBe(shield >= sc.req);
        expect([r.state.protectedShifts, r.state.exposure]).toEqual(shield >= sc.req ? [1, 0] : [0, 1]);
      }
    });
  });
  it('a shelter built on a storm shift counts for that same shift', () => {
    const sc = SC[0], s: GameState = { ...start(0, WG), turn: sc.at, shield: 0, power: 8, life: 8 };
    const r = one(s, 'shelter');
    expect([r.state.shield, r.rec.storm?.ok]).toEqual([3, true]);
  });
  it('shelter points rise by 2 (3 with Thick Walls) per job and never pass 6', () => {
    expect(play(0, LG, ['shelter', 'recycle', 'shelter']).shield).toBe(4);
    const s = play(2, BW, ['shelter', 'shelter']);
    expect(s.shield).toBe(6);
    expect(plan(s, 'shelter').error).toBeTruthy();
  });
  it('protected and unprotected shifts are counted separately across a whole storm', () => {
    const s = play(1, LG, ['recycle', 'rest', 'rest', 'shelter', 'shelter', 'rest', 'rest', 'rest']);
    expect([s.exposure, s.protectedShifts]).toEqual([1, 1]);
    expect(s.history.filter(h => h.storm).map(h => [h.turn, h.storm!.ok])).toEqual([[4, false], [5, true]]);
  });
});

// ---------- 7. science ----------
describe('science points', () => {
  it('each experiment gives exactly 2 stars, up to a maximum of 6', () => {
    for (const [before, after] of [[0, 2], [2, 4], [4, 6]]) {
      const s: GameState = { ...start(0, LG), turn: 1, science: before, power: 8, life: 8 };
      expect(one(s, 'science').state.science).toBe(after);
    }
    const full: GameState = { ...start(0, LG), turn: 1, science: 6 };
    expect(plan(full, 'science').error).toMatch(/all the stars/);
    expect(step(full, 'science').ok).toBe(false);
  });
  it('experiments are not allowed during the storm, in every scenario, but are allowed otherwise', () => {
    SC.forEach((sc, k) => {
      for (let t = 1; t <= K.shifts; t++) {
        const s: GameState = { ...start(k, LG), turn: t };
        const err = plan(s, 'science').error;
        expect(err !== undefined).toBe(inStorm(sc, t));
        if (inStorm(sc, t)) { expect(err).toMatch(/Stay inside/); expect(step(s, 'science').ok).toBe(false); }
      }
    });
  });
  it('the science goal is 4 stars: 2 stars is not enough, 4 is', () => {
    const base = (stars: number) => finish({ ...start(0, WG), turn: 8, science: stars, protectedShifts: 2, exposure: 0, life: 5, power: 5, outcome: null }).outcome;
    expect([base(0), base(2), base(4), base(6)]).toEqual(['survival', 'survival', 'success', 'success']);
  });
});

// ---------- 8. scores and results ----------
describe('scores and results', () => {
  const state = (o: Partial<GameState>): GameState => ({ ...start(0, WG), turn: 8, science: 4, protectedShifts: 2, exposure: 0, life: 5, power: 5, outcome: null, ...o });
  it('success needs ALL of: survived, protected every storm shift, 4+ stars', () => {
    expect(finish(state({})).outcome).toBe('success');
    expect(finish(state({ science: 2 })).outcome).toBe('survival');
    expect(finish(state({ protectedShifts: 1, exposure: 1 })).outcome).toBe('survival');
    expect(finish(state({ protectedShifts: 0, exposure: 2 })).outcome).toBe('survival');
    expect(finish(state({ protectedShifts: 1, exposure: 0 })).outcome).toBe('survival');
    expect(finish(state({ outcome: 'critical' })).outcome).toBe('critical');
  });
  it('a critical failure can never be a success and gets 0 survival points', () => {
    const f = finish(state({ outcome: 'critical' }));
    expect([f.outcome, f.score!.survive]).toEqual(['critical', 0]);
  });
  it('a hand-worked mission: Walls+Lamps on the March 2024 storm', () => {
    // shift: power, supplies -> 1 shelter 4,5 | 2 recycle 3,7 | 3 rest 3,6 | 4 rest 3,5 | 5-8 rest 4,4 5,3 6,2 7,1
    const s = play(0, WG, ['shelter', 'recycle', 'rest', 'rest', 'rest', 'rest', 'rest', 'rest']);
    expect([s.power, s.life, s.shield, s.science, s.outcome]).toEqual([7, 1, 3, 0, 'survival']);
    expect(s.score).toEqual({ survive: 25, protect: 25, supplies: 2, power: 7, science: 0, total: 59 });
  });
  it('score parts: protection by shift, supplies/10, power/capacity, science/6', () => {
    const f = finish(state({ protectedShifts: 1, exposure: 1, life: 10, power: 10, science: 6 })).score!;
    expect([f.survive, f.protect, f.supplies, f.power, f.science, f.total]).toEqual([25, 12.5, 20, 10, 20, 88]);
    const big = finish({ ...state({ power: 7 }), cap: 14 }).score!;
    expect(big.power).toBe(5);
  });
  it('exposed crew is not full marks: survival and protection are scored apart', () => {
    const f = finish(state({ protectedShifts: 0, exposure: 2 }));
    expect([f.score!.survive, f.score!.protect]).toEqual([25, 0]);
  });
  // This one tries EVERY possible plan, so it takes a minute. The timeout stops Vitest's default 5 seconds from cutting it off.
  it('the final result always matches the recorded mission (every possible plan, every event, every upgrade pair)', { timeout: 300_000 }, () => {
    let missions = 0, edges = 0;
    for (let k = 0; k < SC.length; k++) for (const g of PAIRS) {
      let wins = 0;
      const go = (s: GameState): void => {
        if (s.ended) {
          missions++;
          const b = s.score!, sc = SC[k];
          expect(b.total).toBe(Math.round(b.survive + b.protect + b.supplies + b.power + b.science));
          expect(b.total >= 0 && b.total <= 100).toBe(true);
          expect(b.survive).toBe(s.outcome === 'critical' ? 0 : 25);
          expect(b.protect).toBe(25 * s.protectedShifts / sc.len);
          expect(s.protectedShifts + s.exposure).toBeLessThanOrEqual(sc.len);
          const perfect = s.outcome !== 'critical' && s.exposure === 0 && s.protectedShifts === sc.len && s.science >= K.goal;
          expect(s.outcome === 'success').toBe(perfect);
          if (s.exposure > 0 || s.outcome === 'critical') expect(s.outcome).not.toBe('success');
          if (s.outcome === 'success') wins++;
          return;
        }
        for (const a of ACTS) {
          const r = step(s, a);
          if (!r.ok) {
            // refused: it must really be unaffordable / not allowed, never a surprise
            expect(r.error.length > 0).toBe(true);
            continue;
          }
          edges++;
          const { rec, state: n } = r, sc = SC[k], p = plan(s, a);
          const sun = sunAt(sc, s.turn), cost = p.cost ?? 0, pl = p.life ?? 0;
          // power
          expect(rec.sun).toBe(sun);
          expect(s.power + sun - K.upkeep).toBeGreaterThanOrEqual(cost);
          if (rec.safe) expect(rec.powerEnd).toBe(Math.min(s.cap, s.power + sun - K.upkeep - cost));
          expect(n.power >= 0 && n.power <= n.cap).toBe(true);
          // supplies
          const harvest = s.plant === s.turn ? K.harvest : 0;
          const lifeAfter = Math.min(K.lifeCap, s.life + Math.max(0, pl) + harvest) + Math.min(0, pl) - K.use;
          expect(rec.lifeEnd).toBe(lifeAfter);
          expect(n.life >= 0 && n.life <= K.lifeCap).toBe(true);
          expect(rec.harvest).toBe(harvest);
          // stars and shelter
          expect(n.science - s.science).toBe(p.sci ?? 0);
          expect(n.science).toBeLessThanOrEqual(K.sciMax);
          expect(n.shield - s.shield).toBe(Math.min(p.shield ?? 0, K.shieldCap - s.shield));
          // storm record only on storm shifts
          expect(rec.storm !== null).toBe(inStorm(sc, s.turn));
          go(n);
        }
      };
      go(start(k, g));
      expect(wins).toBeGreaterThan(0); // every event + upgrade pair can be won
    }
    expect(missions).toBeGreaterThan(100000);
    expect(edges).toBeGreaterThan(missions);
  });
});
