import type { EnemyDoc, Encounter, BattleMap, MapToken, JournalEntry } from "@/types";

export interface CampaignEntityState {
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
  mapTokens: Record<string, MapToken[]>;
}

export interface CampaignEntityActions {
  setEnemies: (enemies: EnemyDoc[]) => void;
  setEncounters: (encounters: Encounter[]) => void;
  addEncounter: (encounter: Encounter) => void;
  setBattleMaps: (maps: BattleMap[]) => void;
  addBattleMap: (map: BattleMap) => void;
  removeBattleMap: (mapId: string) => void;
  setMapTokens: (mapId: string, tokens: MapToken[]) => void;
  addMapToken: (mapId: string, token: MapToken) => void;
  updateMapToken: (mapId: string, tokenId: string, updates: Partial<MapToken>) => void;
  removeMapToken: (mapId: string, tokenId: string) => void;
  setJournal: (entries: JournalEntry[]) => void;
  addJournalEntry: (entry: JournalEntry) => void;
}

export type CampaignEntitySlice = CampaignEntityState & CampaignEntityActions;

type SetPartial = (partial: Partial<CampaignEntitySlice>) => void;
type GetState = () => CampaignEntitySlice;

export function createEntitySlice(set: SetPartial, get?: GetState): CampaignEntitySlice {
  const state = {
    enemies: [] as EnemyDoc[],
    encounters: [] as Encounter[],
    battleMaps: [] as BattleMap[],
    journal: [] as JournalEntry[],
    mapTokens: {} as Record<string, MapToken[]>,
  };

  const g = () => (get ? get() : state);

  return {
    ...state,

    setEnemies: (enemies) => set({ enemies }),
    setEncounters: (encounters) => set({ encounters }),

    addEncounter: (encounter) =>
      set({ encounters: [...g().encounters, encounter] }),

    setBattleMaps: (maps) => set({ battleMaps: maps }),

    addBattleMap: (map) =>
      set({ battleMaps: [...g().battleMaps, map] }),

    removeBattleMap: (mapId) =>
      set({
        battleMaps: g().battleMaps.filter((m) => m.id !== mapId),
        mapTokens: { ...g().mapTokens, [mapId]: [] },
      }),

    setMapTokens: (mapId, tokens) =>
      set({ mapTokens: { ...g().mapTokens, [mapId]: tokens } }),

    addMapToken: (mapId, token) => {
      const existing = g().mapTokens[mapId] ?? [];
      set({ mapTokens: { ...g().mapTokens, [mapId]: [...existing, token] } });
    },

    updateMapToken: (mapId, tokenId, updates) => {
      const tokens = g().mapTokens[mapId] ?? [];
      set({
        mapTokens: {
          ...g().mapTokens,
          [mapId]: tokens.map((t) => (t.id === tokenId ? { ...t, ...updates } : t)),
        },
      });
    },

    removeMapToken: (mapId, tokenId) => {
      const tokens = g().mapTokens[mapId] ?? [];
      set({
        mapTokens: {
          ...g().mapTokens,
          [mapId]: tokens.filter((t) => t.id !== tokenId),
        },
      });
    },

    setJournal: (entries) => set({ journal: entries }),

    addJournalEntry: (entry) =>
      set({ journal: [...g().journal, entry] }),
  };
}
