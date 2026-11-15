/**
 * Resource explanations (GitHub issue #8): every resource says what it is for, the jobs show what they add or use
 * (read from the engine's plan(), so gadgets are included), the preview explains changes exactly like the report,
 * Pip answers resource questions, and low resources are warned about in words.
 * Renders with react-dom/server, no extra packages.
 */
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { check, init, plan, step } from '../game/engine';
import {
  EVERY_SHIFT, LOW_LIFE, LOW_POWER, effects, lowWarnings, previewText, reportText, shiftPreview, shiftReport, spoken,
} from '../game/mentor';
import { NAME, RES, RES_INDEX, WHY, type ResourceId } from '../game/resourceHelp';
import { ACTS, K, SC, UP, type ActionId, type Gadget } from '../game/scenarios';
import type { GameState } from '../game/types';
import { initialUI, uiReducer, type UIAction, type UIState } from '../game/uiState';
import { ACT } from '../data/scienceFacts';
import { Briefing } from '../screens/Briefing';
import { Mission } from '../screens/Mission';
import { Results } from '../screens/Results';
import { ActionButton } from './ActionButton';
import { ResourceDisplay } from './ResourceDisplay';

// ---------- helpers ----------
const noop = () => {};
const start = (sc = 0, g: Gadget[] = ['lab', 'garden']): GameState => {
  const r = init(sc, g);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const mission = (s: GameState, pending: ActionId | null = null, onAskBase?: (i: number) => void) =>
  renderToStaticMarkup(
    <Mission s={s} pending={pending} resolving={false} mentor="" prev={null} tx={false} report={null} showReport={false} refused={false}
      onPick={noop} onConfirm={noop} onCancel={noop} onHint={noop} onExplain={noop} onAsk={noop} onAskBase={onAskBase} onResults={noop} />,
  );
const panels = (s: GameState, onWhat?: (k: ResourceId) => void) =>
  renderToStaticMarkup(<ResourceDisplay s={s} preview={null} prev={null} tx={false} onWhat={onWhat} />);
const GADGETS = Object.keys(UP) as Gadget[];
const PAIRS: Gadget[][] = GADGETS.flatMap((a, i) => GADGETS.slice(i + 1).map(b => [a, b]));
function rng(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
}
/** Plays random missions (every event and gadget pair) and calls `f` on every state a player can reach. */
function eachState(f: (s: GameState) => void, missions = 8) {
  const rand = rng(8);
  for (let sc = 0; sc < SC.length; sc++)
    for (const g of PAIRS)
      for (let m = 0; m < missions; m++) {
        let s = start(sc, g);
        while (!s.ended) {
          f(s);
          const ok = ACTS.filter(a => check(s, a).ok);
          const r = step(s, ok[Math.floor(rand() * ok.length)]);
          if (!r.ok) throw new Error(r.error);
          s = r.state;
        }
      }
}
const run = (acts: UIAction[], from: UIState = initialUI) => acts.reduce(uiReducer, from);
const ready = (sc = 0, g: Gadget[] = ['walls', 'garden']) =>
  run([{ type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: sc }, ...g.map(k => ({ type: 'up', k }) as UIAction), { type: 'launch' }]);
const onMission = (g: GameState): UIState => ({ ...ready(g.sc, g.loadout), game: g });

/** Every element in a React tree, with function components called (a tiny shallow renderer, so buttons can be "clicked"). */
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement(node)) return [];
  const el = node as ReactElement<Record<string, unknown>>;
  if (typeof el.type === 'function') return elements((el.type as (p: unknown) => ReactNode)(el.props));
  return [el, ...elements(el.props.children as ReactNode)];
}

/** All the new words a player can read, for wording checks. */
function allNewWords(): string[] {
  const out = [...Object.values(WHY), EVERY_SHIFT];
  for (let sc = 0; sc < SC.length; sc++) for (const g of PAIRS) {
    const s = start(sc, g);
    out.push(...RES.map(r => r.a(s)));
    for (let v = 0; v <= 3; v++) out.push(...Object.values(lowWarnings({ ...s, power: v, life: v })).filter((x): x is string => !!x));
  }
  return out;
}

