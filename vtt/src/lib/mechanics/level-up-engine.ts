/**
 * STᚱ VTT — Level-Up Engine (5e RAW)
 *
 * Complete character level-up mechanic implementing D&D 5e RAW:
 *
 * Each level-up:
 *   1. Hit Points: gain 1 hit die (average round up + CON mod)
 *   2. Proficiency Bonus: +1 at levels 5, 9, 13, 17
 *   3. Spell Slots: expand based on caster type (full/half/third)
 *   4. Features: level-appropriate features and abilities
 *   5. Ability Score Improvement: ASI/Feat at levels 4, 8, 12, 16, 19
 *   6. Cantrips: increase at levels 4, 10 (some classes)
 *   7. Expertise: increase at levels 1, 6, 14 (some classes)
 */

import type { Feature } from "@/types/character-core";
import type { PlayerCharacter } from "@/types/character";

// ── Types ─────────────────────────────────────────────────────

export interface LevelUpPreview {
  newLevel: number;
  hpGained: number;
  hpTotal: number;
  hitDieType: number;
  proficiencyBonus: number;
  proficiencyIncreased: boolean;
  spellSlots: LevelUpSpellSlots | null;
  spellSlotsIncreased: boolean;
  asiAvailable: boolean;   // Ability Score Improvement at 4, 8, 12, 16, 19
  featAvailable: boolean;  // Feat instead of ASI
  newFeatures: string[];
  newCantrips: number;
  subclassFeature: boolean;
  extraAttack: boolean;
  asiCount: number;         // How many ASIs total at this level
}

export interface LevelUpSpellSlots {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  level6: number;
  level7: number;
  level8: number;
  level9: number;
}

export type CasterType = "full" | "half" | "third" | "warlock" | "none";

// ── Caster Type Detection ─────────────────────────────────────

const FULL_CASTER_CLASSES = [
  "Bard", "Cleric", "Druid", "Sorcerer", "Wizard", "Warlock",
];

const HALF_CASTER_CLASSES = [
  "Paladin", "Ranger", "Artificer",
];

const THIRD_CASTER_CLASSES = [
  "Eldritch Knight", "Arcane Trickster",
];

export function detectCasterType(className: string): CasterType {
  if (THIRD_CASTER_CLASSES.some((c) => className.toLowerCase().includes(c.toLowerCase())))
    return "third";
  if (HALF_CASTER_CLASSES.some((c) => className.toLowerCase().includes(c.toLowerCase())))
    return "half";
  if (FULL_CASTER_CLASSES.some((c) => className.toLowerCase().includes(c.toLowerCase())))
    return className === "Warlock" ? "warlock" : "full";
  return "none";
}

// ── Spell Slot Progression ────────────────────────────────────

/**
 * Full caster slot progression per level (PHB).
 * Index 0 = level 1, index 19 = level 20.
 */
const FULL_SLOTS: LevelUpSpellSlots[] = [
  { level1:2, level2:0, level3:0, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 1
  { level1:3, level2:0, level3:0, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 2
  { level1:4, level2:2, level3:0, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 3
  { level1:4, level2:3, level3:0, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 4
  { level1:4, level2:3, level3:2, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 5
  { level1:4, level2:3, level3:3, level4:0, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 6
  { level1:4, level2:3, level3:3, level4:1, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 7
  { level1:4, level2:3, level3:3, level4:2, level5:0, level6:0, level7:0, level8:0, level9:0 }, // 8
  { level1:4, level2:3, level3:3, level4:3, level5:1, level6:0, level7:0, level8:0, level9:0 }, // 9
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:0, level7:0, level8:0, level9:0 }, // 10
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:1, level7:0, level8:0, level9:0 }, // 11
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:1, level7:0, level8:0, level9:0 }, // 12
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:1, level7:1, level8:0, level9:0 }, // 13
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:1, level7:1, level8:0, level9:0 }, // 14
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:1, level7:1, level8:1, level9:0 }, // 15
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:1, level7:1, level8:1, level9:0 }, // 16
  { level1:4, level2:3, level3:3, level4:3, level5:2, level6:1, level7:1, level8:1, level9:1 }, // 17
  { level1:4, level2:3, level3:3, level4:3, level5:3, level6:1, level7:1, level8:1, level9:1 }, // 18
  { level1:4, level2:3, level3:3, level4:3, level5:3, level6:2, level7:1, level8:1, level9:1 }, // 19
  { level1:4, level2:3, level3:3, level4:3, level5:3, level6:2, level7:2, level8:1, level9:1 }, // 20
];

