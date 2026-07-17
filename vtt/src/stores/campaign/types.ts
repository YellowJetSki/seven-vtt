/* ── Campaign Store Types ──────────────────────────────────────
 * Shared types for campaign store slices.
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, PlayerCharacter, Encounter, BattleMap, JournalEntry, CampaignSettings, MapToken } from "@/types";
import type { CampaignMeta, EnemyDoc, MapTokenDoc } from "@/types/firestore";

export interface NormalizedCampaignState {
  meta: CampaignMeta | null;
  characters: PlayerCharacter[];
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
  mapTokens: Record<string, MapToken[]>;
  isLoading: boolean;
  error: string | null;
  forcePushCounter: number;

  /** @deprecated Use individual normalized selectors (s.characters, s.encounters, etc.)
   *  instead of this derived field to prevent infinite re-render loops. */
  campaign: Campaign | null;

  // ── Meta ──
  setMeta: (meta: CampaignMeta) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // ── Bulk ──
  setCampaign: (campaign: Campaign) => void;
  hydrateFromLegacy: (campaign: Campaign) => void;
  clear: () => void;
  clearCampaign: () => void;

  // ── Sync ──
  setMapTokens: (mapId: string, tokens: MapTokenDoc[]) => void;

  // ── Characters ──
  addCharacter: (character: PlayerCharacter) => void;
  updateCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;
  removeCharacter: (id: string) => void;
  updatePlayerCharacter: (id: string, updates: Partial<PlayerCharacter>) => void;

  // ── Enemies ──
  addEnemy: (enemy: EnemyDoc) => void;
  updateEnemy: (id: string, updates: Partial<EnemyDoc>) => void;
  removeEnemy: (id: string) => void;

  // ── Encounters ──
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (id: string, updates: Partial<Encounter>) => void;
  removeEncounter: (id: string) => void;

  // ── Maps ──
  addBattleMap: (map: BattleMap) => void;
  updateBattleMap: (id: string, updates: Partial<BattleMap>) => void;
  removeBattleMap: (id: string) => void;

  // ── Journal ──
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  removeJournalEntry: (id: string) => void;

  // ── Settings ──
  updateSettings: (updates: Partial<CampaignSettings>) => void;

  // ── Tokens ──
  addToken: (mapId: string, token: MapToken) => void;
  updateToken: (mapId: string, tokenId: string, updates: Partial<MapToken>) => void;
  removeToken: (mapId: string, tokenId: string) => void;

  // ── Normalization ──
  normalizeCharacters: (chars: PlayerCharacter[]) => PlayerCharacter[];
}
