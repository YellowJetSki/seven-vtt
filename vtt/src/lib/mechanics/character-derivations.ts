/**
 * STᚱ VTT — Character Derivations Engine
 *
 * Auto-calculates all derived character stats from base data.
 * Players never manually set AC, initiative, proficiency bonus, etc.
 * Everything flows from abilities, armor, and level.
 */

import type { PlayerCharacter, SpellLevel, SpellSlotsFull, CasterType } from "@/types";
import { getCasterType, getMaxSlots } from "@/types";
import { computeSpellSaveDC, computeSpellAttackBonus, buildSpellSlots } from "./spell-slot-engine";
import { computeMulticlassSpellcasting, type MulticlassSpellcastingState } from "@/lib/mechanics/multiclass-spell-slots";
import { computeTotalWeight, computeEncumbrance, type EncumbranceState } from "@/types";

// ── Ability Modifier ─────────────────────────────────────────

export function getAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ── Proficiency Bonus ───────────────────────────────────────

export function getProficiencyBonus(level: number): number {
  return Math.ceil(1 + level / 4);
}

// ── Armor Class Calculation ─────────────────────────────────

interface ArmorInfo {
  name: string;
  type: "light" | "medium" | "heavy" | "shield" | "natural" | "unarmored";
  baseAc: number;
  dexCap: number | null; // null = full dex, 0 = no dex
  addsDex: boolean;
  minStr?: number;
  stealthDisadvantage?: boolean;
  weight: number;
}

const ARMOR_DATA: Record<string, ArmorInfo> = {
  // Light Armor
  padded: { name: "Padded", type: "light", baseAc: 11, dexCap: null, addsDex: true, stealthDisadvantage: true, weight: 8 },
  leather: { name: "Leather", type: "light", baseAc: 11, dexCap: null, addsDex: true, weight: 10 },
  studded: { name: "Studded Leather", type: "light", baseAc: 12, dexCap: null, addsDex: true, weight: 13 },
  // Medium Armor
  "hide": { name: "Hide", type: "medium", baseAc: 12, dexCap: 2, addsDex: true, weight: 12 },
  "chain_shirt": { name: "Chain Shirt", type: "medium", baseAc: 13, dexCap: 2, addsDex: true, weight: 20 },
  "scale_mail": { name: "Scale Mail", type: "medium", baseAc: 14, dexCap: 2, addsDex: true, stealthDisadvantage: true, weight: 45 },
  breastplate: { name: "Breastplate", type: "medium", baseAc: 14, dexCap: 2, addsDex: true, weight: 20 },
  half_plate: { name: "Half Plate", type: "medium", baseAc: 15, dexCap: 2, addsDex: true, stealthDisadvantage: true, weight: 40 },
  // Heavy Armor
  "ring_mail": { name: "Ring Mail", type: "heavy", baseAc: 14, dexCap: 0, addsDex: false, stealthDisadvantage: true, weight: 40 },
  "chain_mail": { name: "Chain Mail", type: "heavy", baseAc: 16, dexCap: 0, addsDex: false, minStr: 13, stealthDisadvantage: true, weight: 55 },
  splint: { name: "Splint", type: "heavy", baseAc: 17, dexCap: 0, addsDex: false, minStr: 15, stealthDisadvantage: true, weight: 60 },
  plate: { name: "Plate", type: "heavy", baseAc: 18, dexCap: 0, addsDex: false, minStr: 15, stealthDisadvantage: true, weight: 65 },
  // Shield
  shield: { name: "Shield", type: "shield", baseAc: 2, dexCap: null, addsDex: false, weight: 6 },
};

function normalizeArmorName(name: string): string {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  // Map common variations
  const map: Record<string, string> = {
    "studded_leather": "studded",
    "studded_leather_armor": "studded",
    "leather_armor": "leather",
    "chain_mail": "chain_mail",
    "chainmail": "chain_mail",
    "plate_armor": "plate",
    "half_plate": "half_plate",
    "halfplate": "half_plate",
    "scale_mail": "scale_mail",
    "scalemail": "scale_mail",
    "ring_mail": "ring_mail",
    "ringmail": "ring_mail",
    "breastplate": "breastplate",
  };
  return map[n] || n;
}

