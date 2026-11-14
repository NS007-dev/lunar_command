import { PipSays } from '../components/Pip';

/** Launch screen: title and Pip saying hi. */
export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <section className="hero">
      <span className="tag pop">Mission 1 · The Last Sunlight</span>
      <h1 className="pop">LUNAR<br />COMMAND</h1>
      <PipSays mood="happy" className="pop" style={{ maxWidth: 560 }}>Hi, Commander! I'm Pip. Let's keep our Moon base safe from a space radiation storm!</PipSays>
      <button className="btn" onClick={onStart}>Start! <span aria-hidden="true">▶</span></button>
    </section>
  );
}
