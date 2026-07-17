/* ── Theatric Sidebar Component ────────────────────────────────
 * Sleek, minimal control panel for the theatric view.
 * Auto-hides after a few seconds of inactivity for full immersion.
 *
 * FEATURES:
 *  • Auto-hide UI with hover-to-reveal
 *  • Current map/token info
 *  • Weather controls (clear/rain/snow/fog/dust)
 *  • Scene notes — collapsible DM notes panel
 *  • Fullscreen & grid toggles
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import type { BattleMap } from "@/types";

import type { WeatherEffect } from "./WeatherOverlay";

/* ── Scene Notes localStorage Key ────────────────────────────── */
const SCENE_NOTES_KEY = "vtt-theatric-scene-notes";

interface TheatricSidebarProps {
  map: BattleMap | null;
  tokenId: string;
  fullscreen: boolean;
  showGrid: boolean;
  weather: WeatherEffect;
  sceneNotes: string;
  onSceneNotesChange: (notes: string) => void;
  onToggleFullscreen: () => void;
  onToggleGrid: () => void;
  onWeatherChange: (weather: WeatherEffect) => void;
}

const AUTOHIDE_DELAY = 5000;

const WEATHER_OPTIONS: { value: WeatherEffect; label: string; icon: string }[] = [
  { value: "clear", label: "Clear", icon: "☀️" },
  { value: "rain", label: "Rain", icon: "🌧️" },
  { value: "snow", label: "Snow", icon: "❄️" },
  { value: "fog", label: "Fog", icon: "🌫️" },
  { value: "dust", label: "Dust", icon: "💨" },
];

export function TheatricSidebar({ map, tokenId, fullscreen, showGrid, weather, sceneNotes, onSceneNotesChange, onToggleFullscreen, onToggleGrid, onWeatherChange }: TheatricSidebarProps) {
  const [visible, setVisible] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const resetAutohide = useCallback(() => {
    setVisible(true);
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      if (!hovering) setVisible(false);
    }, AUTOHIDE_DELAY);
    setTimer(newTimer);
  }, [timer, hovering]);

  useEffect(() => {
    resetAutohide();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (hovering) {
      setVisible(true);
      if (timer) clearTimeout(timer);
    } else {
      resetAutohide();
    }
  }, [hovering]);

  const currentToken = map?.tokens?.find((t) => t.id === tokenId);

  return (
    <>
      {/* Transparent hit area to detect hover */}
      <div
        className="absolute left-0 top-0 z-30 h-full w-16"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      />

      {/* Sidebar panel */}
      <div
        className={`absolute left-0 top-0 z-30 flex h-full flex-col border-r border-surface-700/50 bg-surface-900/80 p-4 backdrop-blur-xl transition-all duration-300 ${
          visible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        }`}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{ width: "200px" }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎭</span>
            <span className="text-xs font-bold uppercase tracking-wider text-surface-400">Theatric</span>
          </div>
          <h2 className="text-sm font-semibold text-surface-200 truncate">
            {map?.name ?? "Theatric View"}
          </h2>
          {map && (
            <p className="mt-0.5 text-[10px] text-surface-500">
              {map.gridWidth}×{map.gridHeight} · {map.tokens?.length ?? 0} tokens
            </p>
          )}
        </div>

        {/* Current token info */}
        {currentToken && (
          <div className="mb-4 rounded-lg border border-surface-700/50 bg-surface-800/50 p-3">
            <p className="text-[9px] text-surface-500 uppercase tracking-wider mb-1">Focused Token</p>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center"
                style={{ backgroundColor: currentToken.color }}
              >
                {currentToken.imageUrl ? (
                  <img src={currentToken.imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-[8px] font-bold text-white">{currentToken.label.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-surface-200 truncate">{currentToken.label}</p>
                {currentToken.hp && (
                  <p className="text-[10px] text-surface-400">
                    HP {currentToken.hp.current}/{currentToken.hp.max}
                  </p>
                )}
              </div>
            </div>
            {/* Status markers in sidebar */}
            {(currentToken.statusMarkers ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {currentToken.statusMarkers!.map((m) => (
                  <span key={m.id} className="rounded-full bg-surface-700/50 px-1.5 py-0.5 text-[8px] text-surface-300">
                    {m.type}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Map description / notes */}
        {map?.notes && (
          <p className="mb-4 text-[10px] text-surface-500 italic leading-relaxed line-clamp-3">
            {map.notes}
          </p>
        )}

        {/* ── Scene Notes Toggle ────────────────────────────────── */}
        <div className="mb-4">
          <button
            onClick={() => setNotesOpen((o) => !o)}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[10px] text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 transition-all"
          >
            <span>{notesOpen ? "▼" : "▶"}</span>
            <span>📝 Scene Notes</span>
            <span className="ml-auto text-[9px] text-surface-600">
              {sceneNotes.length > 0 ? `${sceneNotes.length} chars` : "empty"}
            </span>
          </button>
          {notesOpen && (
            <div className="mt-1 animate-slide-up">
              <textarea
                value={sceneNotes}
                onChange={(e) => onSceneNotesChange(e.target.value)}
                placeholder={"Type your scene notes here...\nWhat happens when the party enters?\nKey NPC dialogue?\nHidden clues?"}
                className="w-full rounded-lg border border-surface-700/50 bg-surface-800/70 p-2 text-[11px] text-surface-200 placeholder:text-surface-600 focus:border-accent-500/30 focus:outline-none resize-none transition-all"
                rows={5}
                spellCheck={false}
              />
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[9px] text-surface-600">
                  Notes persist across sessions
                </p>
                <button
                  onClick={() => { onSceneNotesChange(""); }}
                  className="text-[9px] text-warrior-500 hover:text-warrior-400 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Weather Controls */}
        <div className="mb-4">
          <p className="mb-2 text-[9px] text-surface-500 uppercase tracking-wider">Weather</p>
          <div className="grid grid-cols-5 gap-1">
            {WEATHER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onWeatherChange(opt.value)}
                className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[9px] transition-all ${
                  weather === opt.value
                    ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500/30"
                    : "text-surface-500 hover:text-surface-300 hover:bg-surface-800/50"
                }`}
                title={opt.label}
              >
                <span className="text-sm">{opt.icon}</span>
                <span className="truncate max-w-full">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Controls */}
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onToggleGrid}
            className="flex items-center gap-2 rounded-lg border border-surface-700/50 bg-surface-800/50 px-3 py-2 text-[11px] text-surface-300 hover:text-surface-100 hover:bg-surface-700/50 transition-all"
          >
            <span>{showGrid ? "⊞" : "⊟"}</span>
            <span>{showGrid ? "Hide Grid" : "Show Grid"}</span>
          </button>
          <button
            onClick={onToggleFullscreen}
            className="flex items-center gap-2 rounded-lg border border-surface-700/50 bg-surface-800/50 px-3 py-2 text-[11px] text-surface-300 hover:text-surface-100 hover:bg-surface-700/50 transition-all"
          >
            <span>{fullscreen ? "⛶" : "⛶"}</span>
            <span>{fullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 rounded-lg border border-surface-700/50 bg-surface-800/50 px-3 py-2 text-[11px] text-warrior-400 hover:text-warrior-300 hover:bg-surface-700/50 transition-all"
          >
            <span>✕</span>
            <span>Close</span>
          </button>
        </div>
      </div>
    </>
  );
}
