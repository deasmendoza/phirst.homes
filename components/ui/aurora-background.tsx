import { memo, type CSSProperties } from "react";

export interface AuroraBackgroundProps {
  /** Extra wrapper classes */
  className?: string;
  /** Number of static "star" points (0 for none) */
  starCount?: number;
  /** Two colours for the soft radial overlays (CSS variables with a gold fallback) */
  gradientColors?: [string, string];
  /** ARIA label for the background */
  ariaLabel?: string;
}

// Brand colours: the PHirst golds, plus white for the stars.
const STAR_COLORS = ["#FFFFFF", "#FFFFFF", "#FFD77A", "#F2B63C"] as const;

// Small seeded generator, so the stars are in the same place on every render and every visit.
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function makeStars(count: number) {
  const rand = seeded(20261119);
  return Array.from({ length: count }, () => ({
    left: `${(rand() * 100).toFixed(2)}%`,
    top: `${(rand() * 100).toFixed(2)}%`,
    size: rand() < 0.2 ? 3 : 2,
    opacity: 0.35 + rand() * 0.5,
    color: STAR_COLORS[Math.floor(rand() * STAR_COLORS.length)],
  }));
}

/**
 * Site-wide background: night colour with soft gold light. Nothing moves.
 * It is a fixed layer behind the page; page content sits above it in its own stacking layer.
 */
export const AuroraBackground = memo(function AuroraBackground({
  className = "",
  starCount = 60,
  gradientColors = ["var(--aurora-color1, rgba(242,182,60,0.16))", "var(--aurora-color2, rgba(194,147,58,0.12))"],
  ariaLabel = "Soft gold glow background",
}: AuroraBackgroundProps) {
  const [colorA, colorB] = gradientColors;
  const stars = makeStars(starCount);

  return (
    <div role="img" aria-label={ariaLabel} className={`print-hide pointer-events-none fixed inset-0 z-0 overflow-hidden bg-night ${className}`}>
      <div className="absolute inset-0" aria-hidden="true">
        {/* Two wide radial washes */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 15%, ${colorA} 0%, transparent 55%), radial-gradient(circle at 80% 85%, ${colorB} 0%, transparent 55%)`,
          }}
        />

        {/* Blurred gold glows */}
        <div className="absolute inset-0 mix-blend-screen">
          <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-[#F2B63C] opacity-[0.16] blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-[#C2933A] opacity-[0.18] blur-3xl" />
          <div className="absolute left-1/3 top-1/3 h-1/3 w-1/3 rounded-full bg-[#FFD77A] opacity-[0.07] blur-3xl" />
        </div>

        {/* Static stars */}
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: s.opacity, backgroundColor: s.color } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
});

export default AuroraBackground;
