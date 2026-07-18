import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CampaignMeta,
  PlayerCharacter,
  EnemyDoc,
  Encounter,
  BattleMap,
  MapToken,
  JournalEntry,
  Campaign,
} from "@/types";

const STORAGE_KEY = "str-vtt-campaign-normalized";

interface CampaignState {
  meta: CampaignMeta | null;
  characters: PlayerCharacter[];
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
  mapTokens: Record<string, MapToken[]>;
  campaign: Campaign | null;
  forcePushCounter: number;
  isLoading: boolean;
  error: string | null;
}

interface CampaignActions {
  setMeta: (meta: CampaignMeta) => void;
  setCharacters: (characters: PlayerCharacter[]) => void;
  addCharacter: (character: PlayerCharacter) => void;
  updateCharacter: (charId: string, updates: Partial<PlayerCharacter>) => void;
  removeCharacter: (charId: string) => void;
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
  setCampaign: (campaign: Campaign) => void;
  clearCampaign: () => void;
  setForcePushCounter: (counter: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

function buildCampaign(state: CampaignState): Campaign | null {
  if (!state.meta) return null;
  return {
    ...state.meta,
    playerCharacters: state.characters,
    enemies: state.enemies,
    encounters: state.encounters,
    battleMaps: state.battleMaps,
    journal: state.journal,
  };
}

const initialState: CampaignState = {
  meta: null,
  characters: [],
  enemies: [],
  encounters: [],
  battleMaps: [],
  journal: [],
  mapTokens: {},
  campaign: null,
  forcePushCounter: 0,
  isLoading: false,
  error: null,
};

export const useCampaignStore = create<CampaignState & CampaignActions>()(
  persist(
    (set) => ({
      ...initialState,

      setMeta: (meta: CampaignMeta) =>
        set((state) => {
          const newState = { ...state, meta };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      setCharacters: (characters: PlayerCharacter[]) =>
        set((state) => {
          const newState = { ...state, characters };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      addCharacter: (character: PlayerCharacter) =>
        set((state) => {
          const newState = {
            ...state,
            characters: [...state.characters, character],
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      updateCharacter: (charId: string, updates: Partial<PlayerCharacter>) =>
        set((state) => {
          const newState = {
            ...state,
            characters: state.characters.map((c) =>
              c.id === charId ? { ...c, ...updates } : c
            ),
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      removeCharacter: (charId: string) =>
        set((state) => {
          const newState = {
            ...state,
            characters: state.characters.filter((c) => c.id !== charId),
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      setEnemies: (enemies: EnemyDoc[]) =>
        set((state) => {
          const newState = { ...state, enemies };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      setEncounters: (encounters: Encounter[]) =>
        set((state) => {
          const newState = { ...state, encounters };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      addEncounter: (encounter: Encounter) =>
        set((state) => {
          const newState = {
            ...state,
            encounters: [...state.encounters, encounter],
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      setBattleMaps: (maps: BattleMap[]) =>
        set((state) => {
          const newState = { ...state, battleMaps: maps };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      addBattleMap: (map: BattleMap) =>
        set((state) => {
          const newState = {
            ...state,
            battleMaps: [...state.battleMaps, map],
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      removeBattleMap: (mapId: string) =>
        set((state) => {
          const newState = {
            ...state,
            battleMaps: state.battleMaps.filter((m) => m.id !== mapId),
            mapTokens: { ...state.mapTokens, [mapId]: [] },
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      setMapTokens: (mapId: string, tokens: MapToken[]) =>
        set((state) => ({
          ...state,
          mapTokens: { ...state.mapTokens, [mapId]: tokens },
        })),

      addMapToken: (mapId: string, token: MapToken) =>
        set((state) => {
          const existing = state.mapTokens[mapId] ?? [];
          return {
            ...state,
            mapTokens: { ...state.mapTokens, [mapId]: [...existing, token] },
          };
        }),

      updateMapToken: (mapId: string, tokenId: string, updates: Partial<MapToken>) =>
        set((state) => {
          const tokens = state.mapTokens[mapId] ?? [];
          return {
            ...state,
            mapTokens: {
              ...state.mapTokens,
              [mapId]: tokens.map((t) =>
                t.id === tokenId ? { ...t, ...updates } : t
              ),
            },
          };
        }),

      removeMapToken: (mapId: string, tokenId: string) =>
        set((state) => {
          const tokens = state.mapTokens[mapId] ?? [];
          return {
            ...state,
            mapTokens: {
              ...state.mapTokens,
              [mapId]: tokens.filter((t) => t.id !== tokenId),
            },
          };
        }),

      setJournal: (entries: JournalEntry[]) =>
        set((state) => {
          const newState = { ...state, journal: entries };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      addJournalEntry: (entry: JournalEntry) =>
        set((state) => {
          const newState = {
            ...state,
            journal: [...state.journal, entry],
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      setCampaign: (campaign: Campaign) =>
        set({
          meta: {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            dmName: campaign.dmName,
            settings: campaign.settings,
            stats: campaign.stats,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
          },
          characters: campaign.playerCharacters,
          enemies: campaign.enemies,
          encounters: campaign.encounters,
          battleMaps: campaign.battleMaps,
          journal: campaign.journal,
          campaign,
        }),

      clearCampaign: () => set({ ...initialState }),

      setForcePushCounter: (counter: number) =>
        set({ forcePushCounter: counter }),

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: STORAGE_KEY,
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
