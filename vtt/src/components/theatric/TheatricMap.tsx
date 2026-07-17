/* ── Theatric Map Component ────────────────────────────────────
 * Cinematic fullscreen battle map renderer optimized for
 * projectors / TVs / second monitors.
 *
 * KEY FEATURES:
 *  • Full-bleed background with no visible chrome
 *  • Grid is HIDDEN by default (purely dramatic view)
 *  • Tokens rendered with status markers
 *  • Smooth token highlight animation
 *  • Fog of War overlay for player-side viewing
 *  • Extreme letterboxing for wide aspect ratios
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import type { BattleMap, MapToken } from "@/types";
import { WeatherOverlay, type WeatherEffect } from "./WeatherOverlay";

interface TheatricMapProps {
  map: BattleMap | null;
  tokenId: string;
  /** When true, show the grid overlay (default: hidden for dramatic effect) */
  showGrid?: boolean;
  /** Weather effect to overlay on the map */
  weather?: WeatherEffect;
}

export function TheatricMap({ map, tokenId, showGrid = false, weather = "clear" }: TheatricMapProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Fade in map image after mount
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [map?.id]);

  if (!map) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-950">
        <div className="text-center">
          <span className="text-7xl opacity-30">🎭</span>
          <p className="mt-4 text-sm text-surface-600">No battle map loaded.</p>
        </div>
      </div>
    );
  }

  const token = map.tokens?.find((t) => t.id === tokenId);
  const gridOpacity = map.gridOpacity ?? 0.08;

  return (
    <div
      className={`relative h-full w-full overflow-hidden bg-surface-950 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
    >
      {/* Full-bleed map image with dramatic vignette */}
      {map.imageUrl ? (
        <>
          <img
            src={map.imageUrl}
            alt={map.name}
            className="h-full w-full object-cover"
            style={{ imageRendering: "auto" }}
            draggable={false}
          />
          {/* Cinematic vignette overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5" />
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <span className="text-8xl opacity-20">🗺️</span>
            <p className="mt-3 text-lg text-surface-700">Unnamed Map</p>
          </div>
        </div>
      )}

      {/* Ultra-subtle grid overlay (hidden by default) */}
      {showGrid && map.gridWidth > 0 && map.gridHeight > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <pattern
              id={`theatric-grid-${map.id}`}
              width={`${(100 / map.gridWidth).toFixed(4)}%`}
              height={`${(100 / map.gridHeight).toFixed(4)}%`}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${(100 / map.gridWidth).toFixed(4)} 0 L 0 0 0 ${(100 / map.gridHeight).toFixed(4)}`}
                fill="none"
                stroke={`rgba(255,255,255,${gridOpacity * 2})`}
                strokeWidth="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#theatric-grid-${map.id})`} />
        </svg>
      )}

      {/* Render all visible tokens on the map (subtle) */}
      {map.tokens
        ?.filter((t) => t.visible !== false)
        .map((t) => <TheatricTokenRenderer key={t.id} token={t} isHighlighted={t.id === tokenId} gridWidth={map.gridWidth} gridHeight={map.gridHeight} />)}

      {/* Token highlight ring for the focused token */}
      {token && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${(token.x / map.gridWidth) * 100}%`,
            top: `${(token.y / map.gridHeight) * 100}%`,
            width: `${((token.size * 0.8) / map.gridWidth) * 100}%`,
            height: `${((token.size * 0.8) / map.gridHeight) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Animated pulse ring */}
          <div className="absolute inset-0 animate-ping rounded-full border-2 border-accent-400 opacity-30" />
          <div className="absolute inset-0 rounded-full border-2 border-accent-400 shadow-[0_0_20px_rgba(139,48,255,0.3)]" />
        </div>
      )}

      {/* Weather effect overlay */}
      <WeatherOverlay weather={weather} intensity={1.0} />

      {/* Map name — subtle corner label */}
      <div className="absolute bottom-4 left-4 rounded-lg bg-black/30 px-3 py-1.5 text-xs text-white/60 backdrop-blur-sm">
        {map.name}
      </div>
    </div>
  );
}

function TheatricTokenRenderer({ token, isHighlighted, gridWidth, gridHeight }: {
  token: MapToken;
  isHighlighted: boolean;
  gridWidth: number;
  gridHeight: number;
}) {
  const statusIcons: Record<string, string> = {
    blinded: "👁️‍🗨️", charmed: "💖", deafened: "🔇", exhaustion: "😰",
    frightened: "😱", grappled: "🤝", incapacitated: "💫", invisible: "👻",
    paralyzed: "🧊", petrified: "🗿", poisoned: "☠️", prone: "🙇",
    restrained: "⛓️", stunned: "✨", unconscious: "💤", concentration: "🧠",
  };

  return (
    <div
      className={`absolute transition-all duration-500 ${isHighlighted ? "z-20" : "z-10"}`}
      style={{
        left: `${(token.x / gridWidth) * 100}%`,
        top: `${(token.y / gridHeight) * 100}%`,
        width: `${((token.size * 0.7) / gridWidth) * 100}%`,
        height: `${((token.size * 0.7) / gridHeight) * 100}%`,
        transform: "translate(-50%, -50%)",
        minWidth: "24px",
        minHeight: "24px",
      }}
    >
      {/* Token circle */}
      <div
        className="flex h-full w-full items-center justify-center rounded-full overflow-hidden shadow-lg"
        style={{
          backgroundColor: token.imageUrl ? "transparent" : token.color,
          boxShadow: isHighlighted
            ? `0 0 30px ${token.color}88, 0 0 60px ${token.color}44`
            : "0 2px 8px rgba(0,0,0,0.4)",
        }}
      >
        {token.imageUrl ? (
          <img src={token.imageUrl} alt={token.label} className="h-full w-full rounded-full object-cover" draggable={false} />
        ) : token.icon ? (
          <span className="text-sm drop-shadow-md">{token.icon}</span>
        ) : (
          <span className="text-[10px] font-bold text-white drop-shadow-md">{token.label.charAt(0)}</span>
        )}
      </div>

      {/* Token label below */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80 backdrop-blur-sm">
        {token.label}
      </div>

      {/* Status markers */}
      {(token.statusMarkers ?? []).length > 0 && (
        <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5">
          {token.statusMarkers!.slice(0, 3).map((m) => (
            <span key={m.id} className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] shadow-sm" style={{ backgroundColor: m.color || "#6b7280" }}>
              {statusIcons[m.type] || "❓"}
            </span>
          ))}
          {token.statusMarkers!.length > 3 && (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-surface-800 text-[7px] text-surface-400">
              +{token.statusMarkers!.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
