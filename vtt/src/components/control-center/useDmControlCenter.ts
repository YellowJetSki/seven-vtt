import { useState, useCallback, useRef, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import CanvasMapView, { type CanvasMapHandle } from "@/components/maps/CanvasMapView";
import type { BattleMap, MapToken, AoETemplate } from "@/types";
import type { PlacementMode } from "./DmToolbar";

export function useDmControlCenter() {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);
  const addMapToken = useCampaignStore((s) => s.addMapToken);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  const canvasRef = useRef<CanvasMapHandle>(null);

  const [activeMapId, setActiveMapId] = useState<string | null>(
    battleMaps.length > 0 ? battleMaps[0].id : null
  );
  const [activeMap, setActiveMap] = useState<BattleMap | null>(
    battleMaps.length > 0 ? battleMaps[0] : null
  );
  const [activeTokens, setActiveTokens] = useState<MapToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<MapToken | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(false);
  const [isDmView, setIsDmView] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("none");
  const [showInitiative, setShowInitiative] = useState(false);
  const [showEncounterPanel, setShowEncounterPanel] = useState(false);

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

  const handleSelectMap = useCallback((map: BattleMap) => {
    setActiveMapId(map.id);
    setSelectedTokenId(null);
    setSelectedToken(null);
    canvasRef.current?.recenter();
  }, []);

  const handleTokenClick = useCallback((token: MapToken) => {
    setSelectedTokenId(token.id);
    setSelectedToken(token);
  }, []);

  const handleCellClick = useCallback(() => {
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

  const handleAoEPlace = useCallback((template: AoETemplate) => {
    if (!activeMap) return;
    useCampaignStore.getState().addAoETemplate(activeMap.id, template);
  }, [activeMap]);

  const handleCloseInspector = useCallback(() => {
    setSelectedTokenId(null);
    setSelectedToken(null);
  }, []);

  const handleGoBack = useCallback(() => {
    // Parent handler
  }, []);

  const selectedCombatantId = activeEncounter?.combatants.find(
    (c) => c.id === selectedTokenId
  )?.id;

  return {
    canvasRef,
    activeMap,
    activeTokens,
    selectedToken,
    selectedTokenId,
    showGrid,
    showFog,
    isDmView,
    placementMode,
    showInitiative,
    showEncounterPanel,
    activeEncounter,
    selectedCombatantId,
    battleMaps,
    activeMapId,
    setPlacementMode,
    setShowGrid,
    setIsDmView,
    setShowFog,
    setShowInitiative,
    setShowEncounterPanel,
    setSelectedToken,
    handleSelectMap,
    handleTokenClick,
    handleCellClick,
    handleAddPlayerToken,
    handleAddEnemyToken,
    handleAoEPlace,
    handleCloseInspector,
    handleGoBack,
  };
}
