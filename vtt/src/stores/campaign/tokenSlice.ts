/* ── Campaign Token Slice ──────────────────────────────────────
 * Map token CRUD operations.
 * No longer builds `campaign` derived object — prevents infinite re-renders.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { MapToken } from "@/types";
import type { MapTokenDoc } from "@/types/firestore";

export const createTokenSlice: StateCreator<
  NormalizedCampaignState,
  [],
  [],
  Pick<NormalizedCampaignState, "setMapTokens" | "addToken" | "updateToken" | "removeToken">
> = (set) => ({
  setMapTokens: (mapId, tokens) =>
    set((state) => ({
      ...state,
      mapTokens: { ...state.mapTokens, [mapId]: tokens as unknown as MapToken[] },
    })),

  addToken: (mapId, token) =>
    set((state) => {
      const tokens = state.mapTokens[mapId] ?? [];
      return {
        ...state,
        mapTokens: { ...state.mapTokens, [mapId]: [...tokens, token] },
        forcePushCounter: state.forcePushCounter + 1,
      };
    }),

  updateToken: (mapId, tokenId, updates) =>
    set((state) => {
      const tokens = (state.mapTokens[mapId] ?? []).map((t) =>
        t.id === tokenId ? { ...t, ...updates } : t,
      );
      return {
        ...state,
        mapTokens: { ...state.mapTokens, [mapId]: tokens },
        forcePushCounter: state.forcePushCounter + 1,
      };
    }),

  removeToken: (mapId, tokenId) =>
    set((state) => {
      const tokens = (state.mapTokens[mapId] ?? []).filter((t) => t.id !== tokenId);
      return {
        ...state,
        mapTokens: { ...state.mapTokens, [mapId]: tokens },
        forcePushCounter: state.forcePushCounter + 1,
      };
    }),
});
