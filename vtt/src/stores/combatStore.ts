/* ── Combat Store ──────────────────────────────────────────────
 * Manages combat encounters, combatants, turn flow, log, and live session.
 *
 * PERSISTED: Uses Zustand persist middleware (str-vtt-combat key).
 * HP SYNC: Auto-syncs player HP back to campaignStore via registerHpSyncCallback.
 *
 * Architecture: Each domain (encounters, combatants, flow, log, live session)
 * is defined in its own slice file under stores/combat/ for clarity.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CombatEncounter, Combatant, CombatLogEntry, LiveSessionState } from "@/types/combat";
import { createCombatEncounterSlice } from "./combat/encounterSlice";
import { createCombatantSlice } from "./combat/combatantSlice";
import { createCombatFlowSlice } from "./combat/combatFlowSlice";
import { createCombatLogSlice } from "./combat/combatLogSlice";
import { createLiveSessionSlice } from "./combat/liveSessionSlice";
import type { CombatStoreState } from "./combat/types";

/* ── Lazy HP sync callback (avoids circular deps) ───────────── */

let _syncPlayerHp: ((combatants: Combatant[]) => void) | null = null;

export function registerHpSyncCallback(fn: (combatants: Combatant[]) => void) {
  _syncPlayerHp = fn;
}

export function getSyncPlayerHp(): ((combatants: Combatant[]) => void) | null {
  return _syncPlayerHp;
}

/* ── Build full store by composing slices ────────────────────── */

export const useCombatStore = create<CombatStoreState>()(
  persist(
    (...a) => ({
      ...createCombatEncounterSlice(...a),
      ...createCombatantSlice(...a),
      ...createCombatFlowSlice(...a),
      ...createCombatLogSlice(...a),
      ...createLiveSessionSlice(...a),
    }),
    {
      name: "str-vtt-combat",
      partialize: (state) => ({
        activeEncounter: state.activeEncounter,
        combatLog: state.combatLog,
        liveSession: state.liveSession,
      }),
    },
  ),
);
