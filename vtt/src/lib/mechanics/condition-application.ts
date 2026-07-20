/**
 * STᚱ VTT — Condition Application Engine
 *
 * Bridges conditions-engine.ts with character-derivations.ts so
 * active conditions automatically adjust derived stats.
 *
 * When a condition is active, this engine modifies:
 *   - Speed (halved, set to 0 for Incapacitated/Petrified/Unconscious)
 *   - Attack rolls (advantage/disadvantage)
 *   - Saving throws (advantage/disadvantage/auto-fail)
 *   - Ability checks (disadvantage/auto-fail)
 *   - Actions (prevented: Incapacitated, Stunned, etc.)
 *   - Reactions (prevented: Incapacitated, Surprised)
 *   - Concentration (broken: Incapacitated)
 */

import type { PlayerCharacter } from "@/types/character";
import type { ConditionId, ConditionInfo } from "@/types/condition-types";
import { CONDITIONS } from "@/data/condition-data";
import { computeAllDerivations, type CharacterDerivations } from "@/lib/mechanics/character-derivations";

// ── Exported Types ─────────────────────────────────────────────

export interface ConditionModifiers {
  /** Speed multiplier (0 = no movement, 0.5 = half speed) */
  speedMultiplier: number;
  /** Flat speed reduction in feet */
  speedReduction: number;
  /** Set speed to a fixed value (overrides all) */
  speedOverride: number | null;

  /** Attack roll modifier */
  attackRollMod: "normal" | "advantage" | "disadvantage";
  /** Saving throw modifier */
  savingThrowMod: "normal" | "advantage" | "disadvantage";
  /** Ability check modifier */
  abilityCheckMod: "normal" | "advantage" | "disadvantage";

  /** Ability scores that auto-fail saving throws */
  autoFailSaves: string[];
  /** Ability scores that auto-fail checks */
  autoFailChecks: string[];

  /** Whether the character can take actions */
  canTakeActions: boolean;
  /** Whether the character can take bonus actions */
  canTakeBonusActions: boolean;
  /** Whether the character can take reactions */
  canTakeReactions: boolean;
  /** Whether the character can concentrate */
  canConcentrate: boolean;
  /** Whether the character can speak */
  canSpeak: boolean;

  /** Whether the character is unconscious (prone + incapacitated + drops items) */
  isUnconscious: boolean;
  /** Whether the character is petrified (turned to stone) */
  isPetrified: boolean;
  /** Whether the character is paralyzed */
  isParalyzed: boolean;
  /** Whether the character is stunned */
  isStunned: boolean;

  /** Conditions that grant immunity to certain damage types */
  damageImmunities: string[];
  /** Conditions that grant resistance to certain damage types */
  damageResistances: string[];

  /** Human-readable summary of mechanical effects */
  effectSummary: string[];
}

// ── Core Computation ──────────────────────────────────────────

/**
 * Computes all mechanical modifiers from a list of active condition IDs.
 * Pure function — no side effects, no state.
 */
