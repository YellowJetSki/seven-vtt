/* ── Homebrew Types ──────────────────────────────────────────── */

/* ── Items ──────────────────────────────────────────────────── */

export type ItemCategory = "weapon" | "armor" | "potion" | "scroll" | "wand" | "ring" | "wondrous" | "tool" | "ammunition" | "food" | "poison" | "other";

export type WeaponType = "simple melee" | "simple ranged" | "martial melee" | "martial ranged";
export type WeaponProperty = "ammunition" | "finesse" | "heavy" | "light" | "loading" | "range" | "reach" | "special" | "thrown" | "two-handed" | "versatile" | "silvered" | "magical";
export type DamageType = "bludgeoning" | "piercing" | "slashing" | "acid" | "cold" | "fire" | "force" | "lightning" | "necrotic" | "poison" | "psychic" | "radiant" | "thunder";
export type ArmorType = "light" | "medium" | "heavy" | "shield";
export type Rarity = "common" | "uncommon" | "rare" | "very rare" | "legendary" | "artifact" | "varies";

export interface ItemWeaponData {
  weaponType: WeaponType;
  damageDice: string;       // e.g. "1d8"
  damageType: DamageType;
  properties: WeaponProperty[];
  rangeNormal: number;      // feet
  rangeMax?: number;        // feet (for ranged)
  versatileDice?: string;   // e.g. "1d10"
  throwRangeNormal?: number;
  throwRangeMax?: number;
  attackBonus?: number;
  damageBonus?: number;
  isSilvered?: boolean;
  isMagical?: boolean;
}

export interface ItemArmorData {
  armorType: ArmorType;
  baseAC: number;
  dexBonus?: "full" | "up to 2" | "none";
  stealthDisadvantage: boolean;
  strengthRequirement?: number;
  maxDexBonus?: number;     // for medium armor
  isShield: boolean;        // shields are a separate slot
  shieldACBonus?: number;   // +2 for standard shield
}

export interface ItemPotionData {
  effect: string;
  duration?: string;
  level?: number;           // spell level if mimicking a spell
  requiresAttunement?: boolean;
}

export interface ItemScrollData {
  spellName: string;
  spellLevel: number;
  spellSchool: string;
  requiresAttunement?: boolean;
}

/**
 * Generic homebrew item — the "categoryFields" is a discriminated union
 * based on `category`. This keeps the type system clean for weapons vs. armor.
 */
export interface HomebrewItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: Rarity;
  description: string;
  flavorText?: string;
  requiresAttunement: boolean;
  attunementDetails?: string;
  charges?: number;
  chargesMax?: number;
  chargesRecharge?: string;  // e.g. "dawn", "dusk", "short rest", "long rest"
  weight: number;            // lbs
  value: number;             // gp
  isCursed: boolean;
  curseDetails?: string;
  imageUrl?: string;         // Firebase Storage URL or base64 for DM uploads

  /** Discriminated fields based on category */
  weaponData?: ItemWeaponData;
  armorData?: ItemArmorData;
  potionData?: ItemPotionData;
  scrollData?: ItemScrollData;

  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Feats ──────────────────────────────────────────────────── */

export type FeatPrerequisiteType = "ability" | "class" | "race" | "spellcasting" | "level" | "proficiency" | "other";

export interface FeatPrerequisite {
  type: FeatPrerequisiteType;
  description: string;
  /** For ability prerequisites, e.g. "Strength 13" */
  ability?: string;
  minimumValue?: number;
}

export interface HomebrewFeat {
  id: string;
  name: string;
  description: string;        // The full mechanical description
  flavorText?: string;         // Optional RP fluff
  prerequisites: FeatPrerequisite[];
  benefits: string[];          // Bullet-point list of what the feat grants
  repeatable: boolean;         // Can this feat be taken multiple times?
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Spells ─────────────────────────────────────────────────── */

export type SpellSchool = "abjuration" | "conjuration" | "divination" | "enchantment" | "evocation" | "illusion" | "necromancy" | "transmutation";
export type SpellCastingTime = "action" | "bonus action" | "reaction" | "minute" | "hour" | "special";
export type SpellDuration = "instantaneous" | "concentration" | string; // free-text for "1 minute", "1 hour", etc.
export type SpellRange = "self" | "touch" | "sight" | "unlimited" | "special" | string;
export type SpellComponent = "V" | "S" | "M";
export type SpellClass = "artificer" | "bard" | "cleric" | "druid" | "paladin" | "ranger" | "sorcerer" | "warlock" | "wizard";

export interface HomebrewSpell {
  id: string;
  name: string;
  level: number;               // 0 = cantrip
  school: SpellSchool;
  castingTime: SpellCastingTime;
  ritual: boolean;
  components: SpellComponent[];
  materialComponent?: string;   // The specific M component text
  concentration: boolean;
  duration: SpellDuration;
  range: SpellRange;
  area?: string;                // e.g. "20-foot-radius sphere"
  classes: SpellClass[];

  description: string;          // Main effect text
  atHigherLevels?: string;      // Scaling text
  isHomebrew: boolean;
  source: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/* ── Homebrew Library ────────────────────────────────────────── */

export interface HomebrewLibrary {
  items: HomebrewItem[];
  feats: HomebrewFeat[];
  spells: HomebrewSpell[];
}
