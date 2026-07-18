/* ── LoginAmbientBackground ────────────────────────────────────
 * Animated ambient background for the login page with floating
 * arcane particles, glowing orbs, and a subtle gradient mesh.
 * ─────────────────────────────────────────────────────────────── */

export function LoginAmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-surface-950" />

      {/* Large ambient orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent-500/3 blur-3xl animate-float" />
      <div className="absolute bottom-1/3 right-1/4 h-80 w-80 rounded-full bg-mage-500/3 blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
      <div className="absolute top-2/3 left-1/2 h-64 w-64 rounded-full bg-rogue-500/2 blur-3xl animate-float" style={{ animationDelay: "-4s" }} />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 48, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 48, 255, 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Animated particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${5 + Math.random() * 90}%`,
            top: `${5 + Math.random() * 90}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${4 + Math.random() * 6}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            opacity: 0.2 + Math.random() * 0.3,
          }}
        />
      ))}

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-surface-950/20 to-surface-950/60" />
    </div>
  );
}
