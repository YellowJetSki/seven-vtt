/**
 * STᚱ VTT — Loading Screen (Premium)
 *
 * Full-screen loading splash layer with:
 * - Cinematic background with depth ring
 * - Animated ᚱ rune with pulse glow
 * - Staggered loading dots with bounce
 * - Simulated progress bar
 * - Optional subtitle
 * - Fade-in entrance, fade-out exit via `visible` prop
 */

import { useEffect, useState } from "react";

interface LoadingScreenProps {
  /** Show/hide the screen */
  visible: boolean;
  /** Primary loading text */
  label?: string;
  /** Secondary detail text */
  subtitle?: string;
  /** Callback when fade-out animation completes */
  onComplete?: () => void;
}

export default function LoadingScreen({
  visible,
  label = "Loading",
  subtitle,
  onComplete,
}: LoadingScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setExiting(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setExiting(false);
    }
  }, [visible, onComplete]);

  if (!visible && !exiting) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[99] flex flex-col items-center justify-center
        bg-gradient-to-b from-[#07080d] via-[#0a0b14] to-[#0d0e18]
        transition-all duration-400 ease-out
        ${exiting ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Depth ring */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background: "conic-gradient(from 0deg, #eab308, #fbbf24, #eab308, #d97706, #eab308)",
            animation: "depth-rotate 30s linear infinite",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0d0e18]/60" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: "linear-gradient(rgba(234,179,8,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.08) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gold-500/3 blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-amber-500/2 blur-[60px] pointer-events-none" />

      {/* Content */}
      <div className="relative flex flex-col items-center gap-6">
        {/* Rune with pulse glow */}
        <div className="relative">
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-gold-500/5 blur-[24px] animate-pulse-glow" />
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-gold-500/3 blur-[12px]" />
          <span
            className="relative text-5xl font-serif text-gold-400 select-none animate-rune-pulse"
            style={{
              filter: "drop-shadow(0 0 20px rgba(234,179,8,0.15))",
              animation: "rune-pulse 2.5s ease-in-out infinite",
            }}
            aria-hidden="true"
          >
            ᚱ
          </span>
        </div>

        {/* Label with shimmer */}
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-sm font-semibold text-surface-300 tracking-wide"
            style={{
              background: "linear-gradient(135deg, #e2e8f0, #fde047, #e2e8f0)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s ease-in-out infinite",
            }}
          >
            {label}
          </p>
          {subtitle && (
            <p className="text-[10px] text-surface-500 uppercase tracking-[0.15em] font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Staggered bouncing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gold-400/60 animate-loading-dot-bounce"
              style={{ animationDelay: `${i * 0.32}s` }}
            />
          ))}
        </div>

        {/* Progress bar simulation */}
        <div className="w-48 h-0.5 rounded-full bg-white/[0.04] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-500/40 via-amber-500/50 to-gold-500/40 animate-loading-progress"
          />
        </div>
      </div>
    </div>
  );
}