// ---------- 1. what each resource is for ----------
describe('resource panels say why each resource matters', () => {
  const t = text(panels(start()));
  it('each panel keeps its issue #7 line and adds a "why it matters" line', () => {
    expect(t).toContain('the sun adds 3, and the base uses 2 to keep running.');
    expect(t).toContain('Air, water and food. The crew uses 1 each shift.');
    expect(t).toContain('Thick layers block some radiation. Reach 2 before the storm!');
    for (const k of Object.keys(WHY) as ResourceId[]) expect(t).toContain(WHY[k]);
  });
  it('science stars explain what a star is, how to win one and the goal', () => {
    expect(WHY.sci).toContain('something new the crew learns about the Moon');
    expect(WHY.sci).toContain('Only experiments win stars');
    expect(WHY.sci).toContain(`Get ${K.goal} for a full Mission success!`);
  });
  it('"Every job except Rest needs power" is what the engine does, for every gadget pair', () => {
    for (const g of PAIRS) {
      const s = start(0, g);
      for (const a of ACTS) expect(plan(s, a).cost! > 0, `${a} with ${g}`).toBe(a !== 'rest');
    }
  });
  it('no new words say an empty battery ends or stops the mission (it cannot)', () => {
    for (const w of allNewWords())
      for (const sentence of w.split(/(?<=[.!?])\s+/))
        if (/mission (stops|ends|would end)|stops the mission/i.test(sentence)) expect(sentence, sentence).not.toMatch(/battery|power/i);
  });
  it('sentences stay short enough for young readers (25 words or fewer)', () => {
    for (const w of allNewWords()) for (const sentence of w.split(/(?<=[.!?])\s+/)) expect(sentence.split(' ').length, sentence).toBeLessThanOrEqual(25);
  });
});

// ---------- 2. job buttons show what each job adds or uses, straight from plan() ----------
/** Reads the badges back into the plan() fields they stand for. */
function fromBadges(fx: string[]) {
  const out: { life?: number; plant?: number; harvest?: number; shield?: number; sci?: number; msg?: boolean } = {};
  for (const f of fx) {
    let m: RegExpExecArray | null;
    if ((m = /^\+(\d+) supplies on shift (\d+)$/.exec(f))) { out.harvest = Number(m[1]); out.plant = Number(m[2]); }
    else if ((m = /^([+−])(\d+) (supply|supplies)$/.exec(f))) out.life = (m[1] === '+' ? 1 : -1) * Number(m[2]);
    else if ((m = /^\+(\d+) layers?$/.exec(f))) out.shield = Number(m[1]);
    else if ((m = /^\+(\d+) stars?$/.exec(f))) out.sci = Number(m[1]);
    else if (f === 'Storm news next shift') out.msg = true;
    else throw new Error(`Unknown badge: ${f}`);
  }
  return out;
}

