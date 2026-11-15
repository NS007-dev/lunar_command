/**
 * Child-friendly instructions (GitHub issue #7): every screen says what to do next in simple words,
 * unfamiliar terms are explained, and screen readers hear words instead of symbols.
 * Renders the real screens with react-dom/server, no extra packages.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { init, step } from '../game/engine';
import { FIRST_SHIFT, NEXT_SHIFT, shiftReport } from '../game/mentor';
import { K, SC, type ActionId, type Gadget } from '../game/scenarios';
import type { GameState } from '../game/types';
import { PICK_HELP, RESTART_ASK } from '../game/uiState';
import { Briefing } from '../screens/Briefing';
import { EventSelection } from '../screens/EventSelection';
import { GadgetSelection } from '../screens/GadgetSelection';
import { Mission } from '../screens/Mission';
import { Results } from '../screens/Results';
import { ActionButton } from './ActionButton';
import { MoonScene } from './MoonScene';
import { Pip } from './Pip';
import { PipReport } from './PipReport';
import { ResourceDisplay } from './ResourceDisplay';
import { ShiftPath } from './ShiftPath';

const noop = () => {};
const start = (sc = 0, g: Gadget[] = ['lab', 'garden']): GameState => {
  const r = init(sc, g);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
/** The words on the page, without tags. */
const text = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const mission = (s: GameState, pending: ActionId | null = null) =>
  renderToStaticMarkup(
    <Mission s={s} pending={pending} resolving={false} mentor="" prev={null} tx={false} report={null} showReport={false} refused={false}
      onPick={noop} onConfirm={noop} onCancel={noop} onHint={noop} onExplain={noop} onAsk={noop} onResults={noop} />,
  );

describe('briefing', () => {
  const t = text(renderToStaticMarkup(<Briefing onNext={noop} />));
  it('explains what a shift is, how stars are won and what NOAA is', () => {
    expect(t).toContain('A shift is one turn: you pick one job for the crew.');
    expect(t).toContain('Do experiments to win 4 science stars');
    expect(t).toContain("NOAA , a US science agency that watches the Sun's weather");
  });
  it('explains the battery with real numbers and why shelter comes first', () => {
    expect(t).toContain(`The base always uses ${K.upkeep} power just to keep running.`);
    expect(t).toContain('Build thick shelter layers before the storm comes');
    expect(t).toContain('no outdoor experiments');
  });
  it('uses the same shelter name as the job button', () => {
    expect(t).toContain('Storm shelter');
    expect(t).not.toContain('Crew protection');
  });
});

describe('choosing a Sun event', () => {
  const t = text(renderToStaticMarkup(<EventSelection onPick={noop} />));
  it('says what to do and explains flares, radiation storms and S numbers', () => {
    expect(t).toContain('Pick one real Sun event.');
    expect(t).toContain('A solar flare is a super-bright flash of light and X-rays.');
    expect(t).toContain('A radiation storm is a shower of tiny, fast bits from the Sun.');
    expect(t).toContain('The March 2024 and September 2017 events show both.');
    expect(t).toContain('The January 2026 event in this game shows the radiation storm only.');
    expect(t).toContain('The bigger the number, the stronger the storm.');
  });
  it('explains pfu, says when a flare is left out, and uses full month names', () => {
    expect(t).toContain('1,040 pfu');
    expect(t).toContain('pfu is the unit scientists use');
    expect(t).toContain('Our game does not include a flare for this event.');
    expect(t).toContain('September 10, 2017');
    expect(t).toContain('January 19, 2026');
    expect(t).not.toMatch(/Sept\.|Jan\./);
  });
  it('lists each game rule on its own line, with the right shadow grammar', () => {
    expect(t).toContain('Shelter needed: 2 layers');
    expect(t).toContain('Storm lasts: 3 shifts');
    expect(t).toContain('Hill shadow: shifts 3 and 4');
    expect(t).toContain('Hill shadow: shift 2');
  });
});

describe('choosing gadgets', () => {
  const render = (sel: Gadget[]) => text(renderToStaticMarkup(<GadgetSelection sc={0} sel={sel} message="" onToggle={noop} onLaunch={noop} onChangeEvent={noop} />));
  it('explains how to pick and un-pick, with no credits', () => {
    const t = render([]);
    expect(t).toContain(PICK_HELP);
    expect(PICK_HELP).toContain('Tap it again to put it back.');
    expect(t).toContain('Gadgets picked: 0 of 2');
    expect(t).not.toMatch(/credit/i);
  });
  it('says what to press once two are picked', () => {
    expect(render(['lab', 'walls'])).toContain('Press "Blast off!" when you are ready.');
  });
  it('the Big Battery says what it changes compared with no gadget', () => {
    expect(render([])).toContain('Holds 14 power instead of 10, and starts with 7 instead of 5.');
    // and that really is what the engine does
    const plain = start(0, ['lab', 'garden']), big = start(0, ['battery', 'lab']);
    expect([plain.cap, plain.power, big.cap, big.power]).toEqual([10, 5, 14, 7]);
  });
});

