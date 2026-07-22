// ── Player Character Core Types ───────────────────────────────

export interface ClassEntry {
  name: string;
  level: number;
  subclass?: string;
}

export interface SavingThrow {
  proficient: boolean;
  bonus: number;
}

export type SkillProficiency = "none" | "proficient" | "expertise";

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface Speed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  canHover?: boolean;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Feature {
  name: string;
  description: string;
  source: string;
}

export interface Proficiency {
  name: string;
  type: string;
  isProficient: boolean;
  notes?: string;
}

export interface EquipmentSlot {
  slot: string;
  item: string;
  quantity: number;
  weight: number;
  notes: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
  description: string;
  isEquipped: boolean;
  /** Optional image URL for visual display in the item detail modal */
  imageUrl?: string;
  /** Weapon attack bonus (e.g., +5) */
  attackBonus?: number;
  /** Weapon damage dice expression (e.g., "1d8" or "2d6+3") */
  damageDice?: string;
  /** Weapon damage type (e.g., "slashing", "piercing", "fire") */
  damageType?: string;
  /** Armor class bonus (e.g., +1 for shield, +2 for ring of protection) */
  acBonus?: number;
}

export interface Currency {
  leptons: number;    // Common coin (50 = 1 Quadrant)
  quadrants: number;  // Silver-standard (4 = 1 Assarion)
  assarions: number;  // Gold-standard (highest denomination)
}

export interface SpellSlots {
  level1: { current: number; max: number };
  level2: { current: number; max: number };
  level3: { current: number; max: number };
  level4: { current: number; max: number };
  level5: { current: number; max: number };
  level6: { current: number; max: number };
  level7: { current: number; max: number };
  level8: { current: number; max: number };
  level9: { current: number; max: number };
}

export interface ClassResource {
  name: string;
  current: number;
  max: number;
  recharge: "short_rest" | "long_rest" | "dawn";
}
