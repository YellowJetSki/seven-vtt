/**
 * STᚱ VTT — Attack & Damage Resolution Engine (Sprint 19)
 *
 * Pure functions for resolving D&D 5e attack rolls and damage
 * expressions. Supports:
 *   - d20 + attack bonus vs target AC
 *   - Natural 20 = critical hit (double damage dice)
 *   - Natural 1 = critical miss
 *   - Damage dice expression parsing ("2d6+3", "1d8", "4d10")
 *   - Multiple damage types (primary + secondary)
 *
 * Used by the AttackResolutionPopover to provide one-click
 * attack resolution during live combat.
 */

import type { EnemyAttack, EnemyDoc } from "@/types";

// ── Attack Result Types ──
export type AttackResultType = "hit" | "critical_hit" | "miss" | "critical_miss";

export interface AttackRollResult {
  /** The rolled d20 value (1-20) */
  naturalRoll: number;
  /** Attack bonus */
  attackBonus: number;
  /** Total attack roll (naturalRoll + attackBonus) */
  total: number;
  /** Target's armor class */
  targetAC: number;
  /** Whether the attack hit */
  hit: boolean;
  /** Type of result */
  resultType: AttackResultType;
  /** Margin: total - targetAC (for DM info) */
  margin: number;
}

export interface DamageRollResult {
  /** Damage dice expression used */
  expression: string;
  /** Individual die rolls */
  rolls: number[];
  /** Flat damage bonus */
  bonus: number;
  /** Total damage */
  total: number;
  /** Damage type (e.g. "slashing", "fire") */
  damageType: string;
  /** Whether this is a critical hit (doubled dice) */
  isCritical: boolean;
}

export interface AttackResolutionResult {
  attackerName: string;
  targetName: string;
  attackName: string;
  attackRoll: AttackRollResult;
  damageRoll: DamageRollResult | null;
  /** Full damage including critical doubling */
  totalDamage: number;
  /** Whether target was reduced to 0 HP */
  targetDefeated: boolean;
}

// ── Roll a single die ──
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

// ── Roll d20 ──
export function rollD20(): number {
  return rollDie(20);
}

// ── Parse a dice expression like "2d6+3" or "1d8" or "4d10" ──
export function parseDiceExpression(expression: string): {
  count: number;
  sides: number;
  bonus: number;
} {
  // Match patterns like "2d6+3", "1d8", "4d10-1", "d6"
  const match = expression.match(/^(\d+)?d(\d+)([+-]\d+)?$/i);
  if (!match) {
    // Fallback: return 0 damage if unparseable
    return { count: 0, sides: 0, bonus: 0 };
  }
  const count = parseInt(match[1] || "1", 10);
  const sides = parseInt(match[2], 10);
  const bonus = parseInt(match[3] || "0", 10);
  return { count, sides, bonus };
}

// ── Roll damage dice expression ──
export function rollDamageExpression(
  expression: string,
  isCritical: boolean = false
): { rolls: number[]; bonus: number; total: number } {
  const { count, sides, bonus } = parseDiceExpression(expression);

  if (count === 0 || sides === 0) {
    return { rolls: [], bonus: 0, total: 0 };
  }

  const dieCount = isCritical ? count * 2 : count;
  const rolls: number[] = [];
  for (let i = 0; i < dieCount; i++) {
    rolls.push(rollDie(sides));
  }
  const total = rolls.reduce((sum, r) => sum + r, 0) + bonus;

  return { rolls, bonus, total };
}

// ── Make an attack roll ──
export function makeAttackRoll(
  attackBonus: number,
  targetAC: number
): AttackRollResult {
  const naturalRoll = rollD20();
  const total = naturalRoll + attackBonus;
  const margin = total - targetAC;
  const isNatural20 = naturalRoll === 20;
  const isNatural1 = naturalRoll === 1;

  // Natural 20 always hits; Natural 1 always misses
  const hit = isNatural20 || total >= targetAC;

  let resultType: AttackResultType;
  if (isNatural20) {
    resultType = "critical_hit";
  } else if (isNatural1) {
    resultType = "critical_miss";
  } else if (hit) {
    resultType = "hit";
  } else {
    resultType = "miss";
  }

  return {
    naturalRoll,
    attackBonus,
    total,
    targetAC,
    hit,
    resultType,
    margin,
  };
}

