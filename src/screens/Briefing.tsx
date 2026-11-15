import { PipSays } from '../components/Pip';
import { Sources } from '../components/Sources';
import { K } from '../game/scenarios';

/** Mission briefing: what radiation storms are, what a shift is, and the three things to look after. */
export function Briefing({ onNext }: { onNext: () => void }) {
  return (
    <section style={{ paddingTop: '4vh' }}>
      <span className="tag">Your mission</span>
      <h2 style={{ margin: '14px 0' }}>Commander, the Sun is acting up!</h2>
      <PipSays mood="worried" className="pop" style={{ maxWidth: 720 }}>
        Sometimes the Sun sends out a shower of tiny, super-fast bits. That is a <b>radiation storm</b>. Radiation is energy from space that can harm living things. On Earth, our thick air and an invisible magnetic shield (the magnetic field) protect us. On the Moon, the crew needs thick walls!
      </PipSays>
      <div className="steps">
        <div className="card pop"><span className="step-num">1</span><h3>Battery power</h3><p>The sun charges your battery each shift. The base always uses {K.upkeep} power just to keep running. Watch out: a hill's shadow will block some sun for a while.</p></div>
        <div className="card pop"><span className="step-num">2</span><h3>Crew supplies</h3><p>Air, water and food for the crew. They use some every shift. Recycle and grow food to get more! If supplies run out, the mission stops.</p></div>
        <div className="card pop"><span className="step-num">3</span><h3>Storm shelter</h3><p>Thin walls don't block much radiation. Build thick shelter layers before the storm comes, so the crew is safe from its very first shift. During the storm, the crew must stay inside, so no outdoor experiments!</p></div>
      </div>
      <p>You have <b>{K.shifts} shifts</b>. A shift is one turn: you pick one job for the crew. You can't do everything, so choose well! Do experiments to win <b>{K.goal} science stars</b> too. Each star is something new the crew learns about the Moon. Only experiments win stars, and you need {K.goal} for a full Mission success!</p>
      <p style={{ fontSize: '.95rem' }}>Battery power, supplies and shelter layers are made-up game numbers. But the storms really happened! <b>NOAA</b>, a US science agency that watches the Sun's weather (called <b>space weather</b>), recorded them.</p>
      <Sources />
      <p style={{ marginTop: 20 }}><button className="btn" onClick={onNext}>Pick a Sun event <span aria-hidden="true">▶</span></button></p>
    </section>
  );
}
