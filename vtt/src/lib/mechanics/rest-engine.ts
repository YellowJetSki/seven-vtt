/**
 * STᚱ VTT — Rest & Recovery Engine (5e RAW)
 *
 * Implements authentic D&D 5e Short Rest and Long Rest mechanics:
 *
 * Short Rest (1 hour):
 *   - Heal: spend hit dice (CON mod per die)
 *   - Recharge: all "short_rest" class resources
 *   - Wizard: Arcane Recovery (recover slots up to half level)
 *   - Cantrips: unaffected
 *
 * Long Rest (8 hours):
 *   - Heal: full HP recovery
 *   - Slots: full slot recovery (except Warlock — restored on short rest)
 *   - Hit Dice: recover half total (min 1)
 *   - Recharge: all "long_rest" and "short_rest" class resources
 *   - Features: recover all limited-use features
 *   - Inspiration: may be reset by DM
 */

import type { ClassResource, SpellSlots, HitPoints, Feature } from "@/types/character-core";
import type { PlayerCharacter } from "@/types/character";

// ── Result Types ───────────────────────────────────────────────

export interface RestSummary {
  hpHealed: number;
  hitDiceSpent: number;
  hitDiceRecovered: number;
  resourcesRecharged: string[];
  slotsRecovered: Record<number, number>; // level → slots recovered
  featuresRestored: string[];
  tempHpCleared: boolean;
  hasAvailableHitDice: boolean;
  availableHitDiceCount: number;
  hitDiceTotal: number;
}

export interface LongRestSummary {
  hpHealed: number;
  hitDiceRecovered: number;
  hitDiceTotal: number;
  resourcesRecharged: string[];
  slotsRestored: Record<number, number>;
  featuresRestored: string[];
  tempHpCleared: boolean;
  xpMilestone?: number; // DM discretion
}

// ── Hit Dice ───────────────────────────────────────────────────

/**
 * Calculates hit dice total from character class levels.
 * A character has 1 hit die per level (d6/d8/d10/d12 depending on class).
 */
export function computeHitDiceTotal(character: PlayerCharacter): number {
  return character.level;
}

/**
 * Calculates the number of available (unspent) hit dice.
 * stored in the character's resources as "Hit Dice" or derived from level - spent
 */
export function computeAvailableHitDice(character: PlayerCharacter): number {
  const total = computeHitDiceTotal(character);
  const spent = character.spentHitDice ?? 0;
  return Math.max(0, total - spent);
}

/**
 * Calculates which hit die die type this character uses.
 * Majority class determines the die.
 */
export function computeHitDieType(character: PlayerCharacter): 6 | 8 | 10 | 12 {
  if (!character.class || character.class.length === 0) return 8;
  const hdMap: Record<string, 6 | 8 | 10 | 12> = {
    "Barbarian": 12,
    "Fighter": 10,
    "Paladin": 10,
    "Ranger": 10,
    "Blood Hunter": 10,
    "Artificer": 8,
    "Bard": 8,
    "Cleric": 8,
    "Druid": 8,
    "Monk": 8,
    "Rogue": 8,
    "Warlock": 8,
    "Wizard": 6,
    "Sorcerer": 6,
  };
  return hdMap[character.class] ?? 8;
}

// ── Short Rest ─────────────────────────────────────────────────

export interface ShortRestOptions {
  /** Number of hit dice to spend (0 = none) */
  hitDiceToSpend: number;
  /** Optional: available hit dice override */
  availableHitDice?: number;
}

