import { Fragment, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import { MoonScene } from './components/MoonScene';
import { initialUI, uiReducer, type Screen } from './game/uiState';
import { Briefing } from './screens/Briefing';
import { EventSelection } from './screens/EventSelection';
import { GadgetSelection } from './screens/GadgetSelection';
import { Mission } from './screens/Mission';
import { Results } from './screens/Results';
import { Welcome } from './screens/Welcome';

/** How dark the background is behind each screen. */
const SCRIM: Record<Screen, number> = { launch: 0, brief: .55, event: .6, prep: .55, mission: .65, debrief: .6 };

/** Pause between pressing "Do it!" and the shift playing out. */
const RESOLVE_DELAY_MS = 350;

export default function App() {
  const [ui, dispatch] = useReducer(uiReducer, initialUI);
  const mainRef = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // After moving to a new screen, put keyboard focus on its heading (same as the original).
  useLayoutEffect(() => {
    if (!ui.focusHeading) return;
    const h = mainRef.current?.querySelector<HTMLElement>('h1,h2');
    if (h) { h.tabIndex = -1; h.focus(); }
  }, [ui.renderId, ui.focusHeading]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const confirm = () => {
    if (ui.resolving || !ui.pending) return;
    dispatch({ type: 'confirm' });
    timer.current = window.setTimeout(() => dispatch({ type: 'resolve' }), RESOLVE_DELAY_MS);
  };

  const s = ui.game;
  let screen = null;
  switch (ui.screen) {
    case 'launch': screen = <Welcome onStart={() => dispatch({ type: 'go-brief' })} />; break;
    case 'brief': screen = <Briefing onNext={() => dispatch({ type: 'go-event' })} />; break;
    case 'event': screen = <EventSelection onPick={k => dispatch({ type: 'ev', k })} />; break;
    case 'prep': screen = <GadgetSelection sc={ui.sc} sel={ui.sel}
      onToggle={k => dispatch({ type: 'up', k })} onLaunch={() => dispatch({ type: 'launch' })} onChangeEvent={() => dispatch({ type: 'go-event' })} />; break;
    case 'mission': if (s) screen = <Mission s={s} pending={ui.pending} resolving={ui.resolving} mentor={ui.mentor} prev={ui.prev} tx={ui.tx}
      onPick={k => dispatch({ type: 'pick', k })} onConfirm={confirm} onCancel={() => dispatch({ type: 'cancel' })}
      onHint={() => dispatch({ type: 'hint' })} onExplain={() => dispatch({ type: 'expl' })} onAsk={k => dispatch({ type: 'sq', k })} />; break;
    case 'debrief': if (s) screen = <Results s={s} onReplay={() => dispatch({ type: 'replay' })} onOtherEvent={() => dispatch({ type: 'go-event' })} />; break;
  }

  // `key={ui.renderId}` redraws the screen from scratch on every update, like the original did,
  // so its pop/shake/flash animations replay the same way.
  return <>
    <div id="bg" aria-hidden="true" key={`bg${ui.renderId}`}><MoonScene s={s && ui.screen === 'mission' ? s : null} full={false} /></div>
    <div id="scrim" style={{ opacity: SCRIM[ui.screen] }}></div>
    <main id="app" ref={mainRef}><Fragment key={ui.renderId}>{screen}</Fragment></main>
  </>;
}
