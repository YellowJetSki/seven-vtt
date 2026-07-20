/**
 * STᚱ VTT — Class Defaults and Character Creation Utilities
 *
 * Pure data and helper functions for character creation.
 * Extracted from PlayerCreateModal.tsx monolith (Sprint 10 refactor).
 */

export const CLASSES = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer",
  "Warlock", "Wizard", "Artificer", "Blood Hunter",
];

export interface ClassAbilityDefaults {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export const DEFAULT_STATS_BY_CLASS: Record<string, ClassAbilityDefaults> = {
  Barbarian: { str: 16, dex: 14, con: 16, int: 8, wis: 10, cha: 10 },
  Bard: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 16 },
  Cleric: { str: 14, dex: 10, con: 14, int: 10, wis: 16, cha: 8 },
  Druid: { str: 8, dex: 14, con: 14, int: 12, wis: 16, cha: 10 },
  Fighter: { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
  Monk: { str: 10, dex: 16, con: 14, int: 10, wis: 16, cha: 8 },
  Paladin: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 16 },
  Ranger: { str: 10, dex: 16, con: 14, int: 12, wis: 14, cha: 8 },
  Rogue: { str: 8, dex: 16, con: 14, int: 14, wis: 10, cha: 12 },
  Sorcerer: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 16 },
  Warlock: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 16 },
  Wizard: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 },
  Artificer: { str: 8, dex: 14, con: 14, int: 16, wis: 10, cha: 10 },
  "Blood Hunter": { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 8 },
};

export const HIT_DIE_BY_CLASS: Record<string, string> = {
  Barbarian: "1d12",
  Fighter: "1d10",
  Paladin: "1d10",
  Ranger: "1d10",
  Artificer: "1d8",
  Bard: "1d8",
  Cleric: "1d8",
  Druid: "1d8",
  Monk: "1d8",
  Rogue: "1d8",
  Warlock: "1d8",
  "Blood Hunter": "1d10",
  Sorcerer: "1d6",
  Wizard: "1d6",
};

export const SPELLCASTING_CLASSES = new Set([
  "Bard", "Cleric", "Druid", "Paladin", "Ranger",
  "Sorcerer", "Warlock", "Wizard", "Artificer",
]);

export function calcHp(className: string, con: number, level: number): number {
  const die = HIT_DIE_BY_CLASS[className] || "1d8";
  const dieMax = parseInt(die.replace("1d", ""), 10) || 8;
  const conMod = Math.floor((con - 10) / 2);
  return dieMax + conMod + (level - 1) * (Math.floor(dieMax / 2) + 1 + conMod);
}

export function calcAc(className: string, dex: number, con?: number): number {
  const dexMod = Math.floor((dex - 10) / 2);
  if (className === "Barbarian") {
    const conMod = Math.floor(((con || 16) - 10) / 2);
    return 10 + dexMod + conMod;
  }
  if (className === "Monk") {
    const wisMod = Math.floor((16 - 10) / 2);
    return 10 + dexMod + wisMod;
  }
  return 10 + dexMod;
}
