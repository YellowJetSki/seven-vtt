/* ── Campaign Character Slice ──────────────────────────────────
 * Character CRUD operations with meta stats updates.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { PlayerCharacter } from "@/types";
import { buildCampaignCached } from "./campaignBuilder";

export const createCharacterSlice: StateCreator<
  NormalizedCampaignState,
  [],
  [],
  Pick<NormalizedCampaignState, "addCharacter" | "updateCharacter" | "removeCharacter" | "updatePlayerCharacter">
> = (set, get) => ({
  addCharacter: (character) =>
    set((state) => {
      const newState = {
        ...state,
        characters: [...state.characters, character],
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, characterCount: state.characters.length + 1 },
        };
      }
      const { campaign, hash } = buildCampaignCached(newState, state.campaignBuildHash);
      return campaign ? { ...newState, campaign, campaignBuildHash: hash } : newState;
    }),

  updateCharacter: (id, updates) =>
    set((state) => {
      const newState = {
        ...state,
        characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        forcePushCounter: state.forcePushCounter + 1,
      };
      const { campaign, hash } = buildCampaignCached(newState, state.campaignBuildHash);
      return campaign ? { ...newState, campaign, campaignBuildHash: hash } : newState;
    }),

  updatePlayerCharacter: (id, updates) => get().updateCharacter(id, updates),

  removeCharacter: (id) =>
    set((state) => {
      const newState = {
        ...state,
        characters: state.characters.filter((c) => c.id !== id),
        forcePushCounter: state.forcePushCounter + 1,
      };
      if (state.meta) {
        newState.meta = {
          ...state.meta,
          stats: { ...state.meta.stats, characterCount: Math.max(0, state.characters.length - 1) },
        };
      }
      const { campaign, hash } = buildCampaignCached(newState, state.campaignBuildHash);
      return campaign ? { ...newState, campaign, campaignBuildHash: hash } : newState;
    }),
});
