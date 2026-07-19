/**
 * STᚱ VTT — Race & Class Data Definitions
 *
 * Canonical definitions for all D&D 5e races and classes.
 * Designed for seamless Homebrew integration — custom races/classes
 * use the exact same schema as official content.
 *
 * Data Sources: D&D 5e SRD, Player's Handbook, Tasha's Cauldron, Xanathar's Guide
 */

import type { Speed } from "./character-core";

// ── Race Definition ───────────────────────────────────────────

export interface RaceDefinition {
  id: string;
  name: string;
  /** Source book or "homebrew" */
  source: string;
  /** Creature size */
  size: "Tiny" | "Small" | "Medium" | "Large";
  /** Base speed in feet */
  baseSpeed: number;
  /** Special movement speeds */
  specialSpeeds?: Partial<Speed>;
  /** Ability score increases e.g. "Strength +2, Constitution +1" */
  abilityBonuses: AbilityBonus[];
  /** Whether this is a homebrew race */
  isHomebrew: boolean;
  /** Racial traits (features) */
  traits: string[];
  /** Racial proficiencies (skill, armor, weapon, tool, save) */
  proficiencies: RaceProficiency[];
  /** Darkvision range in feet (0 = none) */
  darkvision: number;
  /** Languages known */
  languages: string[];
  /** Subraces, if any */
  subraces?: SubraceDefinition[];
  /** Minimum level to play (default 1) */
  minLevel?: number;
  /** Icon/emoji for UI display */
  icon: string;
  /** Description for the create screen */
  description: string;
  /** Tags for searching/filtering */
  tags: string[];
}

export interface AbilityBonus {
  ability: "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";
  bonus: number;
}

export interface SubraceDefinition {
  name: string;
  abilityBonuses: AbilityBonus[];
  traits: string[];
  description: string;
}

export interface RaceProficiency {
  type: "skill" | "armor" | "weapon" | "tool" | "save" | "language";
  name: string;
  count?: number; // "choose N from list"
  options?: string[];
}

// ── Class Definition ──────────────────────────────────────────

export interface ClassDefinition {
  id: string;
  name: string;
  /** Source book or "homebrew" */
  source: string;
  /** Hit die type */
  hitDie: string;
  /** Primary abilities for spellcasting (if any) */
  spellcastingAbility?: "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";
  /** Caster type classification */
  casterType: "full" | "half" | "third" | "pact" | "none";
  /** Starting proficiencies */
  proficiencies: ClassProficiency[];
  /** Starting equipment */
  startingEquipment: string[];
  /** Class features by level */
  features: ClassFeature[];
  /** Number of skills to choose at level 1 */
  skillChoices: number;
  /** Available skill options */
  skillOptions: string[];
  /** Multiclass requirements */
  multiclassRequirements: Partial<Record<string, number>>;
  /** Whether this is a homebrew class */
  isHomebrew: boolean;
  /** Icon/emoji for UI display */
  icon: string;
  /** Description for the create screen */
  description: string;
  /** Tags for searching/filtering */
  tags: string[];
}

export interface ClassProficiency {
  type: "skill" | "armor" | "weapon" | "tool" | "save";
  name: string;
  count?: number;
  options?: string[];
}

export interface ClassFeature {
  name: string;
  description: string;
  level: number;
  /** Whether this feature recharges on short rest */
  shortRest?: boolean;
  /** Whether this feature has limited uses */
  limitedUse?: { max: number; recharge: "short_rest" | "long_rest" | "dawn" };
}

// ── Homebrew Registry ─────────────────────────────────────────

export interface HomebrewRaceEntry {
  definition: RaceDefinition;
  createdAt: number;
  updatedAt: number;
}

export interface HomebrewClassEntry {
  definition: ClassDefinition;
  createdAt: number;
  updatedAt: number;
}

// ── Stat Application ──────────────────────────────────────────

export interface AppliedRaceStats {
  abilityBonuses: AbilityBonus[];
  baseSpeed: number;
  specialSpeeds: Partial<Speed>;
  darkvision: number;
  traits: string[];
  languages: string[];
  size: string;
  proficiencies: RaceProficiency[];
}

export interface AppliedClassStats {
  hitDie: string;
  casterType: "full" | "half" | "third" | "pact" | "none";
  spellcastingAbility?: string;
  proficiencies: ClassProficiency[];
  features: ClassFeature[];
  skillChoices: number;
  skillOptions: string[];
}
