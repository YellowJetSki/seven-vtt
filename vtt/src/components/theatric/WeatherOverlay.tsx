/* ── Weather Overlay Component ─────────────────────────────────
 * Cinematic weather effects rendered as CSS overlay on the
 * battle map in Theatric View.
 *
 * Supports: rain, snow, fog, dust, clear (no effect)
 * ─────────────────────────────────────────────────────────────── */

import { useMemo } from "react";

/* ── Types ──────────────────────────────────────────────────── */

export type WeatherEffect = "clear" | "rain" | "snow" | "fog" | "dust";

interface WeatherOverlayProps {
  weather: WeatherEffect;
  /** Intensity multiplier: 0.5 (light) to 2.0 (heavy). Default 1.0. */
  intensity?: number;
}

/* ── Particle generation (memoized) ─────────────────────────── */

function generateParticles(count: number, symbol: string): Array<{
  id: number;
  left: string;
  delay: string;
  duration: string;
  opacity: number;
  symbol: string;
}> {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${1.5 + Math.random() * 2.5}s`,
    opacity: 0.3 + Math.random() * 0.5,
    symbol,
  }));
}

/* ── Rain streak lines (pre-computed for stability) ──────────── */

const RAIN_STREAK_LINES: Array<{ x1: number; x2: number }> = Array.from(
  { length: 8 },
  (_, i) => ({
    x1: i * 8 + 2,
    x2: i * 8 - 1,
  }),
);

/* ── Component ──────────────────────────────────────────────── */

export function WeatherOverlay({ weather, intensity = 1.0 }: WeatherOverlayProps) {
  const particleCount = Math.round(60 * intensity);

  const particles = useMemo(() => {
    switch (weather) {
      case "rain":
        return generateParticles(particleCount, "💧");
      case "snow":
        return generateParticles(Math.round(particleCount * 0.6), "❄");
      case "dust":
        return generateParticles(Math.round(particleCount * 0.4), "🌫");
      case "fog":
        // Fog uses CSS gradient animation, not particles
        return [];
      case "clear":
      default:
        return [];
    }
  }, [weather, particleCount]);

  if (weather === "clear") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {/* Fog gradient overlay */}
      {weather === "fog" && (
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 50%, rgba(200,200,220,0.15) 0%, transparent 70%),
              radial-gradient(ellipse 60% 40% at 80% 30%, rgba(200,200,220,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 50% 70%, rgba(200,200,220,0.1) 0%, transparent 65%),
            `,
            animation: "fog-drift 12s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Dust haze overlay */}
      {weather === "dust" && (
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 50% at 30% 60%, rgba(180,160,120,0.12) 0%, transparent 70%),
              radial-gradient(ellipse 50% 40% at 70% 30%, rgba(180,160,120,0.08) 0%, transparent 60%),
            `,
            animation: "fog-drift 8s ease-in-out infinite alternate",
          }}
        />
      )}

      {/* Rain / Snow / Dust particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute text-xs animate-weather-fall"
          style={{
            left: p.left,
            top: "-5%",
            opacity: p.opacity,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: weather === "rain" ? "8px" : "10px",
          }}
        >
          {p.symbol}
        </span>
      ))}

      {/* Rain streak lines (subtle slanted lines) */}
      {weather === "rain" && intensity > 0.5 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" style={{ filter: "blur(1px)" }}>
          <defs>
            <pattern id="rain-streaks" x="0" y="0" width="60" height="80" patternUnits="userSpaceOnUse">
              {RAIN_STREAK_LINES.map((line) => (
                <line
                  key={line.x1}
                  x1={line.x1}
                  y1="0"
                  x2={line.x2}
                  y2="80"
                  stroke="white"
                  strokeWidth="0.8"
                  opacity="0.3"
                />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rain-streaks)" />
        </svg>
      )}
    </div>
  );
}
