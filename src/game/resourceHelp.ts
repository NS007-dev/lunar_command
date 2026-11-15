/*
 * What each resource is for, in simple words (GitHub issue #8). Shown on the resource panels, by their
 * "What is this?" links and in "Ask Pip about your base". Pure: no React.
 *
 * Every number comes from the game itself: the constants in K, the running game (battery size, this storm's
 * shelter need, the gadgets) and the engine's own plan() for what each job adds or uses. So the words always match
 * what the game really does, for every gadget pair. Nothing here changes the game.
 */
import { plan } from './engine';
import { K, SC, type ActionId } from './scenarios';
import type { GameState } from './types';

export type ResourceId = 'power' | 'life' | 'shield' | 'sci';

/** One short line on each panel: why this resource matters. */
export const WHY: Record<ResourceId, string> = {
  power: 'Every job except Rest needs power. Low battery? Rest lets the sun charge it.',
  life: 'If supplies reach 0, the mission stops!',
  shield: 'Layers stay built. Too few layers in a storm shift means extra radiation for the crew.',
  sci: `Each star is something new the crew learns about the Moon. Only experiments win stars. Get ${K.goal} for a full Mission success!`,
};

/** The panel names, so each "What is this?" link has its own name for screen readers. */
export const NAME: Record<ResourceId, string> = { power: 'battery power', life: 'crew supplies', shield: 'storm shelter', sci: 'science stars' };

/**
 * What job `a` would do in a fresh, calm moment of this game: first shift, no storm, nothing planted, nothing built,
 * no stars and no supplies yet. It asks the engine, so gadgets are included.
 */
const job = (s: GameState, a: ActionId) => plan({ ...s, turn: 1, life: 0, shield: 0, science: 0, plant: null, msgAt: null }, a);

const n = (x: number | undefined) => Math.abs(x ?? 0);

/** "Ask Pip about your base": one question per resource, in the same order as the panels. */
export const RES: { k: ResourceId; q: string; a: (s: GameState) => string }[] = [
  {
    k: 'power',
    q: 'What is battery power for?',
    a: s => `Battery power runs the Moon base. Every shift, the sun adds ${K.sun} (only ${K.shadowSun} when a hill's shadow is over the base). `
      + `The base always uses ${K.upkeep} just to keep running. Every job except Rest costs power too: the number on each job shows how much. `
      + `Your battery holds up to ${s.cap}, so extra sun power is lost. If you don't have enough power for a job, pick a cheaper one or Rest. `
      + 'Power left at the end gives you bonus points!',
  },
  {
    k: 'life',
    q: 'What are crew supplies?',
    a: s => `Crew supplies are the air, water and food your crew needs. The crew uses ${K.use} every shift, whatever job you pick. `
      + `An experiment uses ${n(job(s, 'science').life)} more, and planting food uses ${n(job(s, 'grow').life)} more. `
      + `Recycling adds ${n(job(s, 'recycle').life)}. Food you plant is ready ${K.growIn} shifts later and adds ${K.harvest}. `
      + `Supplies can only go up to ${K.lifeCap}. If they reach 0, the mission stops! Supplies left at the end give you bonus points.`,
  },
  {
    k: 'shield',
    q: 'How does the shelter keep the crew safe?',
    a: s => `The storm shelter is thick layers around the crew. A radiation storm is a shower of tiny, fast bits from the Sun, and the layers block some of them. `
      + `Each "Build storm shelter" job adds ${n(job(s, 'shelter').shield)} layers${s.loadout.includes('walls') ? ', thanks to your Thick Walls Kit' : ''}. `
      + `Layers stay built, and you can have up to ${K.shieldCap}. This storm needs ${SC[s.sc].req}. `
      + 'On every storm shift, the game checks your shelter. With enough layers, the crew is safe. With too few, the crew gets extra radiation. '
      + 'Layers you build during a storm shift count right away.',
  },
  {
    k: 'sci',
    q: 'What do science stars mean?',
    a: s => 'Each science star is something new your crew learns about the Moon. The only way to win stars is to do an experiment. '
      + 'The crew goes outside, so experiments are not allowed during a radiation storm. '
      + `Each experiment wins ${n(job(s, 'science').sci)} stars, up to ${K.sciMax}. `
      + `Get at least ${K.goal} stars, and keep the crew safe on every storm shift, for a full Mission success! Stars give you points too.`,
  },
];

/** Where each resource's question is in RES (for the panel links). */
export const RES_INDEX = Object.fromEntries(RES.map((r, i) => [r.k, i])) as Record<ResourceId, number>;
