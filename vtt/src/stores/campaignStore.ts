import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createMetaSlice, type CampaignMetaSlice } from "./campaign/metaSlice";
import { createCharacterSlice, type CampaignCharacterSlice } from "./campaign/characterSlice";
import { createEntitySlice, type CampaignEntitySlice } from "./campaign/entitySlice";

export type CampaignStore = CampaignMetaSlice & CampaignCharacterSlice & CampaignEntitySlice & {
  setCampaignFromFull: (data: {
    meta: CampaignMetaSlice["meta"];
    characters: CampaignCharacterSlice["characters"];
    enemies: CampaignEntitySlice["enemies"];
    encounters: CampaignEntitySlice["encounters"];
    battleMaps: CampaignEntitySlice["battleMaps"];
    journal: CampaignEntitySlice["journal"];
  }) => void;
  incrementSessionCount: () => void;
};

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => {
      const sliceSet = (partial: Partial<CampaignStore>) => set(partial);

      return {
        ...createMetaSlice(sliceSet),
        ...createCharacterSlice(sliceSet, get as () => CampaignCharacterSlice),
        ...createEntitySlice(sliceSet, get as () => CampaignEntitySlice),

        setCampaignFromFull: (data) => {
          set({
            meta: data.meta,
            characters: data.characters,
            enemies: data.enemies,
            encounters: data.encounters,
            battleMaps: data.battleMaps,
            journal: data.journal,
          } as Partial<CampaignStore>);
        },

        incrementSessionCount: () => {
          const current = get()?.meta;
          if (!current) return;
          set({
            meta: {
              ...current,
              stats: {
                ...current.stats,
                sessionCount: (current.stats?.sessionCount || 0) + 1,
              },
              updatedAt: Date.now(),
            },
          });
        },
      };
    },
    {
      name: "str-vtt-campaign-normalized",
      partialize: (state) => ({
        meta: state.meta,
        characters: state.characters,
        enemies: state.enemies,
        encounters: state.encounters,
        battleMaps: state.battleMaps,
        journal: state.journal,
        mapTokens: state.mapTokens,
        campaign: state.campaign,
        forcePushCounter: state.forcePushCounter,
      }),
    }
  )
);
