/**
 * STᚱ VTT — useDmControlCenter
 *
 * Orchestration hook for the DM Control Center.
 * Composes useMapSelection, useTokenManagement, and useViewState
 * sub-hooks for clean separation of concerns.
 */

import { useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useMapSelection } from "./useMapSelection";
import { useTokenManagement } from "./useTokenManagement";
import { useViewState } from "./useViewState";
import type { CanvasMapHandle } from "@/components/maps/CanvasMapView";

export function useDmControlCenter() {
  const canvasRef = useRef<CanvasMapHandle>(null);

  // Map selection
  const {
    battleMaps,
    activeMapId,
    activeMap,
    activeTokens,
    handleSelectMap,
    handleGoBack,
  } = useMapSelection(canvasRef);

  // Token management
  const {
    selectedTokenId,
    selectedToken,
    setSelectedToken,
    handleTokenClick,
    handleCellClick,
    handleCloseInspector,
    handleAddPlayerToken,
    handleAddEnemyToken,
    handleAoEPlace,
  } = useTokenManagement(activeMap);

  // View state
  const {
    showGrid,
    showFog,
    isDmView,
    placementMode,
    showInitiative,
    showEncounterPanel,
    setPlacementMode,
    setShowGrid,
    setIsDmView,
    setShowFog,
    setShowInitiative,
    setShowEncounterPanel,
  } = useViewState();

  // Combat
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
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
