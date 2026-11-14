/* Screen/UI state and how each button changes it. Pure (no React), so it is easy to test. */
import { init, step } from './engine';
import { explain, hint, kidErr } from './mentor';
import { SCI } from '../data/scienceFacts';
import type { ActionId, Gadget } from './scenarios';
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

function apply(ui: UIState, a: UIAction): UIState | null {
  const G = ui.game;
  // While a confirmed shift is playing out (the short pause after "Do it!"), ignore every button
  // except the 'resolve' that finishes it. Otherwise another click could change or cancel the shift.
  if (ui.resolving && a.type !== 'resolve') return null;
  switch (a.type) {
    case 'go-brief': return { ...ui, screen: 'brief' };
    case 'go-event': return { ...ui, screen: 'event', game: null };
    case 'ev': return { ...ui, sc: a.k, sel: [], screen: 'prep' };
    case 'up': {
      const i = ui.sel.indexOf(a.k);
      if (i >= 0) return { ...ui, sel: ui.sel.filter(x => x !== a.k) };
      if (ui.sel.length < 2) return { ...ui, sel: [...ui.sel, a.k] };
      return { ...ui };
    }
    case 'launch': {
      const r = init(ui.sc, ui.sel);
      if (r.ok) return { ...ui, game: r.state, screen: 'mission', pending: null, mentor: '', prev: null };
      return { ...ui };
    }
    case 'pick': return { ...ui, pending: a.k, mentor: '' };
    case 'cancel': return { ...ui, pending: null };
    case 'confirm':
      if (ui.resolving || !ui.pending) return null;
      return { ...ui, resolving: true };
    case 'resolve': {
      if (!G || !ui.pending) return { ...ui, resolving: false, pending: null };
      const before = G.power, r = step(G, ui.pending);
      const next: UIState = { ...ui, resolving: false, pending: null };
      if (r.ok) {
        next.prev = before; next.game = r.state; next.tx = true; next.mentor = explain(r.state);
        if (r.state.ended) next.screen = 'debrief';
      } else next.mentor = kidErr(r.error);
      return next;
    }
    case 'hint': return G ? { ...ui, pending: null, mentor: hint(G) } : { ...ui };
    case 'expl': return G ? { ...ui, pending: null, mentor: explain(G) } : { ...ui };
    case 'sq': return { ...ui, pending: null, mentor: SCI[a.k].a };
    case 'replay': return { ...ui, game: null, sel: [], screen: 'prep', pending: null, mentor: '', prev: null };
  }
}

/** Reducer: returns the next UI state. */
export function uiReducer(ui: UIState, a: UIAction): UIState {
  const next = apply(ui, a);
  if (!next) return ui;
  // Matches the original: "tx" only lasts for the render right after a shift resolves.
  if (a.type !== 'resolve') next.tx = false;
  next.renderId = ui.renderId + 1;
  next.focusHeading = FOCUS_AFTER.has(a.type);
  return next;
}
