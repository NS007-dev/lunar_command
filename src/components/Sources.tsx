import { SOURCES } from '../data/scienceFacts';

/** "What is real in this game?" fold-out: a part for curious kids, then extra notes and links for grown-ups. */
export function Sources() {
  return (
    <details className="card" style={{ background: '#cdeeff' }}>
      <summary style={{ fontWeight: 700, cursor: 'pointer' }}>What is real in this game? (Science &amp; sources)</summary>
      <h3 style={{ fontSize: '1.1rem', margin: '12px 0 4px' }}>For curious explorers</h3>
      <p><span className="tg n">Real record</span>The event dates, the NOAA radiation-storm levels (S2, S3, S4) and the two flare grades (X1.1 and X8.2) are real. They come from NOAA's Space Weather Prediction Center, a team that watches the Sun's weather.</p>
      <p><span className="tg r">Game rule</span>Shelter layers, which shifts the storm covers, the hill shadow, supplies, battery power and when things happen in the game are made up. We made stronger storms (higher S levels) need more shelter, so harder storms feel harder. These are not real measurements.</p>
      <p><span className="tg m">Made up</span>The Moon base, the crew and Pip.</p>
      <p><b>A flare is not a radiation storm.</b> A flare is light and X-rays (graded with letters like M and X). A radiation storm is fast protons (graded S1 to S5). They are measured differently, so a flare's X number does <b>not</b> tell you the radiation dose (how much radiation a person's body takes in).</p>
      <h3 style={{ fontSize: '1.1rem', margin: '12px 0 4px' }}>For grown-ups: extra notes and sources</h3>
      <p>NOAA's S-levels come from satellites near Earth, not on the Moon, so they are not a dose for astronauts either.</p>
      <ul>{SOURCES.map(l => <li key={l.url}><a href={l.url} target="_blank" rel="noopener">{l.text}</a></li>)}</ul>
      <p style={{ fontSize: '.9rem' }}>NASA's DONKI database (ccmc.gsfc.nasa.gov/tools/DONKI) also lists these particle events. This game does not connect to it, so it can work without the internet. Pip's general facts (plants on the space station, recycling, radio delay) are well-known science but are not linked to a source here.</p>
    </details>
  );
}
