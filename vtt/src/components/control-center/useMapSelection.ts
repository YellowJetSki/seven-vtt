/**
 * STᚱ VTT — useMapSelection
 *
 * Extracted hook for map selection and active map tracking.
 */

import { useState, useCallback, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { BattleMap, MapToken } from "@/types";

export function useMapSelection(canvasRef: React.RefObject<{ recenter: () => void } | null>) {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);

  const [activeMapId, setActiveMapId] = useState<string | null>(
    battleMaps.length > 0 ? battleMaps[0].id : null
  );
  const [activeMap, setActiveMap] = useState<BattleMap | null>(
    battleMaps.length > 0 ? battleMaps[0] : null
  );
  const [activeTokens, setActiveTokens] = useState<MapToken[]>([]);

  // Sync when maps or tokens change
  useEffect(() => {
    if (!activeMapId) {
      setActiveMap(null);
      setActiveTokens([]);
      return;
    }
    const map = battleMaps.find((m) => m.id === activeMapId);
    if (map) {
      setActiveMap(map);
      setActiveTokens(mapTokens[activeMapId] || []);
    }
  }, [activeMapId, battleMaps, mapTokens]);

  const handleSelectMap = useCallback(
    (map: BattleMap) => {
      setActiveMapId(map.id);
      canvasRef.current?.recenter();
    },
    [canvasRef]
  );

  const handleGoBack = useCallback(() => {
    // Parent handler — reserved for navigation
  }, []);

  return {
    battleMaps,
    activeMapId,
    activeMap,
    activeTokens,
    handleSelectMap,
    handleGoBack,
  };
}