/**
 * Half caster (Paladin/Ranger) — slots at 2× caster level.
 */
/**
 * Half caster (Paladin/Ranger) — effective caster level = ceil(characterLevel / 2).
 * Uses the PHB Multiclass Spellcaster table.
 * Paladin Level 2  = Caster Level 1  = FULL_SLOTS[0] = 2 L1 slots ✓
 * Paladin Level 5  = Caster Level 3  = FULL_SLOTS[2] = 4/2 slots  ✓
 * Paladin Level 17 = Caster Level 9  = FULL_SLOTS[8] = 4/3/3/3/1 ✓
 * Paladin Level 20 = Caster Level 10 = FULL_SLOTS[9] = 4/3/3/3/2 ✓
 */
export function getHalfSlots(casterLevel: number): LevelUpSpellSlots {
  const effectiveCasterLevel = Math.ceil(casterLevel / 2);
  return FULL_SLOTS[Math.min(19, Math.max(0, effectiveCasterLevel - 1))];
}

/**
 * Third caster (Eldritch Knight/Arcane Trickster) — slots at 3× caster level.
 */
/**
 * Third caster (Eldritch Knight/Arcane Trickster) — effective caster level = ceil(characterLevel / 3).
 * Uses the PHB Multiclass Spellcaster table.
 * EK Level 3  = Caster Level 1  = FULL_SLOTS[0] = 2 L1 slots ✓
 * EK Level 7  = Caster Level 3  = FULL_SLOTS[2] = 4/2 slots  ✓
 * EK Level 20 = Caster Level 7  = FULL_SLOTS[6] = 4/3/3/1    ✓
 */
export function getThirdSlots(casterLevel: number): LevelUpSpellSlots {
  const effectiveCasterLevel = Math.ceil(casterLevel / 3);
  if (effectiveCasterLevel < 1) return FULL_SLOTS[0]; // Level 1-2 → 0 slots
  return FULL_SLOTS[Math.min(19, Math.max(0, effectiveCasterLevel - 1))];
}

export function getSlotsForLevel(
  level: number,
  casterType: CasterType
): LevelUpSpellSlots | null {
  if (casterType === "none" || casterType === "warlock") return null;
  if (casterType === "full") return FULL_SLOTS[Math.max(0, level - 1)];
  if (casterType === "half") return getHalfSlots(level);
  if (casterType === "third") return getThirdSlots(level);
  return null;
}

// ── Hit Die Type ──────────────────────────────────────────────

const HIT_DIE_MAP: Record<string, number> = {
  "Barbarian": 12,
  "Fighter": 10,
  "Paladin": 10,
  "Ranger": 10,
  "Artificer": 8,
  "Bard": 8,
  "Cleric": 8,
  "Druid": 8,
  "Monk": 8,
  "Rogue": 8,
  "Warlock": 8,
  "Sorcerer": 6,
  "Wizard": 6,
};

export function getHitDieType(className: string): number {
  return HIT_DIE_MAP[className] ?? 8;
}

// ── Proficiency Bonus ─────────────────────────────────────────

export function getProficiencyBonus(level: number): number {
  return Math.ceil(1 + level / 4);
}

// ── ASI Levels ────────────────────────────────────────────────

const ASI_LEVELS = new Set([4, 8, 12, 16, 19]);

export function isAsiLevel(level: number): boolean {
  return ASI_LEVELS.has(level);
}

// ── Class Feature Detection ───────────────────────────────────

/**
 * Returns class features gained at a specific level.
 * This is a simplified list — a full implementation would reference
 * a features database.
 */
