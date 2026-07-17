/* ── Campaign Meta Slice ───────────────────────────────────────
 * Meta data + settings management.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { CampaignMeta } from "@/types/firestore";
import type { CampaignSettings } from "@/types";
import { buildCampaign } from "./normalization";

export const createMetaSlice: StateCreator<
  NormalizedCampaignState,
  [],
  [],
  Pick<NormalizedCampaignState, "setMeta" | "setLoading" | "setError" | "updateSettings">
> = (set) => ({
  setMeta: (meta) =>
    set((state) => {
      const newState = { ...state, meta, forcePushCounter: state.forcePushCounter + 1 };
      return { ...newState, campaign: buildCampaign(newState) };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  updateSettings: (updates) =>
    set((state) => {
      if (!state.meta) return state;
      const newState = {
        ...state,
        meta: {
          ...state.meta,
          settings: { ...state.meta.settings, ...updates },
        },
        forcePushCounter: state.forcePushCounter + 1,
      };
      return { ...newState, campaign: buildCampaign(newState) };
    }),
});
