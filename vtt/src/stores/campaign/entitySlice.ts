import type { EnemyDoc, Encounter, BattleMap, MapToken, JournalEntry, AoETemplate } from "@/types";

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
  removeEncounter: (encounterId: string) => void;
  updateEncounter: (encounterId: string, updates: Partial<Encounter>) => void;
  setBattleMaps: (maps: BattleMap[]) => void;
  addBattleMap: (map: BattleMap) => void;
  removeBattleMap: (mapId: string) => void;
  addAoETemplate: (mapId: string, template: AoETemplate) => void;
  updateAoETemplate: (mapId: string, templateId: string, updates: Partial<AoETemplate>) => void;
  removeAoETemplate: (mapId: string, templateId: string) => void;
  setMapTokens: (mapId: string, tokens: MapToken[]) => void;
  addMapToken: (mapId: string, token: MapToken) => void;
  updateMapToken: (mapId: string, tokenId: string, updates: Partial<MapToken>) => void;
  removeMapToken: (mapId: string, tokenId: string) => void;
  setJournal: (entries: JournalEntry[]) => void;
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (entryId: string, updates: Partial<JournalEntry>) => void;
  removeJournalEntry: (entryId: string) => void;
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

    addAoETemplate: (mapId, template) => {
      set({
        battleMaps: g().battleMaps.map((m) =>
          m.id === mapId
            ? { ...m, aoeTemplates: [...(m.aoeTemplates || []), template] }
            : m
        ),
      });
    },

    updateAoETemplate: (mapId, templateId, updates) => {
      set({
        battleMaps: g().battleMaps.map((m) =>
          m.id === mapId
            ? { ...m, aoeTemplates: (m.aoeTemplates || []).map((t) => (t.id === templateId ? { ...t, ...updates } : t)) }
            : m
        ),
      });
    },

    removeAoETemplate: (mapId, templateId) => {
      set({
        battleMaps: g().battleMaps.map((m) =>
          m.id === mapId
            ? { ...m, aoeTemplates: (m.aoeTemplates || []).filter((t) => t.id !== templateId) }
            : m
        ),
      });
    },



    addEncounter: (encounter) =>
      set({ encounters: [...g().encounters, encounter] }),

    removeEncounter: (encounterId) =>
      set({ encounters: g().encounters.filter((e) => e.id !== encounterId) }),

    updateEncounter: (encounterId, updates) =>
      set({ encounters: g().encounters.map((e) => (e.id === encounterId ? { ...e, ...updates } : e)) }),

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

    updateJournalEntry: (entryId, updates) =>
      set({ journal: g().journal.map((e) => (e.id === entryId ? { ...e, ...updates, updatedAt: Date.now() } : e)) }),

    removeJournalEntry: (entryId) =>
      set({ journal: g().journal.filter((e) => e.id !== entryId) }),
  };
}
