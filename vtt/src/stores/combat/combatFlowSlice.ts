import type { StateCreator } from "zustand";
import type { CombatLogEntry, Combatant } from "@/types";
import type { CombatSlice } from "./combatSlice";
import { generateId, createLogEntry } from "./combat-helpers";

export interface CombatFlowSlice {
  startCombat: () => void;
  nextTurn: () => void;
  prevTurn: () => void;
  endCombat: () => void;
  pauseCombat: () => void;
  resumeCombat: () => void;
}

export const createCombatFlowSlice: StateCreator<CombatSlice & CombatFlowSlice, [], [], CombatFlowSlice> = 
  (set, get) => ({
  startCombat: () =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const sorted = [...state.activeEncounter.combatants].sort((a, b) => b.initiative - a.initiative);
      const logEntry = createLogEntry("round_start", "system", "⚔ Combat", { description: "Combat begins!" });
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: sorted,
          round: 1,
          currentCombatantIndex: 0,
          phase: "active",
          startedAt: Date.now(),
          turnStartedAt: Date.now(),
          isPaused: false,
        },
        combatLog: [...state.combatLog, logEntry],
      };
    }),

  nextTurn: () =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const { combatants, currentCombatantIndex } = state.activeEncounter;
      const nextIndex = (currentCombatantIndex + 1) % combatants.length;
      const newRound = nextIndex === 0 ? state.activeEncounter.round + 1 : state.activeEncounter.round;

      const entries: CombatLogEntry[] = [];
      if (nextIndex === 0) {
        entries.push(createLogEntry("round_start", "system", `📜 Round ${newRound}`, { description: `Round ${newRound} begins!` }));
      }

      return {
        activeEncounter: {
          ...state.activeEncounter,
          round: newRound,
          currentCombatantIndex: nextIndex,
          turnStartedAt: Date.now(),
        },
        combatLog: [...state.combatLog, ...entries],
      };
    }),

  prevTurn: () =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const { combatants, currentCombatantIndex } = state.activeEncounter;
      const prevIndex = currentCombatantIndex === 0 ? combatants.length - 1 : currentCombatantIndex - 1;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          currentCombatantIndex: prevIndex,
          turnStartedAt: Date.now(),
        },
      };
    }),

  endCombat: () =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return {
        activeEncounter: { ...state.activeEncounter, phase: "completed", completedAt: Date.now(), isPaused: false },
      };
    }),

  pauseCombat: () =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return { activeEncounter: { ...state.activeEncounter, isPaused: true } };
    }),

  resumeCombat: () =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return { activeEncounter: { ...state.activeEncounter, isPaused: false, turnStartedAt: Date.now() } };
    }),
});
