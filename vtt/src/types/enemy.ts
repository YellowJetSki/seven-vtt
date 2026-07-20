// ── Enemies ──────────────────────────────────────────────────

export type CreatureType =
  | "Aberration" | "Beast" | "Celestial" | "Construct"
  | "Dragon" | "Elemental" | "Fey" | "Fiend"
  | "Giant" | "Humanoid" | "Monstrosity" | "Ooze"
  | "Plant" | "Undead" | "Custom";

export type CreatureSize = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

/**
 * A structured attack for an enemy NPC, compatible with
 * the unified CombatEntity system established in Sprint 8-12.
 * Weapons created here will inject into the combat tab
 * with full attack bonus, damage expression, and properties.
 */
export interface EnemyAttack {
  id: string;
  name: string;
  /** Attack bonus e.g. +7 */
  attackBonus: number;
  /** Damage dice expression e.g. "2d6" */
  damageDice: string;
  /** Damage type e.g. "slashing", "fire", "piercing" */
  damageType: string;
  /** Whether this is a melee attack */
  isMelee: boolean;
  /** Whether this is a ranged attack */
  isRanged: boolean;
  /** Range string e.g. "5 ft" or "60/120 ft" */
  range: string;
  /** Weapon properties e.g. ["Finesse", "Light", "Reach"] */
  properties: string[];
  /** Optional secondary damage effect */
  secondaryDamage?: string;
  /** Description or notes */
  description?: string;
}

export interface EnemyDoc {
  id: string;
  name: string;
  type: CreatureType;
  size: CreatureSize;
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
  speed: number;
  abilities: AbilityScores;
  savingThrows: Partial<Record<string, number>>;
  skills: Record<string, number>;
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string;
  languages: string;
  challengeRating: number;
  traits?: string;
  actions?: string;
  reactions?: string;
  specialAbilities?: string;
  legendaryActions?: string;
  /** Structured attacks that inject into the Combat Tab entity system */
  attacks?: EnemyAttack[];
  isHomebrew: boolean;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}
