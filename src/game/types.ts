import type { ActionId, Gadget } from './scenarios';

export interface ScoreBreakdown {
  survive: number;
  protect: number;
  supplies: number;
  power: number;
  science: number;
  total: number;
}

export type Outcome = 'success' | 'survival' | 'critical';

export interface StormRecord {
  req: number;
  shield: number;
  ok: boolean;
  /** Which storm shift this was (1-based) */
  n: number;
  /** Total storm shifts */
  of: number;
}

/** What happened on one shift. */
export interface ShiftRecord {
  turn: number;
  action: ActionId;
  powerStart: number;
  sun: number;
  upkeep: number;
  cost: number;
  powerEnd: number | null;
  lifeStart: number;
  lifeEnd: number | null;
  harvest: number;
  sci: number;
  shield: number;
  storm: StormRecord | null;
  safe: boolean;
  why?: 'power' | 'life';
  shortfall?: number;
}

export interface GameState {
  /** Index into SC */
  sc: number;
  loadout: Gadget[];
  turn: number;
  power: number;
  cap: number;
  life: number;
  shield: number;
  science: number;
  /** Shift on which the garden is ready, or null */
  plant: number | null;
  /** Shift on which the message was sent to Earth, or null */
  msgAt: number | null;
  protectedShifts: number;
  exposure: number;
  history: ShiftRecord[];
  ended: boolean;
  outcome: Outcome | null;
  score: ScoreBreakdown | null;
}

/** What an action would cost/do, or why it is not allowed. */
export interface Plan {
  error?: string;
  cost?: number;
  life?: number;
  sci?: number;
  plant?: number;
  shield?: number;
  msg?: boolean;
}

export type Result<T> = ({ ok: true } & T) | { ok: false; error: string };
