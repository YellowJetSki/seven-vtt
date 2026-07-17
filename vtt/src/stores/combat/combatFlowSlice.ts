/* ── Combat Flow Slice ─────────────────────────────────────────
 * Start, next/previous turn, end, pause.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { CombatStoreState } from "./types";
import { logUid } from "./types";
import type { CombatLogEntry } from "@/types/combat";

export const createCombatFlowSlice: StateCreator<
  CombatStoreState,
  [],
  [],
  Pick<CombatStoreState, "startEncounter" | "nextTurn" | "previousTurn" | "endEncounter" | "togglePause">
> = (set, get) => ({
  startEncounter: () => {
    const encounter = get().activeEncounter;
    if (!encounter || encounter.phase !== "prep") return;

    const now = Date.now();
    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: now,
      type: "round_start",
      actorId: "system",
      actorName: "⚔️ Combat",
      description: "Combat begins!",
    };

    const sorted = [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);

    set({
      activeEncounter: {
        ...encounter,
        combatants: sorted,
        phase: "active",
        round: 1,
        currentCombatantIndex: 0,
        startedAt: now,
        turnStartedAt: now,
        isPaused: false,
      },
      combatLog: [logEntry, ...get().combatLog],
    });
  },

  nextTurn: () => {
    const encounter = get().activeEncounter;
    if (!encounter || encounter.phase !== "active") return;

    const { currentCombatantIndex, combatants, round } = encounter;
    const nextIndex = currentCombatantIndex + 1;

    if (nextIndex >= combatants.length) {
      const newRound = round + 1;
      const logEntry: CombatLogEntry = {
        id: logUid(),
        timestamp: Date.now(),
        type: "round_start",
        actorId: "system",
        actorName: "⏱ Round",
        description: `Round ${newRound}`,
      };
      set({
        activeEncounter: {
          ...encounter,
          round: newRound,
          currentCombatantIndex: 0,
          turnStartedAt: Date.now(),
        },
        combatLog: [logEntry, ...get().combatLog],
      });
    } else {
      set({
        activeEncounter: {
          ...encounter,
          currentCombatantIndex: nextIndex,
          turnStartedAt: Date.now(),
        },
      });
    }
  },

  previousTurn: () => {
    const encounter = get().activeEncounter;
    if (!encounter || encounter.phase !== "active") return;
    const prevIndex = Math.max(0, encounter.currentCombatantIndex - 1);
    set({
      activeEncounter: {
        ...encounter,
        currentCombatantIndex: prevIndex,
        turnStartedAt: Date.now(),
      },
    });
  },

  endEncounter: () => {
    const encounter = get().activeEncounter;
    if (!encounter || encounter.phase !== "active") return;
    set({
      activeEncounter: {
        ...encounter,
        phase: "completed",
        completedAt: Date.now(),
        turnStartedAt: null,
      },
    });
  },

  togglePause: () => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: { ...encounter, isPaused: !encounter.isPaused },
    });
  },
});
