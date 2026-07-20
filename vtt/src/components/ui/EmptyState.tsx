/**
 * STᚱ VTT — Premium Empty State (Lusion-Grade)
 *
 * Multi-depth empty state with:
 * - Animated icon container with ambient glow ring
 * - Gradient text headings
 * - Floating ambient particles (3 drifting dots)
 * - Staggered entrance animation
 * - Gold rune divider
 * - Action button area with hover glow
 */

import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Emoji icon (default: 📭) */
  icon?: string;
  /** Large heading */
  title: string;
  /** Supporting description */
  description?: string;
  /** Optional CTA or children */
  action?: ReactNode;
  /** Alternative to action */
  children?: ReactNode;
  /** Size variant */
  variant?: "default" | "compact" | "hero";
}

const variants = {
  default: {
    wrapper: "py-16 px-4",
    iconSize: "text-5xl",
    iconContainer: "w-20 h-20",
    glowSize: "w-24 h-24",
    titleSize: "text-xl",
    descSize: "text-sm",
    particleCount: 3,
  },
  compact: {
    wrapper: "py-10 px-4",
    iconSize: "text-3xl",
    iconContainer: "w-14 h-14",
    glowSize: "w-18 h-18",
    titleSize: "text-base",
    descSize: "text-xs",
    particleCount: 2,
  },
  hero: {
    wrapper: "py-24 px-6",
    iconSize: "text-6xl",
    iconContainer: "w-28 h-28",
    glowSize: "w-32 h-32",
    titleSize: "text-2xl",
    descSize: "text-base",
    particleCount: 5,
  },
};

export default function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  children,
  variant = "default",
}: EmptyStateProps) {
  const v = variants[variant];

  return (
    <div className={`flex flex-col items-center justify-center ${v.wrapper} relative overflow-hidden select-none`}>
      {/* Depth layer 1: Ambient glow behind icon */}
      <div
        className={`absolute ${v.glowSize} rounded-full bg-gold-500/[0.04] blur-[40px] pointer-events-none animate-empty-glow-pulse`}
      />
      <div
        className={`absolute ${v.glowSize} rounded-full bg-amber-500/[0.02] blur-[20px] pointer-events-none`}
        style={{ transform: "translate(20%, 10%)" }}
      />

      {/* Depth layer 2: Floating ambient particles */}
      {Array.from({ length: v.particleCount }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gold-400/20 pointer-events-none animate-empty-particle"
          style={{
            top: `${20 + Math.random() * 40}%`,
            left: `${30 + Math.random() * 40}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            "--drift-x": `${(Math.random() - 0.5) * 40}px`,
          } as React.CSSProperties}
        />
      ))}

      {/* Depth layer 3: Icon container with glow ring */}
      <div
        className={`relative ${v.iconContainer} rounded-2xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 
          border border-gold/10 flex items-center justify-center mb-4
          shadow-[0_0_30px_rgba(234,179,8,0.04)]
          animate-empty-float-core`}
      >
        {/* Inner glow dot */}
        <div className="absolute inset-4 rounded-full bg-gold-500/5 blur-[8px]" />
        <span
          className={`${v.iconSize} relative z-10 drop-shadow-[0_0_12px_rgba(234,179,8,0.08)]`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      {/* Depth layer 4: Title with gold gradient */}
      <h3
        className={`${v.titleSize} font-black mb-1.5 animate-slide-in-up`}
        style={{
          background: "linear-gradient(135deg, #fde047 0%, #eab308 50%, #d97706 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 12px rgba(234,179,8,0.12))",
        }}
      >
        {title}
      </h3>

      {/* Depth layer 5: Description */}
      {description && (
        <p
          className={`${v.descSize} text-surface-500 max-w-md text-center leading-relaxed mb-3 animate-slide-in-up`}
          style={{ animationDelay: "0.1s" }}
        >
          {description}
        </p>
      )}

      {/* Depth layer 6: Premium rune divider */}
      <div className="flex items-center gap-3 my-3 animate-slide-in-up" style={{ animationDelay: "0.15s" }}>
        <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold-500/20" />
        <span className="text-gold-400/60 text-[10px] tracking-[0.3em] font-mono select-none" aria-hidden="true">
          ✦ ᚱ ✦
        </span>
        <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold-500/20" />
      </div>

      {/* Depth layer 7: Action area */}
      {(action || children) && (
        <div
          className="mt-1 animate-slide-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {action ?? children}
        </div>
      )}
    </div>
  );
}
