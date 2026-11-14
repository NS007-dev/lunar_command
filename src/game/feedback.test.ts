/**
 * Game feedback tests (GitHub issue #4): after every shift Pip says what happened, with numbers that
 * match the engine's record exactly, and storm news appears at the right time (and only then).
 * Run with:  npm test
 */
import { describe, expect, it } from 'vitest';
import { check, init, step } from './engine';
import { failure, previewText, reportText, shiftReport, stormNews, type ShiftReport } from './mentor';
import { ACTS, K, SC, UP, type ActionId, type Gadget } from './scenarios';
import type { GameState, ShiftRecord } from './types';
import { initialUI, uiReducer, type UIAction, type UIState } from './uiState';

// ---------- helpers ----------
const start = (sc: number, g: Gadget[]): GameState => {
  const r = init(sc, g);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const play = (s: GameState, a: ActionId) => {
  const r = step(s, a);
  if (!r.ok) throw new Error(r.error);
  return { rec: r.rec, after: r.state, report: shiftReport(s, r.rec, r.state) };
};
const line = (r: ShiftReport, kind: string) => r.changes.find(c => c.kind === kind)?.text;
const GADGETS = Object.keys(UP) as Gadget[];
const PAIRS: Gadget[][] = GADGETS.flatMap((a, i) => GADGETS.slice(i + 1).map(b => [a, b]));
function rng(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
}
const run = (acts: UIAction[], from: UIState = initialUI) => acts.reduce(uiReducer, from);
const ready = (sc = 0, g: Gadget[] = ['walls', 'garden']) =>
  run([{ type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: sc }, ...g.map(k => ({ type: 'up', k }) as UIAction), { type: 'launch' }]);
const onMission = (g: GameState): UIState => ({ ...ready(g.sc, g.loadout), game: g });
const doIt = (a: ActionId): UIAction[] => [{ type: 'pick', k: a }, { type: 'confirm' }, { type: 'resolve' }];

/** Reads "A → B: +3 from …, −2 for …. … so N extra …" back into numbers. */
function sums(text: string) {
  const m = /(\d+) → (\d+)(?: layers)?: ([^.]*)\./.exec(text)!;
  const delta = [...m[3].matchAll(/([+−])(\d+)/g)].reduce((t, x) => t + (x[1] === '+' ? 1 : -1) * Number(x[2]), 0);
  const lost = Number(/so (\d+) extra/.exec(text)?.[1] ?? 0);
  return { from: Number(m[1]), to: Number(m[2]), delta, lost };
}

/** Plays many random missions and calls `f` on every shift. */
function eachShift(f: (before: GameState, rec: ShiftRecord, after: GameState, r: ShiftReport) => void) {
  const rand = rng(4);
  for (let sc = 0; sc < SC.length; sc++)
    for (const g of PAIRS)
      for (let m = 0; m < 25; m++) {
        let s = start(sc, g);
        while (!s.ended) {
          const ok = ACTS.filter(a => check(s, a).ok);
          const { rec, after, report } = play(s, ok[Math.floor(rand() * ok.length)]);
          f(s, rec, after, report);
          s = after;
        }
      }
}

// ---------- 1. every successful job gets its own headline ----------
describe('success headlines', () => {
  const s = start(0, ['lab', 'garden']);
  it.each<[ActionId, RegExp]>([
    ['science', /^Experiment done! \+2 stars$/],
    ['recycle', /^Supplies recycled!$/],
    ['grow', /^Food planted! Ready on shift 4$/],
    ['shelter', /^Shelter built! \+2 layers$/],
    ['message', /^Message sent to Earth!$/],
    ['rest', /^Rest done! No power spent$/],
  ])('%s', (a, title) => {
    const { report } = play(s, a);
    expect(report.title).toMatch(title);
    expect(report.tone).toBe('good');
    expect(report.detail.length).toBeGreaterThan(0);
  });
  it('Thick Walls shows +3 layers', () => {
    expect(play(start(0, ['walls', 'lab']), 'shelter').report.title).toBe('Shelter built! +3 layers');
  });
  it('headlines stay short (8 words or fewer) on every shift of many missions', () => {
    eachShift((_b, _r, _a, r) => expect(r.title.split(' ').length, r.title).toBeLessThanOrEqual(8));
  });
  it('the fun fact is kept, but apart from the result', () => {
    const { report } = play(s, 'recycle');
    expect(report.fact).toBeTruthy();
    expect(report.changes.some(c => c.text.includes(report.fact!))).toBe(false);
  });
});

// ---------- 2. the numbers are the engine's numbers ----------
describe('resource changes match the shift record', () => {
  it('power, supplies, shelter and stars add up on every shift of many random missions', () => {
    eachShift((before, rec, after, r) => {
      if (!rec.safe) return;
      const p = sums(line(r, 'power')!);
      expect([p.from, p.to]).toEqual([rec.powerStart, rec.powerEnd]);
      expect(p.from + p.delta - p.lost).toBe(p.to);
      const l = sums(line(r, 'life')!);
      expect([l.from, l.to]).toEqual([rec.lifeStart, rec.lifeEnd]);
      expect(l.from + l.delta - l.lost).toBe(l.to);
      const sh = line(r, 'shield');
      expect(!!sh).toBe(rec.action === 'shelter');
      if (sh) {
        const x = sums(sh);
        expect([x.from, x.to, x.from + x.delta]).toEqual([before.shield, after.shield, after.shield]);
      }
      const st = line(r, 'sci');
      expect(!!st).toBe(rec.action === 'science');
      if (st) expect(sums(st)).toMatchObject({ from: before.science, to: after.science, delta: rec.sci });
      expect(!!line(r, 'storm')).toBe(!!rec.storm);
    });
  });
  it('power, supplies, shelter and science are each on their own line', () => {
    const { report } = play(start(0, ['lab', 'garden']), 'science');
    expect(report.changes.map(c => c.kind)).toEqual(['power', 'life', 'sci']);
    expect(line(report, 'life')).toBe('Crew supplies 6 → 4: −1 for the trip outside, −1 used by the crew.');
  });
  it('recycling shows the +3 separately from what the crew uses', () => {
    expect(line(play(start(0, ['lab', 'garden']), 'recycle').report, 'life')).toBe('Crew supplies 6 → 8: +3 from recycling, −1 used by the crew.');
  });
  it('a harvest is shown as food from the garden', () => {
    const s = { ...start(0, ['lab', 'garden']), plant: 1 }, { report } = play(s, 'rest');
    expect(line(report, 'life')).toContain(`+${K.harvest} from your garden`);
    expect(report.detail).toContain('garden food was ready');
  });
  it('the hill shadow is explained in the power line', () => {
    const s = { ...start(0, ['lab', 'garden']), turn: SC[0].shadow[0] };
    expect(line(play(s, 'rest').report, 'power')).toContain("+2 from the sun (a hill's shadow blocked some)");
  });
});

// ---------- 3. limits that stop extra resources being stored ----------
describe('caps are explained', () => {
  const g = start(0, ['lab', 'garden']);
  it('a full battery says how much extra power was lost', () => {
    expect(line(play({ ...g, power: 10 }, 'rest').report, 'power')).toBe('Power 10 → 10: +3 from the sun, −2 to run the base. The battery is full (10), so 1 extra power could not be stored.');
  });
  it('supplies can only go up to 10', () => {
    expect(line(play({ ...g, life: 9 }, 'recycle').report, 'life')).toBe('Crew supplies 9 → 9: +3 from recycling, −1 used by the crew. Supplies can only go up to 10, so 2 extra could not be stored.');
  });
  it('a shelter layer that does not fit is mentioned (Thick Walls from 4 layers)', () => {
    const { report } = play({ ...start(0, ['walls', 'lab']), shield: 4 }, 'shelter');
    expect(report.title).toBe('Shelter built! +2 layers');
    expect(line(report, 'shield')).toContain('so 1 extra layer did not fit');
  });
  it('no cap note when nothing was lost', () => {
    const { report } = play(g, 'rest');
    expect(report.changes.some(c => /could not|did not fit/.test(c.text))).toBe(false);
  });
});

// ---------- 4. storm results, failures and the last shift ----------
describe('storm results and failures', () => {
  it('an unprotected storm shift is a warning, a protected one is good news', () => {
    const s = { ...start(0, ['lab', 'garden']), turn: SC[0].at, life: 8 };
    const weak = play(s, 'rest').report, strong = play({ ...s, shield: SC[0].req }, 'rest').report;
    expect([weak.tone, weak.changes.find(c => c.kind === 'storm')?.warn]).toEqual(['warn', true]);
    expect(line(weak, 'storm')).toContain('was not strong enough');
    expect([strong.tone, line(strong, 'storm')]).toEqual(['good', expect.stringContaining('The crew stayed safe!')]);
  });
  it('running out of supplies is a failure that says what happened', () => {
    const { report } = play({ ...start(0, ['lab', 'garden']), life: 1, turn: 2 }, 'rest');
    expect([report.tone, report.title]).toEqual(['bad', 'Oh no! The crew ran out of supplies']);
    expect(report.detail).toContain('On shift 2');
    expect(report.end).toContain('See your results');
  });
  it('a power failure gives the real numbers', () => {
    const rec = { turn: 3, why: 'power', upkeep: 2, powerStart: 0, sun: 1, shortfall: 1 } as ShiftRecord;
    expect(failure(rec).detail).toBe('On shift 3, the base needed 2 power to keep running. You had 0 and the sun gave 1, so it was 1 short. Next time, save some power before the sun gets weaker!');
  });
  it('the last shift says the mission is complete', () => {
    const { report } = play({ ...start(0, ['lab', 'garden']), turn: K.shifts, life: 8 }, 'rest');
    expect(report.end).toMatch(/Mission complete!/);
  });
  it('the preview text is unchanged from before', () => {
    expect(previewText(start(0, ['lab', 'garden']), 'shelter')).toBe('If you do this: battery 5 → 4, supplies 6 → 5, shelter 2, stars 0.');
  });
});

// ---------- 5. storm news appears at the right time ----------
describe('storm news', () => {
  for (const [i, sc] of SC.entries()) {
    it(`${sc.name}: coming the shift before, here during, over just after, nothing otherwise`, () => {
      for (let t = 1; t <= K.shifts; t++) {
        const s = { ...start(i, ['lab', 'garden']), turn: t }, n = stormNews(s)?.kind ?? null;
        const want = t === sc.at - 1 ? 'soon' : t >= sc.at && t < sc.at + sc.len ? 'here' : t === sc.at + sc.len ? 'over' : null;
        expect(n, `shift ${t}`).toBe(want);
      }
    });
  }
  it('once Earth has replied, the warning says the storm starts next shift', () => {
    const s = { ...start(0, ['lab', 'garden']), turn: SC[0].at - 1 };
    expect(stormNews(s)!.text).toMatch(/could start soon! Ask Earth/);
    expect(stormNews({ ...s, msgAt: 1 })!.text).toMatch(/starts next shift.*Build more shelter now!/);
    expect(stormNews({ ...s, msgAt: 1, shield: SC[0].req })!.text).toContain('Your shelter is ready!');
  });
  it('the first storm shift says it has arrived; later ones say it goes on', () => {
    const s = { ...start(2, ['lab', 'garden']), turn: SC[2].at };
    expect(stormNews(s)!.text).toMatch(/^The radiation storm is here! Storm shift 1 of 3/);
    expect(stormNews({ ...s, turn: SC[2].at + 1 })!.text).toMatch(/^The radiation storm goes on. Storm shift 2 of 3/);
  });
  it('the storm-over message says experiments are allowed again', () => {
    const s = { ...start(0, ['lab', 'garden']), turn: SC[0].at + SC[0].len, protectedShifts: 2 };
    expect(stormNews(s)!.text).toBe('The storm is over! The crew can go outside again, so experiments are allowed. Your shelter kept the crew safe for 2 of 2 storm shifts.');
    expect(check(s, 'science').ok).toBe(true);
  });
  it('a finished mission has no storm news', () => {
    expect(stormNews({ ...start(0, ['lab', 'garden']), turn: SC[0].at, ended: true })).toBe(null);
  });
});

// ---------- 6. the screen: reports, announcements and the final shift ----------
describe('feedback on the mission screen', () => {
  it('after "Do it!", Pip shows the report and the live region reads it', () => {
    const u = run(doIt('shelter'), ready());
    expect([u.showReport, u.report?.title, u.mentor]).toEqual([true, 'Shelter built! +3 layers', '']);
    expect(u.announce).toBe(reportText(u.report!));
  });
  it('storm news is announced when a shift starts, and not again on other clicks', () => {
    const before = onMission({ ...start(0, ['walls', 'garden']), turn: SC[0].at - 1, life: 8 });
    const u = run(doIt('rest'), before);
    expect(u.announce).toMatch(/^The radiation storm is here!/);
    for (const a of [{ type: 'hint' }, { type: 'pick', k: 'shelter' }, { type: 'cancel' }, { type: 'sq', k: 0 }] as UIAction[]) {
      const v = run([a], u); // either nothing new is read out, or what is read is not the storm news
      expect(v.announceN === u.announceN || !/storm is here/.test(v.announce), a.type).toBe(true);
    }
  });
  it('the same refusal twice is announced twice', () => {
    const u = onMission({ ...start(0, ['walls', 'garden']), shield: K.shieldCap });
    const a = uiReducer(u, { type: 'pick', k: 'shelter' }), b = uiReducer(a, { type: 'pick', k: 'shelter' });
    expect([a.refused, b.refused, b.announce]).toEqual([true, true, a.announce]);
    expect(b.announceN).toBe(a.announceN + 1);
  });
  it('a refusal warning goes away on the next accepted click', () => {
    const u = run([{ type: 'pick', k: 'shelter' }], onMission({ ...start(0, ['walls', 'garden']), shield: K.shieldCap }));
    expect(uiReducer(u, { type: 'pick', k: 'rest' }).refused).toBe(false);
  });
  it('the last shift\'s report stays on screen until "See your results"', () => {
    const last = run(doIt('rest'), onMission({ ...start(0, ['walls', 'garden']), turn: K.shifts, life: 8 }));
    expect([last.screen, last.game?.ended, last.showReport]).toEqual(['mission', true, true]);
    expect(last.report?.end).toMatch(/Mission complete!/);
    const res = uiReducer(last, { type: 'results' });
    expect([res.screen, res.focusHeading]).toEqual(['debrief', true]);
  });
  it('"See your results" does nothing while the mission is still going', () => {
    const u = ready();
    expect(uiReducer(u, { type: 'results' })).toBe(u);
  });
  it('"What happened?" before any shift says nothing has happened yet', () => {
    expect(uiReducer(ready(), { type: 'expl' }).mentor).toMatch(/Nothing has happened yet/);
  });
  it('playing again forgets the old report', () => {
    const last = run(doIt('rest'), onMission({ ...start(0, ['walls', 'garden']), turn: K.shifts, life: 8 }));
    expect(last.report).not.toBe(null);
    const again = run([{ type: 'results' }, { type: 'replay' }, { type: 'up', k: 'lab' }, { type: 'up', k: 'walls' }, { type: 'launch' }], last);
    expect([again.screen, again.report, again.showReport]).toEqual(['mission', null, false]);
  });
});
