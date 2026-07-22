/**
 * STᚱ VTT — Weapon Mastery System (D&D 5.5e)
 *
 * All weapons that grant mastery properties as defined in the
 * 2024 Player's Handbook. Martial characters (Fighters, Barbarians,
 * Paladins, Rangers, Monks, Rogues) can use one mastery per weapon
 * they are proficient with.
 */

export type MasteryType =
  | "cleave" | "graze" | "push" | "sap"
  | "slow" | "topple" | "vex" | "nick";

export interface WeaponMastery {
  type: MasteryType;
  name: string;
  summary: string;
  effect: string;
  icon: string;
}

/** All 8 weapon masteries with their 5.5e mechanics */
export const WEAPON_MASTERIES: Record<MasteryType, WeaponMastery> = {
  cleave: {
    type: "cleave",
    name: "Cleave",
    summary: "Hit a second target nearby",
    effect: "If you hit a creature with a melee weapon and damage it, you can make an additional attack against a different creature within 5 ft of the original target. The extra attack uses the same weapon and adds no ability modifier to damage.",
    icon: "⚔️",
  },
  graze: {
    type: "graze",
    name: "Graze",
    summary: "Deal damage even on a miss",
    effect: "If you miss with a melee weapon attack, you still deal damage equal to your Strength modifier (minimum 1). This damage is of the weapon's normal type.",
    icon: "💫",
  },
  push: {
    type: "push",
    name: "Push",
    summary: "Push target 10 ft away",
    effect: "If you hit a creature with a weapon, you can push it up to 10 feet away from you in a straight line. The creature must be Large or smaller.",
    icon: "💨",
  },
  sap: {
    type: "sap",
    name: "Sap",
    summary: "Disadvantage on target's next attack",
    effect: "If you hit a creature with a weapon, it has disadvantage on its next attack roll before the start of your next turn.",
    icon: "😵",
  },
  slow: {
    type: "slow",
    name: "Slow",
    summary: "Reduce target's speed by 10 ft",
    effect: "If you hit a creature with a weapon and deal damage, its Speed is reduced by 10 feet until the start of your next turn. If it is hit multiple times, this penalty does not stack.",
    icon: "🐢",
  },
  topple: {
    type: "topple",
    name: "Topple",
    summary: "Knock the target prone",
    effect: "If you hit a creature with a weapon, the target must succeed on a Constitution saving throw (DC = 8 + your proficiency bonus + your Strength modifier) or be knocked prone.",
    icon: "💥",
  },
  vex: {
    type: "vex",
    name: "Vex",
    summary: "Advantage on next attack against target",
    effect: "If you hit a creature with a weapon and deal damage to it, you have advantage on your next attack roll against that creature before the end of your next turn.",
    icon: "🎯",
  },
  nick: {
    type: "nick",
    name: "Nick",
    summary: "Extra attack with Light weapon as part of Attack",
    effect: "When you make the extra attack of the Light weapon property, you can make it as part of the Attack action instead of a Bonus Action. You can add your ability modifier to the damage.",
    icon: "⚡",
  },
};

/** Mastery assignments by weapon name (5.5e RAW) */
export const WEAPON_MASTERY_ASSIGNMENTS: Record<string, MasteryType> = {
  "Battleaxe": "topple",
  "Club": "slow",
  "Dagger": "nick",
  "Flail": "sap",
  "Glaive": "cleave",
  "Greataxe": "cleave",
  "Greatclub": "push",
  "Greatsword": "graze",
  "Halberd": "cleave",
  "Handaxe": "vex",
  "Javelin": "slow",
  "Lance": "topple",
  "Light Hammer": "nick",
  "Longbow": "slow",
  "Longsword": "sap",
  "Mace": "sap",
  "Maul": "topple",
  "Morningstar": "sap",
  "Pike": "push",
  "Quarterstaff": "topple",
  "Rapier": "vex",
  "Scimitar": "nick",
  "Shortbow": "vex",
  "Shortsword": "vex",
  "Sickle": "nick",
  "Spear": "topple",
  "Trident": "topple",
  "War Pick": "sap",
  "Warhammer": "push",
  "Whip": "slow",
  "Crossbow, Hand": "vex",
  "Crossbow, Heavy": "push",
  "Crossbow, Light": "slow",
  "Blowgun": "vex",
  "Dart": "vex",
  "Net": "sap",
  "Sling": "slow",
};

export function getWeaponMastery(masteryType: MasteryType): WeaponMastery {
  return WEAPON_MASTERIES[masteryType];
}

export function getMasteryForWeapon(weaponName: string): MasteryType | undefined {
  return WEAPON_MASTERY_ASSIGNMENTS[weaponName];
}

/** Classes that can use Weapon Mastery */
export const MARTIAL_CLASSES = new Set([
  "Barbarian", "Fighter", "Paladin", "Ranger",
  "Monk", "Rogue", "Artificer",
]);
