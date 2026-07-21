/**
 * STᚱ VTT — LoginAuroraBackground
 *
 * Premium animated aurora background with 3-layer gold/amber wave drift,
 * subtle grid texture, and floating particle overlay.
 *
 * Inspired by Lusion and Spotify's ambient depth effects.
 * Renders as an absolutely positioned, pointer-events-none layer.
 */

export default function LoginAuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base void gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#07080d] via-[#0a0b14] to-[#0d0e18]" />

      {/* Aurora wave 1 — slow drift gold */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.18]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(234,179,8,0.15) 0%, transparent 70%)",
          animation: "aurora-drift 14s ease-in-out infinite alternate",
        }}
      />

      {/* Aurora wave 2 — amber accent */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.12]"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 70% 60%, rgba(245,158,11,0.12) 0%, transparent 70%)",
          animation: "aurora-drift 18s ease-in-out 2s infinite alternate",
        }}
      />

      {/* Aurora wave 3 — warm gold */}
      <div
        className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.08]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(251,191,36,0.08) 0%, transparent 70%)",
          animation: "aurora-drift 22s ease-in-out 4s infinite alternate",
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
