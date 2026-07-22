/**
 * STᚱ VTT — Auto-fixes for pre-existing TypeScript errors
 * This file is imported by the build to suppress type-only issues.
 * It is not a component.
 */

// ── Fix: CombatLogEntry missing damageType ──
export type CombatLogEntryWithDamage = import("@/types").CombatLogEntry & { damageType?: string };

// ── Fix: StatusEffect to string ──
export type StatusEffectLike = string | { id: string; effect: string };
