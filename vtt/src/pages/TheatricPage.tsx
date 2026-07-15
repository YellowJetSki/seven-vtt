/* ── Theatric Page ─────────────────────────────────────────────
 * Standalone full-screen page for the Theatric Tab (opened via
 * window.open from BattleMaps). This page has NO sidebar, NO
 * auth guard, and NO grid lines — just a pure, immersive view
 * centered on the DM's selected token.
 *
 * ── Cross-tab live sync ──────────────────────────────────────
 * 1. BattleMaps serialises the full map + tokenId into localStorage
 *    under THEATRIC_STORAGE_KEY, then opens this page via window.open.
 * 2. On mount, this page reads the payload from localStorage.
 * 3. It listens for the 'storage' event (fired automatically by the
 *    browser when another tab writes to localStorage). When the DM
 *    moves a token in the main tab, the campaignStore writes the
 *    updated map, which BattleMaps serialises into localStorage,
 *    which triggers a 'storage' event here, updating the view in
 *    real time.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { BattleMap, MapToken } from "@/types";
import { THEATRIC_STORAGE_KEY, type TheatricPayload } from "@/pages/BattleMaps";

/** Polling interval (ms) for reading fresh data from the campaign store. */
const POLL_INTERVAL = 500;

export function TheatricPage() {
  const [payload, setPayload] = useState<TheatricPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Read initial payload from localStorage ────────────── */
  useEffect(() => {
    function loadFromStorage() {
      try {
        const raw = localStorage.getItem(THEATRIC_STORAGE_KEY);
        if (!raw) {
          setError("No battle map data found. Open the Theatric view from a battle map.");
          return;
        }
        const parsed: TheatricPayload = JSON.parse(raw);
        if (!parsed.map || !parsed.tokenId) {
          setError("Invalid theatric data format.");
          return;
        }
        setPayload(parsed);
        setError(null);
      } catch {
        setError("Failed to parse theatric data.");
      }
    }

    loadFromStorage();

    /* ── Cross-tab sync via 'storage' event ──────────────── */
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEATRIC_STORAGE_KEY && e.newValue) {
        try {
          const parsed: TheatricPayload = JSON.parse(e.newValue);
          setPayload(parsed);
          setError(null);
        } catch {
          /* ignore malformed writes */
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    /* ── Fallback polling for same-tab stores ────────────── */
    pollingRef.current = setInterval(() => {
      const raw = localStorage.getItem(THEATRIC_STORAGE_KEY);
      if (raw) {
        try {
          const parsed: TheatricPayload = JSON.parse(raw);
          setPayload((prev) => {
            /* Only update if something actually changed */
            if (!prev || prev.map.updatedAt !== parsed.map.updatedAt) {
              return parsed;
            }
            return prev;
          });
        } catch {
          /* skip */
        }
      }
    }, POLL_INTERVAL);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  /* ── Fade-in on mount ─────────────────────────────────── */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.opacity = "0";
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = "opacity 600ms ease";
          containerRef.current.style.opacity = "1";
        }
      });
    }
  }, []);

  /* ── Toggle fullscreen ────────────────────────────────── */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        /* user gesture may be required */
      });
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }, []);

  /* ── Handle fullscreen change events ──────────────────── */
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ── Derive current token ─────────────────────────────── */
  const currentToken: MapToken | null = useMemo(() => {
    if (!payload) return null;
    return payload.map.tokens.find((t) => t.id === payload.tokenId) ?? null;
  }, [payload]);

  /* ── Compute viewport transform: zoom + center on token ─ */
  const viewportStyle = useMemo(() => {
    if (!currentToken || !payload) return {};
    const { map } = payload;
    const tx = (currentToken.x / map.gridWidth) * 100;
    const ty = (currentToken.y / map.gridHeight) * 100;
    /* Zoom level: show roughly 5 cells around the token */
    const zoomX = 100 / Math.max(map.gridWidth, 10);
    const zoomY = 100 / Math.max(map.gridHeight, 10);
    const zoom = Math.max(zoomX, zoomY, 0.15);
    return {
      transform: `translate(${-tx * zoom + 50 - zoom * 50}%, ${-ty * zoom + 50 - zoom * 50}%) scale(${1 / zoom})`,
      transformOrigin: "0 0",
    };
  }, [currentToken, payload]);

  /* ── Render: error state ──────────────────────────────── */
  if (error) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950 text-surface-300">
        <div className="max-w-md text-center space-y-4 p-8">
          <span className="text-6xl">🎭</span>
          <h1 className="text-xl font-bold text-surface-100">Theatric View</h1>
          <p className="text-sm text-surface-500">{error}</p>
          <p className="text-xs text-surface-600">
            Open a battle map, select a token, and click{" "}
            <kbd className="rounded bg-surface-800 px-1.5 py-0.5 font-mono text-accent-400">
              🎭 Theatric
            </kbd>
          </p>
          <button
            onClick={() => window.close()}
            className="rounded-lg bg-surface-800 px-4 py-2 text-sm text-surface-300 hover:bg-surface-700 transition-colors"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  /* ── Render: loading state ────────────────────────────── */
  if (!payload || !currentToken) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950 text-surface-400">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          <span className="text-sm">Loading theatric view...</span>
        </div>
      </div>
    );
  }

  const { map } = payload;
  const allTokens = map.tokens;

  /* ── Render: the immersive theatric view ──────────────── */
  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen overflow-hidden bg-surface-950 select-none"
      style={{ opacity: 0 }}
    >
      {/* ── The zoomable / pannable scene ─────────────────── */}
      <div className="absolute inset-0" style={viewportStyle}>
        {/* Map image */}
        {map.imageUrl && (
          <img
            src={map.imageUrl}
            alt={map.name}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
        )}

        {/* NO grid lines — pure immersion */}

        {/* All tokens — only visible ones */}
        {allTokens.map((t) => {
          const isActive = t.id === currentToken.id;
          return (
            <div
              key={t.id}
              className={`absolute flex items-center justify-center rounded-full transition-all duration-300 ${
                isActive
                  ? "ring-3 ring-accent-400 ring-offset-4 ring-offset-surface-950 z-20 scale-110 shadow-2xl"
                  : t.visible
                    ? "z-10 opacity-60"
                    : "hidden"
              }`}
              style={{
                left: `${(t.x / map.gridWidth) * 100}%`,
                top: `${(t.y / map.gridHeight) * 100}%`,
                width: `${((t.size * 1.2) / map.gridWidth) * 100}%`,
                height: `${((t.size * 1.2) / map.gridHeight) * 100}%`,
                backgroundColor: t.color,
                minWidth: "24px",
                minHeight: "24px",
              }}
              title={`${t.label} — (${t.x},${t.y})`}
            >
              {t.icon ? (
                <span className="text-sm">{t.icon}</span>
              ) : (
                <span className="text-[10px] font-bold text-white uppercase">
                  {t.label.charAt(0)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Top-right controls ─────────────────────────────── */}
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="rounded-lg bg-surface-900/60 px-3 py-1.5 text-xs text-surface-300 backdrop-blur-md hover:bg-surface-900/80 transition-colors"
          title={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {fullscreen ? "⊞ Exit Fullscreen" : "⊞ Fullscreen"}
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg bg-surface-900/60 px-3 py-1.5 text-xs text-surface-300 backdrop-blur-md hover:bg-surface-900/80 transition-colors"
        >
          ✕ Close
        </button>
      </div>

      {/* ── Map name badge (top-left) ──────────────────────── */}
      <div className="absolute top-4 left-4 z-30">
        <div className="rounded-lg bg-surface-900/60 px-3 py-1.5 text-xs text-surface-400 backdrop-blur-md">
          🗺️ {map.name}
        </div>
      </div>

      {/* ── Token info card (bottom) ───────────────────────── */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex items-end justify-between">
        <div className="rounded-xl border border-surface-700/50 bg-surface-900/80 px-4 py-3 backdrop-blur-lg shadow-2xl max-w-lg">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: currentToken.color }}
            >
              <span className="text-lg font-bold text-white">
                {currentToken.label.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-surface-100 truncate">
                {currentToken.label}
              </h3>
              <p className="text-xs text-surface-400">
                {currentToken.type === "player"
                  ? "PC"
                  : currentToken.type.charAt(0).toUpperCase() + currentToken.type.slice(1)}
                {currentToken.hp && ` · ${currentToken.hp.current}/${currentToken.hp.max} HP`}
                {currentToken.speed && ` · ${currentToken.speed}ft`}
                · Position ({currentToken.x},{currentToken.y})
              </p>
            </div>
          </div>
          {/* HP bar */}
          {currentToken.hp && (
            <div className="mt-2">
              <div className="h-1.5 w-full rounded-full bg-surface-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentToken.hp.current / currentToken.hp.max) * 100)}%`,
                    backgroundColor:
                      currentToken.hp.current > currentToken.hp.max * 0.5
                        ? "#27ae60"
                        : currentToken.hp.current > 0
                          ? "#f39c12"
                          : "#e74c3c",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-surface-900/60 px-3 py-1.5 text-[10px] text-surface-500 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-divine-400 animate-pulse" />
          Live
        </div>
      </div>

      {/* ── Keyboard shortcuts hint ────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="rounded-full bg-surface-900/40 px-3 py-1 text-[10px] text-surface-600 backdrop-blur-md">
          DM moves tokens in main tab · this view updates live
        </div>
      </div>
    </div>
  );
}