export function computeArmorClass(character: PlayerCharacter): number {
  let ac = 10; // base unarmored
  let dexMod = getAbilityMod(character.dexterity);
  let foundArmor = false;
  let hasShield = false;
  let acBonuses = 0;

  for (const equip of character.equipment) {
    const armorKey = normalizeArmorName(equip.item);
    const armor = ARMOR_DATA[armorKey];
    if (armor) {
      if (armor.type === "shield") {
        hasShield = true;
        continue;
      }
      if (armor.type === "light") {
        ac = armor.baseAc;
        foundArmor = true;
      } else if (armor.type === "medium") {
        ac = armor.baseAc;
        acBonuses += Math.min(dexMod, armor.dexCap ?? dexMod);
        foundArmor = true;
      } else if (armor.type === "heavy") {
        ac = armor.baseAc;
        acBonuses += 0; // no dex to heavy
        foundArmor = true;
      }
    }
  }

  // Unarmored Defense (Barbarian/Monk) — check features
  if (!foundArmor) {
    const classNames = character.classes.map(c => c.name.toLowerCase());
    if (classNames.includes("barbarian")) {
      ac = 10 + getAbilityMod(character.constitution) + dexMod;
    } else if (classNames.includes("monk")) {
      ac = 10 + getAbilityMod(character.wisdom) + dexMod;
    } else {
      // Add full dex to unarmored
      ac += dexMod;
    }
  }

  if (foundArmor) {
    // For light armor: add full dex
    const armorKeys = character.equipment.map(e => normalizeArmorName(e.item));
    const primaryArmor = armorKeys.find(k => {
      const a = ARMOR_DATA[k];
      return a && a.type !== "shield";
    });
    const armorInfo = primaryArmor ? ARMOR_DATA[primaryArmor] : null;
    if (armorInfo && armorInfo.addsDex && armorInfo.type === "light") {
      ac += dexMod;
    } else if (armorInfo && armorInfo.addsDex && armorInfo.type === "medium") {
      ac += Math.min(dexMod, 2); // medium caps at +2
    }
    // heavy gets no dex
  }

  // Shield
  if (hasShield) ac += 2;

  // Add flat bonuses from equipment (e.g., Ring of Protection, +1 armor)
  // Parse notes containing "+X AC" or "+X to AC"
  const acNoteRegex = /\+\s*(\d+)\s*(?:to\s*)?AC/i;
  for (const equip of character.equipment) {
    const match = equip.notes?.match(acNoteRegex);
    if (match) ac += parseInt(match[1], 10);
    // Also check item name for "+1" etc.
    const nameMatch = equip.item.match(/\+(\d+)/);
    if (nameMatch && (equip.slot === "armor" || equip.slot === "offhand")) {
      ac += parseInt(nameMatch[1], 10);
    }
  }

  // Apply conditions that modify AC
  if (character.conditions.includes("petrified")) ac; // Still same, but dex is 0
  // Petrified: effectively AC includes -dex penalty, but we handle this via stat block

  return ac;
}

// ── Initiative ──────────────────────────────────────────────

export function computeInitiative(character: PlayerCharacter): number {
  return getAbilityMod(character.dexterity);
}

// ── Speed ───────────────────────────────────────────────────

export function computeSpeed(character: PlayerCharacter): number {
  let speed = character.speed.walk;
  // Race/class modifiers
  const races = character.race.toLowerCase();
  if (races.includes("wood elf") || races.includes("monk") || races.includes("barbarian")) {
    // base 35 handled in character data
  }
  // Encumbrance penalties
  const encumbrance = computeEncumbranceState(character);
  speed += encumbrance.speedReduction;
  return Math.max(0, speed);
}

// ── Encumbrance ─────────────────────────────────────────────

export interface DerivedEncumbrance {
  totalWeight: number;
  carryingCapacity: number;
  encumbranceLevel: string;
  speedReduction: number;
  disadvantageOnChecks: boolean;
}

export function computeEncumbranceState(character: PlayerCharacter): DerivedEncumbrance {
  const weightData = computeTotalWeight(
    character.equipment.map(e => ({ item: e.item, quantity: e.quantity, weight: e.weight })),
    character.inventory.map(i => ({ name: i.name, quantity: i.quantity, weight: i.weight })),
    character.currency
  );
  const str = character.strength;
  const capacity = str * 15;
  const total = weightData.total;

  // Variant encumbrance thresholds
  let level: string;
  let speedReduction = 0;
  let disadvantageOnChecks = false;

  if (total > capacity) {
    level = "overencumbered";
    speedReduction = 0;
    disadvantageOnChecks = true;
  } else if (total > capacity * 0.666) {
    level = "heavily encumbered";
    speedReduction = -20;
    disadvantageOnChecks = true;
  } else if (total > capacity * 0.333) {
    level = "lightly encumbered";
    speedReduction = -10;
    disadvantageOnChecks = false;
  } else {
    level = "unencumbered";
    speedReduction = 0;
    disadvantageOnChecks = false;
  }

  return { totalWeight: total, carryingCapacity: capacity, encumbranceLevel: level, speedReduction, disadvantageOnChecks };
}

// ── Spellcasting ────────────────────────────────────────────

