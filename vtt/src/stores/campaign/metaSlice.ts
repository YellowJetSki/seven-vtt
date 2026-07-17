/* ── Campaign Meta Slice ───────────────────────────────────────
 * Meta data + settings management.
 * NOTE: No longer builds `campaign` derived object on every update —
 * consumers must use individual normalized selectors (s.characters,
 * s.encounters, etc.) to prevent infinite re-render loops.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { NormalizedCampaignState } from "./types";
import type { CampaignMeta } from "@/types/firestore";
import type { CampaignSettings } from "@/types";

export const createMetaSlice: StateCreator<
  NormalizedCampaignState,
  [],
  [],
  Pick<NormalizedCampaignState, "setMeta" | "setLoading" | "setError" | "updateSettings">
> = (set) => ({
  setMeta: (meta) =>
    set((state) => ({
      ...state,
      meta,
      forcePushCounter: state.forcePushCounter + 1,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  updateSettings: (updates) =>
    set((state) => {
      if (!state.meta) return state;
      return {
        ...state,
        meta: {
          ...state.meta,
          settings: { ...state.meta.settings, ...updates },
        },
        forcePushCounter: state.forcePushCounter + 1,
      };
    }),
});
