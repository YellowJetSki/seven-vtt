/* ── Campaign Global Store ─────────────────────────────────────
 *
 * Firestore auto-sync: Every action that mutates campaign data
 * increments `updatedAt`. The useFirebaseSync hook watches this
 * field plus array lengths to trigger Firestore pushes.
 *
 * The `forcePushCounter` is a manual increment for wholesale
 * replacements (import JSON, reset to demo) that triggers an
 * immediate sync regardless of other watchers.
 *
 * PERSISTENCE: This store uses Zustand persist middleware to
 * store campaign data in localStorage. This ensures campaign
 * data (including imported Arkla.json PCs) survives page refreshes
 * even when Firebase is offline or not yet configured.
 *
 * NOTE: `updatePlayerCharacter` is an alias for `updateCharacter`
 * provided for semantic clarity in player-facing components.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Campaign,
  PlayerCharacter,
  Encounter,
  BattleMap,
  JournalEntry,
} from "@/types";
import type { CampaignSettings } from "@/types";

interface CampaignState {
  campaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
  /** Incremented on wholesale replacement to force Firebase sync */
  forcePushCounter: number;

  // ── Actions ──
  setCampaign: (campaign: Campaign) => void;
  clearCampaign: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Player Characters
  addCharacter: (character: PlayerCharacter) => void;
  updateCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;
  removeCharacter: (id: string) => void;

  // Alias for semantic clarity in player-facing components
  updatePlayerCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;

  // Encounters
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (id: string, updates: Partial<Encounter>) => void;
  removeEncounter: (id: string) => void;

  // Battle Maps
  addBattleMap: (map: BattleMap) => void;
  updateBattleMap: (id: string, updates: Partial<BattleMap>) => void;
  removeBattleMap: (id: string) => void;

  // Journal
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeJournalEntry: (id: string) => void;

  // Settings
  updateSettings: (updates: Partial<CampaignSettings>) => void;
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set) => ({
      campaign: null,
      isLoading: false,
      error: null,
      forcePushCounter: 0,

      setCampaign: (campaign) =>
        set((state) => ({
          campaign,
          error: null,
          forcePushCounter: state.forcePushCounter + 1,
        })),

      clearCampaign: () =>
        set((state) => ({
          campaign: null,
          forcePushCounter: state.forcePushCounter + 1,
        })),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      /* Player Characters */
      addCharacter: (character) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              playerCharacters: [
                ...state.campaign.playerCharacters,
                character,
              ],
              updatedAt: Date.now(),
            },
          };
        }),

      updateCharacter: (id, updates) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              playerCharacters: state.campaign.playerCharacters.map((c) =>
                c.id === id
                  ? { ...c, ...updates, updatedAt: Date.now() }
                  : c,
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      updatePlayerCharacter: (id, updates) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              playerCharacters: state.campaign.playerCharacters.map((c) =>
                c.id === id
                  ? { ...c, ...updates, updatedAt: Date.now() }
                  : c,
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      removeCharacter: (id) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              playerCharacters: state.campaign.playerCharacters.filter(
                (c) => c.id !== id,
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      /* Encounters */
      addEncounter: (encounter) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              encounters: [...state.campaign.encounters, encounter],
              updatedAt: Date.now(),
            },
          };
        }),

      updateEncounter: (id, updates) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              encounters: state.campaign.encounters.map((e) =>
                e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e,
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      removeEncounter: (id) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              encounters: state.campaign.encounters.filter((e) => e.id !== id),
              updatedAt: Date.now(),
            },
          };
        }),

      /* Battle Maps */
      addBattleMap: (map) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              battleMaps: [...state.campaign.battleMaps, map],
              updatedAt: Date.now(),
            },
          };
        }),

      updateBattleMap: (id, updates) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              battleMaps: state.campaign.battleMaps.map((m) =>
                m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m,
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      removeBattleMap: (id) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              battleMaps: state.campaign.battleMaps.filter(
                (m) => m.id !== id,
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      /* Journal */
      addJournalEntry: (entry) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              journal: [...state.campaign.journal, entry],
              updatedAt: Date.now(),
            },
          };
        }),

      updateJournalEntry: (id, updates) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              journal: state.campaign.journal.map((j) =>
                j.id === id
                  ? { ...j, ...updates, updatedAt: Date.now() }
                  : j,
              ),
              updatedAt: Date.now(),
            },
          };
        }),

      removeJournalEntry: (id) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              journal: state.campaign.journal.filter((j) => j.id !== id),
              updatedAt: Date.now(),
            },
          };
        }),

      /* Settings */
      updateSettings: (updates) =>
        set((state) => {
          if (!state.campaign) return state;
          return {
            campaign: {
              ...state.campaign,
              settings: { ...state.campaign.settings, ...updates },
              updatedAt: Date.now(),
            },
          };
        }),
    }),
    {
      name: "str-vtt-campaign",
      // Only persist the campaign data, not transient state
      partialize: (state) => ({
        campaign: state.campaign,
        forcePushCounter: state.forcePushCounter,
      }),
    },
  ),
);
