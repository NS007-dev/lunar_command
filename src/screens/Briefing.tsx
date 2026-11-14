import { PipSays } from '../components/Pip';
import { Sources } from '../components/Sources';

/** Mission briefing: what radiation storms are and the three things to look after. */
export function Briefing({ onNext }: { onNext: () => void }) {
  return (
    <section style={{ paddingTop: '4vh' }}>
      <span className="tag">Your mission</span>
      <h2 style={{ margin: '14px 0' }}>Commander, the Sun is acting up!</h2>
      <PipSays mood="worried" className="pop" style={{ maxWidth: 720 }}>
        Sometimes the Sun sends out fast, tiny particles. That is a <b>radiation storm</b>. Radiation is energy from space that can harm living things. On Earth, our air and magnetic field protect us. On the Moon, the crew needs thick walls!
      </PipSays>
      <div className="steps">
        <div className="card pop"><span className="step-num">1</span><h3>Power</h3><p>Sun power fills the battery. The base takes its share first. A hill's shadow will block some sun for a while.</p></div>
        <div className="card pop"><span className="step-num">2</span><h3>Crew supplies</h3><p>A simple mix of air, water and food. The crew uses some every shift. Recycle and grow food!</p></div>
        <div className="card pop"><span className="step-num">3</span><h3>Crew protection</h3><p>Build shelter layers before the storm. During a storm, stay inside. No experiments!</p></div>
      </div>
      <p>You have <b>8 shifts</b>. You can't do everything. Choose well, and win <b>4 science stars</b> too!</p>
      <p style={{ fontSize: '.9rem', opacity: .9 }}>Power, supplies and shelter are made-up game numbers. The storms are real NOAA records.</p>
      <Sources />
      <p style={{ marginTop: 20 }}><button className="btn" onClick={onNext}>Pick a Sun event <span aria-hidden="true">▶</span></button></p>
    </section>
  );
}
