/**
 * STᚱ VTT — DM Selection Store
 *
 * A lightweight Zustand store that bridges canvas token clicks with
 * open DM popover tools. When the DM clicks a token on the battle map,
 * this store publishes the selected token ID, and any open DM popover
 * (Legendary Tracker, Concentration Timer, Wild Shape, etc.) can
 * subscribe and auto-select that creature.
 *
 * Flow:
 *   DM clicks token on canvas
 *     → dmSelectionStore.selectCombatant("token_dragon_01")
 *     → DmLegendaryActionTracker subscribes → scrolls to + expands dragon card
 *     → DmConcentrationTimerPopover subscribes → shows "filter by dragon" option
 *     → DmWildShapeTracker subscribes → pre-selects that creature
 *
 * This is the REVERSE direction of the Canvas Focus Bridge (Cycle 17).
 */

import { create } from "zustand";

interface DMSelectionState {
  /** The combatant/token ID last selected via canvas click */
  selectedCombatantId: string | null;
  /** The type of selection (for context-aware popover behavior) */
  selectionType: "token_click" | "popover";
}

interface DMSelectionActions {
  /** Called when a combatant is selected from the canvas */
  selectCombatant: (combatantId: string | null) => void;
  /** Called when a combatant is selected from within a DM popover */
  selectFromPopover: (combatantId: string | null) => void;
  /** Clear the current selection */
  clearSelection: () => void;
}

export const useDMSelectionStore = create<DMSelectionState & DMSelectionActions>()((set) => ({
  selectedCombatantId: null,
  selectionType: "token_click",

  selectCombatant: (combatantId: string | null) => {
    set({
      selectedCombatantId: combatantId,
      selectionType: "token_click",
    });
  },

  selectFromPopover: (combatantId: string | null) => {
    set({
      selectedCombatantId: combatantId,
      selectionType: "popover",
    });
  },

  clearSelection: () => {
    set({
      selectedCombatantId: null,
      selectionType: "token_click",
    });
  },
}));