// ── Full attack resolution (attack roll + damage) ──
export function resolveAttack(
  attackerName: string,
  targetName: string,
  attackName: string,
  attackBonus: number,
  damageDice: string,
  damageType: string,
  targetAC: number,
  secondaryDamage?: string
): AttackResolutionResult {
  // Make the attack roll
  const attackRoll = makeAttackRoll(attackBonus, targetAC);

  // Roll damage if hit
  let damageRoll: DamageRollResult | null = null;
  let totalDamage = 0;
  const isCrit = attackRoll.resultType === "critical_hit";

  if (attackRoll.hit) {
    const { rolls, bonus, total } = rollDamageExpression(damageDice, isCrit);
    damageRoll = {
      expression: damageDice,
      rolls,
      bonus,
      total,
      damageType,
      isCritical: isCrit,
    };
    totalDamage = total;

    // Handle secondary damage (e.g. poison, fire on crit)
    if (secondaryDamage && isCrit) {
      const secondaryResult = rollDamageExpression(secondaryDamage, true);
      totalDamage += secondaryResult.total;
      damageRoll = {
        ...damageRoll,
        total: damageRoll.total + secondaryResult.total,
        rolls: [...damageRoll.rolls, ...secondaryResult.rolls],
      };
    }
  }

  return {
    attackerName,
    targetName,
    attackName,
    attackRoll,
    damageRoll,
    totalDamage,
    targetDefeated: false, // Set externally
  };
}

// ── Re-roll a single damage expression (for manual re-rolls) ──
export function rerollDamage(
  expression: string,
  isCritical: boolean,
  damageType: string
): DamageRollResult {
  const { rolls, bonus, total } = rollDamageExpression(expression, isCritical);
  return {
    expression,
    rolls,
    bonus,
    total,
    damageType,
    isCritical,
  };
}

// ── Get a human-readable summary of a dice roll ──
export function formatDiceRoll(rolls: number[], bonus: number, total: number): string {
  const rollStr = rolls.join(" + ");
  if (bonus > 0) {
    return `${rollStr} + ${bonus} = ${total}`;
  } else if (bonus < 0) {
    return `${rollStr} - ${Math.abs(bonus)} = ${total}`;
  }
  return `${rollStr} = ${total}`;
}

// ── Get all attacks for an enemy (from EnemyDoc) ──
export function getEnemyAttacks(enemy: EnemyDoc): EnemyAttack[] {
  // Return structured attacks if available
  if (enemy.attacks && enemy.attacks.length > 0) {
    return enemy.attacks;
  }

  // Fallback: extract attacks from the actions textarea (line-by-line)
  // This is a simplified parser for "name: +X to hit, YdZ damage" format
  if (enemy.actions) {
    const lines = enemy.actions.split("\n").filter((l) => l.trim());
    const parsedAttacks: EnemyAttack[] = [];

    for (const line of lines) {
      // Try to parse: "Multiattack" is a special action, not an attack
      const isAttackLine =
        line.match(/\+?\d+\s+to\s+hit/i) || line.match(/weapon\s+attack/i);
      if (!isAttackLine) continue;

      // Extract name (text before first colon or period)
      const nameMatch = line.match(/^([A-Za-z\s]+?)(?::|\.)/);
      const name = nameMatch ? nameMatch[1].trim() : "Attack";

      // Extract attack bonus
      const atkMatch = line.match(/\+(\d+)\s+to\s+hit/i);
      const atkBonus = atkMatch ? parseInt(atkMatch[1], 10) : 4;

      // Extract damage dice
      const dmgMatch = line.match(/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+damage/i);
      const dmgDice = dmgMatch ? dmgMatch[1] : "1d6";

      // Extract damage type
      const typeMatch = line.match(/damage\s+\([^)]*?\)/i);
      const attackLine = dmgMatch ? line.slice(dmgMatch.index! + dmgMatch[0].length) : "";
      const typeGuess = attackLine.match(/(slashing|piercing|bludgeoning|fire|cold|lightning|acid|poison|radiant|necrotic|psychic|thunder|force)/i);
      const dmgType = typeGuess ? typeGuess[1].toLowerCase() : "bludgeoning";

      // Determine melee/ranged
      const isMelee = !!(line.match(/melee/i) || line.match(/reach/i));
      const isRanged = !!(line.match(/ranged/i) || line.match(/range/i) || line.match(/ranged weapon attack/i));

      // Extract range
      const rangeMatch = line.match(/range\s+(\d+\/?\d*\s*ft\.?)/i);
      const range = rangeMatch ? rangeMatch[1].trim() : isMelee ? "5 ft" : "30/60 ft";

      parsedAttacks.push({
        id: `atk_${Date.now()}_${parsedAttacks.length}`,
        name,
        attackBonus: atkBonus,
        damageDice: dmgDice,
        damageType: dmgType,
        isMelee,
        isRanged,
        range,
        properties: [],
      });
    }

    if (parsedAttacks.length > 0) return parsedAttacks;
  }

  // Fallback: generic attack based on CR
  const cr = enemy.challengeRating;
  const crAtk = 3 + Math.floor(cr * 0.35);
  const crDmg = Math.max(1, Math.floor(cr * 1.5)) + "d6";
  return [
    {
      id: `atk_gen_${enemy.id}`,
      name: `${enemy.size === "Tiny" ? "Bite" : enemy.size === "Huge" || enemy.size === "Gargantuan" ? "Slam" : "Claw"}`,
      attackBonus: crAtk,
      damageDice: crDmg,
      damageType: "bludgeoning",
      isMelee: true,
      isRanged: false,
      range: "5 ft",
      properties: [],
    },
  ];
}
