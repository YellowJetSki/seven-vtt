/* ── Campaign Token Slice ──────────────────────────────────────
 * Map token CRUD operations.
 * Uses cached campaign builder to prevent infinite re-render loops.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { MapToken } from "@/types";
import type { MapTokenDoc } from "@/types/firestore";
import { buildCampaignCached } from "./campaignBuilder";

export const createTokenSlice: StateCreator<
  NormalizedCampaignState,
  [],
  [],
  Pick<NormalizedCampaignState, "setMapTokens" | "addToken" | "updateToken" | "removeToken">
> = (set) => ({
  setMapTokens: (mapId, tokens) =>
    set((state) => ({
      mapTokens: { ...state.mapTokens, [mapId]: tokens as unknown as MapToken[] },
    })),

  addToken: (mapId, token) =>
    set((state) => {
      const tokens = state.mapTokens[mapId] ?? [];
      const newState = {
        ...state,
        mapTokens: { ...state.mapTokens, [mapId]: [...tokens, token] },
        forcePushCounter: state.forcePushCounter + 1,
      };
      const { campaign, hash } = buildCampaignCached(newState, state.campaignBuildHash);
      return campaign ? { ...newState, campaign, campaignBuildHash: hash } : newState;
    }),

  updateToken: (mapId, tokenId, updates) =>
    set((state) => {
      const tokens = (state.mapTokens[mapId] ?? []).map((t) =>
        t.id === tokenId ? { ...t, ...updates } : t,
      );
      const newState = {
        ...state,
        mapTokens: { ...state.mapTokens, [mapId]: tokens },
        forcePushCounter: state.forcePushCounter + 1,
      };
      const { campaign, hash } = buildCampaignCached(newState, state.campaignBuildHash);
      return campaign ? { ...newState, campaign, campaignBuildHash: hash } : newState;
    }),

  removeToken: (mapId, tokenId) =>
    set((state) => {
      const tokens = (state.mapTokens[mapId] ?? []).filter((t) => t.id !== tokenId);
      const newState = {
        ...state,
        mapTokens: { ...state.mapTokens, [mapId]: tokens },
        forcePushCounter: state.forcePushCounter + 1,
      };
      const { campaign, hash } = buildCampaignCached(newState, state.campaignBuildHash);
      return campaign ? { ...newState, campaign, campaignBuildHash: hash } : newState;
    }),
});
