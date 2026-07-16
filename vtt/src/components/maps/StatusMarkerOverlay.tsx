/* ── Token Status Marker Overlay ───────────────────────────────
 * Renders visual condition markers on top of map tokens.
 * DM clicks a token's marker area to toggle conditions like
 * blinded, charmed, poisoned, prone, unconscious, etc.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import type { MapToken, TokenStatusMarker } from "@/types";

interface StatusMarkerOverlayProps {
  token: MapToken;
  isSelected: boolean;
  onUpdateToken: (updates: Partial<MapToken>) => void;
}

const STATUS_CONDITIONS: { type: TokenStatusMarker["type"]; icon: string; label: string; color: string }[] = [
  { type: "blinded", icon: "👁️‍🗨️", label: "Blinded", color: "#6b7280" },
  { type: "charmed", icon: "💖", label: "Charmed", color: "#ec4899" },
  { type: "deafened", icon: "🔇", label: "Deafened", color: "#9ca3af" },
  { type: "exhaustion", icon: "😰", label: "Exhaustion", color: "#f59e0b" },
  { type: "frightened", icon: "😱", label: "Frightened", color: "#8b5cf6" },
  { type: "grappled", icon: "🤝", label: "Grappled", color: "#f97316" },
  { type: "incapacitated", icon: "💫", label: "Incapacitated", color: "#a855f7" },
  { type: "invisible", icon: "👻", label: "Invisible", color: "#d1d5db" },
  { type: "paralyzed", icon: "🧊", label: "Paralyzed", color: "#60a5fa" },
  { type: "petrified", icon: "🗿", label: "Petrified", color: "#78716c" },
  { type: "poisoned", icon: "☠️", label: "Poisoned", color: "#22c55e" },
  { type: "prone", icon: "🙇", label: "Prone", color: "#eab308" },
  { type: "restrained", icon: "⛓️", label: "Restrained", color: "#f97316" },
  { type: "stunned", icon: "✨", label: "Stunned", color: "#a855f7" },
  { type: "unconscious", icon: "💤", label: "Unconscious", color: "#6b7280" },
  { type: "concentration", icon: "🧠", label: "Concentrating", color: "#3b82f6" },
];

const STATUS_COLORS: Record<string, string> = {
  blinded: "#6b7280",
  charmed: "#ec4899",
  deafened: "#9ca3af",
  exhaustion: "#f59e0b",
  frightened: "#8b5cf6",
  grappled: "#f97316",
  incapacitated: "#a855f7",
  invisible: "#d1d5db",
  paralyzed: "#60a5fa",
  petrified: "#78716c",
  poisoned: "#22c55e",
  prone: "#eab308",
  restrained: "#f97316",
  stunned: "#a855f7",
  unconscious: "#6b7280",
  concentration: "#3b82f6",
};

export function StatusMarkerOverlay({ token, isSelected, onUpdateToken }: StatusMarkerOverlayProps) {
  const [showPicker, setShowPicker] = useState(false);

  const currentMarkers = token.statusMarkers ?? [];
  const activeTypes = new Set(currentMarkers.map((m) => m.type));

  const toggleStatus = useCallback((type: TokenStatusMarker["type"]) => {
    const existing = currentMarkers.filter((m) => m.type !== type);
    if (activeTypes.has(type)) {
      // Remove
      onUpdateToken({ statusMarkers: existing });
    } else {
      // Add
      const newMarker: TokenStatusMarker = {
        id: `status_${type}_${Date.now()}`,
        type,
        color: STATUS_COLORS[type] || "#6b7280",
      };
      onUpdateToken({ statusMarkers: [...existing, newMarker] });
    }
  }, [currentMarkers, activeTypes, onUpdateToken]);

  return (
    <div className="relative">
      {/* Active status markers shown on the token */}
      {currentMarkers.length > 0 && (
        <div className="absolute -top-1 -right-1 z-30 flex flex-wrap gap-0.5 max-w-[60px]">
          {currentMarkers.slice(0, 4).map((marker) => {
            const condition = STATUS_CONDITIONS.find((c) => c.type === marker.type);
            return (
              <span
                key={marker.id}
                className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] shadow-sm ring-1 ring-black/20"
                style={{ backgroundColor: marker.color || "#6b7280" }}
                title={condition?.label ?? marker.type}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStatus(marker.type);
                }}
              >
                {condition?.icon ?? "❓"}
              </span>
            );
          })}
          {currentMarkers.length > 4 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-surface-800 text-[7px] text-surface-400 ring-1 ring-black/20">
              +{currentMarkers.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Status Toggle Button (visible when selected) */}
      {isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowPicker(!showPicker); }}
          className="absolute -bottom-1 -left-1 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-surface-800 text-[10px] text-surface-300 hover:bg-accent-600 hover:text-white transition-all shadow-sm ring-1 ring-black/20"
          title="Toggle status conditions"
        >
          +
        </button>
      )}

      {/* Status Condition Picker */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-surface-100">Status Conditions</h3>
              <button
                onClick={() => setShowPicker(false)}
                className="text-xs text-surface-500 hover:text-surface-300"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_CONDITIONS.map((condition) => {
                const isActive = activeTypes.has(condition.type);
                return (
                  <button
                    key={condition.type}
                    onClick={() => toggleStatus(condition.type)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                      isActive
                        ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                        : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200"
                    }`}
                  >
                    <span>{condition.icon}</span>
                    <span>{condition.label}</span>
                    {isActive && <span className="ml-0.5 text-[9px] text-accent-500">✓</span>}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-surface-500 text-center">
              Click active status again to remove it. Markers show on token.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
