// ── D&D 5e Encumbrance System ────────────────────────────────

export interface EncumbranceState {
  totalWeight: number;         // In pounds
  carryingCapacity: number;    // STR × 15 (base) or variant
  pushDragLift: number;        // STR × 30
  encumbranceLevel: "unencumbered" | "lightly_encumbered" | "heavily_encumbered" | "overencumbered";
  variantRule: "standard" | "variant";
}

export interface EquipmentWeight {
  baseItems: number;
  inventory: number;
  currency: number;
  total: number;
}

const COIN_WEIGHT_LB = 0.02;  // 50 coins = 1 lb

export const ITEM_WEIGHTS: Record<string, number> = {
  // Standard D&D equipment weights
  backpack: 5, bedroll: 7, blanket: 3, candle: 0, crowbar: 5,
  "healer's_kit": 3, "holy_water": 1, "hunting_trap": 25, lantern: 2,
  "lantern_bullseye": 2, "lantern_hooded": 2, lock: 1,
  magnifying_glass: 0, "manacles": 6, mirror: 0.5, "oil_flask": 1,
  "paper_sheet": 0, parchment: 0, "perfume_vial": 0, "pick_lock": 1,
  "piton": 0.25, "pole_10ft": 7, "pot_iron": 10, pouch: 1,
  "ram_portable": 35, rations: 2, rope_hemp: 10, rope_silk: 5,
  sack: 0.5, shovel: 5, "signal_whistle": 0, "signet_ring": 0,
  "sledgehammer": 10, "soap": 0, "spikes_iron": 5, "spyglass": 1,
  "tent_2person": 20, "tinderbox": 1, torch: 1, "waterskin": 5,
  "whetstone": 1,
  // Armor weights
  padded: 8, leather: 10, studded: 13, "hide": 12, "chain_shirt": 20,
  scale_mail: 45, breastplate: 20, half_plate: 40, ring_mail: 40,
  chain_mail: 55, splint: 60, plate: 65, shield: 6,
  // Weapon weights
  club: 2, dagger: 1, greatclub: 10, handaxe: 2, javelin: 2,
  "light_hammer": 2, mace: 4, quarterstaff: 4, sickle: 2, spear: 3,
  battleaxe: 4, flail: 2, glaive: 6, greataxe: 7, greatsword: 6,
  halberd: 6, lance: 6, longsword: 3, maul: 10, morningstar: 4,
  pike: 18, rapier: 2, scimitar: 3, shortsword: 2, trident: 4,
  "war_pick": 2, warhammer: 2, whip: 3,
  blowgun: 1, dart: 0.25, longbow: 2, "shortbow": 2, crossbow_light: 5,
  crossbow_hand: 3, crossbow_heavy: 18,
  // Ammo
  arrows: 0.05, bolts: 0.075, "blowgun_needles": 0.02, "sling_bullets": 0.075,
};

export function computeCurrencyWeight(currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number }): number {
  const totalCoins = currency.copper + currency.silver + currency.electrum + currency.gold + currency.platinum;
  return totalCoins * COIN_WEIGHT_LB;
}

export function computeItemWeight(itemName: string, quantity: number): number {
  const baseWeight = ITEM_WEIGHTS[itemName.toLowerCase().replace(/\s+/g, "_")];
  if (baseWeight === undefined) return quantity * 1; // Default 1 lb
  return baseWeight * quantity;
}

export function computeTotalWeight(
  equipment: { item: string; quantity: number; weight: number }[],
  inventory: { name: string; quantity: number; weight: number }[],
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number }
): EquipmentWeight {
  const baseItems = equipment.reduce((sum, e) => sum + (e.weight ?? computeItemWeight(e.item, e.quantity)), 0);
  const invItems = inventory.reduce((sum, i) => sum + (i.weight ?? computeItemWeight(i.name, i.quantity)), 0);
  const coinWeight = computeCurrencyWeight(currency);
  return { baseItems, inventory: invItems, currency: coinWeight, total: baseItems + invItems + coinWeight };
}

export function computeEncumbrance(
  strength: number,
  totalWeight: number,
  variant: "standard" | "variant" = "standard"
): EncumbranceState {
  const carryingCapacity = strength * 15;
  const pushDragLift = strength * 30;

  if (variant === "variant") {
    if (totalWeight > carryingCapacity) return { totalWeight, carryingCapacity, pushDragLift, encumbranceLevel: "overencumbered", variantRule: "variant" };
    if (totalWeight > carryingCapacity * 0.666) return { totalWeight, carryingCapacity, pushDragLift, encumbranceLevel: "heavily_encumbered", variantRule: "variant" };
    if (totalWeight > carryingCapacity * 0.333) return { totalWeight, carryingCapacity, pushDragLift, encumbranceLevel: "lightly_encumbered", variantRule: "variant" };
    return { totalWeight, carryingCapacity, pushDragLift, encumbranceLevel: "unencumbered", variantRule: "variant" };
  }

  if (totalWeight > carryingCapacity) return { totalWeight, carryingCapacity, pushDragLift, encumbranceLevel: "overencumbered", variantRule: "standard" };
  return { totalWeight, carryingCapacity, pushDragLift, encumbranceLevel: "unencumbered", variantRule: "standard" };
}

export function getEncumbrancePenalties(level: EncumbranceState["encumbranceLevel"]): {
  speedReduction: number;
  disadvantageOnChecks: boolean;
  canDash: boolean;
  autoFailChecks: string[];
} {
  switch (level) {
    case "lightly_encumbered":
      return { speedReduction: -10, disadvantageOnChecks: false, canDash: true, autoFailChecks: [] };
    case "heavily_encumbered":
      return { speedReduction: -20, disadvantageOnChecks: true, canDash: false, autoFailChecks: ["strength", "dexterity", "constitution"] };
    case "overencumbered":
      return { speedReduction: 0, disadvantageOnChecks: true, canDash: false, autoFailChecks: ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] };
    default:
      return { speedReduction: 0, disadvantageOnChecks: false, canDash: true, autoFailChecks: [] };
  }
}

export function canAddItem(totalWeight: number, itemWeight: number, carryingCapacity: number): boolean {
  return totalWeight + itemWeight <= carryingCapacity;
}
