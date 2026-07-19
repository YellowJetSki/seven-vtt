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

  const [mapData, setMapData] = useState<typeof campaignMaps[0] | null>(null);
  const [tokens, setTokens] = useState<typeof mapTokens[string]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const keysRef = useRef<Set<string>>(new Set());
  const panIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

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

  // Keyboard panning with arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (!panIntervalRef.current) {
          panIntervalRef.current = setInterval(() => {
            const speed = 16 / camera.zoom;
            const k = keysRef.current;
            if (k.has("ArrowUp")) setCamera({ y: camera.y + speed });
            if (k.has("ArrowDown")) setCamera({ y: camera.y - speed });
            if (k.has("ArrowLeft")) setCamera({ x: camera.x + speed });
            if (k.has("ArrowRight")) setCamera({ x: camera.x - speed });
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
      if (panIntervalRef.current) clearInterval(panIntervalRef.current);
    };
  }, [camera.zoom, setCamera]);

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