describe('job effect badges', () => {
  it('match plan() for every job, on every reachable shift, for every event and gadget pair', () => {
    let n = 0;
    eachState(s => {
      for (const a of ACTS) {
        const p = plan(s, a), fx = effects(s, a);
        if (p.error) { expect(fx).toEqual([]); continue; }
        const b = fromBadges(fx);
        expect(b.life, a).toBe(p.life);
        expect(b.plant, a).toBe(p.plant);
        expect(b.harvest, a).toBe(p.plant ? K.harvest : undefined);
        expect(b.shield, a).toBe(p.shield);
        expect(b.sci, a).toBe(p.sci);
        expect(b.msg, a).toBe(p.msg);
        n++;
      }
    }, 3);
    expect(n).toBeGreaterThan(1000);
  });
  it('each gadget changes exactly what it says', () => {
    const plain = start(0, ['battery', 'garden']), lab = start(0, ['lab', 'walls']), lamps = start(0, ['garden', 'walls']);
    expect([plan(plain, 'science').cost, plan(lab, 'science').cost]).toEqual([2, 1]);
    expect([plan(start(0, ['battery', 'lab']), 'grow').cost, plan(lamps, 'grow').cost]).toEqual([2, 1]);
    expect([plan(plain, 'shelter').cost, plan(lab, 'shelter').cost]).toEqual([2, 2]);
    expect([effects(plain, 'shelter'), effects(lab, 'shelter')]).toEqual([['+2 layers'], ['+3 layers']]);
    expect(effects(lab, 'science')).toEqual(['−1 supply', '+2 stars']);
    expect(effects(plain, 'recycle')).toEqual(['+3 supplies']);
    expect(effects(plain, 'grow')).toEqual(['−1 supply', `+${K.harvest} supplies on shift ${1 + K.growIn}`]);
    expect(effects(plain, 'message')).toEqual(['Storm news next shift']);
    expect(effects(plain, 'rest')).toEqual([]);
  });
  it('the button shows the badges, and the power corner still shows the plan() cost', () => {
    for (const g of PAIRS) {
      const s = start(0, g);
      for (const a of ACTS) {
        const html = renderToStaticMarkup(<ActionButton s={s} a={a} pressed={false} resolving={false} onPick={noop} />);
        for (const f of effects(s, a)) expect(html).toContain(`<span class="chip">${f}`);
        expect(html).toContain(`<span class="c">−${plan(s, a).cost}<small>`);
      }
    }
  });
  it('screen readers hear the badges as one list ("This job: −1 supply, +2 stars")', () => {
    const html = renderToStaticMarkup(<ActionButton s={start()} a="science" pressed={false} resolving={false} onPick={noop} />);
    expect(text(html)).toMatch(/This job: −1 supply , \+2 stars/);
  });
  it('a job that can\'t be done shows no badges, only the reason', () => {
    const s = { ...start(), shield: K.shieldCap };
    const html = renderToStaticMarkup(<ActionButton s={s} a="shelter" pressed={false} resolving={false} onPick={noop} />);
    expect(html).not.toContain('class="fx"');
    expect(html).toContain('class="why"');
  });
  it('Rest says the job itself costs nothing', () => {
    expect(ACT.rest[1]).toBe('This job costs nothing. The sun still charges the battery.');
  });
  it('the mission screen says what happens every shift, whatever job is picked', () => {
    expect(EVERY_SHIFT).toBe(`Every shift, whatever job you pick: the base uses ${K.upkeep} power and the crew uses 1 supply.`);
    expect(K.use).toBe(1);
    expect(text(mission(start()))).toContain(EVERY_SHIFT);
    const r = step({ ...start(), turn: K.shifts, life: 8 }, 'rest');
    if (!r.ok) throw new Error(r.error);
    expect(text(mission(r.state))).not.toContain(EVERY_SHIFT); // no jobs left once the mission is over
  });
});

// ---------- 3. the preview explains changes exactly like the report ----------
describe('preview and report use the same explanations', () => {
  it('on every reachable shift and every allowed job, the preview lines are the report lines (without the storm result)', () => {
    let n = 0;
    eachState(s => {
      for (const a of ACTS) {
        if (!check(s, a).ok) { expect(shiftPreview(s, a)).toBe(null); continue; }
        const r = step(s, a);
        if (!r.ok) throw new Error(r.error);
        const p = shiftPreview(s, a)!, rep = shiftReport(s, r.rec, r.state);
        if (!r.rec.safe) { expect([p.bad, p.changes, p.confirm]).toEqual([true, [], undefined]); continue; }
        expect(p.changes).toEqual(rep.changes.filter(c => c.kind !== 'storm'));
        expect(!!p.storm).toBe(!!r.rec.storm);
        n++;
      }
    }, 3);
    expect(n).toBeGreaterThan(1000);
  });
  it('recycling explains why +3 becomes +2', () => {
    expect(previewText(start(), 'recycle')).toContain('Crew supplies 6 → 8: +3 from recycling, −1 used by the crew.');
  });
  it('the preview says when extra supplies or power would not fit', () => {
    expect(previewText({ ...start(), life: 9 }, 'recycle')).toContain(`Supplies can only go up to ${K.lifeCap}, so 2 extra could not be stored.`);
    expect(previewText({ ...start(), power: 10 }, 'rest')).toContain('The battery is full (10), so 1 extra power could not be stored.');
  });
  it('the preview is shown as a list, read out with "to" for the arrows', () => {
    const html = mission(start(), 'science');
    expect(html).toContain('aria-label="What would change"');
    expect(html).toContain('Science stars 0 <span aria-hidden="true">→</span><span class="sr-only">to</span> 2: +2.');
    expect(html).toContain('Press &quot;Do it!&quot; to play this shift');
    expect(spoken(previewText(start(), 'science'))).not.toContain('→');
  });
  it('a preview that would end the mission warns and has no "Do it!" advice', () => {
    const s = { ...start(), life: 1 }, html = mission(s, 'rest');
    expect(html).toContain('class="say bad"');
    expect(html).toContain('Uh oh! Crew supplies would run out. The mission would end.');
    expect(html).not.toContain('to play this shift');
  });
});

