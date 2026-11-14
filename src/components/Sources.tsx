import { SOURCES } from '../data/scienceFacts';

/** "Science & sources: what is real?" fold-out. */
export function Sources() {
  return (
    <details className="card" style={{ background: '#cdeeff' }}>
      <summary style={{ fontWeight: 700, cursor: 'pointer' }}>Science &amp; sources: what is real?</summary>
      <p><span className="tg n">Real record</span>The event dates, NOAA radiation-storm levels (S2, S3, S4) and the two flare classes (X1.1 and X8.2) are from NOAA Space Weather Prediction Center records.</p>
      <p><span className="tg r">Game rule</span>Shelter points, which shifts the storm covers, the hill shadow, supplies, power and Pip's timing are made up for the game. We chose bigger shelter needs for higher S levels so harder storms feel harder. It is not a measurement.</p>
      <p><span className="tg m">Made up</span>The Moon base, the crew and Pip.</p>
      <p><b>Flare ≠ radiation storm.</b> A flare is light and X-rays (graded with letters like M and X). A radiation storm is fast protons (graded S1 to S5). They are measured differently, so a flare's X number is <b>not</b> a radiation dose. NOAA's S-levels come from satellites near Earth, not on the Moon, so they are not a dose for astronauts either.</p>
      <ul>{SOURCES.map(l => <li key={l.url}><a href={l.url} target="_blank" rel="noopener">{l.text}</a></li>)}</ul>
      <p style={{ fontSize: '.85rem' }}>NASA DONKI (ccmc.gsfc.nasa.gov/tools/DONKI) also catalogs particle events, but this game does not call it, so it works offline. Pip's general facts (plants on the space station, recycling, radio delay) are well-known science but are not linked to a source here.</p>
    </details>
  );
}
