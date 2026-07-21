/**
 * STᚱ VTT — LoginAuroraBackground (Premium Lusion/Ventriloc-Grade)
 *
 * Premium animated aurora background with:
 * - 4-layer gold/amber wave drift for deep atmospheric depth
 * - Subtle grid texture with reduced opacity
 * - Floating particle overlay
 * - Ambient orbs that drift slowly
 * - Soft glow edge pockets near form area
 *
 * Absolutely positioned, pointer-events-none layer.
 * Inspired by Lusion and Spotify's ambient depth effects.
 */

export default function LoginAuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base void gradient — deep, rich dark neutral */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#07080d] via-[#0a0b14] to-[#0d0e18]" />

      {/* Aurora wave 1 — slow drift gold (primary) */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.18]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(234,179,8,0.15) 0%, transparent 70%)",
          animation: "aurora-drift 14s ease-in-out infinite alternate",
        }}
      />

      {/* Aurora wave 2 — amber accent (secondary) */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.12]"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 70% 60%, rgba(245,158,11,0.12) 0%, transparent 70%)",
          animation: "aurora-drift 18s ease-in-out 2s infinite alternate",
        }}
      />

      {/* Aurora wave 3 — warm gold (tertiary) */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.08]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(251,191,36,0.08) 0%, transparent 70%)",
          animation: "aurora-drift 22s ease-in-out 4s infinite alternate",
        }}
      />

      {/* Aurora wave 4 — deep amber atmosphere (quaternary, wide) */}
      <div
        className="absolute -bottom-1/3 -right-1/4 w-[120%] h-[120%] opacity-[0.06]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 60% 70%, rgba(217,119,6,0.10) 0%, transparent 70%)",
          animation: "aurora-drift 26s ease-in-out 6s infinite alternate-reverse",
        }}
      />

      {/* Soft glow pocket near form area (right side) */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[30%] h-[50%] opacity-[0.04]"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, rgba(234,179,8,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating particle overlay */}
      <div className="absolute inset-0 bg-particle opacity-[0.15]" />
    </div>
  );
}
