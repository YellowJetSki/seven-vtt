/* ── Obelisk Map Overlay ────────────────────────────────────────
 * Theatric View overlay that places obelisk markers on the world
 * map. Each marker is positioned based on (mapPositionX, mapPositionY),
 * styled by state and affinity, and shows a tooltip on hover.
 * Supports click-to-navigate to the obelisk detail panel.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useRef, useEffect } from "react";
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

  /** Track mouse for tooltip positioning relative to overlay */
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

  /** Close tooltip on mouse leave */
  const handleMouseLeave = useCallback(() => setHoveredId(null), []);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className={`pointer-events-none absolute inset-0 z-20 ${className}`}
    >
      {/* Obelisk markers positioned absolutely based on percentage coords */}
      {obelisks
        .filter((o) => o.state !== "undiscovered")
        .map((obelisk) => {
          const affinity = OBELISK_AFFINITIES[obelisk.id];
          const color = AFFINITY_COLORS[affinity];
          const corrColor = corruptionColor(obelisk.corruption);
          const isHovered = hoveredId === obelisk.id;

          return (
            <div
              key={obelisk.id}
              className="pointer-events-auto absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${obelisk.mapPositionX}%`,
                top: `${obelisk.mapPositionY}%`,
              }}
            >
              {/* Clickable marker */}
              <button
                onClick={() => onSelectObelisk(obelisk.id)}
                onMouseMove={(e) => handleMouseMove(e, obelisk.id)}
                onMouseLeave={handleMouseLeave}
                className={`group relative flex items-center justify-center transition-all duration-300 ${
                  isHovered ? "scale-125 z-40" : "scale-100"
                }`}
                title={OBELISK_NAMES[obelisk.id]}
              >
                {/* Outer glow */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 ${
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

                {/* Marker body */}
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-200"
                  style={{
                    backgroundColor: isHovered ? color : `${color}33`,
                    borderColor: color,
                    boxShadow: isHovered
                      ? `0 0 20px ${color}66`
                      : `0 0 8px ${color}33`,
                  }}
                >
                  <span className="text-xs font-bold text-white drop-shadow-lg select-none">
                    {STATE_GLYPH[obelisk.state] ?? "◇"}
                  </span>
                </div>

                {/* Corruption ring overlay */}
                {obelisk.corruption > 0 && (
                  <div
                    className="absolute inset-0 rounded-full border-2"
                    style={{
                      borderColor: corrColor,
                      opacity: obelisk.corruption / 100,
                      width: 36,
                      height: 36,
                      left: -18,
                      top: -18,
                    }}
                  />
                )}
              </button>
            </div>
          );
        })}

      {/* Tooltip */}
      {hoveredId && (() => {
        const obelisk = obelisks.find((o) => o.id === hoveredId);
        if (!obelisk) return null;
        const affinity = OBELISK_AFFINITIES[obelisk.id];
        const color = AFFINITY_COLORS[affinity];

        return (
          <div
            className="pointer-events-none absolute z-50 w-48 rounded-lg border border-surface-700/50 bg-surface-900/95 p-3 shadow-xl backdrop-blur-xl"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <p className="text-[11px] font-semibold text-surface-200">
                {OBELISK_NAMES[obelisk.id]}
              </p>
            </div>
            <p className="text-[9px] text-surface-500 uppercase tracking-wider mb-1">
              {STATE_LABEL[obelisk.state] ?? obelisk.state} · {affinity}
            </p>
            {obelisk.corruption > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <div
                  className="h-1.5 flex-1 rounded-full bg-surface-700 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${obelisk.corruption}%`,
                      backgroundColor: corruptionColor(obelisk.corruption),
                    }}
                  />
                </div>
                <span
                  className="text-[9px] font-medium"
                  style={{ color: corruptionColor(obelisk.corruption) }}
                >
                  {obelisk.corruption}%
                </span>
              </div>
            )}
            {obelisk.loreFragments.filter((f) => f.revealed).length > 0 && (
              <p className="mt-1 text-[9px] text-accent-400">
                📖 {obelisk.loreFragments.filter((f) => f.revealed).length} lore fragment
                {obelisk.loreFragments.filter((f) => f.revealed).length !== 1 ? "s" : ""}
              </p>
            )}
            <p className="mt-1 text-[8px] text-surface-500">
              Click to inspect
            </p>
          </div>
        );
      })()}
    </div>
  );
}
