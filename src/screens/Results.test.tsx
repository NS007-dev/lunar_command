/**
 * Results-screen wording for each Sun event (GitHub issue #6). Renders the real screen to plain text,
 * so no browser is needed. The missions are the scripted ones in src/game/testMissions.ts.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { JAN26_LATE_SHELTER, WINS, play } from '../game/testMissions';
import type { GameState } from '../game/types';
import { Results } from './Results';

const noop = () => {};
/** The words a player sees on the results screen. */
const textOf = (s: GameState) =>
  renderToStaticMarkup(<Results s={s} onRestart={noop} onRestartYes={noop} onRestartNo={noop} onOtherEvent={noop} />)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

describe('results wording for each winning mission', () => {
  const CASES = [
    { name: 'March 23, 2024', m: WINS.mar24, date: 'March 23, 2024', storm: 'The storm lasted 2 shifts and your shelter (2) was strong enough every time.', shadow: "A hill's shadow cut the sun on shift 3 to 4.", game: 'Shelter 2 and 2 storm shifts are game numbers.' },
    { name: 'September 10, 2017', m: WINS.sep17, date: 'Sept. 10, 2017', storm: 'The storm lasted 2 shifts and your shelter (3) was strong enough every time.', shadow: "A hill's shadow cut the sun on shift 6 to 7.", game: 'Shelter 3 and 2 storm shifts are game numbers.' },
    { name: 'January 19, 2026', m: WINS.jan26, date: 'Jan. 19, 2026', storm: 'The storm lasted 3 shifts and your shelter (6) was strong enough every time.', shadow: "A hill's shadow cut the sun on shift 2.", game: 'Shelter 4 and 3 storm shifts are game numbers.' },
  ];
  for (const c of CASES) {
    it(`${c.name}: mission success, with this event's storm length, shelter, shadow and real date`, () => {
      const t = textOf(play(c.m));
      expect(t).toContain('Mission success');
      expect(t).toContain('stayed protected for the whole radiation storm');
      expect(t).toContain(c.storm);
      expect(t).toContain(c.shadow);
      expect(t).toContain(`Real record: ${c.date}`);
      expect(t).toContain(c.game);
      expect(t).toContain('You did 2 experiments for 4 stars.');
      expect(t).toMatch(/Radiation protection 25\/25/);
    });
  }
});

describe('results wording when the January 2026 shelter came one shift late', () => {
  const t = textOf(play(JAN26_LATE_SHELTER));
  it('is a survival, not a success, and says 1 storm shift (singular) was too weak', () => {
    expect(t).toContain('Survival success');
    expect(t).toContain('The crew survived, but not fully protected');
    expect(t).toContain('But in 1 storm shift, your shelter was too weak');
    expect(t).not.toContain('Mission success');
  });
  it('explains the three-shift storm: strong enough for 2, too weak for 1', () => {
    expect(t).toContain('The radiation storm lasted 3 shifts. Your shelter was strong enough for 2 and too weak for 1.');
  });
  it('shows protection as 2 of 3 storm shifts (16.7 out of 25)', () => {
    expect(t).toMatch(/Radiation protection 16\.7\/25/);
  });
});
