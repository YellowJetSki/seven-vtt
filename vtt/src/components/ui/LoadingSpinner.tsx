/**
 * STᚱ VTT — Loading Spinner (Premium Gold)
 *
 * Multi-variant loading indicator with:
 * - Inline (sm/md/lg) spinning arc with dash animation
 * - Section-level with shimmer label
 * - Gold glow ring depth effect
 * - Duolingo/Spotify-grade smooth arc animation
 */

interface LoadingSpinnerProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional text label below spinner */
  label?: string;
  /** Variant: "inline" (default) for embedded, "section" for padded block */
  variant?: "inline" | "section";
  /** Custom className override */
  className?: string;
}

const sizeConfig = {
  sm: { svg: "h-4 w-4", outer: "w-8 h-8", stroke: 3, radius: 8 },
  md: { svg: "h-7 w-7", outer: "w-14 h-14", stroke: 3, radius: 10 },
  lg: { svg: "h-10 w-10", outer: "w-20 h-20", stroke: 3.5, radius: 12 },
};

const staggerDots = ["", "animation-delay-[0.32s]", "animation-delay-[0.64s]"];

export default function LoadingSpinner({
  size = "md",
  label,
  variant = "inline",
  className = "",
}: LoadingSpinnerProps) {
  const cfg = sizeConfig[size];
  const circum = 2 * Math.PI * cfg.radius;

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-2 relative ${className}`}>
      {/* Outer glow ring — layered depth */}
      <div
        className={`absolute ${cfg.outer} rounded-full bg-gold-500/[0.04] blur-[16px]`}
      />
      <div
        className={`absolute ${cfg.outer} rounded-full bg-gold-500/[0.02] blur-[8px]`}
      />

      {/* SVG arc spinner */}
      <div className="relative">
        <svg
          className={`${cfg.svg} text-gold-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.15)]`}
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Background track */}
          <circle
            cx="12"
            cy="12"
            r={cfg.radius}
            stroke="currentColor"
            strokeWidth={cfg.stroke}
            className="opacity-[0.08]"
          />
          {/* Animated arc */}
          <circle
            cx="12"
            cy="12"
            r={cfg.radius}
            stroke="currentColor"
            strokeWidth={cfg.stroke}
            strokeLinecap="round"
            strokeDasharray={circum}
            strokeDashoffset={circum * 0.75}
            className="opacity-80 animate-loading-arc"
            style={{ transformOrigin: "center" }}
          />
        </svg>
      </div>

      {/* Staggered bouncing dots */}
      <div className="flex items-center gap-1.5 h-3">
        {staggerDots.map((delay, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full bg-gold-400/70 animate-loading-dot-bounce ${delay}`}
            style={{ animationDelay: `${i * 0.32}s` }}
          />
        ))}
      </div>

      {/* Label with shimmer */}
      {label && (
        <p className="relative text-[11px] text-surface-500 font-medium tracking-wide overflow-hidden">
          <span className="inline-block bg-gradient-to-r from-surface-500 via-gold-400/50 to-surface-500 bg-[length:200%_100%] animate-shimmer bg-clip-text text-transparent">
            {label}
          </span>
        </p>
      )}
    </div>
  );

  if (variant === "section") {
    return (
      <div className="flex items-center justify-center w-full py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
}
