/**
 * STᚱ VTT — useDmControlCenter
 *
 * Orchestration hook for the DM Control Center.
 * Composes useMapSelection, useTokenManagement, useViewState, useFirestoreTokenSync,
 * and useTokenMutations for a unified state surface.
 *
 * Cycle 3 Enhancement:
 *   - useFirestoreTokenSync bridges Firestore tokens ↔ Zustand in real-time
 *   - useTokenMutations provides centralized add/move/remove/update with Firestore writes
 *   - onMoveToken handler wires token drag completion to Firestore sync
 */

import { useCallback, useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useFirestoreTokenSync } from "@/hooks/useFirestoreTokenSync";
import { useTokenMutations } from "@/hooks/useTokenMutations";
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

  // ── Cycle 3: Firestore Token Sync ───────────────────────
  // Subscribes to Firestore onSnapshot for the active map's token subcollection.
  // Merges incoming token data into Zustand campaignStore.
  useFirestoreTokenSync(activeMapId);

  // ── Cycle 3: Token Mutations ────────────────────────────
  // Centralized add/move/update/remove → writes to both Zustand + Firestore.
  const { moveToken, updateToken, addToken, removeToken } = useTokenMutations(activeMapId);

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

  // ── Cycle 3: Token Drag Handler ─────────────────────────
  // Called by useTokenDrag when a drag completes with the final snapped position.
  // Writes the new grid position to both Zustand + Firestore.
  const handleMoveToken = useCallback(
    (tokenId: string, gridX: number, gridY: number) => {
      moveToken(tokenId, gridX, gridY);
    },
    [moveToken]
  );

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
    // Token mutations (exposed for DM UI)
    updateToken,
    addToken,
    removeToken,
    handleMoveToken,
    // View setters
    setPlacementMode,
    setShowGrid,
    setIsDmView,
    setShowFog,
    setShowInitiative,
    setShowEncounterPanel,
    setSelectedToken,
    // Handlers
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
