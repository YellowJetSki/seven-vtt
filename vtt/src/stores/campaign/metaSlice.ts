import type { CampaignMeta } from "@/types";
import { buildCampaign, type BuildableCampaign } from "./campaignHelpers";

export interface CampaignMetaState {
  meta: CampaignMeta | null;
  campaign: BuildableCampaign | null;
  forcePushCounter: number;
  isLoading: boolean;
  error: string | null;
}

export interface CampaignMetaActions {
  setMeta: (meta: CampaignMeta) => void;
  clearCampaign: () => void;
  setForcePushCounter: (counter: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const initial: CampaignMetaState = {
  meta: null,
  campaign: null,
  forcePushCounter: 0,
  isLoading: false,
  error: null,
};

export type CampaignMetaSlice = CampaignMetaState & CampaignMetaActions;

export function createMetaSlice(set: (partial: Partial<CampaignMetaSlice>) => void, get?: () => CampaignMetaSlice): CampaignMetaSlice {
  return {
    ...initial,

    setMeta: (meta: CampaignMeta) => {
      // We can't derive campaign here easily without other slices,
      // so just set meta and let the derived campaign be recomputed elsewhere
      set({ meta });
    },

    clearCampaign: () => set({ ...initial }),

    setForcePushCounter: (counter: number) => set({ forcePushCounter: counter }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
  };
}
