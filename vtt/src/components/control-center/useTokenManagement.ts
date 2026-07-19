/**
 * STᚱ VTT — useTokenManagement
 *
 * Extracted hook for token CRUD operations from useDmControlCenter.
 * Manages adding player/enemy tokens and tracking the selected token.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { BattleMap, MapToken, AoETemplate } from "@/types";

export function useTokenManagement(activeMap: BattleMap | null) {
  const mapTokens = useCampaignStore((s) => s.mapTokens);
  const addMapToken = useCampaignStore((s) => s.addMapToken);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<MapToken | null>(null);

  const handleTokenClick = useCallback((token: MapToken) => {
    setSelectedTokenId(token.id);
    setSelectedToken(token);
  }, []);

  const handleCellClick = useCallback(() => {
    setSelectedTokenId(null);
    setSelectedToken(null);
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSelectedTokenId(null);
    setSelectedToken(null);
  }, []);

  const handleAddPlayerToken = useCallback(() => {
    if (!activeMap) return;
    const tokens = mapTokens[activeMap.id] || [];
    const token: MapToken = {
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "player",
      label: `PC ${tokens.length + 1}`,
      x: Math.floor(activeMap.gridWidth / 2),
      y: Math.floor(activeMap.gridHeight / 2),
      color: "#4a9eff",
      size: 1,
      visible: true,
      icon: "🛡️",
      hp: { current: 50, max: 50 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addMapToken(activeMap.id, token);
    setSelectedToken(token);
    setSelectedTokenId(token.id);
  }, [activeMap, mapTokens, addMapToken]);

  const handleAddEnemyToken = useCallback(() => {
    if (!activeMap) return;
    const tokens = mapTokens[activeMap.id] || [];
    const token: MapToken = {
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "enemy",
      label: `Enemy ${tokens.length + 1}`,
      x: Math.floor(activeMap.gridWidth / 2) + 2,
      y: Math.floor(activeMap.gridHeight / 2),
      color: "#ef4444",
      size: 1,
      visible: true,
      icon: "👹",
      hp: { current: 30, max: 30 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addMapToken(activeMap.id, token);
    setSelectedToken(token);
    setSelectedTokenId(token.id);
  }, [activeMap, mapTokens, addMapToken]);

  const handleAoEPlace = useCallback(
    (template: AoETemplate) => {
      if (!activeMap) return;
      useCampaignStore.getState().addAoETemplate(activeMap.id, template);
    },
    [activeMap]
  );

  return {
    selectedTokenId,
    selectedToken,
    setSelectedToken,
    handleTokenClick,
    handleCellClick,
    handleCloseInspector,
    handleAddPlayerToken,
    handleAddEnemyToken,
    handleAoEPlace,
  };
}
