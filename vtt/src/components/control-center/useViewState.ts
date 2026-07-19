/**
 * STᚱ VTT — useViewState
 *
 * Extracted hook for view state management from useDmControlCenter.
 * Manages grid, fog, DM view, placement mode, and panel toggles.
 */

import { useState } from "react";
import type { PlacementMode } from "./DmToolbar";

export function useViewState() {
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(false);
  const [isDmView, setIsDmView] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("none");
  const [showInitiative, setShowInitiative] = useState(false);
  const [showEncounterPanel, setShowEncounterPanel] = useState(false);

  return {
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
  };
}
