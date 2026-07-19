/**
 * STᚱ VTT — Stat Persistence Layer
 *
 * Ensures all derived character stats (Speed, AC, Initiative, PB, HP, Hit Dice)
 * are correctly computed and stored when using ANY race/class — official or homebrew.
 *
 * This service applies race/class data to a PlayerCharacter object,
 * ensuring that homebrew content integrates seamlessly with the
 * existing derivations engine.
 *
 * Usage:
 *   const character = applyRaceStats(baseCharacter, raceDef);
 *   const character = applyClassStats(character, classDef);
 */

import type { PlayerCharacter } from "@/types";
import type {
  RaceDefinition,
  ClassDefinition,
  AppliedRaceStats,
  AppliedClassStats,
  AbilityBonus,
} from "@/types/race-class";
import { getAbilityMod, getProficiencyBonus } from "./character-derivations";

// ── Race Stats Application ────────────────────────────────────

export function applyRaceToCharacter(
  character: PlayerCharacter,
  race: RaceDefinition,
  subraceIndex?: number
): PlayerCharacter {
  const updated = { ...character };

  // Apply base speed
  updated.speed = {
    ...updated.speed,
    walk: race.baseSpeed,
  };

  // Apply special speeds
  if (race.specialSpeeds) {
    updated.speed = {
      ...updated.speed,
      ...race.specialSpeeds,
    };
  }

  // Apply ability score bonuses
  const allBonuses = [...race.abilityBonuses];
  if (subraceIndex !== undefined && race.subraces?.[subraceIndex]) {
    allBonuses.push(...race.subraces[subraceIndex].abilityBonuses);
  }

  for (const bonus of allBonuses) {
    const key = bonus.ability;
    const curVal = (updated as any)[key];
    if (typeof curVal === "number") {
      (updated as any)[key] = curVal + bonus.bonus;
    }
  }

  // Set darkvision note as a Feature
  if (race.darkvision > 0) {
    const existingTraits = (updated.traits || []).filter(
      (f): f is { name: string; description: string; source: string } =>
        typeof f === "object" && f !== null && "name" in f
    );
    updated.traits = [
      ...existingTraits,
      { name: "Darkvision", description: `Darkvision ${race.darkvision}ft`, source: "Racial Trait" },
    ];
  }

  // Add racial traits as Feature objects
  const newFeatures = race.traits.map(t => ({
    name: t.split(":")[0].trim() || "Racial Trait",
    description: t,
    source: race.isHomebrew ? "Homebrew" : "Racial Trait",
  }));
  const existingFeatures = (updated.features || []).filter(
    (f): f is { name: string; description: string; source: string } =>
      typeof f === "object" && f !== null && "name" in f
  );
  updated.features = [...existingFeatures, ...newFeatures];

  // If subrace features exist, add those too
  if (subraceIndex !== undefined && race.subraces?.[subraceIndex]) {
    const subFeatures = race.subraces[subraceIndex].traits.map(t => ({
      name: t.split(":")[0].trim() || "Subrace Trait",
      description: t,
      source: `${race.subraces![subraceIndex].name} Racial Trait`,
    }));
    updated.features = [...existingFeatures, ...newFeatures, ...subFeatures];
  }

  // Add racial proficiencies
  const profTypes = race.proficiencies.map(p => ({
    name: p.name,
    type: p.type,
    isProficient: true,
  }));
  updated.proficiencies = [
    ...(updated.proficiencies || []),
    ...profTypes,
  ];

  // Add languages
  const existingLangs = new Set<string>(updated.languages || []);
  for (const lang of race.languages) {
    existingLangs.add(lang);
  }
  updated.languages = Array.from(existingLangs);

  return updated;
}

// ── Class Stats Application ───────────────────────────────────

export function applyClassToCharacter(
  character: PlayerCharacter,
  classDef: ClassDefinition
): PlayerCharacter {
  const updated = { ...character };

  // Set hit dice
  updated.hitDice = classDef.hitDie;

  // Add class features as Feature objects
  const classFeatures = classDef.features.map(f => ({
    name: f.name,
    description: f.description,
    source: classDef.isHomebrew ? "Homebrew Class" : classDef.name,
  }));
  const existingFeats = (updated.features || []).filter(
    (f): f is { name: string; description: string; source: string } =>
      typeof f === "object" && f !== null && "name" in f
  );
  updated.features = [
    ...existingFeats,
    ...classFeatures,
  ];

  // Add class proficiencies
  const saveTypes = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
  const saveProfs = classDef.proficiencies
    .filter(p => p.type === "save" && saveTypes.includes(p.name.toLowerCase() as typeof saveTypes[number]));

  for (const prof of saveProfs) {
    const saveKey = prof.name.toLowerCase() as typeof saveTypes[number];
    if (updated.savingThrows?.[saveKey]) {
      updated.savingThrows = {
        ...updated.savingThrows,
        [saveKey]: { ...updated.savingThrows[saveKey], proficient: true },
      };
    }
  }

  const otherProfs = classDef.proficiencies
    .filter(p => p.type !== "save")
    .map(p => ({
      name: p.name,
      type: p.type,
      isProficient: true,
    }));

  updated.proficiencies = [
    ...(updated.proficiencies || []),
    ...otherProfs,
  ];

  return updated;
}

// ── Derived Stat Recalculation ────────────────────────────────

export function recalculateAllStats(character: PlayerCharacter): PlayerCharacter {
  const updated = { ...character };

  // Proficiency Bonus (based on level)
  updated.proficiencyBonus = getProficiencyBonus(character.level);

  // Initiative (DEX modifier)
  updated.initiative = getAbilityMod(character.dexterity);

  // Recalculate speed with encumbrance
  // (encumbrance is handled separately via EncumbranceEngine)

  // Hit points: ensure max is at least the minimum for level
  const conMod = getAbilityMod(character.constitution);
  const hdSize = parseInt(character.hitDice?.replace("1d", "") || "8");
  const minHp = hdSize + conMod + (character.level - 1) * (Math.floor(hdSize / 2) + 1 + conMod);

  if (updated.hitPoints.max < minHp) {
    updated.hitPoints = {
      ...updated.hitPoints,
      max: Math.max(updated.hitPoints.max, minHp),
    };
  }

  return updated;
}

// ── Integration Helper ────────────────────────────────────────

export function buildCharacterFromRaceAndClass(
  base: PlayerCharacter,
  race: RaceDefinition,
  classDef: ClassDefinition,
  subraceIndex?: number
): PlayerCharacter {
  let character = { ...base };

  // 1. Apply race stats first
  character = applyRaceToCharacter(character, race, subraceIndex);

  // 2. Apply class stats second
  character = applyClassToCharacter(character, classDef);

  // 3. Recalculate all derived stats
  character = recalculateAllStats(character);

  return character;
}

// ── Utility: Get all races (SRD + Homebrew) ───────────────────

import { SRD_RACES, getRaceById } from "@/data/srd-races";

export function getAllRaces(homebrewRaces: RaceDefinition[] = []): RaceDefinition[] {
  return [...SRD_RACES, ...homebrewRaces];
}

export function findRace(idOrName: string, homebrewRaces: RaceDefinition[] = []): RaceDefinition | undefined {
  return (
    getAllRaces(homebrewRaces).find(r => r.id === idOrName) ||
    getAllRaces(homebrewRaces).find(r => r.name.toLowerCase() === idOrName.toLowerCase())
  );
}
