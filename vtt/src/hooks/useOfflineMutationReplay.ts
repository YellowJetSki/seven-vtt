/**
 * STᚱ VTT — useOfflineMutationReplay (Sprint 10)
 *
 * Active offline mutation replay engine.
 * When Firebase disconnects, writes are queued to localStorage.
 * When Firebase reconnects, the queue is flushed in order by replaying
 * the mutations against Firestore.
 *
 * This is NOT the queue infrastructure (that's useOfflineQueue.ts).
 * THIS is the actual mutation execution layer — the "drain" pipeline.
 *
 * Mutations are replayed in FIFO order. Each mutation that succeeds
 * is dequeued. Failures are kept in the queue for the next retry.
 *
 * Architecture:
 *   component registers: useOfflineMutationReplay(enqueue, dequeue, getPending)
 *   When firebaseConnected flips from false → true:
 *     1. Read all pending mutations
 *     2. For each: call the appropriate Firestore write (via service layer)
 *     3. On success → dequeue
 *     4. On failure → log warning, keep in queue
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import {
  enqueueMutation,
  dequeueMutation,
  getPendingMutations,
  clearMutationQueue,
} from "./useOfflineQueue";

/**
 * Hook that auto-replays offline mutations when Firebase reconnects.
 * Call `enqueueOfflineMutation` to queue writes when disconnected.
 */
export function useOfflineMutationReplay(): { pendingCount: number; replay: () => void } {
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const characters = useCampaignStore((s) => s.characters);
  const wasDisconnectedRef = useRef(false);
  const isReplayingRef = useRef(false);

  // Track connection transitions
  useEffect(() => {
    if (!firebaseConnected) {
      wasDisconnectedRef.current = true;
    }
  }, [firebaseConnected]);

  // Auto-replay on reconnect
  useEffect(() => {
    if (!firebaseConnected) return;
    if (!wasDisconnectedRef.current) return;
    if (isReplayingRef.current) return;

    const pending = getPendingMutations();
    if (pending.length === 0) {
      wasDisconnectedRef.current = false;
      return;
    }

    isReplayingRef.current = true;

    const replay = async () => {
      // Process mutations in order
      for (const mutation of pending) {
        try {
          // The actual replay calls the appropriate service layer function
          // based on mutation.type and mutation.action
          await replayMutation(mutation);
          dequeueMutation(mutation.id);
        } catch (err) {
          console.warn("[OfflineReplay] Failed mutation:", mutation.id, err);
          // Keep in queue — will retry on next reconnect
        }
      }
      isReplayingRef.current = false;
      wasDisconnectedRef.current = false;
    };

    replay();
  }, [firebaseConnected, characters]);

  const replay = () => {
    const pending = getPendingMutations();
    if (isReplayingRef.current || pending.length === 0) return;

    isReplayingRef.current = true;
    const replayAsync = async () => {
      for (const mutation of pending) {
        try {
          await replayMutation(mutation);
          dequeueMutation(mutation.id);
        } catch {
          // Keep in queue
        }
      }
      isReplayingRef.current = false;
    };
    replayAsync();
  };

  return { pendingCount: getPendingMutations().length, replay };
}

/**
 * Replay a single queued mutation against Firestore.
 * Uses dynamic import to avoid circular dependencies with hooks.
 */
async function replayMutation(mutation: {
  type: string;
  action: string;
  payload: unknown;
}): Promise<void> {
  const { type, action, payload } = mutation;

  try {
    switch (type) {
      case "character": {
        const { setCharacter } = await import("@/lib/firestore/character-service");
        if (typeof payload === "object" && payload !== null) {
          const p = payload as { campaignId: string; characterId: string; updates: unknown };
          if (p.characterId && p.updates) {
            await setCharacter(p.campaignId, p.characterId, p.updates as any);
          }
        }
        break;
      }
      case "combat": {
        const { setActiveEncounter } = await import("@/lib/firestore/combat-service");
        if (typeof payload === "object" && payload !== null) {
          const p = payload as { campaignId: string; encounter: unknown };
          if (p.campaignId && p.encounter) {
            await setActiveEncounter(p.campaignId, p.encounter as any);
          }
        }
        break;
      }
      case "entity": {
        // Entities handled by entity-service
        const { setEntity } = await import("@/lib/firestore/entity-service");
        if (typeof payload === "object" && payload !== null) {
          const p = payload as { campaignId: string; entityId: string; collectionName: string; data: unknown };
          if (p.campaignId && p.entityId && p.data) {
            await setEntity(p.campaignId, p.entityId, p.collectionName, p.data);
          }
        }
        break;
      }
      case "campaign": {
        const { setCampaignMeta } = await import("@/lib/firestore/campaign-service");
        if (typeof payload === "object" && payload !== null) {
          const p = payload as { campaignId: string; data: unknown };
          if (p.campaignId && p.data) {
            await setCampaignMeta(p.campaignId, p.data as any);
          }
        }
        break;
      }
      default:
        console.warn("[OfflineReplay] Unknown mutation type:", type);
    }
  } catch (err) {
    console.warn(`[OfflineReplay] Replay failed for ${type}:${action}:`, err);
    throw err; // Re-throw so the caller knows to keep it in queue
  }
}

/**
 * Enqueue a character mutation for offline-safe replay.
 */
export function queueCharacterMutation(
  campaignId: string,
  characterId: string,
  updates: unknown
): string {
  return enqueueMutation("character", "update", { campaignId, characterId, updates });
}

/**
 * Enqueue a combat mutation for offline-safe replay.
 */
export function queueCombatMutation(
  campaignId: string,
  encounter: unknown
): string {
  return enqueueMutation("combat", "set", { campaignId, encounter });
}

/**
 * Enqueue an entity mutation for offline-safe replay.
 */
export function queueEntityMutation(
  campaignId: string,
  entityId: string,
  collectionName: string,
  data: unknown
): string {
  return enqueueMutation("entity", "set", { campaignId, entityId, collectionName, data });
}

/**
 * Enqueue a campaign meta mutation for offline-safe replay.
 */
export function queueCampaignMutation(
  campaignId: string,
  data: unknown
): string {
  return enqueueMutation("campaign", "update", { campaignId, data });
}
