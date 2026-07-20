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
 *
 * Cycle 21 Enhancement (Premium Battlemap Overhaul):
 *   - Token HP Popover system: rapid HP adjustment via floating popover on token click
 *   - handleTokenClickEx with position tracking for precise popover placement
 *   - handleHpChangeFromPopover writes HP changes to Zustand + Firestore instantly
 */

import { useCallback, useRef, useState } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useFirestoreTokenSync } from "@/hooks/useFirestoreTokenSync";
import { useTokenMutations } from "@/hooks/useTokenMutations";
import { useMapSelection } from "./useMapSelection";
import { useTokenManagement } from "./useTokenManagement";
import { useViewState } from "./useViewState";
import type { CanvasMapHandle } from "@/components/maps/CanvasMapView";
import type { MapToken } from "@/types";

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
  useFirestoreTokenSync(activeMapId);

  // ── Cycle 3: Token Mutations ────────────────────────────
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

  // ── Cycle 21: Token HP Popover State ────────────────────
  const [hpPopoverToken, setHpPopoverToken] = useState<MapToken | null>(null);
  const [hpPopoverPosition, setHpPopoverPosition] = useState({ top: 0, left: 0 });

  /**
   * Enhanced token click handler: opens HP popover at click position
   * while also opening the inspector for detailed management.
   */
  const handleTokenClickEx = useCallback(
    (token: MapToken, clientX: number, clientY: number) => {
      // Set popover position near the click, offset up-left from token
      setHpPopoverPosition({ top: clientY - 20, left: clientX - 20 });
      setHpPopoverToken(token);
      // Also set selected token for the inspector panel
      handleTokenClick(token);
    },
    [handleTokenClick]
  );

  const handleCloseHpPopover = useCallback(() => {
    setHpPopoverToken(null);
  }, []);

  /**
   * Handle HP change from the popover — writes instantly to Zustand + Firestore
   */
  const handleHpChangeFromPopover = useCallback(
    (tokenId: string, current: number, max: number) => {
      if (!activeMap) return;
      updateToken(tokenId, {
        hp: { current, max },
      });
      // Update the local popover state to reflect
      setHpPopoverToken((prev) =>
        prev && prev.id === tokenId
          ? { ...prev, hp: { current, max } }
          : prev
      );
    },
    [activeMap, updateToken]
  );

  // ── Token Drag Handler ─────────────────────────
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
    // Token mutations
    updateToken,
    addToken,
    removeToken,
    handleMoveToken,
    // Cycle 21: HP Popover
    hpPopoverToken,
    hpPopoverPosition,
    handleTokenClickEx,
    handleCloseHpPopover,
    handleHpChangeFromPopover,
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
