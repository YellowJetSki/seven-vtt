/* ── Obelisk Map Overlay ────────────────────────────────────────
 * Theatric View overlay with fantasy-styled markers. Each obelisk
 * appears as a unique runic marker positioned via percentage coords,
 * with affinity-colored glow, corruption ring, state glyph,
 * pulsing active indicators, and a rich tooltip on hover.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useRef } from "react";
import type { Obelisk, ObeliskId } from "@/types/obelisks";
import { OBELISK_NAMES, OBELISK_AFFINITIES, AFFINITY_COLORS, corruptionColor } from "@/types/obelisks";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskMapOverlayProps {
  obelisks: Obelisk[];
  visible: boolean;
  onSelectObelisk: (id: ObeliskId) => void;
  className?: string;
}

/* ── State glyphs ────────────────────────────────────────────── */

const STATE_GLYPH: Record<string, string> = {
  undiscovered: "?",
  discovered: "◈",
  attuned: "✦",
  corrupted: "⬟",
  cleansed: "✧",
  shattered: "⬡",
};

const STATE_LABEL: Record<string, string> = {
  undiscovered: "Undiscovered",
  discovered: "Discovered",
  attuned: "Attuned",
  corrupted: "Corrupted",
  cleansed: "Cleansed",
  shattered: "Shattered",
};

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskMapOverlay({
  obelisks,
  visible,
  onSelectObelisk,
  className = "",
}: ObeliskMapOverlayProps) {
  const [hoveredId, setHoveredId] = useState<ObeliskId | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, obeliskId: ObeliskId) => {
      if (!overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 16,
        y: e.clientY - rect.top - 10,
      });
      setHoveredId(obeliskId);
    },
    [],
  );

  const handleMouseLeave = useCallback(() => setHoveredId(null), []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className={`pointer-events-none absolute inset-0 z-20 ${className}`}
    >
      {obelisks
        .filter((o) => o.state !== "undiscovered")
        .map((obelisk) => {
          const affinity = OBELISK_AFFINITIES[obelisk.id];
          const color = AFFINITY_COLORS[affinity];
          const corrColor = corruptionColor(obelisk.corruption);
          const isHovered = hoveredId === obelisk.id;
          const isCorrupted = obelisk.state === "corrupted";
          const isCleansed = obelisk.state === "cleansed";
          const isShattered = obelisk.state === "shattered";

          return (
            <div
              key={obelisk.id}
              className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${obelisk.mapPositionX}%`,
                top: `${obelisk.mapPositionY}%`,
              }}
            >
              <button
                onClick={() => onSelectObelisk(obelisk.id)}
                onMouseMove={(e) => handleMouseMove(e, obelisk.id)}
                onMouseLeave={handleMouseLeave}
                className={`group relative flex items-center justify-center transition-all duration-300 ${
                  isHovered ? "scale-130 z-40" : "scale-100"
                }`}
                title={OBELISK_NAMES[obelisk.id]}
              >
                {/* Pulsing active ping ring */}
                {obelisk.isActive && (
                  <div
                    className="absolute rounded-full obelisk-map-marker-ping"
                    style={{
                      backgroundColor: color,
                      width: 48,
                      height: 48,
                      left: -24,
                      top: -24,
                      opacity: 0.2,
                    }}
                  />
                )}

                {/* Outer glow with scaling transition */}
                <div
                  className={`absolute rounded-full transition-all duration-500 ${
                    obelisk.isActive ? "animate-ping opacity-30" : "opacity-0"
                  }`}
                  style={{
                    backgroundColor: color,
                    width: 48,
                    height: 48,
                    left: -24,
                    top: -24,
                  }}
                />

                {/* Marker body — glassmorphic fantasy glyph */}
                <div
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg backdrop-blur-sm transition-all duration-200"
                  style={{
                    backgroundColor: isHovered
                      ? `${color}55`
                      : `${color}22`,
                    borderColor: isHovered ? color : `${color}66`,
                    boxShadow: isHovered
                      ? `0 0 24px ${color}88, inset 0 0 12px ${color}44`
                      : `0 0 12px ${color}33, inset 0 0 4px ${color}11`,
                    filter: isCleansed
                      ? "drop-shadow(0 0 6px rgba(243, 199, 113, 0.4))"
                      : isShattered
                        ? "drop-shadow(0 0 6px rgba(231, 76, 60, 0.3)) grayscale(0.5)"
                        : "none",
                  }}
                >
                  {/* Rune glow effect on glyph */}
                  <span
                    className={`text-sm font-bold text-white drop-shadow-lg select-none ${
                      isCleansed ? "obelisk-rune-glow" : ""
                    }`}
                  >
                    {STATE_GLYPH[obelisk.state] ?? "◇"}
                  </span>
                </div>

                {/* Corruption ring overlay */}
                {obelisk.corruption > 0 && (
                  <div
                    className={`absolute rounded-full border-2 transition-all duration-300 ${
                      isCorrupted ? "obelisk-corruption-sheen" : ""
                    }`}
                    style={{
                      borderColor: corrColor,
                      opacity: isCorrupted
                        ? 0.9
                        : 0.3 + obelisk.corruption / 200,
                      width: 40,
                      height: 40,
                      left: -20,
                      top: -20,
                      boxShadow: isCorrupted
                        ? `0 0 12px ${corrColor}66`
                        : "none",
                    }}
                  />
                )}

                {/* Name label below marker — visible on hover */}
                <span
                  className={`absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-medium px-1.5 py-0.5 rounded transition-all duration-200 ${
                    isHovered
                      ? "opacity-100 bg-surface-900/80 text-surface-200 backdrop-blur-sm"
                      : "opacity-0"
                  }`}
                >
                  {OBELISK_NAMES[obelisk.id]}
                </span>
              </button>
            </div>
          );
        })}

      {/* Fantasy tooltip */}
      {hoveredId && (() => {
        const obelisk = obelisks.find((o) => o.id === hoveredId);
        if (!obelisk) return null;
        const affinity = OBELISK_AFFINITIES[obelisk.id];
        const color = AFFINITY_COLORS[affinity];
        const revealedCount = obelisk.loreFragments.filter((f) => f.revealed).length;

        return (
          <div
            className="pointer-events-none absolute z-50 w-52 rounded-xl border border-surface-700/50 bg-surface-900/95 p-3.5 shadow-2xl backdrop-blur-xl animate-scale-in"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${color}22`,
            }}
          >
            {/* Header with affinity stripe */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
              style={{ backgroundColor: color }}
            />

            <div className="pl-3">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold text-surface-100">
                  {OBELISK_NAMES[obelisk.id]}
                </p>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${color}22`,
                    color: color,
                  }}
                >
                  {affinity}
                </span>
              </div>

              <p className="text-[9px] text-surface-500 uppercase tracking-wider mb-1">
                {STATE_LABEL[obelisk.state] ?? obelisk.state}
              </p>

              {obelisk.corruption > 0 && (
                <div className="mt-1.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] text-surface-500 uppercase tracking-wider">
                      Corruption
                    </span>
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: corruptionColor(obelisk.corruption) }}
                    >
                      {obelisk.corruption}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${obelisk.corruption}%`,
                        backgroundColor: corruptionColor(obelisk.corruption),
                        boxShadow: `0 0 6px ${corruptionColor(obelisk.corruption)}66`,
                      }}
                    />
                  </div>
                </div>
              )}

              {revealedCount > 0 && (
                <p className="mt-1.5 text-[9px] text-accent-400">
                  📖 {revealedCount} lore fragment{revealedCount !== 1 ? "s" : ""}
                </p>
              )}

              <p className="mt-1.5 text-[8px] text-surface-600 border-t border-surface-700/30 pt-1.5">
                Click to inspect obelisk details
              </p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