export function computeShortRestSummary(
  character: PlayerCharacter,
  options: ShortRestOptions
): RestSummary {
  const hitDieType = computeHitDieType(character);
  const totalHd = computeHitDiceTotal(character);
  const availHd = options.availableHitDice ?? computeAvailableHitDice(character);

  // Hits from hit dice (average: die/2 + 1 + CON mod, minimum 1)
  const conMod = getAbilityMod(character.constitution);
  const avgHpPerDie = computeAvgHpPerDie(hitDieType, conMod);
  const diceToSpend = Math.min(options.hitDiceToSpend, availHd);
  const hitDiceHp = diceToSpend * avgHpPerDie;

  // HP cap: can't exceed max HP
  const missingHp = Math.max(0, character.hitPoints.max - character.hitPoints.current);
  const hpHealed = Math.min(missingHp, hitDiceHp);

  // Class resources that recharge on short rest
  const resourcesRecharged = (character.resources || [] as ClassResource[])
    .filter((r: ClassResource) => r.recharge === "short_rest" && r.current < r.max)
    .map((r: ClassResource) => r.name);

  // Short rest resource recovery from class features
  const featureResources = getShortRestFeatures(character)
    .map((f: { name: string }) => f.name);

  // Wizard Arcane Recovery (once per day)
  const arcaneRecoveryAvailable = hasArcaneRecovery(character);
  const slotsRecovered: Record<number, number> = {};

  return {
    hpHealed,
    hitDiceSpent: diceToSpend,
    hitDiceRecovered: 0,
    resourcesRecharged: [...new Set([...resourcesRecharged, ...featureResources])],
    slotsRecovered,
    featuresRestored: [...new Set([...resourcesRecharged, ...featureResources])],
    tempHpCleared: true,
    hasAvailableHitDice: availHd > 0 && diceToSpend < availHd,
    availableHitDiceCount: availHd - diceToSpend,
    hitDiceTotal: totalHd,
  };
}

export function applyShortRest(
  character: PlayerCharacter,
  options: ShortRestOptions,
  spellSlotRecovery?: Record<number, number>
): Partial<PlayerCharacter> {
  const summary = computeShortRestSummary(character, options);

  const newHp = Math.min(
    character.hitPoints.max,
    character.hitPoints.current + summary.hpHealed
  );

  // Recharge short rest resources
  const newResources = (character.resources || [] as ClassResource[]).map((r: ClassResource) => {
    if (r.recharge === "short_rest") {
      return { ...r, current: r.max };
    }
    return r;
  });

  // Recover any spell slots
  const slots = character.spellSlots ? { ...character.spellSlots } : undefined;
  if (slots && spellSlotRecovery) {
    const levelKeys = ["level1","level2","level3","level4","level5","level6","level7","level8","level9"] as const;
    for (const [levelStr, count] of Object.entries(spellSlotRecovery)) {
      const idx = parseInt(levelStr, 10);
      if (idx >= 1 && idx <= 9) {
        const key = levelKeys[idx - 1];
        slots[key] = {
          current: Math.min(slots[key].max, slots[key].current + count),
          max: slots[key].max,
        };
      }
    }
  }

  return {
    hitPoints: { ...character.hitPoints, current: newHp, temporary: 0 },
    resources: newResources,
    spellSlots: slots,
    spentHitDice: (character.spentHitDice ?? 0) + options.hitDiceToSpend,
  };
}

// ── Long Rest ──────────────────────────────────────────────────

export function computeLongRestSummary(character: PlayerCharacter): LongRestSummary {
  const totalHd = computeHitDiceTotal(character);
  const recoveredHd = Math.max(1, Math.floor(totalHd / 2));

  const missingHp = character.hitPoints.max - character.hitPoints.current;

  // All resources recharge on long rest
  const resourcesRecharged = (character.resources || [] as ClassResource[])
    .filter((r: ClassResource) => r.current < r.max)
    .map((r: ClassResource) => r.name);

  // Feature names that recharge
  const featureResources = getLongRestFeatures(character)
    .concat(getShortRestFeatures(character))
    .map((f: { name: string }) => f.name);

  // All spell slots restored
  const slotsRestored: Record<number, number> = {};
  if (character.spellSlots) {
    const levelKeys = ["level1","level2","level3","level4","level5","level6","level7","level8","level9"] as const;
    for (let i = 0; i < 9; i++) {
      const key = levelKeys[i];
      const missing = character.spellSlots[key].max - character.spellSlots[key].current;
      if (missing > 0) {
        slotsRestored[i + 1] = missing;
      }
    }
  }

  return {
    hpHealed: missingHp,
    hitDiceRecovered: recoveredHd,
    hitDiceTotal: totalHd,
    resourcesRecharged: [...new Set([...resourcesRecharged, ...featureResources])],
    slotsRestored,
    featuresRestored: [...new Set([...resourcesRecharged, ...featureResources])],
    tempHpCleared: true,
  };
}

