/* ── Campaign Global Store (Normalized) ────────────────────────
 *
 * This store maintains a NORMALIZED cache of all campaign data.
 * Instead of a single monolithic Campaign object, it stores separate
 * arrays for each entity type (characters, enemies, encounters, maps, journal).
 *
 * BACKWARD COMPATIBILITY: The `campaign` getter reconstructs the legacy
 * monolithic shape from the normalized arrays. All existing components
 * that use `s.campaign` continue to work without changes.
 *
 * BACKEND: Writes go through the normalizedFirebaseService to individual
 * subcollection documents. Reads hydrate from Firestore via onSnapshot.
 *
 * PERSISTENCE: Zustand persist middleware keeps a local cache in localStorage.
 * This ensures offline resilience and instant page loads.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Campaign, PlayerCharacter, Encounter, BattleMap, JournalEntry, CampaignSettings } from "@/types";
import type { CharacterDoc, EnemyDoc, EncounterDoc, MapDoc, MapTokenDoc, JournalEntryDoc, CampaignMeta } from "@/types/firestore";
import { normalizedSync, normalizedCampaign, normalizedCharacters, normalizedEnemies, normalizedEncounters, normalizedMaps, normalizedTokens, normalizedJournal } from "@/lib/normalized-firebase-service";
import { isFirebaseAvailable } from "@/lib/firebase";

/* ── Types ──────────────────────────────────────────────────── */

interface NormalizedCampaignState {
  /** Lightweight metadata document */
  meta: CampaignMeta | null;

  /** Normalized entity arrays */
  characters: PlayerCharacter[];
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];

  /** Map of mapId → MapToken[] for per-map token caching */
  mapTokens: Record<string, MapTokenDoc[]>;

  /** Transient state */
  isLoading: boolean;
  error: string | null;
  /** Incremented on wholesale replacement to force sync */
  forcePushCounter: number;

  // ── Backward-compatible computed getter ──
  /** Reconstructs legacy monolithic Campaign from normalized state */
  campaign: Campaign | null;

  // ── Actions ──
  setMeta: (meta: CampaignMeta) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  /** Bulk hydrate from legacy campaign object (for migration/import) */
  hydrateFromLegacy: (campaign: Campaign) => void;
  /** Direct setter for the legacy campaign shape (used by firebase-service) */
  setCampaign: (campaign: Campaign) => void;

  /** Full reset */
  clear: () => void;
  clearCampaign: () => void;

  /** Sync a map's tokens from Firestore into local cache */
  setMapTokens: (mapId: string, tokens: MapTokenDoc[]) => void;

  // ── Character Actions ──
  addCharacter: (character: PlayerCharacter) => void;
  updateCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;
  removeCharacter: (id: string) => void;
  updatePlayerCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;

  // ── Enemy Actions ──
  addEnemy: (enemy: EnemyDoc) => void;
  updateEnemy: (id: string, updates: Partial<EnemyDoc>) => void;
  removeEnemy: (id: string) => void;

  // ── Encounter Actions ──
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (id: string, updates: Partial<Encounter>) => void;
  removeEncounter: (id: string) => void;

  // ── Battle Map Actions ──
  addBattleMap: (map: BattleMap) => void;
  updateBattleMap: (id: string, updates: Partial<BattleMap>) => void;
  removeBattleMap: (id: string) => void;

  // ── Journal Actions ──
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeJournalEntry: (id: string) => void;

  // ── Settings ──
  updateSettings: (updates: Partial<CampaignSettings>) => void;

  // ── Token Actions ──
  addToken: (mapId: string, token: MapTokenDoc) => void;
  updateToken: (mapId: string, tokenId: string, updates: Partial<MapTokenDoc>) => void;
  removeToken: (mapId: string, tokenId: string) => void;
}

/* ── Helpers ────────────────────────────────────────────────── */

