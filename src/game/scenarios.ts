/* All numbers are made-up gameplay units. */

/** Game constants (same values as the original HTML prototype). */
export const K = {
  shifts: 8,
  sun: 3,
  shadowSun: 2,
  upkeep: 2,
  use: 1,
  lifeCap: 10,
  shieldCap: 6,
  sciMax: 6,
  goal: 4,
  lifeStart: 6,
  growIn: 3,
  harvest: 4,
} as const;

export type ScenarioId = 'mar24' | 'sep17' | 'jan26';

export interface Scenario {
  id: ScenarioId;
  name: string;
  /** REAL record (NOAA SWPC) */
  date: string;
  /** REAL record: NOAA radiation-storm (S) level */
  s: 2 | 3 | 4;
  /** REAL record: X-ray flare class (shown for context only; the engine NEVER reads it) */
  flare: string | null;
  /** GAME choice: first shift the storm covers */
  at: number;
  /** GAME choice: how many shifts the storm covers */
  len: number;
  /** GAME choice: shelter points needed */
  req: number;
  /** GAME choice: hill-shadow shifts [first, last] */
  shadow: [number, number];
}

export const SC: Scenario[] = [
  { id: 'mar24', name: 'The March 2024 storm', date: 'March 23, 2024', s: 2, flare: 'X1.1', at: 5, len: 2, req: 2, shadow: [3, 4] },
  { id: 'sep17', name: 'The September 2017 storm', date: 'Sept. 10, 2017', s: 3, flare: 'X8.2', at: 4, len: 2, req: 3, shadow: [6, 7] },
  { id: 'jan26', name: 'The January 2026 storm', date: 'Jan. 19, 2026', s: 4, flare: null, at: 5, len: 3, req: 4, shadow: [2, 2] },
];

export type Gadget = 'battery' | 'walls' | 'lab' | 'garden';

/** Gadget (upgrade) names. */
export const UP: Record<Gadget, string> = {
  battery: 'Big Battery',
  walls: 'Thick Walls Kit',
  lab: 'Speedy Science Lab',
  garden: 'Garden Lamps',
};

export type ActionId = 'science' | 'recycle' | 'grow' | 'shelter' | 'message' | 'rest';

export const ACTS: ActionId[] = ['science', 'recycle', 'grow', 'shelter', 'message', 'rest'];

/** Is shift `t` inside the radiation storm? */
export const inStorm = (sc: Scenario, t: number) => t >= sc.at && t < sc.at + sc.len;

/** Sun power on shift `t` (lower while the hill's shadow is over the base). */
export const sunAt = (sc: Scenario, t: number) =>
  t >= sc.shadow[0] && t <= sc.shadow[1] ? K.shadowSun : K.sun;
