/* Screen/UI state and how each button changes it. Pure (no React), so it is easy to test. */
import { check, init, step } from './engine';
import { explain, hint, reason } from './mentor';
import { SCI } from '../data/scienceFacts';
import { isGadget, isScenario, type ActionId, type Gadget } from './scenarios';
import type { GameState } from './types';

export type Screen = 'launch' | 'brief' | 'event' | 'prep' | 'mission' | 'debrief';

export interface UIState {
  screen: Screen;
  /** Chosen Sun event (index into SC) */
  sc: number;
  /** Chosen gadgets */
  sel: Gadget[];
  /** Action the player is previewing */
  pending: ActionId | null;
  /** True during the short pause after "Do it!" */
  resolving: boolean;
  /** What Pip is saying ('' = default line) */
  mentor: string;
  /** Battery power before the last shift (for the battery-cell animation) */
  prev: number | null;
  /** True for the one render right after a shift resolves (plays the "wobble" animation) */
  tx: boolean;
  /** The running mission, or null */
  game: GameState | null;
  /** Bumped on every update. Used as a React key so the screen is redrawn fresh (and its animations replay) exactly like the original, which rebuilt the page on every click. */
  renderId: number;
  /** Move keyboard focus to the screen heading after this update */
  focusHeading: boolean;
}

export const initialUI: UIState = {
  screen: 'launch', sc: 0, sel: [], pending: null, resolving: false, mentor: '', prev: null, tx: false, game: null,
  renderId: 0, focusHeading: false,
};

export type UIAction =
  | { type: 'go-brief' }
  | { type: 'go-event' }
  | { type: 'ev'; k: number }
  | { type: 'up'; k: Gadget }
  | { type: 'launch' }
  | { type: 'pick'; k: ActionId }
  | { type: 'cancel' }
  | { type: 'confirm' }
  /** Fired 350 ms after "confirm": actually plays the shift. */
  | { type: 'resolve' }
  | { type: 'hint' }
  | { type: 'expl' }
  | { type: 'sq'; k: number }
  | { type: 'replay' };

const FOCUS_AFTER = new Set<UIAction['type']>(['go-brief', 'go-event', 'ev', 'launch', 'replay']);

/**
 * The screens each button exists on. A button sent from any other screen is ignored, so it can never
 * change (or restart, or throw away) a mission. 'resolve' is only sent by the timer after "Do it!".
 */
const SCREENS: Record<UIAction['type'], readonly Screen[]> = {
  'go-brief': ['launch'], 'go-event': ['brief', 'prep', 'debrief'], ev: ['event'], up: ['prep'], launch: ['prep'],
  pick: ['mission'], cancel: ['mission'], confirm: ['mission'], resolve: ['mission'], hint: ['mission'], expl: ['mission'], sq: ['mission'],
  replay: ['debrief'],
};

/** How many gadgets a mission takes. */
export const GADGETS = 2;
export const TOO_MANY_GADGETS = `You can only choose ${GADGETS} gadgets. Tap one you picked to remove it, then pick a different one.`;

/** Why "Blast off!" can't start the mission yet. */
export function launchError(sel: Gadget[], engineError: string): string {
  if (sel.length === 0) return `Pick ${GADGETS} gadgets before blast off. You have not picked any yet.`;
  if (sel.length < GADGETS) return `Pick ${GADGETS - sel.length} more gadget before blast off.`;
  return engineError;
}

/**
 * Updates that refuse a button press. They only change Pip's message (and drop a refused preview); the reducer
 * does not redraw the screen for them, so keyboard focus stays on the button and screen readers hear the reason.
 */
const refusals = new WeakSet<UIState>();
function refuse(ui: UIState, mentor: string, extra: Partial<UIState> = {}): UIState {
  const r = { ...ui, ...extra, mentor };
  refusals.add(r);
  return r;
}

function apply(ui: UIState, a: UIAction): UIState | null {
  const G = ui.game;
  // While a confirmed shift is playing out (the short pause after "Do it!"), ignore every button
  // except the 'resolve' that finishes it. Otherwise another click could change or cancel the shift.
  if (ui.resolving && a.type !== 'resolve') return null;
  // Buttons from another screen are ignored.
  if (!SCREENS[a.type]?.includes(ui.screen)) return null;
  switch (a.type) {
    case 'go-brief': return { ...ui, screen: 'brief' };
    case 'go-event': return { ...ui, screen: 'event', game: null };
    case 'ev':
      if (!isScenario(a.k)) return null;
      return { ...ui, sc: a.k, sel: [], screen: 'prep', mentor: '' };
    case 'up': {
      if (!isGadget(a.k)) return null;
      if (ui.sel.includes(a.k)) return { ...ui, sel: ui.sel.filter(x => x !== a.k), mentor: '' };
      if (ui.sel.length >= GADGETS) return refuse(ui, TOO_MANY_GADGETS); // never swaps out an earlier pick
      return { ...ui, sel: [...ui.sel, a.k], mentor: '' };
    }
    case 'launch': {
      const r = init(ui.sc, ui.sel);
      if (r.ok) return { ...ui, game: r.state, screen: 'mission', pending: null, mentor: '', prev: null };
      return refuse(ui, launchError(ui.sel, r.error));
    }
    case 'pick': {
      if (!G) return null;
      // Unavailable jobs never reach the "Do it!" step: Pip explains why instead.
      const c = check(G, a.k);
      return c.ok ? { ...ui, pending: a.k, mentor: '' } : refuse(ui, reason(c.error, G), { pending: null });
    }
    case 'cancel': return { ...ui, pending: null };
    case 'confirm': {
      if (!G || !ui.pending) return null;
      const c = check(G, ui.pending);
      if (!c.ok) return refuse(ui, reason(c.error, G), { pending: null });
      return { ...ui, resolving: true };
    }
    case 'resolve': {
      // Only finishes a shift that "Do it!" started.
      if (!ui.resolving) return null;
      if (!G || !ui.pending) return { ...ui, resolving: false, pending: null };
      const before = G.power, r = step(G, ui.pending);
      const next: UIState = { ...ui, resolving: false, pending: null };
      if (r.ok) {
        next.prev = before; next.game = r.state; next.tx = true; next.mentor = explain(r.state);
        if (r.state.ended) next.screen = 'debrief';
      } else next.mentor = reason(r.error, G);
      return next;
    }
    case 'hint': return G ? { ...ui, pending: null, mentor: hint(G) } : null;
    case 'expl': return G ? { ...ui, pending: null, mentor: explain(G) } : null;
    case 'sq':
      if (!Number.isInteger(a.k) || !SCI[a.k]) return null;
      return { ...ui, pending: null, mentor: SCI[a.k].a };
    case 'replay': return { ...ui, game: null, sel: [], screen: 'prep', pending: null, mentor: '', prev: null };
  }
  return null;
}

/** Reducer: returns the next UI state. */
export function uiReducer(ui: UIState, a: UIAction): UIState {
  const next = apply(ui, a);
  if (!next) return ui;
  // Matches the original: "tx" only lasts for the render right after a shift resolves.
  if (a.type !== 'resolve') next.tx = false;
  if (refusals.has(next)) { next.focusHeading = false; return next; }
  next.renderId = ui.renderId + 1;
  next.focusHeading = FOCUS_AFTER.has(a.type);
  return next;
}
