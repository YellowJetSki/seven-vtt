/* ── Theatric Page ────────────────────────────────────────────
 * Fullscreen battle map display optimized for projectors/TVs with:
 *   - Dynamic battle map rendering with screen-edge snap
 *   - Token overlay with custom tokens/art/color-coded
 *   - Fog of War zones (edit mode via right sidebar)
 *   - Fullscreen toggle
 *   - Real-time Firebase sync (if available)
 *   - LocalStorage fallback for offline use
 *   - Scene notes saved to localStorage
 *
 * USAGE: localStorage key "vtt-theatric-payload" expects:
 *   { mapId: string, tokenId: string, map?: BattleMap }
 *
 * PORT SCALING:
 *   Maps default to 40x30 grid at 50px = 2000x1500 logical units.
 *   The renderer scales this to fit the viewport while maintaining
 *   aspect ratio, adding letterbox bars if needed.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useCallback } from "react";
import { isFirebaseAvailable } from "@/lib/firebase";
import { TheatricMap } from "@/components/theatric/TheatricMap";
import { TheatricSidebar } from "@/components/theatric/TheatricSidebar";
import type { WeatherEffect } from "@/components/theatric/WeatherOverlay";
import type { BattleMap } from "@/types";

const THEATRIC_STORAGE_KEY = "vtt-theatric-payload";
const SCENE_NOTES_KEY = "vtt-theatric-scene-notes";
const FALLBACK_POLL_INTERVAL = 2000;

interface TheatricPayload {
  mapId: string;
  tokenId: string;
  map?: BattleMap;
}

/* ── Scene Notes Helpers ──────────────────────────────────────── */
function loadSceneNotes(): string {
  try { return localStorage.getItem(SCENE_NOTES_KEY) ?? ""; }
  catch { return ""; }
}

function saveSceneNotes(notes: string): void {
  try {
    if (notes) localStorage.setItem(SCENE_NOTES_KEY, notes);
    else localStorage.removeItem(SCENE_NOTES_KEY);
  } catch { /* quota exceeded — silently ignore */ }
}

