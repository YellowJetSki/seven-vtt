/**
 * STᚱ VTT — Homebrew Types (v2.0)
 *
 * Enhanced with stat integration, VTT AoE fields,
 * visibility controls, and structured prerequisites.
 */

export interface HomebrewItem {
  id: string;
  name: string;
  category: string;
  rarity: string;
  description: string;
  flavorText?: string;
  requiresAttunement: boolean;
  attunementDetails?: string;
  /** Weapon damage dice, e.g. "1d8" */
  damageDice?: string;
  /** Damage type, e.g. "slashing", "fire" */
  damageType?: string;
  /** Flat bonus to attack rolls (weapons) */
  attackBonus?: number;
  /** AC bonus (armor) */
  acBonus?: number;
  charges?: number;
  chargesMax?: number;
  chargesRecharge?: string;
  weight: number;
  value: number;
  isCursed: boolean;
  curseDetails?: string;
  imageUrl?: string;
  tags: string[];
  /** Whether this item is visible to players in the compendium */
  visibleToPlayers: boolean;
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HomebrewSpell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  ritual: boolean;
  components: string[];
  materialComponent?: string;
  concentration: boolean;
  duration: string;
  range: string;
  /** VTT area shape for AoE placement */
  shape?: "circle" | "cone" | "cube" | "sphere" | "line" | "cylinder";
  /** Area size in feet */
  areaSize?: number;
  /** Spell save DC override (if not using caster's) */
  saveDC?: number;
  /** Spell attack bonus override (if not using caster's) */
  spellAttackBonus?: number;
  /** Damage dice, e.g. "8d6" */
  damageDice?: string;
  /** Damage type */
  damageType?: string;
  /** Healing dice, e.g. "1d8" */
  healDice?: string;
  classes: string[];
  description: string;
  atHigherLevels?: string;
  visibleToPlayers: boolean;
  isHomebrew: boolean;
  source: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface HomebrewFeat {
  id: string;
  name: string;
  description: string;
  flavorText?: string;
  prerequisites: FeatPrerequisite[];
  benefits: string[];
  /** Which ability score this feat increases, e.g. "strength" or "strength,constitution" */
  abilityScoreIncrease?: string;
  /** Skills this feat grants proficiency in */
  skillProficiencies?: string[];
  repeatable: boolean;
  visibleToPlayers: boolean;
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FeatPrerequisite {
  type: string;
  description: string;
  ability?: string;
  minimumValue?: number;
}

/** JSON export/import envelope */
export interface HomebrewExport {
  version: number;
  exportedAt: number;
  campaign?: string;
  items: HomebrewItem[];
  spells: HomebrewSpell[];
  feats: HomebrewFeat[];
}

export const HOME_EXPORT_VERSION = 1;