// ---------- 4. "What is this?" links and "Ask Pip about your base" ----------
describe('resource questions for Pip', () => {
  it('there is one question per panel, in panel order', () => {
    expect(RES.map(r => r.k)).toEqual(['power', 'life', 'shield', 'sci']);
    for (const r of RES) expect(RES[RES_INDEX[r.k]]).toBe(r);
  });
  it('the answers use the real numbers for this game (battery size, gadgets, storm need)', () => {
    for (let sc = 0; sc < SC.length; sc++) for (const g of PAIRS) {
      const s = start(sc, g), [power, life, shield, sci] = RES.map(r => r.a(s));
      expect(power).toContain(`Your battery holds up to ${s.cap}`);
      expect(power).toContain(`the sun adds ${K.sun} (only ${K.shadowSun} when a hill's shadow`);
      expect(power).toContain(`The base always uses ${K.upkeep}`);
      expect(life).toContain(`The crew uses ${K.use} every shift`);
      expect(life).toContain(`An experiment uses ${-plan(s, 'science').life!} more, and planting food uses ${-plan(s, 'grow').life!} more.`);
      expect(life).toContain(`Recycling adds ${plan(s, 'recycle').life}.`);
      expect(life).toContain(`ready ${K.growIn} shifts later and adds ${K.harvest}`);
      expect(life).toContain(`Supplies can only go up to ${K.lifeCap}`);
      expect(shield).toContain(`job adds ${plan(s, 'shelter').shield} layers`);
      expect(shield.includes('Thick Walls Kit')).toBe(g.includes('walls'));
      expect(shield).toContain(`This storm needs ${SC[sc].req}.`);
      expect(shield).toContain(`up to ${K.shieldCap}`);
      expect(sci).toContain(`Each experiment wins ${plan(s, 'science').sci} stars, up to ${K.sciMax}.`);
      expect(sci).toContain(`Get at least ${K.goal} stars`);
    }
  });
  it('the answers stay right in the middle of a mission (full shelter, a storm, a garden growing)', () => {
    const s = { ...start(0, ['walls', 'lab']), turn: SC[0].at, shield: K.shieldCap, science: K.sciMax, plant: 6, life: K.lifeCap };
    expect(RES[RES_INDEX.shield].a(s)).toContain('job adds 3 layers');
    expect(RES[RES_INDEX.sci].a(s)).toContain('Each experiment wins 2 stars');
    expect(RES[RES_INDEX.life].a(s)).toContain('Recycling adds 3.');
  });
  it('a question sets what Pip says and the screen reader hears it', () => {
    const u = ready();
    for (let i = 0; i < RES.length; i++) {
      const v = uiReducer(u, { type: 'rq', k: i });
      expect(v.mentor).toBe(RES[i].a(u.game!));
      expect(v.announce).toBe(spoken(RES[i].a(u.game!)));
      expect(v.announceN).toBe(u.announceN + 1);
      expect([v.pending, v.showReport, v.refused]).toEqual([null, false, false]);
    }
  });
  it('asking the same question twice is announced twice', () => {
    const a = uiReducer(ready(), { type: 'rq', k: 0 }), b = uiReducer(a, { type: 'rq', k: 0 });
    expect(b.announce).toBe(a.announce);
    expect(b.announceN).toBe(a.announceN + 1);
  });
  it('a question closes a preview, like the science questions do', () => {
    const u = run([{ type: 'pick', k: 'rest' }], ready());
    expect(u.pending).toBe('rest');
    expect(uiReducer(u, { type: 'rq', k: 1 }).pending).toBe(null);
  });
  it('questions that do not exist are ignored instead of crashing', () => {
    const u = ready();
    for (const k of [-1, RES.length, 0.5, NaN, Infinity, '0' as unknown as number]) {
      expect(() => uiReducer(u, { type: 'rq', k })).not.toThrow();
      expect(uiReducer(u, { type: 'rq', k })).toBe(u);
    }
  });
  it('questions are ignored on every other screen and while a shift is playing out', () => {
    const others: UIState[] = [initialUI, run([{ type: 'go-brief' }]), run([{ type: 'go-brief' }, { type: 'go-event' }]),
      run([{ type: 'go-brief' }, { type: 'go-event' }, { type: 'ev', k: 0 }])];
    for (const u of others) expect(uiReducer(u, { type: 'rq', k: 0 }), u.screen).toBe(u);
    const playing = run([{ type: 'pick', k: 'rest' }, { type: 'confirm' }], ready());
    expect(playing.resolving).toBe(true);
    expect(uiReducer(playing, { type: 'rq', k: 0 })).toBe(playing);
    const debrief = run([{ type: 'pick', k: 'rest' }, { type: 'confirm' }, { type: 'resolve' }, { type: 'results' }],
      onMission({ ...start(0, ['walls', 'garden']), turn: K.shifts, life: 8 }));
    expect(debrief.screen).toBe('debrief');
    expect(uiReducer(debrief, { type: 'rq', k: 0 })).toBe(debrief);
  });
  it('a question does not touch the game, a restart question or the mission', () => {
    const u = ready(), v = uiReducer(u, { type: 'rq', k: 2 });
    expect(v.game).toBe(u.game);
    expect([v.screen, v.restartAsk]).toEqual(['mission', false]);
  });
});