describe('mission screen', () => {
  it('the first shift explains how to play a shift; later shifts keep it short', () => {
    expect(text(mission(start()))).toContain(FIRST_SHIFT);
    expect(FIRST_SHIFT).toContain('Tap a job');
    expect(FIRST_SHIFT).toContain('"Do it!"');
    const later = text(mission({ ...start(), turn: 2 }));
    expect(later).toContain(NEXT_SHIFT);
    expect(later).not.toContain(FIRST_SHIFT);
  });
  it('the button says "What just happened?"', () => {
    expect(text(mission(start()))).toContain('What just happened?');
  });
  it('the shelter job shows how many layers it adds (2, or 3 with the Thick Walls Kit)', () => {
    const plain = renderToStaticMarkup(<ActionButton s={start()} a="shelter" pressed={false} resolving={false} onPick={noop} />);
    const walls = renderToStaticMarkup(<ActionButton s={start(0, ['walls', 'lab'])} a="shelter" pressed={false} resolving={false} onPick={noop} />);
    expect(plain).toContain('+2 layers.');
    expect(walls).toContain('+3 layers.');
  });
  it('the experiment and Ask Earth jobs say why and what for', () => {
    const t = text(mission(start()));
    expect(t).toContain('The crew goes outside to explore.');
    expect(t).toContain('Earth scientists will tell you exactly which shifts the radiation storm covers.');
  });
  it('resource labels are in normal letters, not ALL CAPS', () => {
    const t = text(renderToStaticMarkup(<ResourceDisplay s={start()} preview={null} prev={null} tx={false} />));
    for (const l of ['Battery power', 'Crew supplies', 'Storm shelter', 'Science stars: 0 of 6']) expect(t).toContain(l);
    expect(t).not.toMatch(/POWER|CREW|PROTECTION|SCIENCE STARS/);
    expect(t).toContain('the sun adds 3, and the base uses 2 to keep running.');
  });
});

describe('screen readers', () => {
  it('Pip\'s cheer mood reads as "cheerful"', () => {
    expect(renderToStaticMarkup(<Pip mood="cheer" />)).toContain('aria-label="Pip the robot looks cheerful"');
    expect(renderToStaticMarkup(<Pip mood="happy" />)).toContain('aria-label="Pip the robot looks happy"');
  });
  it('preview arrows on the resource panels are read as "will be"', () => {
    const html = renderToStaticMarkup(<ResourceDisplay s={start()} preview={{ power: 4, life: 5, shield: 2, sci: 0 }} prev={null} tx={false} />);
    expect(html).toContain('<span aria-hidden="true">→</span><span class="sr-only">will be</span>');
    expect(html).toContain('aria-label="Battery power: 5 of 10"');
    expect(html).toContain('aria-label="0 of 6 science stars"');
  });
  it('arrows in Pip\'s report and preview are read as "to"', () => {
    const s = start(), r = step(s, 'shelter');
    if (!r.ok) throw new Error(r.error);
    const report = renderToStaticMarkup(<PipReport r={shiftReport(s, r.rec, r.state)} />);
    expect(report).toContain('Battery power 5 <span aria-hidden="true">→</span><span class="sr-only">to</span> 4');
    expect(mission(s, 'shelter')).toContain('battery power 5 <span aria-hidden="true">→</span><span class="sr-only">to</span> 4');
  });
  it('the Moon picture calls the storm a radiation storm and counts shelter layers', () => {
    const html = renderToStaticMarkup(<MoonScene s={{ ...start(), turn: SC[0].at, shield: 1 }} full />);
    expect(html).toContain('Storm shelter: 1 layer.');
    expect(html).toContain('A radiation storm is happening!');
    expect(html).not.toContain('solar storm');
  });
  it('the shift path names a one-shift shadow as "shift 2"', () => {
    expect(renderToStaticMarkup(<ShiftPath s={start(2)} />)).toContain('Hill shadow on shift 2.');
    expect(renderToStaticMarkup(<ShiftPath s={start(0)} />)).toContain('Hill shadow on shifts 3 to 4.');
  });
  it('score values are read as "out of ... points"', () => {
    const s = start(), r = step({ ...s, life: 1, turn: 2 }, 'rest');
    if (!r.ok) throw new Error(r.error);
    const html = renderToStaticMarkup(<Results s={r.state} onRestart={noop} onRestartYes={noop} onRestartNo={noop} onOtherEvent={noop} />);
    expect(html).toContain('<span aria-hidden="true">0/25</span><span class="sr-only">0 out of 25 points</span>');
  });
});

describe('results and restart', () => {
  const ended = (life: number) => {
    const r = step({ ...start(), life, turn: 2 }, 'rest');
    if (!r.ok) throw new Error(r.error);
    return text(renderToStaticMarkup(<Results s={r.state} onRestart={noop} onRestartYes={noop} onRestartNo={noop} onOtherEvent={noop} />));
  };
  it('a stopped mission is called "Mission stopped", not "Critical failure"', () => {
    const t = ended(1);
    expect(t).toContain('Mission stopped');
    expect(t).not.toContain('Critical failure');
  });
  it('explains the score and keeps the flare vs radiation point', () => {
    const t = ended(1);
    expect(t).toContain('You win points for each part of the mission.');
    expect(t).toContain("so a flare's X number does not tell you how much radiation reached the crew.");
    expect(t).toContain('radiation dose (how much radiation a person\'s body takes in)');
  });
  it('the restart question says what will happen to the results', () => {
    expect(RESTART_ASK).toBe('Do you want to start a new mission? Your score and results from this mission will go away.');
  });
  it('the sources say which part is for kids and which is for grown-ups', () => {
    const t = ended(1);
    expect(t).toContain('What is real in this game?');
    expect(t).toContain('For curious explorers');
    expect(t).toContain('For grown-ups: extra notes and sources');
    expect(t).toContain('so it can work without the internet');
  });
});
