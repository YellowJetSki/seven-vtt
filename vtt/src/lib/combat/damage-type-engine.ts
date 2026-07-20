/**
 * STᚱ VTT — Damage Type Engine (Sprint 20)
 *
 * Pure utility functions for computing damage type interactions
 * according to D&D 5e RAW:
 *   - Immunity: damage × 0
 *   - Resistance: damage ÷ 2 (round down)
 *   - Vulnerability: damage × 2
 *   - Standard: damage unchanged
 *
 * These stack: if a creature is immune AND vulnerable, immunity wins.
 * If resistant AND vulnerable, they cancel out (standard).
 *
 * Integrated into the attack resolution flow so the AttackResolutionPopover
 * shows resistance-applied final damage before the DM confirms.
 */

// ── Standard D&D 5e Damage Types ──
export const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const;

export type DamageType = (typeof DAMAGE_TYPES)[number];

// ── Resistance Effect Type ──
export type DamageEffect = "immune" | "resistance" | "vulnerability" | "standard";

export interface DamageApplicationResult {
  /** The raw damage before any resistance/immunity */
  rawDamage: number;
  /** The damage type */
  damageType: string;
  /** What effect the target has against this type */
  effect: DamageEffect;
  /** The final damage after all modifiers */
  finalDamage: number;
  /** Human-readable explanation */
  explanation: string;
}

// ── Resolve a single damage type against a target's defenses ──
export function resolveDamageType(
  rawDamage: number,
  damageType: string,
  resistances: string[],
  immunities: string[],
  vulnerabilities: string[]
): DamageApplicationResult {
  const hasImmunity = immunities.some(
    (i) => i.toLowerCase() === damageType.toLowerCase()
  );
  const hasResistance = resistances.some(
    (r) => r.toLowerCase() === damageType.toLowerCase()
  );
  const hasVulnerability = vulnerabilities.some(
    (v) => v.toLowerCase() === damageType.toLowerCase()
  );

  // 5e RAW: immunity cancels everything else
  if (hasImmunity) {
    return {
      rawDamage,
      damageType,
      effect: "immune",
      finalDamage: 0,
      explanation: `${damageType} immunity — full negation`,
    };
  }

  // Resistance AND vulnerability → cancel out (standard)
  if (hasResistance && hasVulnerability) {
    return {
      rawDamage,
      damageType,
      effect: "standard",
      finalDamage: rawDamage,
      explanation: `${damageType} resistance cancels vulnerability — normal damage`,
    };
  }

  // Vulnerability alone → double
  if (hasVulnerability) {
    return {
      rawDamage,
      damageType,
      effect: "vulnerability",
      finalDamage: rawDamage * 2,
      explanation: `${damageType} vulnerability — damage doubled`,
    };
  }

  // Resistance alone → half
  if (hasResistance) {
    return {
      rawDamage,
      damageType,
      effect: "resistance",
      finalDamage: Math.floor(rawDamage / 2),
      explanation: `${damageType} resistance — damage halved`,
    };
  }

  // Standard
  return {
    rawDamage,
    damageType,
    effect: "standard",
    finalDamage: rawDamage,
    explanation: `normal ${damageType} damage`,
  };
}

// ── Apply damage type effects to a set of damage results ──
export function applyDamageTypes(
  damageAmount: number,
  damageTypes: string[],
  resistances: string[],
  immunities: string[],
  vulnerabilities: string[]
): {
  results: DamageApplicationResult[];
  totalFinalDamage: number;
} {
  // If there are multiple damage types, split evenly (rounded)
  // This is a simplification — in real 5e, each damage type is applied separately
  // But for quick VTT resolution, we apply the primary type to the full amount
  // and compute secondary types separately

  const results: DamageApplicationResult[] = [];
  let totalFinalDamage = 0;

  // Primary damage type
  if (damageTypes.length > 0) {
    const primaryType = damageTypes[0];
    const primaryResult = resolveDamageType(
      damageAmount,
      primaryType,
      resistances,
      immunities,
      vulnerabilities
    );
    results.push(primaryResult);
    totalFinalDamage += primaryResult.finalDamage;
  }

  // Secondary damage types (e.g., fire + poison)
  // For secondary types, we assume they're smaller damage amounts
  // This is intentionally simplified — real 5e uses specific dice per type
  for (let i = 1; i < damageTypes.length; i++) {
    const secondaryType = damageTypes[i];
    // Assume secondary damage is ~30% of primary for auto-calc
    const secondaryAmount = Math.floor(damageAmount * 0.3);
    if (secondaryAmount > 0) {
      const secondaryResult = resolveDamageType(
        secondaryAmount,
        secondaryType,
        resistances,
        immunities,
        vulnerabilities
      );
      results.push(secondaryResult);
      totalFinalDamage += secondaryResult.finalDamage;
    }
  }

  return { results, totalFinalDamage };
}

// ── Get resistance color for UI display ──
export function getDamageEffectColor(effect: DamageEffect): {
  text: string;
  bg: string;
  border: string;
  icon: string;
} {
  switch (effect) {
    case "immune":
      return {
        text: "text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
        icon: "🛡️",
      };
    case "resistance":
      return {
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: "½",
      };
    case "vulnerability":
      return {
        text: "text-rose-400",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20",
        icon: "×2",
      };
    case "standard":
      return {
        text: "text-surface-400",
        bg: "bg-surface-800/50",
        border: "border-white/[0.06]",
        icon: "—",
      };
  }
}

// ── Get a human-readable label for effect ──
export function getDamageEffectLabel(effect: DamageEffect): string {
  switch (effect) {
    case "immune": return "Immune";
    case "resistance": return "Resistant";
    case "vulnerability": return "Vulnerable";
    case "standard": return "Normal";
  }
}

// ── Format damage type for display ──
export function formatDamageType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
