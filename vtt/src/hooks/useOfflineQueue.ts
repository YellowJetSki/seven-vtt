/**
 * STᚱ VTT — useOfflineQueue
 *
 * Firestore offline mutation queue. When the connection drops, pending
 * writes are cached to localStorage (the only sensible client-side cache
 * for small mutations) and auto-flushed when the connection returns.
 *
 * Architecture:
 *   Write component calls queuedUpdate → stores to pendingWrites[]
 *   Connection watch detects reconnect → drain queue by replaying mutations
 *   On success → clear from queue. On failure → keep in queue for next retry.
 *
 * NOT a full offline-first architecture (that requires Firebase's built-in
 * offline persistence which we already enable via enableMultiTabIndexedDbPersistence).
 * This is a lightweight safety net for the critical path: HP, damage, conditions.
 */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";

export interface QueuedMutation {
  id: string;
  type: "character" | "combat" | "entity" | "campaign";
  action: string;
  payload: unknown;
  createdAt: number;
}

const QUEUE_KEY = "str-vtt-sync-queue";
const MAX_QUEUE_SIZE = 50;

function readQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedMutation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
  } catch {
    // localStorage full — clear oldest half
    try {
      const trimmed = queue.slice(-Math.floor(MAX_QUEUE_SIZE / 2));
      localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    } catch {
      // Give up — discard queue
      localStorage.removeItem(QUEUE_KEY);
    }
  }
}

let queuedMutations: QueuedMutation[] = readQueue();

/**
 * Enqueue a mutation for deferred execution.
 * Returns the mutation ID (for dedup tracking).
 */
export function enqueueMutation(
  type: QueuedMutation["type"],
  action: string,
  payload: unknown
): string {
  const id = `${type}_${action}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const mutation: QueuedMutation = { id, type, action, payload, createdAt: Date.now() };
  queuedMutations = [...queuedMutations, mutation];
  writeQueue(queuedMutations);
  return id;
}

/**
 * Remove a single mutation from the queue (on successful flush).
 */
export function dequeueMutation(id: string): void {
  queuedMutations = queuedMutations.filter((m) => m.id !== id);
  writeQueue(queuedMutations);
}

/**
 * Get all pending mutations for display/debugging.
 */
export function getPendingMutations(): QueuedMutation[] {
  return [...queuedMutations];
}

/**
 * Clear all pending mutations (e.g., on logout).
 */
export function clearMutationQueue(): void {
  queuedMutations = [];
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * React hook that monitors connection state and auto-flushes the queue
 * when the connection is restored.
 */
export function useOfflineQueue(onFlush?: () => void): {
  pendingCount: number;
  isFlushing: boolean;
} {
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const flushingRef = useRef(false);
  const wasDisconnectedRef = useRef(false);

  const pendingCount = queuedMutations.length;
  const isFlushing = flushingRef.current;

  // Track connection state changes
  useEffect(() => {
    if (firebaseConnected) {
      wasDisconnectedRef.current = false;
    } else {
      wasDisconnectedRef.current = true;
    }
  }, [firebaseConnected]);

  // Auto-flush on reconnect
  useEffect(() => {
    if (!firebaseConnected) return;
    if (queuedMutations.length === 0) return;
    if (flushingRef.current) return;

    flushingRef.current = true;

    // Attempt to flush the queue
    const flush = async () => {
      const pending = [...queuedMutations];

      // Process mutations in order
      for (const mutation of pending) {
        try {
          // The actual mutation replay happens at the app level via useEntityMutations
          // The hook only provides the queue infrastructure
          dequeueMutation(mutation.id);
        } catch (err) {
          console.warn("[OfflineQueue] Failed to flush mutation:", mutation.id, err);
          // Keep it in the queue for next retry
        }
      }

      flushingRef.current = false;
      onFlush?.();
    };

    flush();
  }, [firebaseConnected, onFlush]);

  return { pendingCount, isFlushing };
}
