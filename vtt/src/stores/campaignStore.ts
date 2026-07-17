/* ── Campaign Global Store (Normalized) ────────────────────────
 *
 * Normalized cache of all campaign data using Zustand persist.
 * Uses slice pattern — each domain (meta, characters, entities, tokens) is
 * managed by its own slice file under stores/campaign/.
 *
 * BACKWARD COMPATIBILITY: The `campaign` getter reconstructs the legacy
 * monolithic shape from normalized arrays.
 *
 * PERSISTENCE: Zustand persist (key: vtt-campaign-store, v2).
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Campaign, PlayerCharacter } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { createMetaSlice } from "./campaign/metaSlice";
import { createCharacterSlice } from "./campaign/characterSlice";
import { createEntitySlice } from "./campaign/entitySlice";
import { createTokenSlice } from "./campaign/tokenSlice";
import { normalizeCharacters, buildCampaign } from "./campaign/normalization";
import type { NormalizedCampaignState } from "./campaign/types";

const initialState: Omit<NormalizedCampaignState,
  | "setMeta" | "setLoading" | "setError"
  | "setCampaign" | "hydrateFromLegacy" | "clear" | "clearCampaign"
  | "setMapTokens"
  | "addCharacter" | "updateCharacter" | "removeCharacter" | "updatePlayerCharacter"
  | "addEnemy" | "updateEnemy" | "removeEnemy"
  | "addEncounter" | "updateEncounter" | "removeEncounter"
  | "addBattleMap" | "updateBattleMap" | "removeBattleMap"
  | "addJournalEntry" | "updateJournalEntry" | "removeJournalEntry"
  | "updateSettings"
  | "addToken" | "updateToken" | "removeToken"
  | "normalizeCharacters"
> = {
  meta: null,
  characters: [],
  enemies: [],
  encounters: [],
  battleMaps: [],
  journal: [],
  mapTokens: {},
  isLoading: false,
  error: null,
  forcePushCounter: 0,
  campaign: null,
};

export const useCampaignStore = create<NormalizedCampaignState>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...createMetaSlice(set, get),
      ...createCharacterSlice(set, get),
      ...createEntitySlice(set, get),
      ...createTokenSlice(set, get),

      // Normalization
      normalizeCharacters,

      // Bulk operations
      setCampaign: (campaign) => {
        const normalizedPCs = normalizeCharacters(campaign.playerCharacters);
        const authStore = useAuthStore.getState();
        if (authStore.setPlayerIdentifiers && normalizedPCs.length > 0) {
          authStore.setPlayerIdentifiers(
            normalizedPCs.map((pc) => ({ label: pc.name, characterId: pc.id })),
          );
        }
        const newState = {
          meta: {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            dmName: campaign.dmName,
            settings: campaign.settings ?? {
              homebrewRules: [],
              experienceSystem: "xp" as const,
              currencyName: "Gold",
              privateDmNotes: "",
            },
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
            stats: {
              characterCount: normalizedPCs.length,
              enemyCount: campaign.encounters.reduce(
                (sum, e) => sum + e.enemies.reduce((s, ee) => s + (ee.count || 1), 0), 0,
              ),
              encounterCount: campaign.encounters.length,
              mapCount: campaign.battleMaps.length,
              journalCount: campaign.journal.length,
              sessionCount: 0,
            },
          },
          characters: normalizedPCs,
          enemies: [],
          encounters: campaign.encounters,
          battleMaps: campaign.battleMaps.map((bm) => ({ ...bm, fogOfWar: bm.fogOfWar ?? [] })),
          mapTokens: Object.fromEntries(
            campaign.battleMaps.map((bm) => [bm.id, bm.tokens ?? []]),
          ),
          journal: campaign.journal,
          forcePushCounter: Date.now(),
        } as const;

        set({
          meta: newState.meta,
          characters: newState.characters,
          enemies: newState.enemies,
          encounters: newState.encounters,
          battleMaps: newState.battleMaps,
          mapTokens: newState.mapTokens,
          journal: newState.journal,
          forcePushCounter: newState.forcePushCounter,
          campaign: buildCampaign({
            meta: newState.meta,
            characters: newState.characters,
            encounters: newState.encounters,
            battleMaps: newState.battleMaps,
            mapTokens: newState.mapTokens,
            journal: newState.journal,
          }),
        });
      },

      hydrateFromLegacy: (campaign) => {
        get().setCampaign(campaign);
      },

      clear: () => set({ ...initialState }),
      clearCampaign: () => set({ ...initialState }),
    }),
    {
      name: "vtt-campaign-store",
      version: 2,
      partialize: (state) => ({
        meta: state.meta,
        characters: state.characters,
        enemies: state.enemies,
        encounters: state.encounters,
        battleMaps: state.battleMaps,
        journal: state.journal,
        mapTokens: state.mapTokens,
      }),
      migrate: (persisted: unknown, version: number) => {
        if (version < 2 && persisted && typeof persisted === 'object' && 'characters' in (persisted as Record<string, unknown>)) {
          const p = persisted as { characters: PlayerCharacter[] };
          p.characters = normalizeCharacters(p.characters);
        }
        return (persisted ?? {}) as NormalizedCampaignState;
      },
    },
  ),
);
