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

/**
 * A clear, specific reason for an engine refusal (shown on action buttons and by Pip).
 * Matches the engine's exact messages, so the engine's output never has to change. Keeps the numbers
 * from the power message. `s` (optional) adds detail that depends on the shift, e.g. a garden that is ready today.
 */
export function reason(error: string, s?: GameState): string {
  const pw = /^Not enough power: this costs (\d+) but only (\d+) is left/.exec(error);
  if (pw) return `Not enough power. This job needs ${pw[1]}, but after this shift's sun and the base's ${K.upkeep}, only ${pw[2]} is left.`;
  switch (error) {
    case 'Stay inside! Going outside in a radiation storm is risky.':
      return `${error} Experiments are outside jobs, so they wait until the storm is over.`;
    case 'You already have all the stars!':
      return `You already have all ${K.sciMax} stars!`;
    case 'Crew supplies are already full.':
      return `Crew supplies are already full (${K.lifeCap} of ${K.lifeCap}).`;
    case 'Your garden is already growing.':
      return s && s.plant === s.turn
        ? 'Your food is ready to pick this shift, so the garden is still busy. Only one garden can grow at a time.'
        : 'Your garden is already growing. Only one garden can grow at a time.';
    case 'Too late! Food needs 3 shifts to grow.':
      return `Too late! Food needs ${K.growIn} shifts to grow, and the mission ends after shift ${K.shifts}.`;
    case 'The shelter is as strong as it can be.':
      return `The shelter is as strong as it can be (${K.shieldCap} layers).`;
    case 'Earth already got your message.':
      return 'Earth already got your message. You can only send one.';
    case 'Crew supplies are too low for this.':
      return 'Crew supplies are too low for this. This job uses 1 extra supply, and the crew would run out.';
    case 'Mission is over.':
      return 'The mission is over. Check your results!';
    case 'Unknown action.':
      return "That isn't one of the base's jobs.";
  }
  return kidErr(error);
}

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