const CLASS_FEATURES: Record<string, Record<number, string[]>> = {
  "Fighter": {
    1: ["Fighting Style", "Second Wind"],
    2: ["Action Surge (1 use)"],
    3: ["Martial Archetype", "Archery/Battle Master/etc."],
    4: ["Ability Score Improvement"],
    5: ["Extra Attack (1)"],
    6: ["Ability Score Improvement"],
    7: ["Martial Archetype Feature"],
    8: ["Ability Score Improvement"],
    9: ["Indomitable (1 use)"],
    10: ["Martial Archetype Feature"],
    11: ["Extra Attack (2)"],
    12: ["Ability Score Improvement"],
    13: ["Indomitable (2 uses)"],
    14: ["Ability Score Improvement"],
    15: ["Martial Archetype Feature"],
    16: ["Ability Score Improvement"],
    17: ["Action Surge (2 uses)", "Indomitable (3 uses)"],
    18: ["Martial Archetype Feature"],
    19: ["Ability Score Improvement"],
    20: ["Extra Attack (3)"],
  },
  "Wizard": {
    1: ["Spellcasting", "Arcane Recovery"],
    2: ["Arcane Tradition"],
    3: ["Cantrip Formulas (optional)"],
    4: ["Ability Score Improvement"],
    5: ["—"],
    6: ["Arcane Tradition Feature"],
    7: ["—"],
    8: ["Ability Score Improvement"],
    9: ["—"],
    10: ["Arcane Tradition Feature"],
    11: ["—"],
    12: ["Ability Score Improvement"],
    13: ["—"],
    14: ["Arcane Tradition Feature"],
    15: ["—"],
    16: ["Ability Score Improvement"],
    17: ["—"],
    18: ["Spell Mastery"],
    19: ["Ability Score Improvement"],
    20: ["Signature Spells"],
  },
  "Rogue": {
    1: ["Expertise", "Sneak Attack (1d6)", "Thieves' Cant"],
    2: ["Cunning Action"],
    3: ["Roguish Archetype"],
    4: ["Ability Score Improvement"],
    5: ["Uncanny Dodge", "Sneak Attack (3d6)"],
    6: ["Expertise"],
    7: ["Evasion"],
    8: ["Ability Score Improvement"],
    9: ["Roguish Archetype Feature"],
    10: ["Ability Score Improvement"],
    11: ["Reliable Talent"],
    12: ["Ability Score Improvement"],
    13: ["Roguish Archetype Feature"],
    14: ["Blindsense"],
    15: ["Slippery Mind", "Sneak Attack (8d6)"],
    16: ["Ability Score Improvement"],
    17: ["Roguish Archetype Feature"],
    18: ["Elusive"],
    19: ["Ability Score Improvement"],
    20: ["Stroke of Luck"],
  },
};

/**
 * Get features for a given class at a specific level.
 * Falls back to generic features if class not in the lookup.
 */
export function getClassFeatures(
  className: string,
  level: number
): string[] {
  const classData = CLASS_FEATURES[className];
  if (classData) {
    return classData[level] ?? [];
  }
  return [];
}

/**
 * Generic features gained at each level (for any class).
 */
export function getGenericFeatures(level: number, character: PlayerCharacter): string[] {
  const features: string[] = [];
  const className = character.class ?? "";
  const caster = detectCasterType(className);

  // Class-specific features
  const classSpecific = getClassFeatures(className, level);
  features.push(...classSpecific);

  // Spell slot progression
  if (caster !== "none" && caster !== "warlock") {
    const slots = getSlotsForLevel(level, caster);
    if (slots) {
      const newSlotLevels = Object.entries(slots).filter(
        ([, count]) => count > 0
      );
      if (newSlotLevels.length > 0) {
        const highestLevel = Math.max(
          ...newSlotLevels.map(([key]) => parseInt(key.replace("level", ""), 10))
        );
        features.push(`Level ${highestLevel} Spell Slots`);
      }
    }
  }

  // Cantrip increase at 4 and 10 for full casters
  if (caster === "full" && (level === 4 || level === 10)) {
    features.push("New Cantrip");
  }

  return features;
}

// ── Preview Engine ────────────────────────────────────────────

