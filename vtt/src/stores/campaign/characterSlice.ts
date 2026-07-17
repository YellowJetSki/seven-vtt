/* ── Campaign Character Slice ──────────────────────────────────
 * Character CRUD operations with meta stats updates.
 * NOTE: No longer builds `campaign` derived object — consumers use
 * individual normalized selectors.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { PlayerCharacter } from "@/types";

export const createCharacterSlice: StateCreator<
  NormalizedCampaignState,
  [],
  [],
  Pick<NormalizedCampaignState, "addCharacter" | "updateCharacter" | "removeCharacter" | "updatePlayerCharacter">
> = (set, get) => ({
  addCharacter: (character) =>
    set((state) => {
      const newMeta = state.meta ? {
        ...state.meta,
        stats: { ...state.meta.stats, characterCount: state.characters.length + 1 },
      } : state.meta;
      return {
        ...state,
        characters: [...state.characters, character],
        meta: newMeta,
        forcePushCounter: state.forcePushCounter + 1,
      };
    }),

  updateCharacter: (id, updates) =>
    set((state) => ({
      ...state,
      characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      forcePushCounter: state.forcePushCounter + 1,
    })),

  updatePlayerCharacter: (id, updates) => get().updateCharacter(id, updates),

  removeCharacter: (id) =>
    set((state) => {
      const newMeta = state.meta ? {
        ...state.meta,
        stats: { ...state.meta.stats, characterCount: Math.max(0, state.characters.length - 1) },
      } : state.meta;
      return {
        ...state,
        characters: state.characters.filter((c) => c.id !== id),
        meta: newMeta,
        forcePushCounter: state.forcePushCounter + 1,
      };
    }),
});
