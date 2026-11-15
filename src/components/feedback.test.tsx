/**
 * Render checks for game feedback (GitHub issue #4): Pip's report, storm banners, the last shift,
 * the Results failure reason, the persistent live region and reduced motion. Uses react-dom/server, no extra packages.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from '../App';
import { init, step } from '../game/engine';
import { shiftReport, type ShiftReport } from '../game/mentor';
import { K, SC, type ActionId } from '../game/scenarios';
import type { GameState } from '../game/types';
import { RESTART_ASK } from '../game/uiState';
import { Mission } from '../screens/Mission';
import { Results } from '../screens/Results';
import { MoonScene } from './MoonScene';
import { ResourceDisplay } from './ResourceDisplay';

const noop = () => {};
const start = (): GameState => {
  const r = init(0, ['lab', 'garden']);
  if (!r.ok) throw new Error(r.error);
  return r.state;
};
const play = (s: GameState, a: ActionId) => {
  const r = step(s, a);
  if (!r.ok) throw new Error(r.error);
  return { after: r.state, report: shiftReport(s, r.rec, r.state) };
};
const mission = (s: GameState, o: { tx?: boolean; report?: ShiftReport | null; showReport?: boolean; refused?: boolean; mentor?: string } = {}) =>
  renderToStaticMarkup(
    <Mission s={s} pending={null} resolving={false} mentor={o.mentor ?? ''} prev={null} tx={o.tx ?? false}
      report={o.report ?? null} showReport={o.showReport ?? false} refused={o.refused ?? false}
      onPick={noop} onConfirm={noop} onCancel={noop} onHint={noop} onExplain={noop} onAsk={noop} onResults={noop} />,
  );

describe("Pip's report", () => {
  it('shows the headline, what changed and the fun fact apart, with a good tone', () => {
    const { after, report } = play(start(), 'shelter');
    const html = mission(after, { tx: true, report, showReport: true });
    expect(html).toContain('class="say good"');
    expect(html).toContain('Shelter built! +2 layers');
    expect(html).toContain('aria-label="What changed"');
    expect(html).toContain('class="say-f"');
    // the tone is in words too, and the mark is hidden from screen readers
    expect(html).toMatch(/<span class="say-m" aria-hidden="true">✓<\/span>/);
  });
  it('a refused job tints the bubble as a warning', () => {
    expect(mission(start(), { refused: true, mentor: 'Crew supplies are already full (10 of 10).' })).toContain('class="say warn"');
  });
  it("Pip's bubble is not its own live region on the mission screen (the app's live region reads it)", () => {
    expect(mission(start())).not.toContain('aria-live');
  });
});

describe('storm banners', () => {
  const at = (turn: number, extra: Partial<GameState> = {}) => ({ ...start(), turn, ...extra });
  it('the storm banner is never role="alert", so redraws do not read it again', () => {
    expect(mission(at(SC[0].at), { tx: true })).not.toContain('role="alert"');
  });
  it('the storm banner only shakes on the render right after the shift starts', () => {
    expect(mission(at(SC[0].at), { tx: true })).toContain('class="alert here shake"');
    expect(mission(at(SC[0].at))).toContain('class="alert here"');
  });
  it('a warning banner shows the shift before, and a storm-over banner just after', () => {
    expect(mission(at(SC[0].at - 1))).toContain('class="alert soon"');
    expect(mission(at(SC[0].at + SC[0].len, { protectedShifts: 2 }))).toContain('class="alert over"');
    expect(mission(at(1))).not.toContain('class="alert');
  });
  it('after the storm the info box says it is over', () => {
    expect(mission(at(SC[0].at + SC[0].len, { protectedShifts: 1, exposure: 1 }))).toContain('Radiation storm is over: 1 shift protected, 1 not protected.');
  });
});

describe('the last shift', () => {
  it('jobs are replaced by "See your results" so the final report can be read first', () => {
    const { after, report } = play({ ...start(), turn: K.shifts, life: 8 }, 'rest');
    const html = mission(after, { tx: true, report, showReport: true });
    expect(html).toContain('See your results');
    expect(html).toContain('Mission complete!');
    expect(html).not.toContain('class="act"');
  });
});

describe('Results', () => {
  it('a critical failure says exactly what ran out', () => {
    const { after } = play({ ...start(), life: 1, turn: 2 }, 'rest');
    const html = renderToStaticMarkup(<Results s={after} onRestart={noop} onRestartYes={noop} onRestartNo={noop} onOtherEvent={noop} />);
    expect(html).toContain('Oh no! The crew ran out of supplies');
    expect(html).toContain('On shift 2, the crew used their last supplies.');
    expect(html).toContain('class="say bad"');
  });
  it('offers "Play again" and "Try another Sun event"', () => {
    const { after } = play({ ...start(), life: 1, turn: 2 }, 'rest');
    const html = renderToStaticMarkup(<Results s={after} onRestart={noop} onRestartYes={noop} onRestartNo={noop} onOtherEvent={noop} />);
    expect(html).toContain('Play again');
    expect(html).toContain('Try another Sun event');
    expect(html).not.toContain('Yes, new mission!');
  });
  it('while asking, Pip asks the question with "Yes, new mission!" and "No, keep my results" in a labelled group', () => {
    const { after } = play({ ...start(), life: 1, turn: 2 }, 'rest');
    const html = renderToStaticMarkup(<Results s={after} asking onRestart={noop} onRestartYes={noop} onRestartNo={noop} onOtherEvent={noop} />);
    expect(html).toContain('role="group" aria-labelledby="restart-q"');
    expect(html).toContain(`<span id="restart-q">${RESTART_ASK}</span>`);
    expect(html).toContain('Yes, new mission!');
    expect(html).toContain('No, keep my results');
    expect(html).toContain('aria-label="Pip the robot looks worried"');
    expect(html).not.toContain('Play again');
    expect(html).toContain('Score:'); // the results stay visible behind the question
  });
});

describe('screen readers and motion', () => {
  it('the app has one polite live region outside the redrawn screen', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toMatch(/<main[^]*<\/main><div class="sr-only" role="status" aria-live="polite" aria-atomic="true">/);
  });
  it('only the shelter blocks that were just built fade in, using CSS (so reduced motion stops it)', () => {
    const s = { ...start(), shield: 4 };
    const html = renderToStaticMarkup(<MoonScene s={s} full newFrom={2} />);
    expect(html).not.toContain('<animate');
    expect(html.split('class="nb"').length - 1).toBe(2);
    expect(renderToStaticMarkup(<MoonScene s={s} full={false} />)).not.toContain('class="nb"');
  });
  it('supply and shelter segments flash only for what changed', () => {
    const { after } = play(start(), 'shelter'); // shelter 0 → 2, supplies 6 → 5
    const html = renderToStaticMarkup(<ResourceDisplay s={after} preview={null} prev={5} tx />);
    expect(html.split('on chg').length - 1).toBe(2);
    expect(html.split('class="gone"').length - 1).toBe(1);
    expect(renderToStaticMarkup(<ResourceDisplay s={after} preview={null} prev={5} tx={false} />)).not.toMatch(/chg|gone|class="new"/);
  });
});
