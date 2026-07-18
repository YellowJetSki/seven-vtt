import type { CampaignMeta, PlayerCharacter, EnemyDoc, Encounter, BattleMap, JournalEntry, MapToken } from "@/types";

export interface BuildableCampaign extends CampaignMeta {
  playerCharacters: PlayerCharacter[];
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
}

export function buildCampaign(state: {
  meta: CampaignMeta | null;
  characters: PlayerCharacter[];
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
}): BuildableCampaign | null {
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

export const STORAGE_KEY = "str-vtt-campaign-normalized";

export const initialCampaignState = {
  meta: null as CampaignMeta | null,
  characters: [] as PlayerCharacter[],
  enemies: [] as EnemyDoc[],
  encounters: [] as Encounter[],
  battleMaps: [] as BattleMap[],
  journal: [] as JournalEntry[],
  mapTokens: {} as Record<string, MapToken[]>,
  campaign: null as BuildableCampaign | null,
  forcePushCounter: 0,
  isLoading: false,
  error: null as string | null,
};