let _idCounter = 0;

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${++_idCounter}`;
}

/**
 * Build a legacy Campaign object from normalized state.
 */
function buildCampaign(state: {
  meta: CampaignMeta | null;
  characters: PlayerCharacter[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  mapTokens: Record<string, MapTokenDoc[]>;
  journal: JournalEntry[];
}): Campaign | null {
  if (!state.meta) return null;
  return {
    id: state.meta.id,
    name: state.meta.name,
    description: state.meta.description,
    dmName: state.meta.dmName,
    settings: state.meta.settings,
    playerCharacters: state.characters,
    encounters: state.encounters,
    battleMaps: state.battleMaps.map((bm) => ({
      ...bm,
      tokens: state.mapTokens[bm.id] ?? bm.tokens ?? [],
    })),
    journal: state.journal,
    createdAt: state.meta.createdAt,
    updatedAt: state.meta.updatedAt,
  };
}

/* ── Store ──────────────────────────────────────────────────── */

export const useCampaignStore = create<NormalizedCampaignState>()(
  persist(
    (set, get) => ({
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

      // Backward-compatible computed getter
      get campaign(): Campaign | null {
        return buildCampaign(get());
      },

      setMeta: (meta) =>
        set((state) => ({
          meta,
          forcePushCounter: state.forcePushCounter + 1,
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      setCampaign: (campaign) => {
        set({
          meta: {
            id: campaign.id,
            name: campaign.name,
            description: campaign.description,
            dmName: campaign.dmName,
            settings: campaign.settings || {
              homebrewRules: [],
              experienceSystem: "xp",
              currencyName: "Gold",
              privateDmNotes: "",
            },
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
            stats: {
              characterCount: campaign.playerCharacters.length,
              enemyCount: campaign.encounters.reduce((sum, e) => sum + e.creatures.length, 0),
              encounterCount: campaign.encounters.length,
              mapCount: campaign.battleMaps.length,
              journalCount: campaign.journal.length,
              sessionCount: 0,
            },
          },
          characters: campaign.playerCharacters,
          enemies: campaign.encounters.flatMap((e) =>
            e.creatures.filter((c) => !campaign.playerCharacters.some((pc) => pc.id === c.id))
          ),
          encounters: campaign.encounters,
          battleMaps: campaign.battleMaps.map(({ tokens, fogOfWar, ...rest }) => ({
            ...rest,
            fogOfWar: fogOfWar ?? [],
          })),
          mapTokens: Object.fromEntries(
            campaign.battleMaps.map((bm) => [bm.id, bm.tokens ?? []]),
          ),
          journal: campaign.journal,
          forcePushCounter: Date.now(),
        });
      },

      hydrateFromLegacy: (campaign) => {
        get().setCampaign(campaign);
      },

      clear: () =>
        set({
          meta: null,
          characters: [],
          enemies: [],
          encounters: [],
          battleMaps: [],
          journal: [],
          mapTokens: {},
          forcePushCounter: Date.now(),
        }),
      clearCampaign: () => get().clear(),

      setMapTokens: (mapId, tokens) =>
        set((state) => ({
          mapTokens: { ...state.mapTokens, [mapId]: tokens },
        })),

      /* ── Character Actions ── */
      addCharacter: (character) =>
        set((state) => ({
          characters: [...state.characters, character],
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, characterCount: state.characters.length + 1 },
            updatedAt: Date.now(),
          } : null,
        })),

      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c,
          ),
          meta: state.meta ? { ...state.meta, updatedAt: Date.now() } : null,
        })),

      updatePlayerCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c,
          ),
          meta: state.meta ? { ...state.meta, updatedAt: Date.now() } : null,
        })),

      removeCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, characterCount: Math.max(0, state.characters.length - 1) },
            updatedAt: Date.now(),
          } : null,
        })),

      /* ── Enemy Actions ── */
      addEnemy: (enemy) =>
        set((state) => ({
          enemies: [...state.enemies, enemy],
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, enemyCount: state.enemies.length + 1 },
            updatedAt: Date.now(),
          } : null,
        })),

      updateEnemy: (id, updates) =>
        set((state) => ({
          enemies: state.enemies.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e,
          ),
          meta: state.meta ? { ...state.meta, updatedAt: Date.now() } : null,
        })),

      removeEnemy: (id) =>
        set((state) => ({
          enemies: state.enemies.filter((e) => e.id !== id),
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, enemyCount: Math.max(0, state.enemies.length - 1) },
            updatedAt: Date.now(),
          } : null,
        })),

      /* ── Encounter Actions ── */
      addEncounter: (encounter) =>
        set((state) => ({
          encounters: [...state.encounters, encounter],
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, encounterCount: state.encounters.length + 1 },
            updatedAt: Date.now(),
          } : null,
        })),

      updateEncounter: (id, updates) =>
        set((state) => ({
          encounters: state.encounters.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e,
          ),
          meta: state.meta ? { ...state.meta, updatedAt: Date.now() } : null,
        })),

      removeEncounter: (id) =>
        set((state) => ({
          encounters: state.encounters.filter((e) => e.id !== id),
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, encounterCount: Math.max(0, state.encounters.length - 1) },
            updatedAt: Date.now(),
          } : null,
        })),

      /* ── Battle Map Actions ── */
      addBattleMap: (map) =>
        set((state) => ({
          battleMaps: [...state.battleMaps, map],
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, mapCount: state.battleMaps.length + 1 },
            updatedAt: Date.now(),
          } : null,
        })),

      updateBattleMap: (id, updates) =>
        set((state) => ({
          battleMaps: state.battleMaps.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m,
          ),
          meta: state.meta ? { ...state.meta, updatedAt: Date.now() } : null,
        })),

      removeBattleMap: (id) =>
        set((state) => ({
          battleMaps: state.battleMaps.filter((m) => m.id !== id),
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, mapCount: Math.max(0, state.battleMaps.length - 1) },
            updatedAt: Date.now(),
          } : null,
        })),

      /* ── Token Actions ── */
      addToken: (mapId, token) =>
        set((state) => ({
          mapTokens: {
            ...state.mapTokens,
            [mapId]: [...(state.mapTokens[mapId] ?? []), token],
          },
        })),

      updateToken: (mapId, tokenId, updates) =>
        set((state) => ({
          mapTokens: {
            ...state.mapTokens,
            [mapId]: (state.mapTokens[mapId] ?? []).map((t) =>
              t.id === tokenId ? { ...t, ...updates, updatedAt: Date.now() } : t,
            ),
          },
        })),

      removeToken: (mapId, tokenId) =>
        set((state) => ({
          mapTokens: {
            ...state.mapTokens,
            [mapId]: (state.mapTokens[mapId] ?? []).filter((t) => t.id !== tokenId),
          },
        })),

      /* ── Journal Actions ── */
      addJournalEntry: (entry) =>
        set((state) => ({
          journal: [...state.journal, entry],
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, journalCount: state.journal.length + 1 },
            updatedAt: Date.now(),
          } : null,
        })),

      updateJournalEntry: (id, updates) =>
        set((state) => ({
          journal: state.journal.map((j) =>
            j.id === id ? { ...j, ...updates, updatedAt: Date.now() } : j,
          ),
          meta: state.meta ? { ...state.meta, updatedAt: Date.now() } : null,
        })),

      removeJournalEntry: (id) =>
        set((state) => ({
          journal: state.journal.filter((j) => j.id !== id),
          meta: state.meta ? {
            ...state.meta,
            stats: { ...state.meta.stats, journalCount: Math.max(0, state.journal.length - 1) },
            updatedAt: Date.now(),
          } : null,
        })),

      /* ── Settings ── */
      updateSettings: (updates) =>
        set((state) => {
          if (!state.meta) return state;
          return {
            meta: {
              ...state.meta,
              settings: { ...state.meta.settings, ...updates },
              updatedAt: Date.now(),
            },
          };
        }),
    }),
    {
      name: "str-vtt-campaign-normalized",
      partialize: (state) => ({
        meta: state.meta,
        characters: state.characters,
        enemies: state.enemies,
        encounters: state.encounters,
        battleMaps: state.battleMaps,
        mapTokens: state.mapTokens,
        journal: state.journal,
        forcePushCounter: state.forcePushCounter,
      }),
    },
  ),
);
