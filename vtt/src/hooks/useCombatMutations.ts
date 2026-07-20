/**
 * STᚱ VTT — useCombatMutations
 *
 * ALL combat mutations centralized into a single hook.
 * Every mutation writes to BOTH:
 *   1. Zustand combatStore (instant UI feedback)
 *   2. Firestore (real-time sync to other tabs/devices)
 *
 * This is the DM's single source of truth for:
 *   - Initiative tracker state
 *   - Monster HP, temp HP, death status
 *   - Status conditions / effects
 *   - Turn flow (start combat, next/prev turn, end)
 *   - Encounter CRUD (create, populate, clear)
 *   - Combat log entries
 *
 * Usage:
 *   const { damageCombatant, healCombatant, nextTurn, ... } = useCombatMutations();
 *   damageCombatant(combatantId, 14); // Deals 14 damage, syncs to all connected UIs instantly
 */

import { useCallback, useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { setActiveEncounter } from "@/lib/firestore-service";
import type { CombatEncounter, Combatant, CombatLogEntry, CombatantHP } from "@/types";
import type { AoEDamageResult } from "@/lib/combat/aoe-damage-engine";
import { buildAoEHPUpdates, createAoELogEntry } from "@/lib/combat/aoe-damage-engine";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";
import { generateId, clampHP, createLogEntry } from "@/stores/combat/combat-helpers";
import { enqueueMutation, dequeueMutation } from "@/hooks/useOfflineQueue";

// ── Helper: Read current encounter + write to both stores ──

function useWriteCombat() {
  const pendingWrites = useRef(false);

  return useCallback(
    (mutator: (encounter: CombatEncounter) => CombatEncounter) => {
      if (pendingWrites.current) return;
      pendingWrites.current = true;

      const state = useCombatStore.getState();
      const current = state.activeEncounter;
      if (!current) {
        pendingWrites.current = false;
        return;
      }

      const updated = mutator(current);

      // Snapshot the mutation for offline queue
      const mutationSnapshot = { encounterId: updated.id, combatantIds: updated.combatants.map(c => c.id) };

      // Update Zustand immediately
      state.setEncounter(updated);

      // Write to Firestore async
      setActiveEncounter(FALLBACK_CAMPAIGN_ID, updated).catch((err) => {
        console.warn("[Firestore/Combat] Write failed, queuing for retry:", err);
        enqueueMutation("combat", "setActiveEncounter", {
          campaignId: FALLBACK_CAMPAIGN_ID,
          encounter: updated,
          mutationSnapshot,
        });
      });

      setTimeout(() => {
        pendingWrites.current = false;
      }, 50);
    },
    []
  );
}

// ── Helper: map combatants ──

function mapCombatants(
  combatants: Combatant[],
  id: string,
  updates: Partial<Combatant>
): Combatant[] {
  return combatants.map((c) => (c.id === id ? { ...c, ...updates } : c));
}

// ── Hooks ──────────────────────────────────────────────────

/**
 * HP-related combat mutations.
 */
export function useCombatHpMutations() {
  const write = useWriteCombat();

  const damageCombatant = useCallback(
    (combatantId: string, amount: number) => {
      write((enc) => {
        const c = enc.combatants.find((x) => x.id === combatantId);
        if (!c) return enc;
        const hp = clampHP(c.hitPoints, -amount);
        const dead = hp.current <= 0;
        return {
          ...enc,
          combatants: mapCombatants(enc.combatants, combatantId, {
            hitPoints: hp,
            isDead: dead,
          }),
        };
      });
    },
    [write]
  );

  const healCombatant = useCallback(
    (combatantId: string, amount: number) => {
      write((enc) => {
        const c = enc.combatants.find((x) => x.id === combatantId);
        if (!c) return enc;
        const hp = clampHP(c.hitPoints, amount);
        const alive = hp.current > 0;
        return {
          ...enc,
          combatants: mapCombatants(enc.combatants, combatantId, {
            hitPoints: hp,
            isDead: !alive,
          }),
        };
      });
    },
    [write]
  );

  const setTempHP = useCallback(
    (combatantId: string, amount: number) => {
      write((enc) => ({
        ...enc,
        combatants: mapCombatants(enc.combatants, combatantId, {
          hitPoints: {
            ...(enc.combatants.find((x) => x.id === combatantId)?.hitPoints ?? {
              current: 0, max: 0, temporary: 0,
            }),
            temporary: Math.max(0, amount),
          },
        }),
      }));
    },
    [write]
  );

  /**
   * Apply AoE damage to multiple combatants at once.
   * Writes to BOTH Zustand (instant) and Firestore (cross-device sync).
   *
   * FIX (Sprint 27): Added this function to the Firestore-synced hook.
   * Previously, MultiTargetAoEPopover used the raw Zustand store action
   * which did NOT sync to Firestore.
   */
  const aoeDamageCombatants = useCallback(
    (
      actorId: string,
      actorName: string,
      spellName: string,
      damage: number,
      damageType: string,
      result: AoEDamageResult
    ) => {
      write((enc) => {
        const updates = buildAoEHPUpdates(result);

        let combatants = [...enc.combatants];
        const logEntries: CombatLogEntry[] = [];

        for (const update of updates) {
          combatants = mapCombatants(combatants, update.combatantId, {
            hitPoints: update.hitPoints,
            isDead: update.isDead,
          });
        }

        const aoeEntry = createAoELogEntry(
          actorId,
          actorName,
          spellName,
          damage,
          damageType,
          result
        );
        logEntries.push(aoeEntry);
        logEntries.push(...result.deathEntries);

        return {
          ...enc,
          combatants,
        };
      });
    },
    [write]
  );

  return { damageCombatant, healCombatant, setTempHP, aoeDamageCombatants };
}

/**
 * Status effect combat mutations.
 */
export function useCombatEffectMutations() {
  const write = useWriteCombat();

  const addStatusEffect = useCallback(
    (combatantId: string, effect: string) => {
      write((enc) => ({
        ...enc,
        combatants: mapCombatants(enc.combatants, combatantId, {
          statusEffects: [
            ...(enc.combatants.find((x) => x.id === combatantId)?.statusEffects ?? []),
            { id: `${effect}_${Date.now()}`, effect },
          ],
        }),
      }));
    },
    [write]
  );

  const removeStatusEffect = useCallback(
    (combatantId: string, effectId: string) => {
      write((enc) => ({
        ...enc,
        combatants: mapCombatants(enc.combatants, combatantId, {
          statusEffects:
            enc.combatants
              .find((x) => x.id === combatantId)
              ?.statusEffects.filter((e) => e.id !== effectId) ?? [],
        }),
      }));
    },
    [write]
  );

  const toggleDead = useCallback(
    (combatantId: string) => {
      write((enc) => {
        const c = enc.combatants.find((x) => x.id === combatantId);
        if (!c) return enc;
        return {
          ...enc,
          combatants: mapCombatants(enc.combatants, combatantId, {
            isDead: !c.isDead,
          }),
        };
      });
    },
    [write]
  );

  const toggleConcentration = useCallback(
    (combatantId: string) => {
      write((enc) => {
        const c = enc.combatants.find((x) => x.id === combatantId);
        if (!c) return enc;
        return {
          ...enc,
          combatants: mapCombatants(enc.combatants, combatantId, {
            isConcentrating: !c.isConcentrating,
          }),
        };
      });
    },
    [write]
  );

  const setCombatantNotes = useCallback(
    (combatantId: string, notes: string) => {
      write((enc) => ({
        ...enc,
        combatants: mapCombatants(enc.combatants, combatantId, { notes }),
      }));
    },
    [write]
  );

  return { addStatusEffect, removeStatusEffect, toggleDead, toggleConcentration, setCombatantNotes };
}

/**
 * Turn flow combat mutations.
 */
export function useCombatFlowMutations() {
  const write = useWriteCombat();

  const startCombat = useCallback(() => {
    write((enc) => {
      const sorted = [...enc.combatants].sort((a, b) => b.initiative - a.initiative);
      return {
        ...enc,
        combatants: sorted,
        round: 1,
        currentCombatantIndex: 0,
        phase: "active" as const,
        startedAt: Date.now(),
        turnStartedAt: Date.now(),
        isPaused: false,
      };
    });
  }, [write]);

  const nextTurn = useCallback(() => {
    write((enc) => {
      const { combatants, currentCombatantIndex } = enc;
      const nextIndex = (currentCombatantIndex + 1) % combatants.length;
      const newRound = nextIndex === 0 ? enc.round + 1 : enc.round;
      return {
        ...enc,
        round: newRound,
        currentCombatantIndex: nextIndex,
        turnStartedAt: Date.now(),
      };
    });
  }, [write]);

  const prevTurn = useCallback(() => {
    write((enc) => {
      const { combatants, currentCombatantIndex } = enc;
      const prevIndex = currentCombatantIndex === 0 ? combatants.length - 1 : currentCombatantIndex - 1;
      return {
        ...enc,
        currentCombatantIndex: prevIndex,
        turnStartedAt: Date.now(),
      };
    });
  }, [write]);

  const endCombat = useCallback(() => {
    write((enc) => ({
      ...enc,
      phase: "completed" as const,
      completedAt: Date.now(),
      isPaused: false,
    }));
  }, [write]);

  const pauseCombat = useCallback(() => {
    write((enc) => ({ ...enc, isPaused: true }));
  }, [write]);

  const resumeCombat = useCallback(() => {
    write((enc) => ({ ...enc, isPaused: false, turnStartedAt: Date.now() }));
  }, [write]);

  return { startCombat, nextTurn, prevTurn, endCombat, pauseCombat, resumeCombat };
}

/**
 * Encounter CRUD mutations.
 */
export function useCombatEncounterMutations() {
  const writeEncounter = useWriteCombat();

  const setEncounter = useCallback(
    (encounter: CombatEncounter) => {
      const state = useCombatStore.getState();

      // Update Zustand
      state.setEncounter(encounter);

      // Write to Firestore
      setActiveEncounter(FALLBACK_CAMPAIGN_ID, encounter).catch((err) => {
        console.warn("[Firestore/Combat] Write encounter failed:", err);
      });
    },
    []
  );

  const createEncounter = useCallback(
    (name: string): string => {
      const id = generateId();
      const encounter: CombatEncounter = {
        id,
        name,
        combatants: [],
        round: 0,
        currentCombatantIndex: 0,
        turnStartedAt: null,
        phase: "prep",
        startedAt: null,
        completedAt: null,
        elapsedSeconds: 0,
        isPaused: false,
      };

      useCombatStore.getState().setEncounter(encounter);
      setActiveEncounter(FALLBACK_CAMPAIGN_ID, encounter).catch((err) => {
        console.warn("[Firestore/Combat] Create encounter failed:", err);
      });

      return id;
    },
    []
  );

  const addCombatant = useCallback(
    (combatant: Combatant) => {
      writeEncounter((enc) => ({
        ...enc,
        combatants: [...enc.combatants, combatant].sort(
          (a, b) => b.initiative - a.initiative
        ),
      }));
    },
    [writeEncounter]
  );

  const removeCombatant = useCallback(
    (combatantId: string) => {
      writeEncounter((enc) => ({
        ...enc,
        combatants: enc.combatants.filter((c) => c.id !== combatantId),
      }));
    },
    [writeEncounter]
  );

  const reorderCombatants = useCallback(
    (combatantIds: string[]) => {
      writeEncounter((enc) => {
        const combatantMap = new Map(enc.combatants.map((c) => [c.id, c]));
        const reordered = combatantIds
          .map((id) => combatantMap.get(id))
          .filter((c): c is Combatant => !!c);
        return { ...enc, combatants: reordered };
      });
    },
    [writeEncounter]
  );

  const clearEncounter = useCallback(() => {
    const state = useCombatStore.getState();
    state.clearEncounter();
    setActiveEncounter(FALLBACK_CAMPAIGN_ID, {
      id: "",
      name: "",
      combatants: [],
      round: 0,
      currentCombatantIndex: 0,
      turnStartedAt: null,
      phase: "prep",
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      isPaused: false,
    }).catch((err) => {
      console.warn("[Firestore/Combat] Clear encounter failed:", err);
    });
  }, []);

  return {
    setEncounter,
    createEncounter,
    addCombatant,
    removeCombatant,
    reorderCombatants,
    clearEncounter,
  };
}

/**
 * Convenience hook returning ALL combat mutations.
 */
export function useAllCombatMutations() {
  return {
    ...useCombatHpMutations(),
    ...useCombatEffectMutations(),
    ...useCombatFlowMutations(),
    ...useCombatEncounterMutations(),
  };
}

// Re-export helpers for use in other modules
export { generateId, clampHP, createLogEntry };
