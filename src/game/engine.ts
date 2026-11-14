/* ===== Pure simulation engine (no DOM, no React). Single source of truth. All numbers are made-up gameplay units. ===== */
import { K, SC, UP, inStorm, sunAt, type ActionId, type Gadget } from './scenarios';
import { finish } from './scoring';
import type { GameState, Plan, Result, ShiftRecord } from './types';

export function init(sc: number, load: Gadget[]): Result<{ state: GameState }> {
  if (!SC[sc]) return { ok: false, error: 'Pick a Sun event.' };
  if (!Array.isArray(load) || load.length !== 2 || new Set(load).size !== 2 || load.some(k => !UP[k]))
    return { ok: false, error: 'Choose exactly two different gadgets.' };
  const b = load.includes('battery');
  return {
    ok: true,
    state: {
      sc, loadout: [...load], turn: 1, power: b ? 7 : 5, cap: b ? 14 : 10, life: K.lifeStart, shield: 0, science: 0,
      plant: null, msgAt: null, protectedShifts: 0, exposure: 0, history: [], ended: false, outcome: null, score: null,
    },
  };
}

/** Has Earth's reply arrived? (It comes the shift after the message is sent.) */
export const known = (s: GameState) => s.msgAt != null && s.turn > s.msgAt;

/** What an action would cost and do this shift, or why it can't be done. */
export function plan(s: GameState, a: ActionId): Plan {
  const h = (k: Gadget) => s.loadout.includes(k), t = s.turn;
  switch (a) {
    case 'rest': return { cost: 0 };
    case 'science':
      if (inStorm(SC[s.sc], t)) return { error: 'Stay inside! Going outside in a radiation storm is risky.' };
      if (s.science >= K.sciMax) return { error: 'You already have all the stars!' };
      return { cost: h('lab') ? 1 : 2, life: -1, sci: 2 };
    case 'recycle':
      if (s.life >= K.lifeCap) return { error: 'Crew supplies are already full.' };
      return { cost: 2, life: 3 };
    case 'grow':
      if (s.plant != null) return { error: 'Your garden is already growing.' };
      if (t + K.growIn > K.shifts) return { error: 'Too late! Food needs 3 shifts to grow.' };
      return { cost: h('garden') ? 1 : 2, life: -1, plant: t + K.growIn };
    case 'shelter':
      if (s.shield >= K.shieldCap) return { error: 'The shelter is as strong as it can be.' };
      return { cost: 2, shield: h('walls') ? 3 : 2 };
    case 'message':
      if (s.msgAt != null) return { error: 'Earth already got your message.' };
      return { cost: 1, msg: true };
  }
  return { error: 'Unknown action.' };
}

/**
 * Pure: preview and resolution both use this.
 * Order: base power first, then the job, then harvest, then crew uses supplies, then the storm check.
 */
export function step(s: GameState, a: ActionId): Result<{ state: GameState; rec: ShiftRecord }> {
  if (s.ended) return { ok: false, error: 'Mission is over.' };
  const p = plan(s, a);
  if (p.error) return { ok: false, error: p.error };
  const cost = p.cost ?? 0;
  const t = s.turn, n: GameState = structuredClone(s), sc = SC[s.sc], sun = sunAt(sc, t), left = s.power + sun - K.upkeep;
  const rec: ShiftRecord = {
    turn: t, action: a, powerStart: s.power, sun, upkeep: K.upkeep, cost, powerEnd: null, lifeStart: s.life, lifeEnd: null,
    harvest: 0, sci: 0, shield: s.shield, storm: null, safe: true,
  };
  if (left < 0) {
    rec.safe = false; rec.why = 'power'; rec.shortfall = -left; rec.cost = 0;
    n.history.push(rec); n.outcome = 'critical';
    return { ok: true, state: finish(n), rec };
  }
  if (left < cost) return { ok: false, error: `Not enough power: this costs ${cost} but only ${left} is left after the base is looked after.` };
  const pl = p.life ?? 0;
  const hv = s.plant === t ? K.harvest : 0, gain = pl > 0 ? pl : 0;
  const life = Math.min(K.lifeCap, s.life + gain + hv) + (pl < 0 ? pl : 0) - K.use;
  if (life <= 0 && pl < 0) return { ok: false, error: 'Crew supplies are too low for this.' };
  n.power = Math.min(n.cap, left - cost); n.life = Math.max(0, life); rec.lifeEnd = life; rec.powerEnd = n.power; rec.harvest = hv;
  if (hv) n.plant = null;
  if (p.plant) n.plant = p.plant;
  if (p.msg) n.msgAt = t;
  const sb = n.science; n.science = Math.min(K.sciMax, sb + (p.sci || 0)); rec.sci = n.science - sb;
  n.shield = Math.min(K.shieldCap, s.shield + (p.shield || 0)); rec.shield = n.shield;
  if (inStorm(sc, t)) {
    const ok = n.shield >= sc.req;
    rec.storm = { req: sc.req, shield: n.shield, ok, n: t - sc.at + 1, of: sc.len };
    if (ok) n.protectedShifts++; else n.exposure++;
  }
  if (life <= 0) {
    rec.safe = false; rec.why = 'life';
    n.history.push(rec); n.outcome = 'critical';
    return { ok: true, state: finish(n), rec };
  }
  n.history.push(rec);
  if (t >= K.shifts) finish(n); else n.turn = t + 1;
  return { ok: true, state: n, rec };
}
