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
import type { Campaign, PlayerCharacter, Encounter, BattleMap, JournalEntry, CampaignSettings, MapToken } from "@/types";
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

  /** Map of mapId → MapToken[] for per-map token caching (UI layer) */
  mapTokens: Record<string, MapToken[]>;

  /** Transient state */
  isLoading: boolean;
  error: string | null;
  /** Incremented on wholesale replacement to force sync */
  forcePushCounter: number;

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
  addToken: (mapId: string, token: MapToken) => void;
  updateToken: (mapId: string, tokenId: string, updates: Partial<MapToken>) => void;
  removeToken: (mapId: string, tokenId: string) => void;

  // ── Data Normalization ──
  /** Normalizes legacy PC data (currency, features, speed, savingThrows, skills) */
  normalizeCharacters: (chars: PlayerCharacter[]) => PlayerCharacter[];

  // ── Computed value (not a getter — recomputed on each state change) ──
  /** Reconstructs legacy monolithic Campaign from normalized state */
  campaign: Campaign | null;
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
  mapTokens: Record<string, MapToken[]>;
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

      // Computed campaign — recomputed via the `set` wrapper below
      campaign: null,

      setMeta: (meta) =>
        set((state) => {
          const newState = {
            ...state,
            meta,
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Normalize legacy PC data format (called before setCampaign and setCharacters)
      normalizeCharacters: (chars: PlayerCharacter[]): PlayerCharacter[] => {
        return chars.map((c: any) => {
          if (!c.currency) {
            c.currency = { copper: c.copper ?? 0, silver: c.silver ?? 0, electrum: c.electrum ?? 0, gold: c.gold ?? 0, platinum: c.platinum ?? 0 };
          }
          if (c.features && c.features.length > 0 && typeof c.features[0] === 'string') {
            c.features = c.features.map((f: string) => ({ name: f, description: f, source: 'Legacy' }));
          }
          if (typeof c.speed === 'number') {
            c.speed = { walk: c.speed };
          }
          if (!c.savingThrows) {
            const def = (a: number) => ({ proficient: false, bonus: Math.floor((a - 10) / 2) });
            c.savingThrows = {
              strength: def(c.strength), dexterity: def(c.dexterity),
              constitution: def(c.constitution), intelligence: def(c.intelligence),
              wisdom: def(c.wisdom), charisma: def(c.charisma),
            };
          }
          if (!c.skills) {
            c.skills = Object.fromEntries(
              ['acrobatics','animalHandling','arcana','athletics','deception','history',
               'insight','intimidation','investigation','medicine','nature','perception',
               'performance','persuasion','religion','sleightOfHand','stealth','survival']
                .map(k => [k, 'none'])
            );
          }
          return c as PlayerCharacter;
        });
      },

      setCampaign: (campaign) => {
        const normalizedPCs = get().normalizeCharacters(campaign.playerCharacters);
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
              enemyCount: campaign.encounters.reduce((sum, e) => sum + e.enemies.reduce((s, ee) => s + (ee.count || 1), 0), 0),
              encounterCount: campaign.encounters.length,
              mapCount: campaign.battleMaps.length,
              journalCount: campaign.journal.length,
              sessionCount: 0,
            },
          },
          characters: normalizedPCs,
          enemies: [] as EnemyDoc[],
          encounters: campaign.encounters,
          battleMaps: campaign.battleMaps.map((bm) => ({
            ...bm,
            fogOfWar: bm.fogOfWar ?? [],
          })),
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

      clear: () =>
        set({
          meta: null,
          characters: [],
          enemies: [],
          encounters: [],
          battleMaps: [],
          journal: [],
          mapTokens: {},
          campaign: null,
          forcePushCounter: 0,
        }),
      clearCampaign: () =>
        set({
          meta: null,
          characters: [],
          enemies: [],
          encounters: [],
          battleMaps: [],
          journal: [],
          mapTokens: {},
          campaign: null,
          forcePushCounter: 0,
        }),

      setMapTokens: (mapId, tokens) =>
        set((state) => ({
          mapTokens: { ...state.mapTokens, [mapId]: tokens as unknown as MapToken[] },
        })),

      // ── Character Actions ──
      addCharacter: (character) =>
        set((state) => {
          const newState = {
            ...state,
            characters: [...state.characters, character],
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, characterCount: state.characters.length + 1 },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      updateCharacter: (id, updates) =>
        set((state) => {
          const newState = {
            ...state,
            characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      updatePlayerCharacter: (id, updates) => get().updateCharacter(id, updates),

      removeCharacter: (id) =>
        set((state) => {
          const newState = {
            ...state,
            characters: state.characters.filter((c) => c.id !== id),
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, characterCount: Math.max(0, state.characters.length - 1) },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      // ── Enemy Actions ──
      addEnemy: (enemy) =>
        set((state) => ({
          enemies: [...state.enemies, enemy],
          forcePushCounter: state.forcePushCounter + 1,
        })),

      updateEnemy: (id, updates) =>
        set((state) => ({
          enemies: state.enemies.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          forcePushCounter: state.forcePushCounter + 1,
        })),

      removeEnemy: (id) =>
        set((state) => ({
          enemies: state.enemies.filter((e) => e.id !== id),
          forcePushCounter: state.forcePushCounter + 1,
        })),

      // ── Encounter Actions ──
      addEncounter: (encounter) =>
        set((state) => {
          const newState = {
            ...state,
            encounters: [...state.encounters, encounter],
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, encounterCount: state.encounters.length + 1 },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      updateEncounter: (id, updates) =>
        set((state) => {
          const newState = {
            ...state,
            encounters: state.encounters.map((e) => (e.id === id ? { ...e, ...updates } : e)),
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      removeEncounter: (id) =>
        set((state) => {
          const newState = {
            ...state,
            encounters: state.encounters.filter((e) => e.id !== id),
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, encounterCount: Math.max(0, state.encounters.length - 1) },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      // ── Battle Map Actions ──
      addBattleMap: (map) =>
        set((state) => {
          const newState = {
            ...state,
            battleMaps: [...state.battleMaps, map],
            mapTokens: { ...state.mapTokens, [map.id]: map.tokens ?? [] },
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, mapCount: state.battleMaps.length + 1 },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      updateBattleMap: (id, updates) =>
        set((state) => {
          const newState = {
            ...state,
            battleMaps: state.battleMaps.map((m) => (m.id === id ? { ...m, ...updates } : m)),
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      removeBattleMap: (id) =>
        set((state) => {
          const { [id]: _, ...restTokens } = state.mapTokens;
          const newState = {
            ...state,
            battleMaps: state.battleMaps.filter((m) => m.id !== id),
            mapTokens: restTokens,
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, mapCount: Math.max(0, state.battleMaps.length - 1) },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      // ── Journal Actions ──
      addJournalEntry: (entry) =>
        set((state) => {
          const newState = {
            ...state,
            journal: [...state.journal, entry],
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, journalCount: state.journal.length + 1 },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      updateJournalEntry: (id, updates) =>
        set((state) => {
          const newState = {
            ...state,
            journal: state.journal.map((j) => (j.id === id ? { ...j, ...updates } : j)),
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      removeJournalEntry: (id) =>
        set((state) => {
          const newState = {
            ...state,
            journal: state.journal.filter((j) => j.id !== id),
            forcePushCounter: state.forcePushCounter + 1,
          };
          if (state.meta) {
            newState.meta = {
              ...state.meta,
              stats: { ...state.meta.stats, journalCount: Math.max(0, state.journal.length - 1) },
            };
          }
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      // ── Settings ──
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

      // ── Token Actions ──
      addToken: (mapId, token) =>
        set((state) => {
          const tokens = state.mapTokens[mapId] ?? [];
          const newState = {
            ...state,
            mapTokens: { ...state.mapTokens, [mapId]: [...tokens, token] },
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      updateToken: (mapId, tokenId, updates) =>
        set((state) => {
          const tokens = (state.mapTokens[mapId] ?? []).map((t) =>
            t.id === tokenId ? { ...t, ...updates } : t,
          );
          const newState = {
            ...state,
            mapTokens: { ...state.mapTokens, [mapId]: tokens },
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),

      removeToken: (mapId, tokenId) =>
        set((state) => {
          const tokens = (state.mapTokens[mapId] ?? []).filter((t) => t.id !== tokenId);
          const newState = {
            ...state,
            mapTokens: { ...state.mapTokens, [mapId]: tokens },
            forcePushCounter: state.forcePushCounter + 1,
          };
          return { ...newState, campaign: buildCampaign(newState) };
        }),
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
      migrate: (persisted: any, version: number) => {
        // v1 → v2: Migrate old flat currency/features/speed to nested format
        if (version < 2 && persisted?.characters) {
          persisted.characters = persisted.characters.map((c: any) => {
            // Migrate currency: flat → nested
            if (!c.currency) {
              c.currency = {
                copper: c.copper ?? 0,
                silver: c.silver ?? 0,
                electrum: c.electrum ?? 0,
                gold: c.gold ?? 0,
                platinum: c.platinum ?? 0,
              };
            }
            // Migrate features: string[] → FeatureEntry[]
            if (c.features && c.features.length > 0 && typeof c.features[0] === 'string') {
              c.features = c.features.map((f: string) => ({ name: f, description: f, source: 'Legacy' }));
            }
            // Migrate speed: number → Speed object
            if (typeof c.speed === 'number') {
              c.speed = { walk: c.speed };
            }
            // Add default savingThrows if missing
            if (!c.savingThrows) {
              const def = (a: number) => ({ proficient: false, bonus: Math.floor((a - 10) / 2) });
              c.savingThrows = {
                strength: def(c.strength), dexterity: def(c.dexterity),
                constitution: def(c.constitution), intelligence: def(c.intelligence),
                wisdom: def(c.wisdom), charisma: def(c.charisma),
              };
            }
            // Add default skills if missing
            if (!c.skills) {
              c.skills = Object.fromEntries(
                ['acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception', 'history',
                 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception',
                 'performance', 'persuasion', 'religion', 'sleightOfHand', 'stealth', 'survival']
                  .map((k) => [k, 'none'])
              );
            }
            return c;
          });
        }
        return persisted as NormalizedCampaignState;
      },
    },
  ),
);
