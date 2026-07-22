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
  /** @deprecated Use leptons/quadrants/assarions */
  copper?: number;
  /** @deprecated Use leptons/quadrants/assarions */
  silver?: number;
  /** @deprecated Use leptons/quadrants/assarions */
  electrum?: number;
  /** @deprecated Use leptons/quadrants/assarions */
  gold?: number;
  /** @deprecated Use leptons/quadrants/assarions */
  platinum?: number;
}

/** Converts legacy {copper,silver,gold} to {leptons,quadrants,assarions} */
export function convertLegacyCurrency(c: Record<string, number>): Currency {
  const cu = c as any;
  return {
    leptons: cu.leptons ?? (cu.copper ?? 0) + (cu.silver ?? 0) * 10 + (cu.electrum ?? 0) * 50 + (cu.gold ?? 0) * 100 + (cu.platinum ?? 0) * 1000,
    quadrants: cu.quadrants ?? (cu.silver ?? 0) * 10 + (cu.gold ?? 0) * 100,
    assarions: cu.assarions ?? (cu.gold ?? 0) + (cu.platinum ?? 0) * 10,
  };
}

/** Converts {leptons,quadrants,assarions} to readable gold value */
export function currencyToGold(c: Currency): number {
  return c.assarions + Math.floor(c.quadrants / 4) + Math.floor(c.leptons / 200);
}

/** Human-readable currency string */
export function formatCurrency(c: Currency): string {
  const parts: string[] = [];
  if (c.assarions > 0) parts.push(`${c.assarions} A`);
  if (c.quadrants > 0) parts.push(`${c.quadrants} Q`);
  if (c.leptons > 0) parts.push(`${c.leptons} L`);
  return parts.join(" ") || "0 L";
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
