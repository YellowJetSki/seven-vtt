/**
 * STᚱ VTT — Combat Store (Firestore-Driven, No localStorage Persist)
 *
 * Combat state is now FLUSH every page load — fully driven by Firestore
 * via useFirestoreCombatSync(). localStorage persistence was removed
 * because it caused race conditions where stale Zustand state would
 * overwrite Firestore-synced combat data on page reload.
 *
 * Architecture:
 *   Firestore ──(onSnapshot)──► useFirestoreCombatSync ──(setEncounter)──► combatStore (volatile)
 *   UI mutations ──► useCombatMutations ──(setDoc)──► Firestore ◄──(onSnapshot)──► other tabs
 *
 * The session timer is also volatile — it resets on page reload, which
 * is intentional for live-play continuity.
 */

import { create } from "zustand";
import { createCombatSlice, type CombatSlice } from "./combat/combatSlice";
import { createCombatFlowSlice, type CombatFlowSlice } from "./combat/combatFlowSlice";
import { createCombatHpSlice, type CombatHpSlice } from "./combat/combatHpSlice";
import { createCombatSessionSlice, type CombatSessionSlice } from "./combat/combatSessionSlice";

export type CombatStore = CombatSlice & CombatFlowSlice & CombatHpSlice & CombatSessionSlice;

export const useCombatStore = create<CombatStore>()((...args) => ({
  ...createCombatSlice(...args),
  ...createCombatFlowSlice(...args),
  ...createCombatHpSlice(...args),
  ...createCombatSessionSlice(...args),
}));
