/**
 * Scripted missions shared by the scenario tests (GitHub issue #6). Test-only: nothing in the game imports this file.
 * Every plan is deterministic and was worked out by hand from the rules in GAME_RULES.md.
 */
import { init, step } from './engine';
import { SC, type ActionId, type Gadget, type ScenarioId } from './scenarios';
import type { GameState } from './types';

/** Scenario indexes into SC, by name, so tests never say "event 2". */
export const MARCH_2024 = 0;
export const SEPTEMBER_2017 = 1;
export const JANUARY_2026 = 2;

/** Plays `actions` from a fresh start, one per shift. Throws (naming the shift) if the engine refuses one. */
export function playMission(sc: number, gadgets: Gadget[], actions: ActionId[]): GameState {
  const r = init(sc, gadgets);
  if (!r.ok) throw new Error(r.error);
  let s = r.state;
  for (const a of actions) {
    const next = step(s, a);
    if (!next.ok) throw new Error(`${SC[sc].id}: ${a} was refused on shift ${s.turn}: ${next.error}`);
    s = next.state;
  }
  return s;
}

/** After each shift: [shift, job, power, crew supplies, shelter, science stars]. */
export type TraceRow = [number, ActionId, number, number, number, number];

export interface ScriptedMission {
  sc: number;
  gadgets: Gadget[];
  actions: ActionId[];
  /** What the base looks like at the end of every shift. */
  trace: TraceRow[];
}

/** One winning mission per Sun event: message early, shelter ready before the storm, experiments outside the storm. */
export const WINS: Record<ScenarioId, ScriptedMission> = {
  // Storm shifts 5–6 needs shelter 2: one shelter job (+2), built in the hill's shadow (shifts 3–4, sun 2).
  mar24: {
    sc: MARCH_2024,
    gadgets: ['battery', 'lab'],
    actions: ['message', 'science', 'recycle', 'shelter', 'rest', 'rest', 'recycle', 'science'],
    trace: [
      [1, 'message', 7, 5, 0, 0],
      [2, 'science', 7, 3, 0, 2],
      [3, 'recycle', 5, 5, 0, 2], // shadow: sun 2
      [4, 'shelter', 3, 4, 2, 2], // shadow: sun 2; shelter 2 is enough
      [5, 'rest', 4, 3, 2, 2], // storm 1 of 2
      [6, 'rest', 5, 2, 2, 2], // storm 2 of 2
      [7, 'recycle', 4, 4, 2, 2],
      [8, 'science', 4, 2, 2, 4], // goal of 4 stars reached on the last shift
    ],
  },
  // Storm shifts 4–5 needs shelter 3: one Thick Walls job (+3) on shift 3, the shift just before the storm.
  sep17: {
    sc: SEPTEMBER_2017,
    gadgets: ['walls', 'lab'],
    actions: ['message', 'science', 'shelter', 'recycle', 'rest', 'science', 'recycle', 'rest'],
    trace: [
      [1, 'message', 5, 5, 0, 0],
      [2, 'science', 5, 3, 0, 2],
      [3, 'shelter', 4, 2, 3, 2], // Thick Walls: +3, exactly what the storm needs
      [4, 'recycle', 3, 4, 3, 2], // storm 1 of 2
      [5, 'rest', 4, 3, 3, 2], // storm 2 of 2
      [6, 'science', 3, 1, 3, 4], // shadow: sun 2
      [7, 'recycle', 1, 3, 3, 4], // shadow: sun 2
      [8, 'rest', 2, 2, 3, 4],
    ],
  },
  // Storm shifts 5–7 needs shelter 4: two shelter jobs. Same plan as the restart tests in uiState.test.ts.
  jan26: {
    sc: JANUARY_2026,
    gadgets: ['walls', 'garden'],
    actions: ['science', 'recycle', 'grow', 'shelter', 'shelter', 'message', 'rest', 'science'],
    trace: [
      [1, 'science', 4, 4, 0, 2],
      [2, 'recycle', 2, 6, 0, 2], // shadow: sun 2
      [3, 'grow', 2, 4, 0, 2], // food ready on shift 6
      [4, 'shelter', 1, 3, 3, 2],
      [5, 'shelter', 0, 2, 6, 2], // storm 1 of 3: shelter built this shift counts
      [6, 'message', 0, 5, 6, 2], // storm 2 of 3: harvest +4
      [7, 'rest', 1, 4, 6, 2], // storm 3 of 3
      [8, 'science', 0, 2, 6, 4],
    ],
  },
};

/**
 * January 2026 with the second shelter job one shift too late: storm shift 1 has shelter 3 (needs 4), so the crew
 * is exposed once and the mission ends as a survival, not a success.
 */
export const JAN26_LATE_SHELTER: ScriptedMission = {
  sc: JANUARY_2026,
  gadgets: ['walls', 'garden'],
  actions: ['science', 'recycle', 'grow', 'rest', 'shelter', 'shelter', 'rest', 'science'],
  trace: [
    [1, 'science', 4, 4, 0, 2],
    [2, 'recycle', 2, 6, 0, 2],
    [3, 'grow', 2, 4, 0, 2],
    [4, 'rest', 3, 3, 0, 2],
    [5, 'shelter', 2, 2, 3, 2], // storm 1 of 3: 3 < 4, exposed
    [6, 'shelter', 1, 5, 6, 2], // storm 2 of 3: protected (and the harvest arrives)
    [7, 'rest', 2, 4, 6, 2], // storm 3 of 3: protected
    [8, 'science', 1, 2, 6, 4],
  ],
};

export const play = (m: ScriptedMission) => playMission(m.sc, m.gadgets, m.actions);
