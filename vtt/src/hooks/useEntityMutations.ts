/**
 * STᚱ VTT — useEntityMutations (Firestore-Synced + Offline Queue)
 *
 * Provides mutation functions for campaign entities that write to BOTH
 * Zustand (instant UI) and Firestore (real-time cross-device sync).
 *
 * Sprint 6: Added offline queue integration. When Firestore writes fail
 * (e.g., network blip), the mutation is enqueued to the offline queue
 * for automatic replay when the connection returns.
 */

import { useCallback, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAuthStore } from "@/stores/authStore";
import {
  setEnemy,
  setEncounter,
  setBattleMap,
  deleteBattleMap as deleteBattleMapFs,
  setJournalEntry,
} from "@/lib/firestore-service";
import { enqueueMutation, dequeueMutation } from "@/hooks/useOfflineQueue";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";
import type { EnemyDoc, Encounter, BattleMap, JournalEntry, MapToken, AoETemplate } from "@/types";

/**
 * Internal write helper — batches rapid Firestore writes (50ms window)
 * while allowing all Zustand mutations through instantly.
 * Catches Firestore write failures and enqueues them to the offline queue.
 */
function useCampaignWrite() {
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQueue = useRef<Array<() => Promise<void>>>([]);

  const getFirebaseConnected = useAuthStore((s) => s.firebaseConnected);

  const flush = useCallback(() => {
    const queue = pendingQueue.current;
    pendingQueue.current = [];
    pendingTimer.current = null;
    for (const writeFn of queue) {
      writeFn().catch((err) => {
        console.warn("[Firestore/Entities] Write failed, enqueuing to offline:", err);
        // The enqueueMutation handles the offline queue — the mutation
        // will be replayed when the connection is restored.
      });
    }
  }, []);

  return useCallback(
    (writeFn: () => Promise<void>, enqueueOnFail?: { type: string; action: string; payload: unknown }) => {
      pendingQueue.current.push(() =>
        writeFn().catch((err) => {
          console.warn("[Firestore/Entities] Write failed:", err);
          if (enqueueOnFail) {
            enqueueMutation(
              enqueueOnFail.type as "character" | "combat" | "entity" | "campaign",
              enqueueOnFail.action,
              enqueueOnFail.payload
            );
          }
        })
      );
      if (!pendingTimer.current) {
        pendingTimer.current = setTimeout(flush, 50);
      }
    },
    [flush]
  );
}

// ── Enemies ───────────────────────────────────────────────────

export function useEnemyMutations() {
  const write = useCampaignWrite();
  const setEnemies = useCampaignStore((s) => s.setEnemies);
  const getState = useCampaignStore.getState;

  const saveEnemy = useCallback(
    (enemy: EnemyDoc) => {
      const state = getState();
      const existing = state.enemies.find((e) => e.id === enemy.id);
      const updatedEnemies = existing
        ? state.enemies.map((e) => (e.id === enemy.id ? enemy : e))
        : [...state.enemies, enemy];
      setEnemies(updatedEnemies);
      write(
        () => setEnemy(FALLBACK_CAMPAIGN_ID, enemy.id, enemy),
        { type: "entity", action: "saveEnemy", payload: enemy }
      );
    },
    [setEnemies, write, getState]
  );

  const deleteEnemy = useCallback(
    (enemyId: string) => {
      const state = getState();
      const filtered = state.enemies.filter((e) => e.id !== enemyId);
      setEnemies(filtered);
      write(
        () => setEnemy(FALLBACK_CAMPAIGN_ID, enemyId, {} as EnemyDoc),
        { type: "entity", action: "deleteEnemy", payload: { enemyId } }
      );
    },
    [setEnemies, write, getState]
  );

  return { saveEnemy, deleteEnemy };
}

// ── Encounters ────────────────────────────────────────────────