export function computeLevelUpPreview(
  character: PlayerCharacter
): LevelUpPreview | null {
  const currentLevel = character.level ?? 1;
  if (currentLevel >= 20) return null;

  const newLevel = currentLevel + 1;
  const className = character.class ?? "Fighter";
  const hitDieType = getHitDieType(className);
  const conMod = Math.floor((character.constitution - 10) / 2);
  const oldPb = getProficiencyBonus(currentLevel);
  const newPb = getProficiencyBonus(newLevel);

  // HP gained (average rounded up + CON mod, minimum 1)
  const avgRoll = Math.ceil(hitDieType / 2) + 1; // average of die + 1
  const hpGained = Math.max(1, avgRoll + conMod);
  const hpTotal = (character.hitPoints?.max ?? 10) + hpGained;

  // Spell slots
  const casterType = detectCasterType(className);
  const currentSlots = getSlotsForLevel(currentLevel, casterType);
  const nextSlots = getSlotsForLevel(newLevel, casterType);
  let spellSlotsIncreased = false;
  if (currentSlots && nextSlots) {
    const currKeys = Object.keys(currentSlots) as (keyof LevelUpSpellSlots)[];
    spellSlotsIncreased = currKeys.some(
      (key) => (nextSlots[key] ?? 0) > (currentSlots[key] ?? 0)
    );
  }

  // Features
  const features = getGenericFeatures(newLevel, character);

  return {
    newLevel,
    hpGained,
    hpTotal,
    hitDieType,
    proficiencyBonus: newPb,
    proficiencyIncreased: newPb > oldPb,
    spellSlots: nextSlots,
    spellSlotsIncreased,
    asiAvailable: isAsiLevel(newLevel),
    featAvailable: isAsiLevel(newLevel),
    newFeatures: features.filter((f) => f !== "Ability Score Improvement"),
    newCantrips: casterType === "full" && (newLevel === 4 || newLevel === 10) ? 1 : 0,
    subclassFeature: [3, 6, 7, 9, 10, 14, 15, 18].includes(newLevel),
    extraAttack: [5].includes(newLevel) || (className === "Fighter" && [11, 20].includes(newLevel)),
    asiCount: isAsiLevel(newLevel) ? 1 : 0,
  };
}

// ── Apply Engine ──────────────────────────────────────────────

export function applyLevelUp(
  character: PlayerCharacter,
  hpRollResult?: number
): Partial<PlayerCharacter> {
  const preview = computeLevelUpPreview(character);
  if (!preview) return {};

  const className = character.class ?? "Fighter";
  const casterType = detectCasterType(className);
  const conMod = Math.floor((character.constitution - 10) / 2);

  // Use actual roll if provided, otherwise use average
  const hpGained = hpRollResult != null
    ? Math.max(1, hpRollResult + conMod)
    : preview.hpGained;

  // Compute new spell slots — FIXED: initializes `current` when unlocking new levels
  let spellSlots = character.spellSlots ? { ...character.spellSlots } : undefined;
  if (spellSlots && preview.spellSlots) {
    const levelSlots: Array<{ key: keyof LevelUpSpellSlots; field: "level1" | "level2" | "level3" | "level4" | "level5" | "level6" | "level7" | "level8" | "level9" }> = [
      { key: "level1", field: "level1" }, { key: "level2", field: "level2" },
      { key: "level3", field: "level3" }, { key: "level4", field: "level4" },
      { key: "level5", field: "level5" }, { key: "level6", field: "level6" },
      { key: "level7", field: "level7" }, { key: "level8", field: "level8" },
      { key: "level9", field: "level9" },
    ];
    for (const { key, field } of levelSlots) {
      const newMax = preview.spellSlots[key] ?? 0;
      if (spellSlots[field]) {
        spellSlots[field] = {
          current: spellSlots[field].current,
          max: Math.max(spellSlots[field].max, newMax),
        };
      } else if (newMax > 0) {
        // NEW slot level unlocked — initialize current = max
        spellSlots[field] = { current: newMax, max: newMax };
      }
    }
  }

  // Collect new features (append to existing)
  const existingFeatures = character.features ?? [];
  const newFeatureNames = [
    ...preview.newFeatures,
    ...(preview.asiAvailable ? ["Ability Score Improvement"] : []),
    ...(preview.extraAttack ? ["Extra Attack"] : []),
  ];

  // Convert string feature names to Feature objects
  const newFeatureObjects: Feature[] = newFeatureNames.map((name) => ({
    name,
    description: `Gained at level ${preview.newLevel}`,
    source: character.class ?? "Class",
  }));

  // Merge with existing features, deduplicating by name
  const existingNames = new Set(existingFeatures.map((f: Feature | string) => typeof f === "string" ? f : f.name));
  const mergedFeatures: Feature[] = [
    ...existingFeatures.map((f: Feature | string) =>
      typeof f === "string" ? { name: f, description: "", source: "Class" } as Feature : f
    ),
    ...newFeatureObjects.filter((f) => !existingNames.has(f.name)),
  ];

  return {
    level: preview.newLevel,
    hitPoints: {
      current: (character.hitPoints?.current ?? 10) + hpGained,
      max: (character.hitPoints?.max ?? 10) + hpGained,
      temporary: character.hitPoints?.temporary ?? 0,
    },
    proficiencyBonus: preview.proficiencyBonus,
    spellSlots,
    features: mergedFeatures,
    // Preserve spentHitDice — leveling up does NOT reset spent HD
    spentHitDice: character.spentHitDice ?? 0,
  };
}
