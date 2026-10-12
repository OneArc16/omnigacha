const FIELD_WIDTH = 1366;
const FIELD_HEIGHT = 768;
const STAR_COUNT = 170;

type Star = { x: number; y: number; radius: number; opacity: number };

// Generador determinista: el campo de estrellas es idéntico en cada render.
function buildStars(): Star[] {
  let seed = 7;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const round = (value: number) => Math.round(value * 100) / 100;

  return Array.from({ length: STAR_COUNT }, () => {
    const x = round(next() * FIELD_WIDTH);
    const y = round(next() * FIELD_HEIGHT);
    const opacity = round(0.15 + next() * 0.6);
    const radius = next() < 0.08 ? 1.4 : 0.7;
    return { x, y, radius, opacity };
  });
}

const STARS = buildStars();

export function SpaceBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <svg
        className="absolute inset-0 h-full w-full opacity-80"
        viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {STARS.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.radius}
            fill="white"
            opacity={star.opacity}
          />
        ))}
        <path
          d="M0 700 Q 500 560 1366 640"
          fill="none"
          stroke="rgba(232,201,135,.08)"
          strokeWidth="1"
        />
      </svg>
      <svg
        className="absolute -right-[180px] -top-[260px]"
        width="760"
        height="760"
        viewBox="0 0 760 760"
      >
        <circle
          cx="380"
          cy="380"
          r="300"
          fill="none"
          stroke="rgba(232,201,135,.07)"
        />
        <circle
          cx="380"
          cy="380"
          r="360"
          fill="none"
          stroke="rgba(140,160,255,.06)"
          strokeDasharray="2 8"
        />
        <circle cx="380" cy="80" r="3" fill="rgba(232,201,135,.6)" />
      </svg>
    </div>
  );
}
