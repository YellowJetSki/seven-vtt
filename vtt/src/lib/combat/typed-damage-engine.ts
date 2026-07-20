/**
 * STᚱ VTT — Enhanced Combat HP Slice (Sprint 20)
 *
 * Extends the base combatHpSlice with damage-type-aware damage
 * application that accounts for 5e resistance/vulnerability/immunity.
 *
 * This file shadows the original combatHpSlice.ts — DO NOT MODIFY
 * that file directly. Instead, import these functions alongside it.
 */

import type { Combatant, CombatLogEntry, CombatantHP } from "@/types";
import {
  resolveDamageType,
  type DamageApplicationResult,
  type DamageEffect,
} from "@/lib/combat/damage-type-engine";

// ── Log entry types extended for Sprint 20 ──
export interface TypedDamageLogEntry extends CombatLogEntry {
  /** The damage type applied */
  damageType?: string;
  /** The resistance effect */
  damageEffect?: DamageEffect;
  /** Raw damage before resistance was factored */
  rawDamage?: number;
  /** Final damage after resistance */
  finalDamage?: number;
}

// ── Generate a unique ID ──
function generateId(): string {
  return `dmg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Clamp HP with temp HP absorption ──
function clampHP(hp: CombatantHP, delta: number): CombatantHP {
  let { current, max, temporary } = hp;
  if (delta > 0) {
    if (temporary > 0) {
      const absorbed = Math.min(temporary, delta);
      temporary -= absorbed;
      delta -= absorbed;
    }
    current = Math.min(max, current + delta);
  } else {
    const damage = Math.abs(delta);
    if (temporary > 0) {
      const absorbed = Math.min(temporary, damage);
      temporary -= absorbed;
      current = damage > absorbed ? Math.max(0, current - (damage - absorbed)) : current;
    } else {
      current = Math.max(0, current - damage);
    }
  }
  return { current, max, temporary };
}

// ── Get the damage type resistances/immunities for a combatant ──
// This reads from the EnemyDoc stored in campaignStore, or returns empty arrays
// for player combatants (which don't have these fields by default)
const NO_DEFENSES: { resistances: string[]; immunities: string[]; vulnerabilities: string[] } = {
  resistances: [],
  immunities: [],
  vulnerabilities: [],
};

// ── Map of known player character damage resistances (from races/classes/feats) ──
// This is a simplified lookup; full integration would read from the character sheet
export const DEFAULT_PLAYER_DAMAGE_DEFENSES: Record<string, {
  resistances: string[];
  immunities: string[];
  vulnerabilities: string[];
}> = {
  // Tiefling: fire resistance
  tiefling: { resistances: ["fire"], immunities: [], vulnerabilities: [] },
  // Dragonborn: resistance based on ancestry (handled per character)
  // Barbarian: rage gives resistance to bludgeoning/piercing/slashing
  barbarian: { resistances: ["bludgeoning", "piercing", "slashing"], immunities: [], vulnerabilities: [] },
  // Dwarf: poison resistance
  dwarf: { resistances: ["poison"], immunities: [], vulnerabilities: [] },
  // Yuan-ti: poison immunity
  "yuan-ti": { resistances: [], immunities: ["poison"], vulnerabilities: [] },
};

// ── Get a combatant's damage type defenses ──
export function getCombatantDefenses(
  combatant: Combatant,
  enemies: Array<{ name: string; damageResistances: string[]; damageImmunities: string[]; damageVulnerabilities: string[] }>,
  characters?: Array<{ name: string; race?: string; class?: string }>
): { resistances: string[]; immunities: string[]; vulnerabilities: string[] } {
  if (combatant.type === "enemy") {
    // Look up the enemy doc
    const enemyDoc = enemies.find(
      (e) => e.name.toLowerCase() === combatant.name.toLowerCase()
    );
    if (enemyDoc) {
      return {
        resistances: enemyDoc.damageResistances || [],
        immunities: enemyDoc.damageImmunities || [],
        vulnerabilities: enemyDoc.damageVulnerabilities || [],
      };
    }
    return NO_DEFENSES;
  }

  // Player character — look up by race/class
  if (characters) {
    const pc = characters.find(
      (c) => c.name.toLowerCase() === combatant.name.toLowerCase()
    );
    if (pc) {
      const results: { resistances: string[]; immunities: string[]; vulnerabilities: string[] } = {
        resistances: [],
        immunities: [],
        vulnerabilities: [],
      };

      // Check race-based defenses
      for (const [key, defs] of Object.entries(DEFAULT_PLAYER_DAMAGE_DEFENSES)) {
        if (pc.race?.toLowerCase().includes(key)) {
          results.resistances.push(...defs.resistances);
          results.immunities.push(...defs.immunities);
          results.vulnerabilities.push(...defs.vulnerabilities);
        }
        if (pc.class?.toLowerCase().includes(key)) {
          results.resistances.push(...defs.resistances);
          results.immunities.push(...defs.immunities);
          results.vulnerabilities.push(...defs.vulnerabilities);
        }
      }

      return results;
    }
  }

  return NO_DEFENSES;
}

// ── Apply damage with type awareness, returning full result ──
export function applyTypedDamage(
  currentHP: CombatantHP,
  rawDamage: number,
  damageType: string,
  defenses: { resistances: string[]; immunities: string[]; vulnerabilities: string[] }
): {
  newHP: CombatantHP;
  result: DamageApplicationResult;
} {
  const result = resolveDamageType(
    rawDamage,
    damageType,
    defenses.resistances,
    defenses.immunities,
    defenses.vulnerabilities
  );

  const newHP = clampHP(currentHP, -result.finalDamage);

  return { newHP, result };
}

// ── Build a typed damage log entry ──
export function createTypedDamageLogEntry(
  actorId: string,
  actorName: string,
  targetId: string,
  targetName: string,
  rawDamage: number,
  finalDamage: number,
  damageType: string,
  damageEffect: DamageEffect,
  description?: string
): TypedDamageLogEntry {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type: "damage",
    actorId,
    actorName,
    targetId,
    targetName,
    value: finalDamage,
    damageType,
    damageEffect,
    rawDamage,
    finalDamage,
    description: description || `${rawDamage} ${damageType} → ${finalDamage} (${damageEffect})`,
  };
}

// ── Create a death log entry ──
export function createDeathLogEntry(
  combatantId: string,
  combatantName: string,
  damageType?: string
): CombatLogEntry {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type: "death",
    actorId: combatantId,
    actorName: combatantName,
    description: damageType
      ? `Reduced to 0 HP by ${damageType} damage`
      : "Reduced to 0 HP",
  };
}

// ── Map combatants helper ──
export function mapCombatants(
  combatants: Combatant[],
  id: string,
  updates: Partial<Combatant>
): Combatant[] {
  return combatants.map((c) => (c.id === id ? { ...c, ...updates } : c));
}
