/**
 * Checks the React version's game engine against the original HTML prototype's engine.
 * Plays thousands of random missions on both and expects identical states after every shift.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as Engine from '../src/game/engine';
import { ACTS, SC, type ActionId, type Gadget } from '../src/game/scenarios';
import type { GameState } from '../src/game/types';

type LegacyEngine = {
  init: (sc: number, load: string[]) => { ok: boolean; state?: unknown; error?: string };
  step: (s: unknown, a: string) => { ok: boolean; state?: unknown; rec?: unknown; error?: string };
  plan: (s: unknown, a: string) => unknown;
};

function loadLegacy(): LegacyEngine {
  const html = readFileSync(new URL('../legacy/index.html', import.meta.url), 'utf8');
  const src = html.match(/<script id="engine">([\s\S]*?)<\/script>/)![1];
  return new Function(`${src}; return Engine;`)() as LegacyEngine;
}

const legacy = loadLegacy();
const GADGETS: Gadget[] = ['battery', 'walls', 'lab', 'garden'];
const PAIRS: Gadget[][] = GADGETS.flatMap((a, i) => GADGETS.slice(i + 1).map(b => [a, b]));

// Small seeded random generator so failures can be reproduced.
function rng(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
}

describe('engine matches the original HTML prototype', () => {
  it('init gives the same starting state and errors', () => {
    for (let sc = 0; sc < SC.length; sc++) for (const p of PAIRS) expect(Engine.init(sc, p)).toEqual(legacy.init(sc, p));
    expect(Engine.init(5, ['battery', 'lab'])).toEqual(legacy.init(5, ['battery', 'lab']));
    expect(Engine.init(0, ['battery', 'battery'])).toEqual(legacy.init(0, ['battery', 'battery']));
    expect(Engine.init(0, ['battery'])).toEqual(legacy.init(0, ['battery']));
  });

  it('random missions play out identically (plans, previews, results and scores)', () => {
    const rand = rng(42);
    let missions = 0;
    for (let run = 0; run < 600; run++) {
      const sc = run % SC.length, pair = PAIRS[Math.floor(rand() * PAIRS.length)];
      const a = Engine.init(sc, pair), b = legacy.init(sc, pair);
      if (!a.ok) throw new Error('init failed');
      let s: GameState = a.state, ls = b.state;
      while (!s.ended) {
        for (const act of ACTS) {
          expect(Engine.plan(s, act)).toEqual(legacy.plan(ls, act));
          expect(Engine.step(s, act)).toEqual(legacy.step(ls, act));
        }
        const choices = ACTS.filter(x => Engine.step(s, x).ok);
        const act: ActionId = choices[Math.floor(rand() * choices.length)];
        const r = Engine.step(s, act), lr = legacy.step(ls, act);
        expect(r).toEqual(lr);
        if (!r.ok) throw new Error('step failed');
        s = r.state; ls = lr.state;
      }
      missions++;
    }
    expect(missions).toBe(600);
  });

  it('an ended mission refuses more actions', () => {
    const r = Engine.init(0, ['battery', 'lab']);
    if (!r.ok) throw new Error();
    const ended = { ...r.state, ended: true };
    expect(Engine.step(ended, 'rest')).toEqual(legacy.step(ended, 'rest'));
  });
});
