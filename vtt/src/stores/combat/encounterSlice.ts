/* ── Encounter CRUD Slice ──────────────────────────────────────
 * Create, set active encounters.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { CombatStoreState } from "./types";
import { uid } from "./types";
import type { CombatEncounter, Combatant } from "@/types/combat";

export const createCombatEncounterSlice: StateCreator<
  CombatStoreState,
  [],
  [],
  Pick<CombatStoreState, "createEncounter" | "createEncounterWithCombatants" | "setActiveEncounter">
> = (set) => ({
  createEncounter: (name) => {
    const id = uid("encounter");
    const encounter: CombatEncounter = {
      id,
      name,
      combatants: [],
      round: 1,
      currentCombatantIndex: 0,
      turnStartedAt: null,
      phase: "prep",
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      isPaused: false,
    };
    set({ activeEncounter: encounter, combatLog: [] });
    return id;
  },

  createEncounterWithCombatants: (name, combatantData) => {
    const id = uid("encounter");
    const combatants: Combatant[] = combatantData.map((data) => ({
      ...data,
      id: uid("combatant"),
    }));
    const encounter: CombatEncounter = {
      id,
      name,
      combatants,
      round: 1,
      currentCombatantIndex: 0,
      turnStartedAt: null,
      phase: "prep",
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      isPaused: false,
    };
    set({ activeEncounter: encounter, combatLog: [] });
    return id;
  },

  setActiveEncounter: (encounterId) => {
    if (encounterId === null) {
      set({ activeEncounter: null, combatLog: [] });
    }
  },
});
