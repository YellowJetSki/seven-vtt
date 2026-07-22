import { computeTotalWeight, computeEncumbrance, getEncumbrancePenalties, canAddItem } from "@/types";
import type { EncumbranceState, EquipmentWeight } from "@/types";

export interface EncumbranceResult {
  weight: EquipmentWeight;
  encumbrance: EncumbranceState;
  penalties: ReturnType<typeof getEncumbrancePenalties>;
  canCarryMore: boolean;
}

export function calculateEncumbrance(
  strength: number,
  equipment: { item: string; quantity: number; weight: number }[],
  inventory: { name: string; quantity: number; weight: number }[],
  currency: { leptons: number; quadrants: number; assarions: number; copper?: number; silver?: number; electrum?: number; gold?: number; platinum?: number; },
  variant: "standard" | "variant" = "standard"
): EncumbranceResult {
  const weight = computeTotalWeight(equipment, inventory, currency);
  const encumbrance = computeEncumbrance(strength, weight.total, variant);
  const penalties = getEncumbrancePenalties(encumbrance.encumbranceLevel);
  const canCarryMore = canAddItem(weight.total, 1, encumbrance.carryingCapacity);
  return { weight, encumbrance, penalties, canCarryMore };
}

export function encumbranceToSpeed(baseSpeed: number, encumbrance: EncumbranceState): number {
  const penalties = getEncumbrancePenalties(encumbrance.encumbranceLevel);
  if (encumbrance.encumbranceLevel === "overencumbered") return 5;
  return Math.max(0, baseSpeed + penalties.speedReduction);
}

export function formatEncumbranceLevel(level: EncumbranceState["encumbranceLevel"]): string {
  switch (level) {
    case "unencumbered": return "Unencumbered";
    case "lightly_encumbered": return "Lightly Encumbered (−10 speed)";
    case "heavily_encumbered": return "Heavily Encumbered (−20 speed, disadvantage)";
    case "overencumbered": return "Overencumbered (speed 5, cannot dash)";
  }
}
