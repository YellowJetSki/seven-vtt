/* ── ItemForm Constants ─────────────────────────────────────────
 * Shared dropdown options and lookup tables for ItemForm.
 * Extracted to prevent inline magic numbers and duplicate data.
 * ─────────────────────────────────────────────────────────────── */

import type { ItemCategory, Rarity, WeaponType, DamageType, WeaponProperty, ArmorType } from "@/types/homebrew";

export const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "weapon", label: "Weapon" },
  { value: "armor", label: "Armor" },
  { value: "potion", label: "Potion" },
  { value: "scroll", label: "Scroll" },
  { value: "wand", label: "Wand" },
  { value: "ring", label: "Ring" },
  { value: "wondrous", label: "Wondrous Item" },
  { value: "tool", label: "Tool" },
  { value: "ammunition", label: "Ammunition" },
  { value: "food", label: "Food / Drink" },
  { value: "poison", label: "Poison" },
  { value: "other", label: "Other" },
];

export const RARITIES: Rarity[] = ["common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies"];

export const WEAPON_TYPES: WeaponType[] = ["simple melee", "simple ranged", "martial melee", "martial ranged"];

export const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: "bludgeoning", label: "Bludgeoning" },
  { value: "piercing", label: "Piercing" },
  { value: "slashing", label: "Slashing" },
  { value: "acid", label: "Acid" },
  { value: "cold", label: "Cold" },
  { value: "fire", label: "Fire" },
  { value: "force", label: "Force" },
  { value: "lightning", label: "Lightning" },
  { value: "necrotic", label: "Necrotic" },
  { value: "poison", label: "Poison" },
  { value: "psychic", label: "Psychic" },
  { value: "radiant", label: "Radiant" },
  { value: "thunder", label: "Thunder" },
];

export const WEAPON_PROPERTIES: { value: WeaponProperty; label: string }[] = [
  { value: "ammunition", label: "Ammunition" },
  { value: "finesse", label: "Finesse" },
  { value: "heavy", label: "Heavy" },
  { value: "light", label: "Light" },
  { value: "loading", label: "Loading" },
  { value: "range", label: "Range" },
  { value: "reach", label: "Reach" },
  { value: "special", label: "Special" },
  { value: "thrown", label: "Thrown" },
  { value: "two-handed", label: "Two-Handed" },
  { value: "versatile", label: "Versatile" },
  { value: "silvered", label: "Silvered" },
  { value: "magical", label: "Magical" },
];

export const ARMOR_TYPES: { value: ArmorType; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
  { value: "shield", label: "Shield" },
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; /* 5MB */

export function generateItemId(): string {
  return `hb-item-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
