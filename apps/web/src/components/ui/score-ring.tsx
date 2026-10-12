type ScoreRingProps = {
  score: number;
  max?: number;
  color: string;
  label?: string;
};

const SIZE = 84;
const RADIUS = 36;
const STROKE_WIDTH = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreRing({
  score,
  max = 100,
  color,
  label = "Puntaje",
}: ScoreRingProps) {
  const ratio = Math.min(Math.max(score / max, 0), 1);
  const center = SIZE / 2;

  return (
    <div className="px-1.5 text-center">
      <div className="relative grid size-[84px] place-items-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke="var(--track)"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={center}
            cy={center}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </svg>
        <b className="absolute text-2xl font-extrabold text-ink">{score}</b>
      </div>
      <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
    </div>
  );
}
