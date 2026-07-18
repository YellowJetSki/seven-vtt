/* ── Hazard Tick Engine ────────────────────────────────────────
 * Pure, side-effect-free functions for managing persistent
 * hazard zone lifecycle: ticking, expiration, ground effects.
 * No React dependencies — can be used in stores, hooks, or
 * directly in components.
 * ─────────────────────────────────────────────────────────────── */

import type { HazardZone, HazardTick, GroundEffect } from "@/types/hazard-zones";
import { damageTypeToGroundEffect } from "@/types/hazard-zones";

/** Check if a hazard should tick this round */
export function shouldTick(hazard: HazardZone, currentRound: number): boolean {
  if (hazard.remainingRounds === null) return false;  // instantaneous
  if (hazard.remainingRounds <= 0) return false;       // expired
  if (!hazard.tickDamage) return false;                // no damage to apply
  if (hazard.lastTickRound === currentRound) return false; // already ticked

  // Round zero is placement round — no tick
  if (currentRound === hazard.placedOnRound) return false;

  // Tick interval check
  const roundsSincePlacement = currentRound - hazard.placedOnRound;
  return roundsSincePlacement % hazard.tickInterval === 0;
}

/** Apply a tick to a hazard, returning the updated tick array */
export function applyTick(
  hazard: HazardZone,
  currentRound: number,
  options?: { targetTokenId?: string; damage?: number },
): HazardTick[] {
  const tick: HazardTick = {
    round: currentRound,
    targetTokenId: options?.targetTokenId,
    damage: options?.damage,
  };
  return [...hazard.ticks, tick];
}

/** Advance hazard durations by one round, returning expired hazard IDs */
export function expireHazards(
  hazards: HazardZone[],
  _currentRound: number,
): { updated: HazardZone[]; expiredIds: string[] } {
  const expiredIds: string[] = [];
  const updated = hazards.map((h) => {
    if (h.remainingRounds === null) return h; // permanent
    if (h.remainingRounds <= 0) {
      expiredIds.push(h.id);
      return h;
    }
    return { ...h, remainingRounds: h.remainingRounds - 1 };
  });

  return {
    updated: updated.filter((h) => h.remainingRounds !== 0 && h.remainingRounds !== null),
    expiredIds,
  };
}

/** Spawn a ground effect from an expired hazard */
export function spawnGroundEffect(hazard: HazardZone): GroundEffect | null {
  if (!hazard.leavesGroundEffect) return null;

  const groundType = hazard.groundEffectType ?? damageTypeToGroundEffect(hazard.damageType);
  if (!groundType) return null;

  const groundEffect: GroundEffect = {
    id: `ge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sourceTemplateId: hazard.id,
    type: groundType,
    label: `${hazard.label} residue`,
    gridX: hazard.gridX,
    gridY: hazard.gridY,
    radius: hazard.size,
    color: hazard.color ?? "#aa66ff",
    opacity: 0.3,
    difficultTerrain: groundType === "ice_patch" || groundType === "gas_cloud",
    damageOnEntry: groundType === "gas_cloud" ? "1d6" : undefined,
    visibleToPlayers: hazard.visibleToPlayers,
    remainingRounds: hazard.groundEffectDuration ?? 3,
    createdAt: Date.now(),
    fadeProgress: 0,
  };

  return groundEffect;
}

/** Fade ground effects, removing fully faded ones */
export function fadeGroundEffects(
  effects: GroundEffect[],
): { updated: GroundEffect[]; removedIds: string[] } {
  const removedIds: string[] = [];
  const updated = effects
    .map((e) => {
      if (e.remainingRounds !== null && e.remainingRounds <= 0) {
        const faded = {
          ...e,
          fadeProgress: Math.min(1, e.fadeProgress + 0.25),
        };
        if (faded.fadeProgress >= 1) {
          removedIds.push(e.id);
          return null;
        }
        return { ...faded, remainingRounds: 0 };
      }
      return {
        ...e,
        remainingRounds: e.remainingRounds !== null ? e.remainingRounds - 1 : null,
        fadeProgress: 0,
      };
    })
    .filter((e): e is GroundEffect => e !== null);

  return { updated, removedIds };
}

/** Process a full round advance: tick, expire, spawn ground effects */
export function processRoundAdvance(
  hazards: HazardZone[],
  groundEffects: GroundEffect[],
  currentRound: number,
): {
  hazards: HazardZone[];
  groundEffects: GroundEffect[];
  newGroundEffects: GroundEffect[];
  expiredHazardIds: string[];
  tickedHazardIds: string[];
} {
  // 1. Apply ticks
  const tickedIds: string[] = [];
  const tickedHazards = hazards.map((h) => {
    if (shouldTick(h, currentRound)) {
      tickedIds.push(h.id);
      return {
        ...h,
        lastTickRound: currentRound,
        ticks: applyTick(h, currentRound),
      };
    }
    return h;
  });

  // 2. Expire hazards
  const { updated: survivingHazards, expiredIds } = expireHazards(tickedHazards, currentRound);

  // 3. Spawn ground effects from expired hazards
  const expiredHazards = hazards.filter((h) => expiredIds.includes(h.id));
  const newGroundEffects: GroundEffect[] = expiredHazards
    .map(spawnGroundEffect)
    .filter((ge): ge is GroundEffect => ge !== null);

  // 4. Fade existing ground effects
  const { updated: fadedEffects } = fadeGroundEffects(groundEffects);

  return {
    hazards: survivingHazards,
    groundEffects: [...fadedEffects, ...newGroundEffects],
    newGroundEffects,
    expiredHazardIds: expiredIds,
    tickedHazardIds: tickedIds,
  };
}

/** Calculate the total damage dealt by a hazard over all ticks */
export function totalHazardDamage(hazard: HazardZone): number {
  return hazard.ticks.reduce((sum, t) => sum + (t.damage ?? 0), 0);
}

/** Get a human-readable remaining duration string */
export function durationLabel(rounds: number | null): string {
  if (rounds === null) return "Permanent";
  if (rounds <= 0) return "Expired";
  if (rounds === 1) return "1 round";
  return `${rounds} rounds`;
}
