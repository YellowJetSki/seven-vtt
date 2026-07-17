/* ── Combat Log Slice ──────────────────────────────────────────
 * Add notes, clear log, undo last action.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { CombatStoreState } from "./types";
import { logUid } from "./types";
import type { CombatLogEntry } from "@/types/combat";
import { getSyncPlayerHp } from "../combatStore";

export const createCombatLogSlice: StateCreator<
  CombatStoreState,
  [],
  [],
  Pick<CombatStoreState, "addNote" | "clearLog" | "undoLastAction">
> = (set, get) => ({
  addNote: (note) => {
    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: "note",
      actorId: "DM",
      actorName: "DM Note",
      description: note,
    };
    set({ combatLog: [logEntry, ...get().combatLog] });
  },

  clearLog: () => {
    set({ combatLog: [] });
  },

  undoLastAction: () => {
    const { combatLog, activeEncounter } = get();
    if (combatLog.length === 0 || !activeEncounter) return;

    const lastEntry = combatLog[0];
    if (!lastEntry || !lastEntry.targetId) return;

    const target = activeEncounter.combatants.find((c) => c.id === lastEntry.targetId);
    if (!target) return;

    let revertedCombatants = [...activeEncounter.combatants];

    if (lastEntry.type === "damage" || lastEntry.type === "death") {
      revertedCombatants = revertedCombatants.map((c) => {
        if (c.id !== lastEntry.targetId) return c;
        const healed = Math.min(c.hitPoints.max, c.hitPoints.current + (lastEntry.value ?? 0));
        return { ...c, hitPoints: { ...c.hitPoints, current: healed }, isDead: healed > 0 ? false : c.isDead };
      });
    } else if (lastEntry.type === "heal") {
      revertedCombatants = revertedCombatants.map((c) => {
        if (c.id !== lastEntry.targetId) return c;
        const damaged = Math.max(0, c.hitPoints.current - (lastEntry.value ?? 0));
        return { ...c, hitPoints: { ...c.hitPoints, current: damaged } };
      });
    }

    set({
      activeEncounter: { ...activeEncounter, combatants: revertedCombatants },
      combatLog: combatLog.slice(1),
    });

    const syncHp = getSyncPlayerHp();
    if (syncHp) syncHp(revertedCombatants);
  },
});
