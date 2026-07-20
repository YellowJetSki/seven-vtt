import type { StateCreator } from "zustand";
import type { CombatLogEntry, Combatant } from "@/types";
import type { CombatSlice } from "./combatSlice";
import { generateId, createLogEntry } from "./combat-helpers";

// ── Combat log overflow protection (shared with combatHpSlice) ──
const MAX_COMBAT_LOG = 500;
const COMBAT_LOG_CULL_COUNT = Math.floor(MAX_COMBAT_LOG * 0.2);

function trimCombatLog(log: CombatLogEntry[]): CombatLogEntry[] {
  if (log.length <= MAX_COMBAT_LOG) return log;
  return log.slice(COMBAT_LOG_CULL_COUNT);
}

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
        combatLog: trimCombatLog([...state.combatLog, logEntry]),
      };
    }),

  nextTurn: () =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const { combatants, currentCombatantIndex, round } = state.activeEncounter;

      // Edge case: empty combatant list
      if (combatants.length === 0) return state;

      // Find next LIVING combatant (skip dead ones per D&D 5e rules)
      let nextIndex = (currentCombatantIndex + 1) % combatants.length;
      let attempts = 0;
      const maxAttempts = combatants.length;

      while (combatants[nextIndex]?.isDead && attempts < maxAttempts) {
        nextIndex = (nextIndex + 1) % combatants.length;
        attempts++;
      }

      // ALL combatants are dead — end combat
      if (attempts >= maxAttempts) {
        return {
          activeEncounter: {
            ...state.activeEncounter,
            phase: "completed",
            completedAt: Date.now(),
            isPaused: false,
          },
          combatLog: trimCombatLog([
            ...state.combatLog,
            createLogEntry("round_start", "system", "💀 Combat Over", {
              description: "All combatants are defeated.",
            }),
          ]),
        };
      }

      const newRound = nextIndex === 0 ? (round || 1) + 1 : round || 1;

      const entries: CombatLogEntry[] = [];
      if (nextIndex === 0) {
        entries.push(
          createLogEntry("round_start", "system", `📜 Round ${newRound}`, {
            description: `Round ${newRound} begins!`,
          })
        );
      } else if (nextIndex !== currentCombatantIndex) {
        entries.push(
          createLogEntry("turn_change", combatants[nextIndex]?.id || "system", combatants[nextIndex]?.name || "Unknown", {
            description: `${combatants[nextIndex]?.name || "Unknown"}'s turn`,
          })
        );
      }

      return {
        activeEncounter: {
          ...state.activeEncounter,
          round: newRound,
          currentCombatantIndex: nextIndex,
          turnStartedAt: Date.now(),
        },
        combatLog: trimCombatLog([...state.combatLog, ...entries]),
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
