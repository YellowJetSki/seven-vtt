/**
 * STᚱ VTT — Theatric Page
 *
 * Dual-screen cinematic display for the player-facing monitor/TV.
 * Zero UI chrome — syncs active battle map & tokens via campaign store.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheatricStore } from "@/stores/theatricStore";
import { useCampaignStore } from "@/stores/campaignStore";
import TheatricDisplay from "@/components/theatric/TheatricDisplay";
import TheatricStatusBar from "@/components/theatric/TheatricStatusBar";
import TheatricWaitingState from "@/components/theatric/TheatricWaitingState";

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

  useEffect(() => {
    const mapId = searchParams.get("map");
    if (mapId) setActiveMap(mapId);
  }, [searchParams, setActiveMap]);

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

  useEffect(() => {
    if (!activeMapId) return;
    setTokens(mapTokens[activeMapId] || []);
  }, [activeMapId, mapTokens]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  if (isLoading || (error && !mapData)) {
    return <TheatricWaitingState error={error || ""} isConnected={isConnected} isLoading={isLoading} />;
  }

  return (
    <div
      className="fixed inset-0 bg-[#0a0b12] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
    >
      {mapData && <TheatricDisplay mapData={mapData} tokens={tokens} />}

      <TheatricStatusBar
        mapName={mapData?.name}
        isConnected={isConnected}
        show={showControls}
        onToggleFullscreen={toggleFullscreen}
      />

      <div className="fixed bottom-4 left-4 z-30">
        <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse-soft" : "bg-yellow-500"}`} />
      </div>
    </div>
  );
}
