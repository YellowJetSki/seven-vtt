/**
 * STᚱ VTT — AoE Damage Engine (Sprint 21)
 *
 * Pure functions for computing multi-target area-of-effect damage
 * with per-target resistance/vulnerability/immunity application.
 *
 * Supports:
 *   - Single damage roll applied to N targets
 *   - Per-target resistance calculation (each target has its own defenses)
 *   - Multi-type damage (e.g., fire + poison)
 *   - Half damage on save (DEX save halving)
 *   - Combat log grouping for undo support
 */

import type { Combatant, CombatLogEntry } from "@/types";
import { resolveDamageType, type DamageApplicationResult } from "./damage-type-engine";
import { getCombatantDefenses } from "./typed-damage-engine";

// ── Per-target damage result ──
export interface AoETargetResult {
  combatantId: string;
  combatantName: string;
  /** Raw damage before resistance */
  rawDamage: number;
  /** Final damage after resistance */
  finalDamage: number;
  /** Whether the target made their save (for half-damage spells) */
  saved: boolean;
  /** Damage application results per type */
  typeResults: DamageApplicationResult[];
  /** Whether this damage killed the target */
  isDead: boolean;
  /** The target's HP before damage */
  hpBefore: { current: number; max: number; temporary: number };
  /** The target's HP after damage */
  hpAfter: { current: number; max: number; temporary: number };
}

// ── Full AoE damage result ──
export interface AoEDamageResult {
  /** The raw damage rolled (before any target modifiers) */
  baseDamage: number;
  /** The damage types applied */
  damageTypes: string[];
  /** Per-target results */
  targets: AoETargetResult[];
  /** Total raw damage across all targets */
  totalRawDamage: number;
  /** Total final damage across all targets */
  totalFinalDamage: number;
  /** Number of targets killed */
  totalDeaths: number;
  /** Timestamp for grouping log entries */
  groupTimestamp: number;
  /** Deduplicated death entries (one per target that died) */
  deathEntries: CombatLogEntry[];
}

// ── Compute AoE damage for multiple targets ──
export function computeAoEDamage(
  targets: Combatant[],
  baseDamage: number,
  damageTypes: string[],
  enemies: Array<{ name: string; damageResistances: string[]; damageImmunities: string[]; damageVulnerabilities: string[] }>,
  saveHalves: boolean,
  savedTargetIds: string[]
): AoEDamageResult {
  const targetResults: AoETargetResult[] = [];
  let totalRawDamage = 0;
  let totalFinalDamage = 0;
  let totalDeaths = 0;
  const deathEntries: CombatLogEntry[] = [];
  const groupTimestamp = Date.now();

  for (const target of targets) {
    const hpBefore = { ...target.hitPoints };
    const isSaved = savedTargetIds.includes(target.id);

    // Determine effective damage for this target
    const effectiveDamage = saveHalves && isSaved ? Math.floor(baseDamage / 2) : baseDamage;

    // Get the target's defenses
    const defenses = getCombatantDefenses(target, enemies);

    // Apply damage per type
    const typeResults: DamageApplicationResult[] = [];
    let finalDamage = 0;

    if (damageTypes.length > 0) {
      const primaryType = damageTypes[0];
      const result = resolveDamageType(
        effectiveDamage,
        primaryType,
        defenses.resistances,
        defenses.immunities,
        defenses.vulnerabilities
      );
      typeResults.push(result);
      finalDamage += result.finalDamage;
    }

    // Secondary damage types (e.g., fire + poison)
    for (let i = 1; i < damageTypes.length; i++) {
      const secondaryAmount = Math.floor(effectiveDamage * 0.3);
      if (secondaryAmount > 0) {
        const result = resolveDamageType(
          secondaryAmount,
          damageTypes[i],
          defenses.resistances,
          defenses.immunities,
          defenses.vulnerabilities
        );
        typeResults.push(result);
        finalDamage += result.finalDamage;
      }
    }

    // Apply to HP
    const hpAfter = applyDamageToHP(hpBefore, finalDamage);
    const isDead = hpAfter.current <= 0;

    totalRawDamage += effectiveDamage;
    totalFinalDamage += finalDamage;

    if (isDead) {
      totalDeaths++;
      deathEntries.push({
        id: `aoe_death_${target.id}_${Date.now()}`,
        timestamp: groupTimestamp,
        type: "death",
        actorId: target.id,
        actorName: target.name,
        description: `${target.name} reduced to 0 HP by AoE ${damageTypes[0] || "damage"}`,
      });
    }

    targetResults.push({
      combatantId: target.id,
      combatantName: target.name,
      rawDamage: effectiveDamage,
      finalDamage,
      saved: isSaved,
      typeResults,
      isDead,
      hpBefore,
      hpAfter,
    });
  }

  return {
    baseDamage,
    damageTypes,
    targets: targetResults,
    totalRawDamage,
    totalFinalDamage,
    totalDeaths,
    groupTimestamp,
    deathEntries,
  };
}

// ── Apply damage to HP (clamp, temp absorption) ──
function applyDamageToHP(
  hp: { current: number; max: number; temporary: number },
  damage: number
): { current: number; max: number; temporary: number } {
  let { current, max, temporary } = hp;
  if (damage <= 0) return { current, max, temporary };

  // Absorb with temp HP first
  if (temporary > 0) {
    const absorbed = Math.min(temporary, damage);
    temporary -= absorbed;
    damage -= absorbed;
  }

  // Apply remaining to current HP
  current = Math.max(0, current - damage);

  return { current, max, temporary };
}

// ── Generate unique ID for AoE log entries ──
export function generateAoELogId(): string {
  return `aoe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Create a grouped AoE combat log entry ──
export function createAoELogEntry(
  actorId: string,
  actorName: string,
  spellName: string,
  damage: number,
  damageType: string,
  result: AoEDamageResult
): CombatLogEntry {
  const aliveCount = result.targets.filter((t) => !t.isDead).length;
  const deadCount = result.targets.filter((t) => t.isDead).length;
  const firstTarget = result.targets[0];

  return {
    id: generateAoELogId(),
    timestamp: result.groupTimestamp,
    type: "damage",
    actorId,
    actorName,
    targetId: firstTarget?.combatantId,
    targetName: result.targets.length > 1
      ? `${result.targets.length} targets`
      : firstTarget?.combatantName,
    value: damage,
    description: `${spellName}: ${aliveCount} alive, ${deadCount} dead (${damageType})`,
  };
}

// ── Build HP update patches for all targets ──
export function buildAoEHPUpdates(
  result: AoEDamageResult
): Array<{ combatantId: string; hitPoints: { current: number; max: number; temporary: number }; isDead: boolean }> {
  return result.targets.map((t) => ({
    combatantId: t.combatantId,
    hitPoints: t.hpAfter,
    isDead: t.isDead,
  }));
}
