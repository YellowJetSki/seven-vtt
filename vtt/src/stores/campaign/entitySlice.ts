/* ── Campaign Entity Slice ─────────────────────────────────────
 * CRUD for enemies, encounters, battle maps, and journal entries.
 * No longer builds `campaign` derived object — prevents infinite re-renders.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { Encounter, BattleMap, JournalEntry } from "@/types";
import type { EnemyDoc } from "@/types/firestore";

export const createEntitySlice: StateCreator<
  NormalizedCampaignState,
  [],
  [],
  Pick<NormalizedCampaignState,
    | "addEnemy" | "updateEnemy" | "removeEnemy"
    | "addEncounter" | "updateEncounter" | "removeEncounter"
    | "addBattleMap" | "updateBattleMap" | "removeBattleMap"
    | "addJournalEntry" | "updateJournalEntry" | "removeJournalEntry"
  >
> = (set) => ({
  // ── Enemies ──
  addEnemy: (enemy) =>
    set((state) => ({
      ...state,
      enemies: [...state.enemies, enemy],
      forcePushCounter: state.forcePushCounter + 1,
    })),

  updateEnemy: (id, updates) =>
    set((state) => ({
      ...state,
      enemies: state.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  removeEnemy: (id) =>
    set((state) => ({
      ...state,
      enemies: state.enemies.filter((e) => e.id !== id),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  // ── Encounters ──
  addEncounter: (encounter) =>
    set((state) => ({
      ...state,
      encounters: [...state.encounters, encounter],
      ...(state.meta ? { meta: { ...state.meta, stats: { ...state.meta.stats, encounterCount: state.encounters.length + 1 } } } : {}),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  updateEncounter: (id, updates) =>
    set((state) => ({
      ...state,
      encounters: state.encounters.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  removeEncounter: (id) =>
    set((state) => ({
      ...state,
      encounters: state.encounters.filter((e) => e.id !== id),
      ...(state.meta ? { meta: { ...state.meta, stats: { ...state.meta.stats, encounterCount: Math.max(0, state.encounters.length - 1) } } } : {}),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  // ── Battle Maps ──
  addBattleMap: (map) =>
    set((state) => ({
      ...state,
      battleMaps: [...state.battleMaps, map],
      mapTokens: { ...state.mapTokens, [map.id]: map.tokens ?? [] },
      ...(state.meta ? { meta: { ...state.meta, stats: { ...state.meta.stats, mapCount: state.battleMaps.length + 1 } } } : {}),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  updateBattleMap: (id, updates) =>
    set((state) => ({
      ...state,
      battleMaps: state.battleMaps.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  removeBattleMap: (id) =>
    set((state) => {
      const { [id]: _, ...restTokens } = state.mapTokens;
      return {
        ...state,
        battleMaps: state.battleMaps.filter((m) => m.id !== id),
        mapTokens: restTokens,
        ...(state.meta ? { meta: { ...state.meta, stats: { ...state.meta.stats, mapCount: Math.max(0, state.battleMaps.length - 1) } } } : {}),
        forcePushCounter: state.forcePushCounter + 1,
      };
    }),

  // ── Journal ──
  addJournalEntry: (entry) =>
    set((state) => ({
      ...state,
      journal: [...state.journal, entry],
      ...(state.meta ? { meta: { ...state.meta, stats: { ...state.meta.stats, journalCount: state.journal.length + 1 } } } : {}),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  updateJournalEntry: (id, updates) =>
    set((state) => ({
      ...state,
      journal: state.journal.map((j) => (j.id === id ? { ...j, ...updates } : j)),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  removeJournalEntry: (id) =>
    set((state) => ({
      ...state,
      journal: state.journal.filter((j) => j.id !== id),
      ...(state.meta ? { meta: { ...state.meta, stats: { ...state.meta.stats, journalCount: Math.max(0, state.journal.length - 1) } } } : {}),
      forcePushCounter: state.forcePushCounter + 1,
    })),
});
