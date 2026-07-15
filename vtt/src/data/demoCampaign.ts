import type { Campaign, PlayerCharacter, Encounter, BattleMap, JournalEntry } from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function initModFromDex(dex: number): number {
  return Math.floor((dex - 10) / 2);
}

const NOW = Date.now();
const DAY = 86_400_000;

export function createDemoCampaign(): Campaign {
  return {
    id: uid("camp"),
    name: "New Campaign",
    description: "A fresh campaign ready for adventure.",
    dmName: "Dungeon Master",
    playerCharacters: [],
    encounters: [],
    battleMaps: [],
    journal: [],
    settings: {
      homebrewRules: [],
      experienceSystem: "xp",
      currencyName: "Gold Pieces",
      privateDmNotes: "",
    },
    createdAt: NOW,
    updatedAt: NOW,
  };
}

export const DEMO_PLAYER_FIRST_NAMES: string[] = [];
