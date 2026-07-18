import type { StateCreator } from "zustand";
import type { CombatEncounter, Combatant, CombatLogEntry, LiveSessionState } from "@/types";
import { generateId, clampHP, createLogEntry, defaultConditions } from "./combat-helpers";

export interface CombatSlice {
  activeEncounter: CombatEncounter | null;
  combatLog: CombatLogEntry[];
  liveSession: LiveSessionState;

  createEncounter: (name: string) => string;
  createEncounterWithCombatants: (name: string, combatants: Combatant[]) => string;
  setEncounter: (encounter: CombatEncounter) => void;
  addCombatant: (combatant: Combatant) => void;
  updateCombatant: (combatantId: string, updates: Partial<Combatant>) => void;
  removeCombatant: (combatantId: string) => void;
  reorderCombatants: (combatantIds: string[]) => void;
  clearEncounter: () => void;
  clearLog: () => void;
}

const defaultSession: LiveSessionState = {
  activeEncounterId: null,
  phase: "exploration",
  sessionStartedAt: null,
  lastShortRestAt: null,
  lastLongRestAt: null,
  conditions: { ...defaultConditions },
};

export const createCombatSlice: StateCreator<CombatSlice> = (set) => ({
  activeEncounter: null,
  combatLog: [],
  liveSession: { ...defaultSession },

  createEncounter: (name: string): string => {
    const id = generateId();
    const encounter: CombatEncounter = {
      id,
      name,
      combatants: [],
      round: 0,
      currentCombatantIndex: 0,
      turnStartedAt: null,
      phase: "prep",
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      isPaused: false,
    };
    set({ activeEncounter: encounter });
    return id;
  },

  createEncounterWithCombatants: (name: string, combatants: Combatant[]): string => {
    const id = generateId();
    const encounter: CombatEncounter = {
      id,
      name,
      combatants: combatants.sort((a, b) => b.initiative - a.initiative),
      round: 0,
      currentCombatantIndex: 0,
      turnStartedAt: null,
      phase: "prep",
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      isPaused: false,
    };
    set({ activeEncounter: encounter });
    return id;
  },

  setEncounter: (encounter: CombatEncounter) => set({ activeEncounter: encounter }),

  addCombatant: (combatant: Combatant) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: [...state.activeEncounter.combatants, combatant].sort(
            (a, b) => b.initiative - a.initiative
          ),
        },
      };
    }),

  updateCombatant: (combatantId: string, updates: Partial<Combatant>) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: state.activeEncounter.combatants.map((c) =>
            c.id === combatantId ? { ...c, ...updates } : c
          ),
        },
      };
    }),

  removeCombatant: (combatantId: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: state.activeEncounter.combatants.filter((c) => c.id !== combatantId),
        },
      };
    }),

  reorderCombatants: (combatantIds: string[]) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const combatantMap = new Map(state.activeEncounter.combatants.map((c) => [c.id, c]));
      const reordered = combatantIds.map((id) => combatantMap.get(id)).filter((c): c is Combatant => !!c);
      return { activeEncounter: { ...state.activeEncounter, combatants: reordered } };
    }),

  clearEncounter: () => set({ activeEncounter: null, combatLog: [] }),
  clearLog: () => set({ combatLog: [] }),
});