describe('"What is this?" links on the panels', () => {
  it('each panel has one, with its own name for screen readers', () => {
    const html = panels(start(), noop);
    expect(html.split('class="what"').length - 1).toBe(4);
    for (const k of Object.keys(NAME) as ResourceId[]) expect(html).toContain(`What is this?<span class="sr-only"> (${NAME[k]})</span>`);
    expect(html).toMatch(/<span class="q" aria-hidden="true">\?<\/span>What is this\?/);
  });
  it('they are real buttons, so keyboards and screen readers can use them', () => {
    expect(panels(start(), noop)).toMatch(/<button class="what">/);
  });
  it('without a handler the links are left out (the panels still explain themselves)', () => {
    const html = panels(start());
    expect(html).not.toContain('class="what"');
    expect(text(html)).toContain(WHY.life);
  });
  it('each link asks Pip about its own resource', () => {
    const asked: ResourceId[] = [];
    const tree = ResourceDisplay({ s: start(), preview: null, prev: null, tx: false, onWhat: k => asked.push(k) });
    const links = elements(tree).filter(e => e.props.className === 'what');
    expect(links.length).toBe(4);
    for (const l of links) (l.props.onClick as () => void)();
    expect(asked).toEqual(['power', 'life', 'shield', 'sci']);
  });
  it('on the mission screen, a link asks the matching question in "Ask Pip about your base"', () => {
    const asked: number[] = [];
    const tree = Mission({
      s: start(), pending: null, resolving: false, mentor: '', prev: null, tx: false, report: null, showReport: false, refused: false,
      onPick: noop, onConfirm: noop, onCancel: noop, onHint: noop, onExplain: noop, onAsk: noop, onAskBase: i => asked.push(i), onResults: noop,
    });
    const all = elements(tree);
    for (const l of all.filter(e => e.props.className === 'what')) (l.props.onClick as () => void)();
    expect(asked).toEqual([0, 1, 2, 3]);
    // and the same four questions are in the Ask Pip list
    const html = mission(start(), null, noop);
    expect(text(html)).toContain('Ask Pip about your base:');
    for (const r of RES) expect(text(html)).toContain(r.q);
    expect(text(html)).toContain('What is radiation?'); // the science questions are still there
  });
});

