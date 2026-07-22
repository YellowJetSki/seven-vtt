/**
 * STᚱ VTT — Theatric Page (Premium Cinematic)
 *
 * Dual-screen cinematic display for the player-facing monitor/TV.
 * Zero default UI chrome — pure canvas with auto-hide gold-accented HUD.
 * Syncs active battle map & tokens via campaign store.
 * Detects keyboard arrows for camera panning.
 * Hides all grids, menus, and DM chrome by default.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheatricStore } from "@/stores/theatricStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import TheatricDisplay from "@/components/theatric/TheatricDisplay";
import TheatricStatusBar from "@/components/theatric/TheatricStatusBar";
import TheatricWaitingState from "@/components/theatric/TheatricWaitingState";
import TheatricConnectionIndicator from "@/components/theatric/TheatricConnectionIndicator";

export default function TheatricPage() {
  const [searchParams] = useSearchParams();
  const isConnected = useTheatricStore((s) => s.isConnected);
  const setConnected = useTheatricStore((s) => s.setConnected);
  const setActiveMap = useTheatricStore((s) => s.setActiveMap);
  const setCamera = useTheatricStore((s) => s.setCamera);
  const camera = useTheatricStore((s) => s.camera);
  const activeMapId = useTheatricStore((s) => s.activeMapId);
  const setShowLabels = useTheatricStore((s) => s.setShowLabels);
  const showLabels = useTheatricStore((s) => s.showLabels);
  const campaignMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  const [mapData, setMapData] = useState<typeof campaignMaps[0] | null>(null);
  const [tokens, setTokens] = useState<typeof mapTokens[string]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const keysRef = useRef<Set<string>>(new Set());
  const panIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Sticky refs for camera to prevent stale closure in keyboard handler
  const cameraRef = useRef(camera);
  cameraRef.current = camera;
  const setCameraRef = useRef(setCamera);
  setCameraRef.current = setCamera;

  // Load map from URL param
  useEffect(() => {
    const mapId = searchParams.get("map");
    if (mapId) setActiveMap(mapId);
  }, [searchParams, setActiveMap]);

  // Sync map data & tokens from campaign store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activeMapId) {
        if (campaignMaps.length > 0) {
          setActiveMap(campaignMaps[0].id);
        } else {
          setIsLoading(false);
          setError("No battle map selected. The DM will push a map shortly.");
        }
        return;
      }
      const map = campaignMaps.find((m) => m.id === activeMapId);
      if (map) {
        setMapData(map);
        setTokens(mapTokens[activeMapId] || []);
        setError(null);
        setConnected(true);
      } else {
        setError("Selected map not found. Waiting for DM to update...");
      }
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeMapId, campaignMaps, mapTokens, setActiveMap, setConnected]);

  // Re-sync tokens when they change
  useEffect(() => {
    if (!activeMapId) return;
    setTokens(mapTokens[activeMapId] || []);
  }, [activeMapId, mapTokens]);

  // Auto-hide controls on inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  // Keyboard panning with arrow keys — stable effect, reads camera from refs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (!panIntervalRef.current) {
          panIntervalRef.current = setInterval(() => {
            const cam = cameraRef.current;
            const setCam = setCameraRef.current;
            const speed = 16 / Math.max(0.01, cam.zoom); // Guard against zoom = 0 → Infinity
            const k = keysRef.current;
            if (k.has("ArrowUp")) setCam({ y: cam.y + speed });
            if (k.has("ArrowDown")) setCam({ y: cam.y - speed });
            if (k.has("ArrowLeft")) setCam({ x: cam.x + speed });
            if (k.has("ArrowRight")) setCam({ x: cam.x - speed });
          }, 16);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].some(k => keysRef.current.has(k))) {
        if (panIntervalRef.current) {
          clearInterval(panIntervalRef.current);
          panIntervalRef.current = undefined;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (panIntervalRef.current) {
        clearInterval(panIntervalRef.current);
        panIntervalRef.current = undefined;
      }
    };
  }, []); // ← stable: never re-creates, reads from refs

  // ── Auto-follow camera onto active combatant ──
  // Reads active encounter from combatStore and centers camera
  // on the current turn token, using grid coordinates
  useEffect(() => {
    const enc = activeEncounter;
    if (!enc || enc.phase !== "active" || !activeMapId) return;

    const currentIdx = enc.currentCombatantIndex;
    if (currentIdx < 0 || currentIdx >= enc.combatants.length) return;

    const currentCombatant = enc.combatants[currentIdx];
    if (!currentCombatant) return;

    // Find the matching token for this combatant by name
    const mapTokenArray = mapTokens[activeMapId];
    if (!mapTokenArray) return;

    const matchingToken = mapTokenArray.find(
      (t) => t.label.toLowerCase() === currentCombatant.name.toLowerCase()
    );
    if (!matchingToken) return;

    // Smoothly center camera on the token's grid position
    // Uses camera store to avoid stale closures
    setCamera({
      x: -(matchingToken.x * 50), // approximate gridSize = 50
      y: -(matchingToken.y * 50),
      zoom: 1.2, // slight zoom-in for dramatic effect
    });
  }, [activeEncounter, activeMapId, mapTokens, setCamera]); // Re-runs when encounter, map, or tokens change

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const toggleGrid = useCallback(() => {
    setShowGrid((g) => !g);
  }, []);

  const toggleLabels = useCallback(() => {
    setShowLabels(!showLabels);
  }, []);

  if (isLoading || (error && !mapData)) {
    return <TheatricWaitingState error={error || ""} isConnected={isConnected} isLoading={isLoading} />;
  }

  return (
    <div
      className="fixed inset-0 bg-[#0a0b12] overflow-hidden select-none"
      style={{ height: '100dvh', width: '100dvw' }}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setShowControls(true)}
    >
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f111a] via-[#0a0b12] to-[#06070a] pointer-events-none z-0" />

      {/* Main canvas — fills entire viewport */}
      {mapData && (
        <TheatricDisplay
          mapData={mapData}
          tokens={tokens}
          showGrid={showGrid}
        />
      )}

      {/* Auto-hide status bar — fades on inactivity */}
      <TheatricStatusBar
        mapName={mapData?.name}
        isConnected={isConnected}
        show={showControls}
        showGrid={showGrid}
        showLabels={showLabels}
        onToggleFullscreen={toggleFullscreen}
        onToggleGrid={toggleGrid}
        onToggleLabels={toggleLabels}
      />

      {/* Subtle connection indicator — always visible */}
      <TheatricConnectionIndicator isConnected={isConnected} />

      {/* Instruction hint — fades after first mouse move */}
      {!showControls && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-1000 opacity-20 hover:opacity-40">
          <span className="text-[10px] text-gold-400/40 uppercase tracking-[0.2em] font-mono">
            Move mouse to reveal controls · Arrow keys to pan
          </span>
        </div>
      )}
    </div>
  );
}