export interface DerivedSpellcasting {
  casterType: CasterType | null;
  isCaster: boolean;
  spellSlots: SpellSlotsFull | null;
  spellSaveDC: number;
  spellAttackBonus: number;
  spellcastingAbility: string;
  spellcastingMod: number;
}

const SPELLCASTING_ABILITY: Record<string, string> = {
  wizard: "intelligence",
  cleric: "wisdom",
  druid: "wisdom",
  sorcerer: "charisma",
  bard: "charisma",
  paladin: "charisma",
  ranger: "wisdom",
  artificer: "intelligence",
  warlock: "charisma",
};

export function computeSpellcasting(character: PlayerCharacter): DerivedSpellcasting {
  const classes = character.classes && character.classes.length > 0
    ? character.classes.map(c => ({ name: c.name, level: c.level }))
    : [{ name: character.class || "Fighter", level: character.level }];

  // Use the multiclass engine for ALL characters (handles single-class too)
  const abilities = {
    strength: character.strength || 10,
    dexterity: character.dexterity || 10,
    constitution: character.constitution || 10,
    intelligence: character.intelligence || 10,
    wisdom: character.wisdom || 10,
    charisma: character.charisma || 10,
  };
  const pb = getProficiencyBonus(character.level);
  const mcState = computeMulticlassSpellcasting(classes, abilities, pb);

  // Determine casting class for ability display
  const primaryClass = classes[0]?.name?.toLowerCase() || "";
  const abilityName = SPELLCASTING_ABILITY[primaryClass] || "intelligence";

  let spellSlots: SpellSlotsFull | null = null;
  if (mcState.isCaster) {
    spellSlots = mcState.multiclassSlots;

    // If character has stored spell slot data, merge current values
    if (character.spellSlots) {
      const merged = {} as SpellSlotsFull;
      for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
        const key = `level${lvl}` as keyof SpellSlotsFull;
        const computed = mcState.multiclassSlots[key];
        const stored = (character.spellSlots as any)[key];
        if (computed) {
          merged[key] = {
            ...computed,
            current: stored
              ? Math.min(stored.current ?? computed.current, computed.max)
              : computed.current,
          };
        }
      }
      spellSlots = merged;
    }
  }

  return {
    casterType: mcState.isCaster ? (mcState.effectiveCasterLevel > 0 ? "full" : mcState.pactSlots.hasPactMagic ? "pact" : "none") : null,
    isCaster: mcState.isCaster,
    spellSlots,
    spellSaveDC: mcState.spellSaveDC,
    spellAttackBonus: mcState.spellAttackBonus,
    spellcastingAbility: abilityName,
    spellcastingMod: mcState.spellcastingAbilityMod,
  };
}

// ── Full Derived State ──────────────────────────────────────

export interface CharacterDerivations {
  abilityMods: Record<string, number>;
  proficiencyBonus: number;
  ac: number;
  acBreakdown: string;
  initiative: number;
  speed: { walk: number; fly?: number; swim?: number; climb?: number };
  encumbrance: DerivedEncumbrance;
  spellcasting: DerivedSpellcasting;
  hitDieType: string;
  maxHp: number;
  isDead: boolean;
  isUnconscious: boolean;
  isConcentrating: boolean;
  conditionsActive: string[];
}

export function computeAllDerivations(character: PlayerCharacter): CharacterDerivations {
  const abilities = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
  const abilityMods: Record<string, number> = {};
  abilities.forEach(ab => {
    abilityMods[ab] = getAbilityMod((character as any)[ab] ?? 10);
  });

  const pb = getProficiencyBonus(character.level);
  const ac = computeArmorClass(character);

  // AC breakdown for display
  let acBreakdown = `10 + ${getAbilityMod(character.dexterity)} (DEX)`;
  if (ac > 10) acBreakdown = `${ac}`;

  const initiative = computeInitiative(character);
  const encumbrance = computeEncumbranceState(character);
  const spellcasting = computeSpellcasting(character);

  // Conditions
  const conditionsActive = character.conditions || [];
  const isDead = conditionsActive.includes("unconscious") && conditionsActive.includes("death") || false;
  const isUnconscious = conditionsActive.includes("unconscious") || isDead;
  const isConcentrating = conditionsActive.includes("concentration");

  // Hit dice
  const hitDieType = character.hitDice || "1d8";

  return {
    abilityMods,
    proficiencyBonus: pb,
    ac,
    acBreakdown,
    initiative,
    speed: character.speed,
    encumbrance,
    spellcasting,
    hitDieType,
    maxHp: character.hitPoints.max,
    isDead,
    isUnconscious,
    isConcentrating,
    conditionsActive,
  };
}