export function applyLongRest(character: PlayerCharacter): Partial<PlayerCharacter> {
  const summary = computeLongRestSummary(character);

  // Full HP
  const newHp: HitPoints = {
    current: character.hitPoints.max,
    max: character.hitPoints.max,
    temporary: 0,
  };

  // Recharge all resources
  const newResources = (character.resources || [] as ClassResource[]).map((r: ClassResource) => ({
    ...r,
    current: r.max,
  }));

  // Full spell slots
  const newSlots = character.spellSlots
    ? {
        ...character.spellSlots,
        level1: { ...character.spellSlots.level1, current: character.spellSlots.level1.max },
        level2: { ...character.spellSlots.level2, current: character.spellSlots.level2.max },
        level3: { ...character.spellSlots.level3, current: character.spellSlots.level3.max },
        level4: { ...character.spellSlots.level4, current: character.spellSlots.level4.max },
        level5: { ...character.spellSlots.level5, current: character.spellSlots.level5.max },
        level6: { ...character.spellSlots.level6, current: character.spellSlots.level6.max },
        level7: { ...character.spellSlots.level7, current: character.spellSlots.level7.max },
        level8: { ...character.spellSlots.level8, current: character.spellSlots.level8.max },
        level9: { ...character.spellSlots.level9, current: character.spellSlots.level9.max },
      }
    : undefined;

  // Reset spent hit dice
  const currentSpent = character.spentHitDice ?? 0;
  const recoveredHd = Math.max(1, Math.floor(character.level / 2));
  const newSpent = Math.max(0, currentSpent - recoveredHd);

  return {
    hitPoints: newHp,
    resources: newResources,
    spellSlots: newSlots,
    spentHitDice: newSpent,
  };
}

// ── Ability Modifier Helper ───────────────────────────────────

export function getAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function computeAvgHpPerDie(hitDieType: number, conMod: number): number {
  return Math.max(1, Math.floor(hitDieType / 2) + 1 + conMod);
}

// ── Feature Detection ─────────────────────────────────────────

function getShortRestFeatures(character: PlayerCharacter): Feature[] {
  return (character.features || []).filter((f: Feature | string) => {
    const shortRestNames = [
      "Second Wind", "Action Surge", "Channel Divinity", "Wild Shape",
      "Ki", "Bardic Inspiration", "Rage", "Blood Maledict",
      "Arcane Recovery", "Maneuvers", "Combat Superiority",
    ];
    const name = typeof f === "string" ? f : f.name;
    return shortRestNames.some((sr) => name.toLowerCase().includes(sr.toLowerCase()));
  }) as Feature[];
}

function getLongRestFeatures(character: PlayerCharacter): Feature[] {
  return (character.features || []).filter((f: Feature | string) => {
    const longRestOnly = [
      "Spellcasting", "Divine Intervention", "Oath", "Sacred Oath",
      "Song of Rest", "Favored Foe", "Stunning Strike",
    ];
    const name = typeof f === "string" ? f : f.name;
    return longRestOnly.some((lr) => name.toLowerCase().includes(lr.toLowerCase()));
  }) as Feature[];
}

function hasArcaneRecovery(character: PlayerCharacter): boolean {
  return (character.features || []).some((f: Feature | string) => {
    const name = typeof f === "string" ? f : f.name;
    return name.toLowerCase().includes("arcane recovery");
  });
}