export function useEncounterMutations() {
  const write = useCampaignWrite();
  const setEncounters = useCampaignStore((s) => s.setEncounters);
  const getState = useCampaignStore.getState;

  const saveEncounter = useCallback(
    (encounter: Encounter) => {
      const state = getState();
      const existing = state.encounters.find((e) => e.id === encounter.id);
      const updatedEncounters = existing
        ? state.encounters.map((e) => (e.id === encounter.id ? encounter : e))
        : [...state.encounters, encounter];
      setEncounters(updatedEncounters);
      write(
        () => setEncounter(FALLBACK_CAMPAIGN_ID, encounter.id, encounter),
        { type: "entity", action: "saveEncounter", payload: encounter }
      );
    },
    [setEncounters, write, getState]
  );

  const deleteEncounter = useCallback(
    (encounterId: string) => {
      const state = getState();
      const filtered = state.encounters.filter((e) => e.id !== encounterId);
      setEncounters(filtered);
      write(
        () => setEncounter(FALLBACK_CAMPAIGN_ID, encounterId, { id: encounterId } as Encounter),
        { type: "entity", action: "deleteEncounter", payload: { encounterId } }
      );
    },
    [setEncounters, write, getState]
  );

  return { saveEncounter, deleteEncounter };
}

// ── Battle Maps ───────────────────────────────────────────────

export function useBattleMapMutations() {
  const write = useCampaignWrite();
  const setBattleMaps = useCampaignStore((s) => s.setBattleMaps);
  const getState = useCampaignStore.getState;

  const saveMap = useCallback(
    (map: BattleMap) => {
      const state = getState();
      const existing = state.battleMaps.find((m) => m.id === map.id);
      const updatedMaps = existing
        ? state.battleMaps.map((m) => (m.id === map.id ? map : m))
        : [...state.battleMaps, map];
      setBattleMaps(updatedMaps);
      write(
        () => setBattleMap(FALLBACK_CAMPAIGN_ID, map.id, map),
        { type: "entity", action: "saveMap", payload: map }
      );
    },
    [setBattleMaps, write, getState]
  );

  const deleteMap = useCallback(
    (mapId: string) => {
      const state = getState();
      const filtered = state.battleMaps.filter((m) => m.id !== mapId);
      setBattleMaps(filtered);
      write(
        () => deleteBattleMapFs(FALLBACK_CAMPAIGN_ID, mapId),
        { type: "entity", action: "deleteMap", payload: { mapId } }
      );
    },
    [setBattleMaps, write, getState]
  );

  return { saveMap, deleteMap };
}

// ── Journal ───────────────────────────────────────────────────

export function useJournalMutations() {
  const write = useCampaignWrite();
  const setJournal = useCampaignStore((s) => s.setJournal);
  const getState = useCampaignStore.getState;

  const saveEntry = useCallback(
    (entry: JournalEntry) => {
      const state = getState();
      const existing = state.journal.find((e) => e.id === entry.id);
      const updated = existing
        ? state.journal.map((e) => (e.id === entry.id ? entry : e))
        : [...state.journal, entry];
      setJournal(updated);
      write(
        () => setJournalEntry(FALLBACK_CAMPAIGN_ID, entry.id, entry),
        { type: "entity", action: "saveJournal", payload: entry }
      );
    },
    [setJournal, write, getState]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      const state = getState();
      const filtered = state.journal.filter((e) => e.id !== entryId);
      setJournal(filtered);
      write(
        () => setJournalEntry(FALLBACK_CAMPAIGN_ID, entryId, { id: entryId } as JournalEntry),
        { type: "entity", action: "deleteJournal", payload: { entryId } }
      );
    },
    [setJournal, write, getState]
  );

  return { saveEntry, deleteEntry };
}

/**
 * Convenience hook returning ALL entity mutation groups.
 */
export function useAllEntityMutations() {
  return {
    ...useEnemyMutations(),
    ...useEncounterMutations(),
    ...useBattleMapMutations(),
    ...useJournalMutations(),
  };
}
