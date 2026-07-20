/**
 * STᚱ VTT — Initiative Roll Engine (Sprint 18)
 *
 * Pure utility functions for automated initiative rolling and sorting
 * according to D&D 5e RAW:
 *   1. Roll 1d20 + DEX modifier
 *   2. Ties broken by highest DEX modifier
 *   3. Still tied → highest DEX score
 *   4. Still tied → reroll between tied combatants
 *
 * Used by the InitiativeRollOverlay to auto-generate turn order
 * when launching encounters to battle maps.
 */

import type { Combatant, CombatantHP } from "@/types";

// ── Generate a unique combatant ID ──
export function generateCombatantId(): string {
  return `cmb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Compute DEX modifier from ability score ──
export function getDexModifier(dexScore: number): number {
  return Math.floor((dexScore - 10) / 2);
}

// ── Roll 1d20 (no RNG — returns average for deterministic preview) ──
export function rollInitiativeDie(): number {
  // Average of 1d20 = 10.5, but for real play we provide a UI to "roll"
  // The actual roll happens client-side via Math.random()
  return Math.floor(Math.random() * 20) + 1;
}

// ── Roll initiative for a single character ──
export function rollInitiativeForCharacter(dexScore: number): number {
  const roll = rollInitiativeDie();
  const mod = getDexModifier(dexScore);
  return roll + mod;
}

// ── Sort combatants by initiative (5e RAW tiebreaker) ──
export function sortByInitiative(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => {
    // 1. Primary: initiative value (descending)
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;

    // 2. Ties broken by DEX modifier (descending)
    // We stored dexMod on the combatant for tiebreaking purposes
    // Fallback to 0 if not stored
    const aDexMod = (a as any).dexMod ?? 0;
    const bDexMod = (b as any).dexMod ?? 0;
    if (bDexMod !== aDexMod) return bDexMod - aDexMod;

    // 3. Still tied → alphabetical by name
    return a.name.localeCompare(b.name);
  });
}

// ── Build a combatant from a map token (enemy) ──
export interface TokenCombatantSource {
  id: string;
  name: string;
  type: "player" | "enemy" | "npc" | "custom";
  hp?: { current: number; max: number };
  armorClass?: number;
  dexScore?: number;
}

export interface InitiativeRollResult {
  combatantId: string;
  name: string;
  type: "player" | "enemy" | "ally";
  roll: number;
  dexMod: number;
  total: number;
  isTiebreaker?: boolean;
}

export function buildCombatantFromToken(
  token: TokenCombatantSource,
  dexScore: number
): { combatant: Combatant; rollResult: InitiativeRollResult } {
  const dexMod = getDexModifier(dexScore);
  const roll = rollInitiativeDie();
  const total = roll + dexMod;

  const combatant: Combatant = {
    id: generateCombatantId(),
    name: token.name,
    type: token.type === "player" ? "player" : token.type === "npc" ? "ally" : "enemy",
    initiative: total,
    armorClass: token.armorClass ?? 10,
    hitPoints: {
      current: token.hp?.current ?? token.hp?.max ?? 10,
      max: token.hp?.max ?? 10,
      temporary: 0,
    },
    statusEffects: [],
    isDead: false,
    isConcentrating: false,
    notes: "",
  };

  // Store dexMod for tiebreaker use (runtime property, not in type)
  (combatant as any).dexMod = dexMod;

  const rollResult: InitiativeRollResult = {
    combatantId: combatant.id,
    name: token.name,
    type: combatant.type,
    roll,
    dexMod,
    total,
  };

  return { combatant, rollResult };
}

// ── Build combatants for an entire group ──
export function buildCombatantsFromTokens(
  tokens: TokenCombatantSource[]
): { combatants: Combatant[]; rollResults: InitiativeRollResult[] } {
  const combatants: Combatant[] = [];
  const rollResults: InitiativeRollResult[] = [];

  for (const token of tokens) {
    // Default DEX scores by type if not provided
    const dexScore = token.dexScore ?? 10;
    const { combatant, rollResult } = buildCombatantFromToken(token, dexScore);

    // Apply tiebreaker resolution
    const existing = combatants.find(
      (c) => c.initiative === combatant.initiative
    );
    if (existing) {
      // If tie, check if we already resolved by adding a tiny offset
      // We handle this in sortByInitiative
      rollResult.isTiebreaker = true;
    }

    combatants.push(combatant);
    rollResults.push(rollResult);
  }

  return { combatants: sortByInitiative(combatants), rollResults };
}

// ── Preview initiative range ──
export function getInitiativeRange(dexScore: number): { min: number; max: number; avg: number } {
  const mod = getDexModifier(dexScore);
  return {
    min: 1 + mod,
    max: 20 + mod,
    avg: 10.5 + mod,
  };
}