export function TheatricPage() {
  const [payload, setPayload] = useState<TheatricPayload | null>(null);
  const [map, setMap] = useState<BattleMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [weather, setWeather] = useState<WeatherEffect>("clear");
  const [sceneNotes, setSceneNotes] = useState<string>(loadSceneNotes);
  const [firebaseReady, setFirebaseReady] = useState<boolean | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firebaseUnsubRef = useRef<(() => void) | null>(null);

  // Persist scene notes to localStorage on every change
  useEffect(() => { saveSceneNotes(sceneNotes); }, [sceneNotes]);

  // Detect if Firebase is available
  useEffect(() => {
    setFirebaseReady(isFirebaseAvailable());
  }, []);

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
        if (!parsed.mapId || !parsed.tokenId) {
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

    // Poll localStorage for new payloads (in case the user opens a different map)
    const quickPoll = setInterval(() => {
      const raw = localStorage.getItem(THEATRIC_STORAGE_KEY);
      if (raw) {
        try {
          const parsed: TheatricPayload = JSON.parse(raw);
          setPayload((prev) => {
            if (!prev || prev.tokenId !== parsed.tokenId || prev.mapId !== parsed.mapId) {
              return parsed;
            }
            return prev;
          });
        } catch {
          /* ignore parse errors on poll */
        }
      }
    }, 500);

    return () => {
      clearInterval(quickPoll);
    };
  }, []);

  /* ── Firebase payload listener ───────────────────────── */
  useEffect(() => {
    if (!firebaseReady || !payload) return;

    // Attempt to subscribe to the specific map document in Firestore
    import("@/lib/firebase").then(({ getDb }) => {
      try {
        const db = getDb();
        import("firebase/firestore").then(({ doc, onSnapshot }) => {
          const mapRef = doc(db, "campaigns", "arkla", "maps", payload.mapId);
          const unsub = onSnapshot(mapRef, {
            next: (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                const mapData = data?.data ?? data;
                if (mapData && mapData.id === payload.mapId) {
                  setMap(mapData as BattleMap);
                  setError(null);
                }
              }
            },
            error: () => {
              // Firebase unavailable, fallback to localStorage
            },
          });
          firebaseUnsubRef.current = unsub;
        });
      } catch {
        // Firebase not available, fallback to localStorage
      }
    });

    return () => {
      if (firebaseUnsubRef.current) {
        firebaseUnsubRef.current();
        firebaseUnsubRef.current = null;
      }
    };
  }, [payload, firebaseReady]);

  /* ── Fallback: poll localStorage for full map data (Firebase unavailable) ─ */
  useEffect(() => {
    if (!payload || firebaseReady) return;

    function loadFullFromStorage() {
      try {
        const raw = localStorage.getItem(THEATRIC_STORAGE_KEY);
        if (!raw) return;
        const parsed: TheatricPayload = JSON.parse(raw);
        const currentPayload = payload;
        if (parsed.map && currentPayload && parsed.map.id === currentPayload.mapId) {
          setMap((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(parsed.map)) return prev;
            return parsed.map ?? null;
          });
          setError(null);
        }
      } catch {
        /* skip */
      }
    }

    loadFullFromStorage();

    const interval = setInterval(loadFullFromStorage, FALLBACK_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [payload, firebaseReady]);

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

  /* ── Auto-scroll to center the focused token ──────────── */
  const mapContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!map || !payload?.tokenId) return;
    const token = map.tokens?.find((t) => t.id === payload.tokenId);
    if (!token || !mapContainerRef.current) return;

    const container = mapContainerRef.current;
    const tokenPercentX = token.x / map.gridWidth;
    const tokenPercentY = token.y / map.gridHeight;
    const scrollX = (tokenPercentX * container.scrollWidth) - container.clientWidth / 2;
    const scrollY = (tokenPercentY * container.scrollHeight) - container.clientHeight / 2;

    container.scrollTo({
      left: Math.max(0, scrollX),
      top: Math.max(0, scrollY),
      behavior: "smooth",
    });
  }, [map, payload?.tokenId]);

  /* ── Fullscreen toggle ────────────────────────────────── */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }, []);

  /* ── Render error state ───────────────────────────────── */
  if (error) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950 p-8 text-center overflow-hidden" ref={containerRef}>
        {/* Animated background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-accent-500/5 blur-3xl animate-pulse-glow" />
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-48 w-48 rounded-full bg-mage-500/5 blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>

        {/* Animated logo with glow */}
        <div className="relative z-10 mb-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-accent-500/10 ring-1 ring-accent-500/20 overflow-hidden animate-pulse-glow shadow-[0_0_40px_rgba(139,48,255,0.15)]">
            <img src="/AppIcon.png" alt="STᚱ VTT" className="h-24 w-24 object-cover" />
          </div>
        </div>

        <h2 className="relative z-10 text-lg font-semibold text-surface-300">STᚱ VTT</h2>
        <p className="relative z-10 max-w-md text-sm text-surface-600">{error}</p>
        <button
          onClick={() => window.close()}
          className="relative z-10 mt-4 rounded-lg border border-surface-700 bg-surface-800/50 px-4 py-2 text-sm text-surface-400 hover:text-surface-200 hover:border-surface-600 transition-all hover:bg-surface-700/50 backdrop-blur-sm"
        >
          Close
        </button>
      </div>
    );
  }

  /* ── Render loading state ─────────────────────────────── */
  if (!payload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-900 p-8" ref={containerRef}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <p className="text-sm text-surface-500">Loading theatric data...</p>
      </div>
    );
  }

  /* ── Render main view ─────────────────────────────────── */
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-surface-900" ref={containerRef}>
      {/* Map container with scroll for centering */}
      <div ref={mapContainerRef} className="flex-1 relative overflow-auto">
      {/* Theatric Sidebar */}
      <TheatricSidebar
        map={map}
        tokenId={payload.tokenId}
        fullscreen={fullscreen}
        showGrid={showGrid}
        weather={weather}
        sceneNotes={sceneNotes}
        onSceneNotesChange={setSceneNotes}
        onToggleFullscreen={toggleFullscreen}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onWeatherChange={setWeather}
      />

      {/* Battle Map */}
      <div className="flex-1 relative">
        <TheatricMap map={map} tokenId={payload.tokenId} showGrid={showGrid} weather={weather} />

        {/* Corner watermark */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/40 px-2 py-1 text-[10px] text-surface-500 backdrop-blur-sm">
          🎭 Theatric View
        </div>
      </div>
      </div> {/* End map container */}
    </div>
  );
}
