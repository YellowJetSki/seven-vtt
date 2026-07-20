/**
 * STᚱ VTT — useEntityMutations (Firestore-Synced Entity Mutations)
 *
 * Provides mutation functions for campaign entities that write to BOTH
 * Zustand (instant UI) and Firestore (real-time cross-device sync).
 *
 * Each entity mutation:
 *   1. Calls Zustand setter (instant UI)
 *   2. Queues a Firestore setDoc write (debounced, 50ms batch)
 *
 * The Firestore writes are picked up by useFirestoreEntitySync's onSnapshot
 * listeners, which propagate changes to ALL connected tabs/devices.
 */

import { useCallback, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import {
  setEnemy,
  setEncounter,
  setBattleMap,
  deleteBattleMap as deleteBattleMapFs,
  setJournalEntry,
} from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";
import type { EnemyDoc, Encounter, BattleMap, JournalEntry, MapToken, AoETemplate } from "@/types";

/**
 * Internal write helper — batches rapid Firestore writes (50ms window)
 * while allowing all Zustand mutations through instantly.
 */
function useCampaignWrite() {
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingQueue = useRef<Array<() => Promise<void>>>([]);

  const flush = useCallback(() => {
    const queue = pendingQueue.current;
    pendingQueue.current = [];
    pendingTimer.current = null;
    for (const writeFn of queue) {
      writeFn().catch((err) => console.warn("[Firestore/Entities] Write failed:", err));
    }
  }, []);

  return useCallback(
    (writeFn: () => Promise<void>) => {
      pendingQueue.current.push(writeFn);
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

  /** Add or update an enemy. Writes to both Zustand and Firestore. */
  const saveEnemy = useCallback(
    (enemy: EnemyDoc) => {
      // Write to Zustand (instant)
      const state = getState();
      const existing = state.enemies.find((e) => e.id === enemy.id);
      const updatedEnemies = existing
        ? state.enemies.map((e) => (e.id === enemy.id ? enemy : e))
        : [...state.enemies, enemy];
      setEnemies(updatedEnemies);
      // Queue Firestore write (debounced)
      write(() => setEnemy(FALLBACK_CAMPAIGN_ID, enemy.id, enemy));
    },
    [setEnemies, write, getState]
  );

  /** Delete an enemy by ID. */
  const deleteEnemy = useCallback(
    (enemyId: string) => {
      const state = getState();
      const filtered = state.enemies.filter((e) => e.id !== enemyId);
      setEnemies(filtered);
      // Firestore delete not available on entity-service — mark as deleted
      // by writing an empty placeholder (listeners will skip empty entries)
      write(() => setEnemy(FALLBACK_CAMPAIGN_ID, enemyId, {} as EnemyDoc));
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
      write(() => setEncounter(FALLBACK_CAMPAIGN_ID, encounter.id, encounter));
    },
    [setEncounters, write, getState]
  );

  const deleteEncounter = useCallback(
    (encounterId: string) => {
      const state = getState();
      const filtered = state.encounters.filter((e) => e.id !== encounterId);
      setEncounters(filtered);
      // Write minimal doc to trigger deletion on other tabs
      write(() => setEncounter(FALLBACK_CAMPAIGN_ID, encounterId, { id: encounterId } as Encounter));
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
      write(() => setBattleMap(FALLBACK_CAMPAIGN_ID, map.id, map));
    },
    [setBattleMaps, write, getState]
  );

  const deleteMap = useCallback(
    (mapId: string) => {
      const state = getState();
      const filtered = state.battleMaps.filter((m) => m.id !== mapId);
      setBattleMaps(filtered);
      write(() => deleteBattleMapFs(FALLBACK_CAMPAIGN_ID, mapId));
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
      write(() => setJournalEntry(FALLBACK_CAMPAIGN_ID, entry.id, entry));
    },
    [setJournal, write, getState]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      const state = getState();
      const filtered = state.journal.filter((e) => e.id !== entryId);
      setJournal(filtered);
      write(() => setJournalEntry(FALLBACK_CAMPAIGN_ID, entryId, { id: entryId } as JournalEntry));
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
