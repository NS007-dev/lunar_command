import { K, SC } from './scenarios';
import type { GameState } from './types';

/** Ends the mission: decides the outcome and works out the score (mutates and returns `n`). */
export function finish(n: GameState): GameState {
  const sc = SC[n.sc], c = n.outcome === 'critical';
  if (!c) n.outcome = (n.exposure === 0 && n.protectedShifts === sc.len && n.science >= K.goal) ? 'success' : 'survival';
  const survive = c ? 0 : 25;
  const protect = 25 * n.protectedShifts / sc.len;
  const supplies = 20 * Math.max(0, n.life) / K.lifeCap;
  const power = 10 * Math.max(0, n.power) / n.cap;
  const science = 20 * Math.min(n.science / K.sciMax, 1);
  const total = Math.round(survive + protect + supplies + power + science);
  n.ended = true;
  n.score = { survive, protect, supplies, power, science, total };
  return n;
}
