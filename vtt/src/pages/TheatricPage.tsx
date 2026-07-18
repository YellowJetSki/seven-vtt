/**
 * STᚱ VTT — Theatric Page
 *
 * Dual-screen cinematic display for the player-facing monitor/TV.
 * This page loads with zero UI chrome — no header, no sidebar, no controls.
 * It syncs the active battle map, tokens, and lighting via Firebase in real-time.
 *
 * URL Parameters:
 *   ?map=<mapId> — Optionally pre-select a map
 *   ?host=<host> — Firebase host reference for multi-tab sync
 *
 * Architecture:
 *   DM Dashboard ──► Firestore (theatric/state) ──► This page (onSnapshot)
 *   This page reads theatricStore + campaignStore → renders pure canvas
 */

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheatricStore } from "@/stores/theatricStore";
import { useCampaignStore } from "@/stores/campaignStore";
import TheatricDisplay from "@/components/theatric/TheatricDisplay";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function TheatricPage() {
  const [searchParams] = useSearchParams();
  const isConnected = useTheatricStore((s) => s.isConnected);
  const setConnected = useTheatricStore((s) => s.setConnected);
  const setActiveMap = useTheatricStore((s) => s.setActiveMap);
  const activeMapId = useTheatricStore((s) => s.activeMapId);
  const campaignMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);

  const [mapData, setMapData] = useState<typeof campaignMaps[0] | null>(null);
  const [tokens, setTokens] = useState<typeof mapTokens[string]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Read URL param for initial map selection
  useEffect(() => {
    const mapId = searchParams.get("map");
    if (mapId) {
      setActiveMap(mapId);
    }
  }, [searchParams, setActiveMap]);

  // Fetch map data from campaign store
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!activeMapId) {
        // If no active map, use first available map or show waiting state
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

  // Subscribe to token updates via campaign store
  useEffect(() => {
    if (!activeMapId) return;
    const currentTokens = mapTokens[activeMapId] || [];
    setTokens(currentTokens);
  }, [activeMapId, mapTokens]);

  // Show controls on mouse move, hide after 3s
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  // Hide controls on mouse leave
  const handleMouseLeave = () => {
    setShowControls(false);
  };

  // Full-screen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Connection indicator
  const connectionText = isConnected
    ? "🟢 Live"
    : "🟡 Connecting...";

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0b12] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 float-arcane text-accent-400">ᚱ</div>
          <LoadingSpinner size="lg" label="Awakening the theatric display..." />
        </div>
      </div>
    );
  }

  if (error && !mapData) {
    return (
      <div className="fixed inset-0 bg-[#0a0b12] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-6 text-accent-400 animate-pulse-glow">ᚱ</div>
          <h1 className="text-2xl font-bold text-white mb-2">STᚱ VTT</h1>
          <p className="text-surface-400 text-sm mb-4 leading-relaxed">{error}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-surface-500">
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            {connectionText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-[#0a0b12] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Cinematic Canvas ── */}
      {mapData && (
        <TheatricDisplay
          mapData={mapData}
          tokens={tokens}
        />
      )}

      {/* ── Minimal Status Overlay (auto-hides after 3s) ── */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-500 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-white/80 font-semibold text-sm">
                {mapData?.name || "Theatric Display"}
              </span>
              <span className="text-[10px] text-surface-400 uppercase tracking-wider">
                {connectionText}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all backdrop-blur-sm border border-white/10"
                aria-label="Toggle fullscreen"
              >
                ⛶ Fullscreen
              </button>
              <span className="text-[10px] text-surface-500">
                Arkla — STᚱ VTT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Connection indicator dot (always visible, bottom-left) ── */}
      <div className="fixed bottom-4 left-4 z-30 flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500 animate-pulse-soft" : "bg-yellow-500"
          }`}
        />
      </div>
    </div>
  );
}