// ---------- 5. low warnings in words ----------
describe('low-resource warnings', () => {
  it('the written warning appears exactly when the bar turns red', () => {
    const s = start(0, ['battery', 'lab']);
    for (let p = 0; p <= s.cap; p++) {
      const html = panels({ ...s, power: p });
      expect(html.includes('class="lo"'), `power ${p}`).toBe(p <= LOW_POWER && p > 0);
      expect(html.includes('Low! Battery power'), `power ${p}`).toBe(p <= LOW_POWER);
    }
    for (let l = 0; l <= K.lifeCap; l++) {
      const html = panels({ ...s, power: s.cap, life: l });
      expect(html.includes('class="lo"'), `life ${l}`).toBe(l <= LOW_LIFE && l > 0);
      expect(html.includes('Low! Crew supplies'), `life ${l}`).toBe(l <= LOW_LIFE);
    }
  });
  it('the thresholds match Pip: the hint warns about supplies at the same level', () => {
    expect(LOW_POWER).toBe(K.upkeep + 1);
    expect(LOW_LIFE).toBe(3);
  });
  it('the warnings say what to do, and the supplies one says what happens at 0', () => {
    const w = lowWarnings({ ...start(), power: 2, life: 2 });
    expect(w.power).toBe('Low! Battery power is only 2. Pick a cheap job, or Rest so the sun can charge the battery.');
    expect(w.life).toBe('Low! Crew supplies are only 2. Recycle or plant food soon. If supplies reach 0, the mission stops!');
    expect(lowWarnings(start())).toEqual({ power: undefined, life: undefined });
  });
  it('the warning is plain text on the panel (read by screen readers), with its icon hidden', () => {
    const html = panels({ ...start(), life: 2 });
    expect(html).toMatch(/<span class="low-w"><svg[^>]*aria-hidden="true"[^]*?<\/svg><span>Low! Crew supplies are only 2\./);
  });
  it('no warnings once the mission is over', () => {
    const r = step({ ...start(), turn: K.shifts, life: 3, power: 1 }, 'rest');
    if (!r.ok) throw new Error(r.error);
    expect(r.state.ended).toBe(true);
    expect(lowWarnings(r.state)).toEqual({});
    expect(panels(r.state)).not.toContain('low-w');
  });
  it('after a shift that leaves a resource low, the screen reader hears the warning after the report', () => {
    const u = onMission({ ...start(0, ['walls', 'garden']), life: 4, power: 3 });
    const v = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }, { type: 'resolve' }], u);
    const w = lowWarnings(v.game!);
    expect(w.life).toBeDefined();
    expect(w.power).toBeDefined();
    expect(v.announce).toBe(spoken([reportText(v.report!), w.power, w.life].join(' ')));
  });
  it('nothing extra is read when nothing is low', () => {
    const v = run([{ type: 'pick', k: 'shelter' }, { type: 'confirm' }, { type: 'resolve' }], ready());
    expect(v.announce).toBe(spoken(reportText(v.report!)));
    expect(v.announce).not.toContain('Low!');
  });
});

// ---------- 6. garden, briefing and results ----------
describe('garden countdown', () => {
  const garden = (s: GameState) => /Garden: ([^<]*)</.exec(mission(s))?.[1];
  it('says "1 shift", not "1 shifts", and what the food gives', () => {
    expect(garden({ ...start(), plant: 2 })).toBe(`Growing. Ready in 1 shift (+${K.harvest} supplies).`);
    expect(garden({ ...start(), plant: 3 })).toBe(`Growing. Ready in 2 shifts (+${K.harvest} supplies).`);
    expect(garden({ ...start(), plant: 1 })).toBe(`Food is ready this shift! +${K.harvest} supplies.`);
    expect(garden(start())).toBe('Nothing planted.');
  });
});

describe('briefing and results', () => {
  it('the briefing says what happens when supplies run out and what stars are', () => {
    const t = text(renderToStaticMarkup(<Briefing onNext={noop} />));
    expect(t).toContain('Recycle and grow food to get more! If supplies run out, the mission stops.');
    expect(t).toContain('Do experiments to win 4 science stars too.'); // issue #7 wording kept
    expect(t).toContain('Each star is something new the crew learns about the Moon.');
    expect(t).toContain('Only experiments win stars, and you need 4 for a full Mission success!');
    expect(t).not.toMatch(/battery[^.]*mission stops/i);
  });
  it('the results say that leftover supplies and power give points', () => {
    const r = step({ ...start(), turn: K.shifts, life: 8 }, 'rest');
    if (!r.ok) throw new Error(r.error);
    const t = text(renderToStaticMarkup(<Results s={r.state} onRestart={noop} onRestartYes={noop} onRestartNo={noop} onOtherEvent={noop} />));
    expect(t).toContain('You win points for each part of the mission.');
    expect(t).toContain('Crew supplies and battery power you still have at the end give extra points.');
    expect(r.state.score!.supplies).toBeGreaterThan(0);
    expect(r.state.score!.power).toBeGreaterThan(0);
  });
});