export function computeConditionModifiers(conditionIds: string[]): ConditionModifiers {
  // Guard against undefined/null — important for cross-sync state integrity
  const safeIds = Array.isArray(conditionIds) ? conditionIds : [];
  const modifiers: ConditionModifiers = {
    speedMultiplier: 1,
    speedReduction: 0,
    speedOverride: null,

    attackRollMod: "normal",
    savingThrowMod: "normal",
    abilityCheckMod: "normal",

    autoFailSaves: [],
    autoFailChecks: [],

    canTakeActions: true,
    canTakeBonusActions: true,
    canTakeReactions: true,
    canConcentrate: true,
    canSpeak: true,

    isUnconscious: false,
    isPetrified: false,
    isParalyzed: false,
    isStunned: false,

    damageImmunities: [],
    damageResistances: [],

    effectSummary: [],
  };

  const validIds = safeIds.filter((id): id is ConditionId => !!CONDITIONS[id as ConditionId]);

  // Use a Set to deduplicate effect summary strings
  const summarySet = new Set<string>();

  for (const id of validIds) {
    const c = CONDITIONS[id];
    if (!c) continue;

    // ── Speed Effects ──
    if (c.setsSpeed === 0) {
      modifiers.speedOverride = 0;
    }
    if (c.setsSpeed !== null && c.setsSpeed !== undefined && c.setsSpeed > 0) {
      modifiers.speedOverride = Math.min(
        modifiers.speedOverride ?? Infinity,
        c.setsSpeed
      );
    }
    if (c.halvesSpeed) {
      modifiers.speedMultiplier = Math.min(modifiers.speedMultiplier, 0.5);
    }
    if (c.setsSpeed === 0) {
      summarySet.add("Speed reduced to 0");
    } else if (c.halvesSpeed) {
      summarySet.add("Speed halved");
    }

    // ── Attack Roll Effects ──
    if (c.appliesDisadvantageTo.includes("attack_rolls")) {
      modifiers.attackRollMod = "disadvantage";
    }
    if (c.appliesAdvantageTo.includes("attack_rolls")) {
      // If both disadvantage and advantage, they cancel (normal)
      if (modifiers.attackRollMod === "disadvantage") {
        modifiers.attackRollMod = "normal";
      } else {
        modifiers.attackRollMod = "advantage";
      }
    }
    if (c.appliesDisadvantageTo.includes("attack_rolls")) {
      summarySet.add("Disadvantage on attack rolls");
    }
    if (c.appliesAdvantageTo.includes("attack_rolls")) {
      summarySet.add("Advantage on attack rolls");
    }

    // ── Saving Throw Effects ──
    if (c.appliesDisadvantageTo.includes("saving_throws")) {
      modifiers.savingThrowMod = "disadvantage";
      summarySet.add("Disadvantage on saving throws");
    }
    if (c.appliesAdvantageTo.includes("saving_throws")) {
      if (modifiers.savingThrowMod === "disadvantage") {
        modifiers.savingThrowMod = "normal";
      } else {
        modifiers.savingThrowMod = "advantage";
      }
      summarySet.add("Advantage on saving throws");
    }

    // ── Ability Check Effects ──
    if (c.appliesDisadvantageTo.includes("ability_checks")) {
      modifiers.abilityCheckMod = "disadvantage";
      summarySet.add("Disadvantage on ability checks");
    }
    if (c.appliesAdvantageTo.includes("ability_checks")) {
      if (modifiers.abilityCheckMod === "disadvantage") {
        modifiers.abilityCheckMod = "normal";
      } else {
        modifiers.abilityCheckMod = "advantage";
      }
      summarySet.add("Advantage on ability checks");
    }

    // ── Auto-fails ──
    if (c.autoFailsSaves.length > 0) {
      modifiers.autoFailSaves = [...new Set([...modifiers.autoFailSaves, ...c.autoFailsSaves])];
      summarySet.add(`Auto-fail ${c.autoFailsSaves.join(", ")} saves`);
    }
    if (c.autoFailsAbilityChecks.length > 0) {
      modifiers.autoFailChecks = [...new Set([...modifiers.autoFailChecks, ...c.autoFailsAbilityChecks])];
      summarySet.add(`Auto-fail ${c.autoFailsAbilityChecks.join(", ")} checks`);
    }

    // ── Action / Bonus / Reaction ──
    if (c.preventsActions) {
      modifiers.canTakeActions = false;
      summarySet.add("Cannot take actions");
    }
    if (c.preventsBonusActions) {
      modifiers.canTakeBonusActions = false;
      summarySet.add("Cannot take bonus actions");
    }
    if (c.preventsReactions) {
      modifiers.canTakeReactions = false;
      summarySet.add("Cannot take reactions");
    }

    // ── Concentration ──
    // Breaks concentration: Incapacitated, Stunned, Petrified, Paralyzed, Unconscious
    if (["incapacitated", "stunned", "petrified", "paralyzed", "unconscious"].includes(c.id)) {
      modifiers.canConcentrate = false;
    }

    // ── Speech ──
    if (["petrified", "unconscious", "stunned"].includes(c.id)) {
      modifiers.canSpeak = false;
    }

    // ── Special States ──
    if (c.id === "unconscious") modifiers.isUnconscious = true;
    if (c.id === "petrified") modifiers.isPetrified = true;
    if (c.id === "paralyzed") modifiers.isParalyzed = true;
    if (c.id === "stunned") modifiers.isStunned = true;
  }

  // Convert deduplicated Set back to array
  modifiers.effectSummary = [...summarySet];

  return modifiers;
}

// ── Speed Computation ─────────────────────────────────────────

export interface ModifiedSpeed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  notes: string[];
}

/**
 * Applies condition speed modifiers to a character's base speed.
 */
export function applyConditionSpeed(
  baseSpeed: { walk: number; fly?: number; swim?: number; climb?: number; burrow?: number } | undefined,
  modifiers: ConditionModifiers
): ModifiedSpeed {
  const safeSpeed = baseSpeed || { walk: 30 };
  const notes: string[] = [];

  const modifySpeed = (base: number | undefined): number | undefined => {
    if (base === undefined) return undefined;

    // Override takes priority
    if (modifiers.speedOverride !== null) {
      if (modifiers.speedOverride === 0) {
        notes.push("Movement reduced to 0");
        return 0;
      }
      return modifiers.speedOverride;
    }

    let result = base;
    if (modifiers.speedMultiplier < 1) {
      result = Math.floor(result * modifiers.speedMultiplier);
    }
    result = Math.max(0, result - modifiers.speedReduction);
    return result;
  };

  return {
    walk: modifySpeed(safeSpeed.walk) ?? 30,
    fly: modifySpeed(safeSpeed.fly),
    swim: modifySpeed(safeSpeed.swim),
    climb: modifySpeed(safeSpeed.climb),
    burrow: modifySpeed(safeSpeed.burrow),
    notes,
  };
}

// ── Full Character Application ────────────────────────────────

export interface ConditionAdjustedDerivations extends CharacterDerivations {
  conditionModifiers: ConditionModifiers;
  modifiedSpeed: ModifiedSpeed;
  conditionSummaries: string[];
}

/**
 * Takes a character and their base derivations, applies condition
 * effects, and returns adjusted values.
 */
