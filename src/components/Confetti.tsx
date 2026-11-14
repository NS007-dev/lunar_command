const COLORS = ['#ffc93c', '#ff6a4d', '#4fd1a1', '#6ec3ff', '#ff9ec7'];

/** Falling confetti for a mission success. */
export function Confetti() {
  return <>
    {Array.from({ length: 24 }, (_, i) => (
      <span key={i} className="cf" style={{
        left: `${(i * 41) % 100}%`,
        animationDuration: `${2.5 + (i % 5) * .6}s`,
        animationDelay: `${(i % 7) * .15}s`,
        background: COLORS[i % 5],
      }}></span>
    ))}
  </>;
}
