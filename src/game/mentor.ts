/* Pip's words: turns game state into the text Pip says. No React here. */
import { FACT } from '../data/scienceFacts';
import { known, plan, step } from './engine';
import { K, SC, inStorm, type ActionId } from './scenarios';
import type { GameState, ShiftRecord } from './types';

/** The arrow used in "5 → 4". Screen readers are given the word "to" instead (see spoken()). */
export const ARROW = '→';

/** Text for screen readers: "Battery power 5 → 4" becomes "Battery power 5 to 4" (not "right arrow"). */
export const spoken = (text: string) => text.split(ARROW).join('to');

/** What Pip says when a job can't be done and the game has no more specific reason. */
export const GENERIC_REFUSAL = "You can't do this job right now. Try a different one!";

/** Makes engine error messages friendlier for kids. */
export const kidErr = (e: string) =>
  /Stay inside|Too late|already|full|strong|too low|already have/i.test(e) ? e
    : /Not enough power/.test(e) ? 'Not enough battery power for this job. Try Rest to let the sun charge the battery.'
      : GENERIC_REFUSAL;

/**
 * A clear, specific reason for an engine refusal (shown on action buttons and by Pip).
 * Matches the engine's exact messages, so the engine's output never has to change. Keeps the numbers
 * from the power message. `s` (optional) adds detail that depends on the shift, e.g. a garden that is ready today.
 */
export function reason(error: string, s?: GameState): string {
  const pw = /^Not enough power: this costs (\d+) but only (\d+) is left/.exec(error);
  if (pw) return `Not enough battery power! This job needs ${pw[1]}. After the sun charges the battery and the base uses its ${K.upkeep}, you will only have ${pw[2]}. Try a cheaper job, or Rest: it costs nothing, and the sun still charges the battery.`;
  switch (error) {
    case 'Stay inside! Going outside in a radiation storm is risky.':
      return `${error} Experiments happen outside, so they wait until the storm is over.`;
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
      return 'Crew supplies are too low for this. This job uses 1 extra supply, and the crew would run out. Try recycling supplies first.';
    case 'Mission is over.':
      return 'The mission is over. Check your results!';
    case 'Unknown action.':
      return "That isn't one of the base's jobs.";
  }
  return kidErr(error);
}

/** How a message feels: good news, a warning, or a failure. Always shown with words too, never colour alone. */
export type Tone = 'good' | 'warn' | 'bad';

/** One line of "what changed" in a shift report. */
export interface Change {
  kind: 'power' | 'life' | 'shield' | 'sci' | 'storm';
  text: string;
  /** Something went wrong on this line (e.g. the crew was not protected) */
  warn?: boolean;
}

/** Pip's report on the shift that was just played. Every number comes from the engine's shift record. */
export interface ShiftReport {
  tone: Tone;
  /** Short headline, e.g. "Shelter built! +2 layers" */
  title: string;
  /** One friendly sentence about what the job did */
  detail: string;
  /** Power, supplies, shelter, stars and storm, each on its own line */
  changes: Change[];
  /** Said when this was the mission's last shift */
  end?: string;
  /** Fun fact (shown apart from the result) */
  fact?: string;
}

const s_ = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);
/** "+3 from the sun, −2 to run the base" (zero parts are left out). */
const parts = (xs: [number, string][]) => xs.filter(([n]) => n !== 0).map(([n, w]) => `${signed(n)} ${w}`).join(', ');

/** Why the mission stopped, for a shift where the base could not keep going. */
export function failure(h: ShiftRecord): { title: string; detail: string } {
  return h.why === 'power'
    ? {
      title: 'Oh no! The base ran out of power',
      detail: `On shift ${h.turn}, the base needed ${h.upkeep} power to keep running. You had ${h.powerStart} and the sun gave ${h.sun}, so it was ${h.shortfall} short. Next time, save some power before the sun gets weaker!`,
    }
    : {
      title: 'Oh no! The crew ran out of supplies',
      detail: `On shift ${h.turn}, the crew used their last supplies. Next time, recycle or plant food earlier.`,
    };
}

const END_OK = 'That was the last shift. Mission complete! Press "See your results" to find out how you did.';
const END_BAD = 'The mission is over. Press "See your results" to find out what happened.';

/**
 * Builds Pip's report for one shift. `before` is the game right before the shift, `rec` the engine's record of it
 * and `after` the game right after. Nothing is worked out a second way: the numbers are the record's, and what the
 * job adds is read from the engine's own plan().
 */
