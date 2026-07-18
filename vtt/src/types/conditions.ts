// ── Re-export condition types and data ────────────────────────

export type { ConditionId, ConditionInfo } from "./condition-types";
export { CONDITIONS } from "@/data/condition-data";

import type { ConditionId, ConditionInfo } from "./condition-types";
import { CONDITIONS } from "@/data/condition-data";

export function getConditionEffects(conditionIds: ConditionId[]): {
  speedMod: number;
  hasDisadvantageOnAttacks: boolean;
  hasAdvantageOnAttacks: boolean;
  hasDisadvantageOnSaves: boolean;
  hasDisadvantageOnChecks: boolean;
  isIncapacitated: boolean;
  autoFailSaves: string[];
  autoFailChecks: string[];
} {
  const effects = {
    speedMod: 0,
    hasDisadvantageOnAttacks: false,
    hasAdvantageOnAttacks: false,
    hasDisadvantageOnSaves: false,
    hasDisadvantageOnChecks: false,
    isIncapacitated: false,
    autoFailSaves: [] as string[],
    autoFailChecks: [] as string[],
  };

  for (const id of conditionIds) {
    const c = CONDITIONS[id];
    if (!c) continue;
    if (c.setsSpeed !== null) effects.speedMod = Math.min(effects.speedMod, 0);
    if (c.halvesSpeed) effects.speedMod -= 1;
    if (c.appliesDisadvantageTo.includes("attack_rolls")) effects.hasDisadvantageOnAttacks = true;
    if (c.appliesAdvantageTo.includes("attack_rolls")) effects.hasAdvantageOnAttacks = true;
    if (c.appliesDisadvantageTo.includes("saving_throws")) effects.hasDisadvantageOnSaves = true;
    if (c.appliesDisadvantageTo.includes("ability_checks")) effects.hasDisadvantageOnChecks = true;
    if (c.preventsActions && c.preventsBonusActions && c.preventsReactions) effects.isIncapacitated = true;
    effects.autoFailSaves = [...effects.autoFailSaves, ...c.autoFailsSaves];
    effects.autoFailChecks = [...effects.autoFailChecks, ...c.autoFailsAbilityChecks];
  }
  return effects;
}