export function applyConditionsToDerivations(
  character: PlayerCharacter,
  baseDerivations: CharacterDerivations
): ConditionAdjustedDerivations {
  const conditionModifiers = computeConditionModifiers(character.conditions);
  const modifiedSpeed = applyConditionSpeed(baseDerivations.speed, conditionModifiers);

  const summaries = conditionModifiers.effectSummary;

  return {
    ...baseDerivations,
    conditionModifiers,
    modifiedSpeed,
    conditionSummaries: summaries,
  };
}

// ── Condition Color & Display ─────────────────────────────────

/**
 * Returns a consistent color scheme for a condition badge.
 */
export function getConditionStyle(conditionName: string): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  const styleMap: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    "Blinded": { bg: "bg-slate-500/15", text: "text-slate-300", border: "border-slate-500/25", icon: "👁️" },
    "Charmed": { bg: "bg-pink-500/15", text: "text-pink-300", border: "border-pink-500/25", icon: "💕" },
    "Deafened": { bg: "bg-sky-500/15", text: "text-sky-300", border: "border-sky-500/25", icon: "🔇" },
    "Exhaustion": { bg: "bg-amber-500/15", text: "text-amber-300", border: "border-amber-500/25", icon: "😩" },
    "Frightened": { bg: "bg-violet-500/15", text: "text-violet-300", border: "border-violet-500/25", icon: "😨" },
    "Grappled": { bg: "bg-orange-500/15", text: "text-orange-300", border: "border-orange-500/25", icon: "🤝" },
    "Incapacitated": { bg: "bg-red-600/15", text: "text-red-300", border: "border-red-600/25", icon: "💫" },
    "Invisible": { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/20", icon: "👻" },
    "Paralyzed": { bg: "bg-amber-600/15", text: "text-amber-300", border: "border-amber-600/25", icon: "⚡" },
    "Petrified": { bg: "bg-stone-500/15", text: "text-stone-300", border: "border-stone-500/25", icon: "🗿" },
    "Poisoned": { bg: "bg-emerald-600/15", text: "text-emerald-300", border: "border-emerald-600/25", icon: "☠️" },
    "Prone": { bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/25", icon: "🛌" },
    "Restrained": { bg: "bg-red-500/15", text: "text-red-300", border: "border-red-500/25", icon: "⛓️" },
    "Stunned": { bg: "bg-rose-500/15", text: "text-rose-300", border: "border-rose-500/25", icon: "😵" },
    "Unconscious": { bg: "bg-red-700/15", text: "text-red-300", border: "border-red-700/25", icon: "💤" },
    "Concentration": { bg: "bg-gold-500/15", text: "text-gold-300", border: "border-gold-500/25", icon: "🧘" },
  };

  return styleMap[conditionName] ?? { bg: "bg-surface-600/15", text: "text-surface-300", border: "border-surface-600/25", icon: "❓" };
}

// ── Condition Data with Mechanical Details ────────────────────

export interface ConditionDetail {
  id: ConditionId;
  name: string;
  description: string;
  summary: string;
  effects: string[];
  icon: string;
  color: ReturnType<typeof getConditionStyle>;
}

/**
 * Returns full condition detail including mechanical effects for display.
 */
export function getConditionDetails(conditionId: ConditionId): ConditionDetail | null {
  if (!conditionId) return null;
  const info = CONDITIONS[conditionId as ConditionId];
  if (!info) return null;

  const effects: string[] = [];
  if (info.setsSpeed === 0) effects.push("Speed becomes 0");
  if (info.halvesSpeed) effects.push("Speed halved");
  if (info.preventsActions) effects.push("Cannot take Actions");
  if (info.preventsBonusActions) effects.push("Cannot take Bonus Actions");
  if (info.preventsReactions) effects.push("Cannot take Reactions");
  if (info.appliesDisadvantageTo.includes("attack_rolls")) effects.push("Disadvantage on Attack Rolls");
  if (info.appliesAdvantageTo.includes("attack_rolls")) effects.push("Advantage on Attack Rolls");
  if (info.appliesDisadvantageTo.includes("saving_throws")) effects.push("Disadvantage on Saving Throws");
  if (info.appliesDisadvantageTo.includes("ability_checks")) effects.push("Disadvantage on Ability Checks");
  if (info.autoFailsSaves.length > 0) effects.push(`Auto-fail ${info.autoFailsSaves.join(", ")} saves`);
  if (info.autoFailsAbilityChecks.length > 0) effects.push(`Auto-fail ${info.autoFailsAbilityChecks.join(", ")} checks`);

  const style = getConditionStyle(info.name);

  return {
    id: conditionId,
    name: info.name,
    description: info.description,
    summary: info.description.length > 80 ? info.description.slice(0, 80) + "..." : info.description,
    effects,
    icon: style.icon,
    color: style,
  };
}

/**
 * Returns all available conditions with mechanical details.
 */
export function getAllConditionDetails(): ConditionDetail[] {
  const ids = Object.keys(CONDITIONS) as ConditionId[];
  return ids
    .map((id) => getConditionDetails(id))
    .filter((d): d is ConditionDetail => d !== null);
}