export function shiftReport(before: GameState, rec: ShiftRecord, after: GameState): ShiftReport {
  const end = after.ended ? (rec.safe ? END_OK : END_BAD) : undefined;
  const changes: Change[] = [];
  const shade = rec.sun < K.sun;
  const powerLine = (): Change => {
    const pe = rec.powerEnd ?? 0, raw = rec.powerStart + rec.sun - rec.upkeep - rec.cost, lost = raw - pe;
    return {
      kind: 'power',
      text: `Battery power ${rec.powerStart} → ${pe}: ${parts([[rec.sun, shade ? "from the sun (a hill's shadow blocked some)" : 'from the sun'], [-rec.upkeep, 'to run the base'], [-rec.cost, 'for the job']])}.`
        + (lost > 0 ? ` The battery is full (${after.cap}), so ${lost} extra power could not be stored.` : ''),
    };
  };

  if (!rec.safe) {
    const f = failure(rec);
    if (rec.why === 'life') changes.push(powerLine(), { kind: 'life', text: `Crew supplies ${rec.lifeStart} → 0.`, warn: true });
    return { tone: 'bad', title: f.title, detail: f.detail, changes, end };
  }

  const p = plan(before, rec.action), job = p.life ?? 0, hv = rec.harvest;
  changes.push(powerLine());

  // Crew supplies: what was added is capped first, then the job and the crew use theirs (same order as the engine).
  const gain = job > 0 ? job : 0, use = job < 0 ? job : 0, lifeEnd = rec.lifeEnd ?? 0;
  const lostLife = rec.lifeStart + gain + hv - Math.min(K.lifeCap, rec.lifeStart + gain + hv);
  changes.push({
    kind: 'life',
    text: `Crew supplies ${rec.lifeStart} → ${lifeEnd}: ${parts([[gain, 'from recycling'], [hv, 'from your garden'], [use, rec.action === 'grow' ? 'water for the plants' : 'for the trip outside'], [-K.use, 'used by the crew']])}.`
      + (lostLife > 0 ? ` Supplies can only go up to ${K.lifeCap}, so ${lostLife} extra could not be stored.` : ''),
  });

  const sc = SC[before.sc], stormLeft = rec.turn <= sc.at + sc.len - 1;
  const added = rec.shield - before.shield;
  if (p.shield) {
    const extra = p.shield - added;
    changes.push({
      kind: 'shield',
      text: `Shelter ${before.shield} → ${rec.shield} layers: ${signed(added)}.`
        + (extra > 0 ? ` The shelter can only have ${K.shieldCap} layers, so ${s_(extra, 'extra layer')} did not fit.` : '')
        + (stormLeft ? (rec.shield >= sc.req ? ` That is enough for the storm (it needs ${sc.req})!` : ` The storm needs ${sc.req}, so keep building!`) : ''),
    });
  }

  if (p.sci) {
    const was = after.science - rec.sci, extra = p.sci - rec.sci;
    changes.push({
      kind: 'sci',
      text: `Science stars ${was} → ${after.science}: ${signed(rec.sci)}.`
        + (extra > 0 ? ` You can only have ${K.sciMax} stars, so ${s_(extra, 'star')} could not be added.` : '')
        + (was < K.goal && after.science >= K.goal ? ` You reached the goal of ${K.goal} stars!` : ''),
    });
  }

  if (rec.storm) {
    const st = rec.storm;
    changes.push(st.ok
      ? { kind: 'storm', text: `Storm shift ${st.n} of ${st.of}: your shelter (${st.shield}) was strong enough (${st.req} needed). The crew stayed safe!` }
      : { kind: 'storm', text: `Storm shift ${st.n} of ${st.of}: your shelter (${st.shield}) was not strong enough (${st.req} needed). The crew got extra radiation and will need a health check.`, warn: true });
  }

  const T: Record<ActionId, [string, string]> = {
    science: [`Experiment done! ${signed(rec.sci)} stars`, 'The crew went outside and learned something new about the Moon.'],
    recycle: ['Supplies recycled!', 'The crew cleaned used air and water so they can use them again.'],
    grow: [`Food planted! Ready on shift ${after.plant}`, `Plants need ${K.growIn} shifts to grow. Then they give +${K.harvest} supplies.`],
    shelter: [`Shelter built! ${signed(added)} ${added === 1 ? 'layer' : 'layers'}`, 'More layers between the crew and the storm block more radiation.'],
    message: ['Message sent to Earth!', 'Earth scientists will study the Sun and tell you when the radiation storm comes. Their reply comes next shift.'],
    rest: ['Rest done! No power spent', 'The crew rested while the sun charged the battery.'],
  };
  const [title, detail] = T[rec.action];
  return {
    tone: rec.storm && !rec.storm.ok ? 'warn' : 'good',
    title,
    detail: detail + (hv ? ` Yum! Your garden food was ready: +${hv} supplies.` : ''),
    changes, end, fact: FACT[rec.action],
  };
}

