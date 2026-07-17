/* ── Campaign Entity Slice ─────────────────────────────────────
 * CRUD for enemies, encounters, battle maps, and journal entries.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { Encounter, BattleMap, JournalEntry } from "@/types";
import type { EnemyDoc } from "@/types/firestore";
import { buildCampaign } from "./normalization";

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
      enemies: [...state.enemies, enemy],
      forcePushCounter: state.forcePushCounter + 1,
    })),

  updateEnemy: (id, updates) =>
    set((state) => ({
      enemies: state.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  removeEnemy: (id) =>
    set((state) => ({
      enemies: state.enemies.filter((e) => e.id !== id),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  // ── Encounters ──
  addEncounter: (encounter) =>
    set((state) => {
      const newState = {
        ...state,
        encounters: [...state.encounters, encounter],
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, encounterCount: state.encounters.length + 1 },
        };
      }
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  updateEncounter: (id, updates) =>
    set((state) => {
      const newState = {
        ...state,
        encounters: state.encounters.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        forcePushCounter: state.forcePushCounter + 1,
      };
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  removeEncounter: (id) =>
    set((state) => {
      const newState = {
        ...state,
        encounters: state.encounters.filter((e) => e.id !== id),
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, encounterCount: Math.max(0, state.encounters.length - 1) },
        };
      }
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  // ── Battle Maps ──
  addBattleMap: (map) =>
    set((state) => {
      const newState = {
        ...state,
        battleMaps: [...state.battleMaps, map],
        mapTokens: { ...state.mapTokens, [map.id]: map.tokens ?? [] },
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, mapCount: state.battleMaps.length + 1 },
        };
      }
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  updateBattleMap: (id, updates) =>
    set((state) => {
      const newState = {
        ...state,
        battleMaps: state.battleMaps.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        forcePushCounter: state.forcePushCounter + 1,
      };
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  removeBattleMap: (id) =>
    set((state) => {
      const { [id]: _, ...restTokens } = state.mapTokens;
      const newState = {
        ...state,
        battleMaps: state.battleMaps.filter((m) => m.id !== id),
        mapTokens: restTokens,
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, mapCount: Math.max(0, state.battleMaps.length - 1) },
        };
      }
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  // ── Journal ──
  addJournalEntry: (entry) =>
    set((state) => {
      const newState = {
        ...state,
        journal: [...state.journal, entry],
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, journalCount: state.journal.length + 1 },
        };
      }
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  updateJournalEntry: (id, updates) =>
    set((state) => {
      const newState = {
        ...state,
        journal: state.journal.map((j) => (j.id === id ? { ...j, ...updates } : j)),
        forcePushCounter: state.forcePushCounter + 1,
      };
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  removeJournalEntry: (id) =>
    set((state) => {
      const newState = {
        ...state,
        journal: state.journal.filter((j) => j.id !== id),
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, journalCount: Math.max(0, state.journal.length - 1) },
        };
      }
      return { ...newState, campaign: buildCampaign(newState) };
    }),
});
