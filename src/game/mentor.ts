/* Pip's words: turns game state into the text Pip says. No React here. */
import { FACT } from '../data/scienceFacts';
import { known } from './engine';
import { K, SC, inStorm } from './scenarios';
import type { GameState } from './types';

/** Makes engine error messages friendlier for kids. */
export const kidErr = (e: string) =>
  /Stay inside|Too late|already|full|strong|too low|already have/i.test(e) ? e
    : /Not enough power/.test(e) ? 'Not enough power left for this.'
      : 'You cannot do this now.';

/** "What happened?": explains the last shift. */
export function explain(s: GameState): string {
  const h = s.history[s.history.length - 1];
  if (!h) return 'Nothing has happened yet. Pick a job for your first shift!';
  if (!h.safe)
    return h.why === 'power'
      ? `Oh no! The base needs ${h.upkeep} power every shift to keep its systems running. You had ${h.powerStart} and the sun gave ${h.sun}, so it was ${h.shortfall} short. Plan your power before the sun gets weaker!`
      : `Oh no! Crew supplies ran out on shift ${h.turn}. Recycling and growing food early helps.`;
  let t = `Shift ${h.turn}: Battery ${h.powerStart} → ${h.powerEnd} (sun +${h.sun}, base −${h.upkeep}${h.cost ? `, job −${h.cost}` : ''}). Crew supplies ${h.lifeStart} → ${h.lifeEnd}.`;
  if (h.sun < K.sun) t += ' A hill blocked some sunlight.';
  if (h.harvest) t += ` Your garden grew food! +${h.harvest} supplies.`;
  if (h.sci) t += ` +${h.sci} stars!`;
  if (h.storm)
    t += h.storm.ok
      ? ` Radiation storm, shift ${h.storm.n} of ${h.storm.of}: your shelter (${h.storm.shield}) is enough (${h.storm.req} needed). The crew stayed protected.`
      : ` Radiation storm, shift ${h.storm.n} of ${h.storm.of}: your shelter was only ${h.storm.shield} and ${h.storm.req} was needed. The crew got extra radiation this shift and needs a health check.`;
  return t + ' Fun fact: ' + FACT[h.action];
}

/** "Hint": advice for the current shift. */
export function hint(s: GameState): string {
  const sc = SC[s.sc], t = s.turn, k = known(s);
  const w = k
    ? `The radiation storm lasts shifts ${sc.at} to ${sc.at + sc.len - 1}.`
    : `Fast particles may come around shifts ${sc.at - 1} to ${sc.at + sc.len}. Ask Earth to find out.`;
  const sh = t <= sc.shadow[1]
    ? ` A hill's shadow cuts sun power to ${K.shadowSun} on shift ${sc.shadow[0]}${sc.shadow[1] > sc.shadow[0] ? ' to ' + sc.shadow[1] : ''}.`
    : '';
  if (inStorm(sc, t)) return `A radiation storm is happening. Stay inside! Your shelter is ${s.shield} and the storm needs ${sc.req}.`;
  if (s.life <= 3) return `Careful: crew supplies are low (${s.life}). Recycling gives +3. Food takes 3 shifts to grow. ${w}`;
  if (s.shield < sc.req) return `${w} You need shelter ${sc.req} and you have ${s.shield}. Each shelter job costs power.${sh}`;
  return `Your shelter is ready! ${w}${sh} What can you afford?`;
}