/** The report as one plain sentence list, for the screen-reader announcement. */
export function reportText(r: ShiftReport): string {
  const title = /[.!?]$/.test(r.title) ? r.title : r.title + '.';
  return [title, r.detail, ...r.changes.map(c => c.text), r.end, r.fact && 'Fun fact: ' + r.fact].filter(Boolean).join(' ');
}

/** What the screen says about the radiation storm right now: coming, here or just over. Null when there is nothing to say. */
export function stormNews(s: GameState): { kind: 'soon' | 'here' | 'over'; text: string } | null {
  if (s.ended) return null;
  const sc = SC[s.sc], t = s.turn, last = sc.at + sc.len - 1, ready = s.shield >= sc.req;
  if (t === sc.at - 1)
    return known(s)
      ? { kind: 'soon', text: `Heads up! The radiation storm starts next shift. It needs ${sc.req} shelter layers and you have ${s.shield}.${ready ? ' Your shelter is ready!' : ' Build more shelter now!'}` }
      : { kind: 'soon', text: `A radiation storm could start soon! Ask Earth to find out, and get your shelter ready (it needs ${sc.req} layers).` };
  if (inStorm(sc, t))
    return {
      kind: 'here',
      text: `${t === sc.at ? 'The radiation storm is here!' : 'The radiation storm goes on.'} Storm shift ${t - sc.at + 1} of ${sc.len}. Stay inside! Your shelter has ${s.shield} layers and the storm needs ${sc.req}.${ready ? ' The crew is safe.' : ' Build more shelter!'}`,
    };
  if (t === last + 1)
    return { kind: 'over', text: `The storm is over! The crew can go outside again, so experiments are allowed. Your shelter kept the crew safe for ${s.protectedShifts} of ${sc.len} storm shifts.` };
  return null;
}

/** What Pip says while the player is looking at "Do it!" for job `a`. */
export function previewText(s: GameState, a: ActionId): string {
  const pv = step(s, a);
  if (!pv.ok) return reason(pv.error, s);
  const r = pv.rec;
  if (!r.safe) return `Uh oh! ${r.why === 'power' ? 'The base would be ' + r.shortfall + ' power short.' : 'Crew supplies would run out.'} The mission would end.`;
  const storm = r.storm
    ? (r.storm.ok
      ? ` The storm needs ${r.storm.req} shelter layers, and you will have enough.`
      : ` The storm needs ${r.storm.req} shelter layers, but you would only have ${r.storm.shield}. The crew would get extra radiation.`)
    : '';
  return `If you do this: battery power ${r.powerStart} → ${r.powerEnd}, crew supplies ${r.lifeStart} → ${r.lifeEnd}, shelter ${s_(r.shield, 'layer')}, ${s_(pv.state.science, 'star')}.${storm} ${CONFIRM}`;
}

/** What Pip says at the start of the first shift, before anything is picked. */
export const FIRST_SHIFT = 'This is your first shift! Tap a job to see what it will do. Then press "Do it!" to play the shift.';
/** What Pip says at the start of later shifts. */
export const NEXT_SHIFT = 'What should we do this shift? Tap a job to see what it will do.';

/** How to carry on from a preview. */
export const CONFIRM = 'Press "Do it!" to play this shift, or "Wait, no" to pick again.';

/** "Hint": advice for the current shift. */
export function hint(s: GameState): string {
  const sc = SC[s.sc], t = s.turn, k = known(s);
  const w = k
    ? `The radiation storm covers shifts ${sc.at} to ${sc.at + sc.len - 1}.`
    : `The radiation storm may come around shifts ${sc.at - 1} to ${sc.at + sc.len}. ${s.msgAt == null ? 'Ask Earth to find out exactly.' : "Earth's reply comes next shift."}`;
  const sh = t <= sc.shadow[1]
    ? ` On ${sc.shadow[1] > sc.shadow[0] ? `shifts ${sc.shadow[0]} to ${sc.shadow[1]}` : `shift ${sc.shadow[0]}`}, a hill's shadow means the sun only adds ${K.shadowSun} power.`
    : '';
  if (inStorm(sc, t)) return `A radiation storm is happening, so stay inside! Your shelter has ${s.shield} layers and the storm needs ${sc.req}.${s.shield >= sc.req ? ' The crew is safe.' : ' Build more shelter now!'}`;
  if (s.life <= 3) return `Careful: crew supplies are low (${s.life}). Recycling gives +3 right away. Food takes 3 shifts to grow. ${w}`;
  if (s.shield < sc.req) return `${w} The storm needs ${sc.req} shelter layers and you have ${s.shield}. Each shelter job costs power, so build before the storm comes!${sh}`;
  return `Your shelter is ready! ${w}${sh} ${s.science < K.goal ? 'Try an experiment to win science stars!' : 'Pick a job you have enough power for.'}`;
}
