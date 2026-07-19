// ── Player Character — Re-exports from sub-modules ───────────

export type { ClassEntry, SavingThrow, SkillProficiency, HitPoints, Speed, DeathSaves, Feature, Proficiency, EquipmentSlot, InventoryItem, Currency, SpellSlots, ClassResource } from "./character-core";

export type { BuffTarget, TempBuff } from "./character-temp-buffs";

import type { ClassEntry, SavingThrow, SkillProficiency, HitPoints, Speed, DeathSaves, Feature, Proficiency, EquipmentSlot, InventoryItem, Currency, SpellSlots, ClassResource } from "./character-core";
import type { TempBuff } from "./character-temp-buffs";

/**
 * A tracked feat reference on a character.
 * Links to a HomebrewFeat by id or name and tracks activation state.
 */
export interface ActiveFeatRef {
  /** HomebrewFeat id (or SRD feat id) */
  featId: string;
  /** Feat name (fallback lookup) */
  featName: string;
  /** Whether the feat is currently active/enabled */
  isActive: boolean;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  playerName: string;
  race: string;
  class: string;
  subClass?: string;
  level: number;
  classes: ClassEntry[];
  experiencePoints: number;
  background: string;
  alignment: string;
  inspiration: boolean;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  savingThrows: Record<string, SavingThrow>;
  skills: Record<string, SkillProficiency>;
  hitPoints: HitPoints;
  armorClass: number;
  initiative: number;
  speed: Speed;
  hitDice: string;
  proficiencyBonus: number;
  conditions: string[];
  deathSaves: DeathSaves;
  temporaryHitPoints: number;
  traits: Feature[];
  proficiencies: Proficiency[];
  languages: string[];
  features: Feature[];
  equipment: EquipmentSlot[];
  inventory: InventoryItem[];
  currency: Currency;
  appearance: string;
  backstory: string;
  allies: string;
  characterNotes: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  imageUrl?: string;
  isHomebrew: boolean;
  /** Array of spell names the character has prepared */
  preparedSpells: string[];
  /** Array of active feat references (togglable) */
  activeFeats: ActiveFeatRef[];
  spellSlots?: SpellSlots;
  resources?: ClassResource[];
  /** Number of hit dice spent since last long rest */
  spentHitDice?: number;
  tempBuffs?: TempBuff[];
  createdAt: number;
  updatedAt: number;
}
