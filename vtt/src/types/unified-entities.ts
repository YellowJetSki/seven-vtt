/**
 * STᚱ VTT — Unified Entity Types
 *
 * Bridge types that unify SRD HomebrewItem/HomebrewSpell/HomebrewFeat
 * with character data (inventory items, prepared spells, active feats)
 * for injection into the Combat Tab.
 *
 * These types bridge the gap between:
 *   - HomebrewItem (SRD compendium with full fields)
 *   - EquipmentSlot/InventoryItem (character inventory, plain strings)
 *   - PlayerCharacter.preparedSpells
 *   - PlayerCharacter.activeFeats
 *
 * The result: a unified CombatEntity[] that the Combat Tab renders.
 */

import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "./homebrew";

// ── Unified Combat Entity ────────────────────────────────────

export type EntitySourceType = "weapon" | "spell" | "feat" | "feature" | "item";

export interface CombatEntity {
  /** Unique ID for this entity instance */
  id: string;
  /** Display name */
  name: string;
  /** Source category */
  sourceType: EntitySourceType;
  /** Underlying data source */
  sourceId?: string;
  /** Whether this entity is active/enabled */
  isActive: boolean;

  // ── Attack info (weapons & offensive spells) ──
  /** Attack bonus string e.g. "+7" */
  attackBonus?: string;
  /** Damage expression e.g. "1d8+3 slashing" */
  damageExpression?: string;
  /** Whether this is a melee attack */
  isMelee?: boolean;
  /** Whether this is a ranged attack */
  isRanged?: boolean;
  /** Range string e.g. "60/120 ft" */
  range?: string;
  /** Weapon properties e.g. ["Finesse", "Light"] */
  properties?: string[];

  // ── Spell info (spells) ──
  /** Spell level (0 = cantrip) */
  spellLevel?: number;
  /** Spell school */
  spellSchool?: string;
  /** Whether concentration is required */
  requiresConcentration?: boolean;
  /** Whether a saving throw is required */
  hasSave?: boolean;
  /** Save DC */
  saveDC?: number;
  /** Save ability */
  saveAbility?: string;

  // ── Feat/Feature info ──
  /** Feat effect description */
  effectDescription?: string;
  /** Whether this feat requires activation */
  requiresActivation?: boolean;

  // ── Display ──
  /** Icon character */
  icon?: string;
  /** Color class for badges */
  colorClass?: string;
  /** Tags for filtering */
  tags?: string[];
}

// ── Input types for the injector ──

export interface CharacterCombatData {
  /** Proficiency bonus */
  proficiencyBonus: number;
  /** Ability modifiers */
  abilityMods: Record<string, number>;
  /** Equipped weapons with item data */
  equippedWeapons: Array<{
    item: HomebrewItem;
    slot: string;
    isEquipped: boolean;
  }>;
  /** Prepared spells */
  preparedSpells: Array<{
    spell: HomebrewSpell;
    isPrepared: boolean;
  }>;
  /** Active feats/features */
  activeFeats: Array<{
    feat: HomebrewFeat;
    isActive: boolean;
  }>;
  /** Primary spellcasting ability */
  spellcastingAbility?: string;
  /** Spell attack bonus */
  spellAttackBonus?: number;
  /** Spell save DC */
  spellSaveDC?: number;
}

// ── Category maps for icons and colors ──

export const WEAPON_ICONS: Record<string, string> = {
  sword: "\u2694\uFE0F",
  axe: "\uD83E\uDE93",
  bow: "\uD83C\uDFF9",
  dagger: "\uD83D\uDDE1\uFE0F",
  hammer: "\uD83D\uDD28",
  mace: "\uD83D\uDD28",
  spear: "\uD83D\uDE2E\u200D\uD83D\uDCA8",
  staff: "\uD83E\uDE84",
  crossbow: "\uD83C\uDFF9",
  whip: "\uD83D\uDC82",
  default: "\u2694\uFE0F",
};

export const SPELL_ICONS: Record<string, string> = {
  Abjuration: "\uD83D\uDEE1\uFE0F",
  Conjuration: "\u2728",
  Divination: "\uD83D\uDC41\uFE0F",
  Enchantment: "\uD83D\uDC9C",
  Evocation: "\uD83D\uDCA5",
  Illusion: "\uD83C\uDF2B\uFE0F",
  Necromancy: "\u2620\uFE0F",
  Transmutation: "\u2697\uFE0F",
  default: "\uD83D\uDD2E",
};

export const FEAT_ICONS: Record<string, string> = {
  default: "\uD83C\uDFC6",
};

export function getWeaponIcon(name: string): string {
  const low = name.toLowerCase();
  if (low.includes("sword") || low.includes("blade") || low.includes("rapier") || low.includes("scimitar") || low.includes("shortsword") || low.includes("longsword") || low.includes("greatsword")) return WEAPON_ICONS.sword;
  if (low.includes("axe") || low.includes("handaxe") || low.includes("battleaxe") || low.includes("greataxe")) return WEAPON_ICONS.axe;
  if (low.includes("bow") || low.includes("longbow") || low.includes("shortbow")) return WEAPON_ICONS.bow;
  if (low.includes("crossbow") || low.includes("hand crossbow")) return WEAPON_ICONS.crossbow;
  if (low.includes("dagger") || low.includes("knife")) return WEAPON_ICONS.dagger;
  if (low.includes("hammer") || low.includes("maul") || low.includes("warhammer")) return WEAPON_ICONS.hammer;
  if (low.includes("mace") || low.includes("flail") || low.includes("morningstar")) return WEAPON_ICONS.mace;
  if (low.includes("spear") || low.includes("lance") || low.includes("pike") || low.includes("halberd") || low.includes("glaive") || low.includes("trident")) return WEAPON_ICONS.spear;
  if (low.includes("staff") || low.includes("quarterstaff")) return WEAPON_ICONS.staff;
  if (low.includes("whip")) return WEAPON_ICONS.whip;
  return WEAPON_ICONS.default;
}

export function getSpellIcon(school: string): string {
  return SPELL_ICONS[school] || SPELL_ICONS.default;
}

export function getFeatIcon(name: string): string {
  return FEAT_ICONS.default;
}
