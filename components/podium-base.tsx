export function LaurelWreath({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="currentColor">
      {[...Array(5)].map((_, i) => (
        <ellipse
          key={`l${i}`}
          cx={10 + i * 3}
          cy={16 - i * 2 + (i % 2)}
          rx="5"
          ry="3"
          transform={`rotate(${-20 + i * 10} ${10 + i * 3} ${16 - i * 2})`}
          fill="currentColor"
        />
      ))}
      {[...Array(5)].map((_, i) => (
        <ellipse
          key={`r${i}`}
          cx={38 - i * 3}
          cy={16 - i * 2 + (i % 2)}
          rx="5"
          ry="3"
          transform={`rotate(${20 - i * 10} ${38 - i * 3} ${16 - i * 2})`}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

const PODIUM_CONFIG = {
  1: {
    height: 80,
    depth: 60,
    colors: { highlight: "#fcd34d", light: "#fbbf24", dark: "#d97706", darker: "#92400e" },
    laurelSize: "w-16 h-16",
    glow: true,
  },
  2: {
    height: 64,
    depth: 50,
    colors: { highlight: "#e2e8f0", light: "#cbd5e1", dark: "#64748b", darker: "#334155" },
    laurelSize: "w-14 h-14",
    glow: false,
  },
  3: {
    height: 48,
    depth: 40,
    colors: { highlight: "#d97706", light: "#b45309", dark: "#78350f", darker: "#451a03" },
    laurelSize: "w-12 h-12",
    glow: false,
  },
} as const;

export function PodiumBase({ rank }: { rank: 1 | 2 | 3 }) {
  const config = PODIUM_CONFIG[rank];
  const { height, depth, colors } = config;
  const halfDepth = depth / 2;

  const faceStyle = { backfaceVisibility: "hidden" as const };

  return (
    <div className="podium-container w-full mt-[-4px]">
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <div
          className="podium-cube absolute inset-0 w-full"
          style={{ height: `${height}px` }}
        >
          <div
            className="face absolute inset-0 rounded-b-lg"
            style={{
              ...faceStyle,
              transform: `translateZ(${halfDepth}px)`,
              background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.dark} 100%)`,
            }}
          />
          <div
            className="face absolute inset-0 rounded-b-lg"
            style={{
              ...faceStyle,
              transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
              background: `linear-gradient(180deg, ${colors.dark} 0%, ${colors.darker} 100%)`,
            }}
          />
          <div
            className="face absolute left-0 right-0"
            style={{
              ...faceStyle,
              height: `${depth}px`,
              top: `-${halfDepth}px`,
              transform: `rotateX(-90deg) translateZ(${halfDepth}px)`,
              background: `linear-gradient(180deg, ${colors.highlight} 0%, ${colors.light} 100%)`,
              boxShadow: "inset 0 2px 4px rgba(255,255,255,0.2)",
            }}
          />
          <div
            className="face absolute top-0"
            style={{
              ...faceStyle,
              width: `${depth}px`,
              height: `${height}px`,
              left: 0,
              transformOrigin: "left center",
              transform: `rotateY(-90deg) translateZ(${halfDepth}px)`,
              background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.dark} 100%)`,
            }}
          />
          <div
            className="face absolute top-0"
            style={{
              ...faceStyle,
              width: `${depth}px`,
              height: `${height}px`,
              left: "100%",
              marginLeft: `-${halfDepth}px`,
              transformOrigin: "center center",
              transform: `rotateY(90deg) translateZ(${halfDepth}px)`,
              background: `linear-gradient(180deg, ${colors.light} 0%, ${colors.dark} 100%)`,
            }}
          />
          <div
            className="face podium-shimmer absolute inset-0 flex items-center justify-center rounded-b-lg"
            style={{
              transform: `translateZ(${halfDepth + 1}px)`,
            }}
          >
            <img
              src="/laureal-leaf.png"
              alt=""
              className={`${config.laurelSize} object-contain opacity-70`}
            />
          </div>
        </div>
        {config.glow ? (
          <div
            className="absolute inset-0 rounded-b-lg pointer-events-none"
            style={{ boxShadow: "0 0 40px -5px rgba(251, 191, 36, 0.3)" }}
          />
        ) : null}
      </div>
    </div>
  );
}
