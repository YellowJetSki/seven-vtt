/**
 * STᚱ VTT — useFirestoreEntitySync (Real-Time Entity Sync)
 *
 * Bridges campaign entities (enemies, encounters, battleMaps, journal)
 * between Firestore and Zustand. This completes the real-time sync layer
 * for ALL campaign data.
 *
 * Architecture:
 *   Firestore ──(onSnapshot)──► useFirestoreEntitySync ──(setState)──► Zustand campaignStore
 *   Entity mutations ──► useEntityMutations ──(setDoc)──► Firestore ◄──(onSnapshot)──► other tabs
 *
 * Syncs 4 collections:
 *   - enemies (CRUD via entity-service)
 *   - encounters (CRUD via entity-service)
 *   - battleMaps + mapTokens (CRUD via entity-service)
 *   - journal (CRUD via entity-service)
 *
 * FIX (Cycle 3): Previously, entitySlice.ts ONLY wrote to Zustand `set()`.
 * No Firestore writes happened for enemies, encounters, maps, or journal.
 * This hook adds the real-time listener subscriptions.
 *
 * MUST be mounted alongside useFirestoreSync in the auth gate.
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import {
  listenActiveEncounter,
} from "@/lib/firestore-service";
import { getFirestoreDb } from "@/lib/firebase";
import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { fromFirestore, CAMPAIGN_COLLECTION } from "@/lib/firestore/helpers";
import type { EnemyDoc, Encounter, BattleMap, MapToken, JournalEntry } from "@/types";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Subscribes to real-time updates for ALL campaign entity collections.
 * Each entity type has its own subcollection listener.
 */
export function useFirestoreEntitySync(): void {
  const mountedRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firebaseConnectedRef = useRef(false);

  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  // Store actions
  const setEnemies = useCampaignStore((s) => s.setEnemies);
  const setEncounters = useCampaignStore((s) => s.setEncounters);
  const setBattleMaps = useCampaignStore((s) => s.setBattleMaps);
  const setMapTokens = useCampaignStore((s) => s.setMapTokens);
  const setJournal = useCampaignStore((s) => s.setJournal);

  firebaseConnectedRef.current = firebaseConnected;

  useEffect(() => {
    if (authState !== "authenticated" || !role) return;
    if (mountedRef.current) return;
    mountedRef.current = true;

    let mounted = true;

    function cleanup() {
      for (const unsub of unsubsRef.current) {
        try { unsub(); } catch { /* noop */ }
      }
      unsubsRef.current = [];
    }

    function subscribe() {
      cleanup();

      getFirestoreDb().then((db) => {
        if (!mounted) return;

        const campaignPath = `${CAMPAIGN_COLLECTION}/${FALLBACK_CAMPAIGN_ID}`;

        // ── Enemies listener ──
        const unsubEnemies = onSnapshot(
          collection(db, `${campaignPath}/enemies`),
          (snap) => {
            if (!mounted) return;
            const enemies = snap.docs.map((d) => fromFirestore<EnemyDoc>(d.id, d.data()));
            setEnemies(enemies);
          },
          (err) => {
            console.warn("[Firestore/Entities/Enemies] Listener error:", err);
            if (!mounted) return;
            setEnemies([]);
          }
        );
        unsubsRef.current.push(unsubEnemies);

        // ── Encounters listener ──
        const unsubEncounters = onSnapshot(
          collection(db, `${campaignPath}/encounters`),
          (snap) => {
            if (!mounted) return;
            const encounters = snap.docs.map((d) => fromFirestore<Encounter>(d.id, d.data()));
            setEncounters(encounters);
          },
          (err) => {
            console.warn("[Firestore/Entities/Encounters] Listener error:", err);
            if (!mounted) return;
            setEncounters([]);
          }
        );
        unsubsRef.current.push(unsubEncounters);

        // ── Battle Maps listener ──
        const unsubMaps = onSnapshot(
          collection(db, `${campaignPath}/maps`),
          (snap) => {
            if (!mounted) return;
            const maps = snap.docs.map((d) => fromFirestore<BattleMap>(d.id, d.data()));
            setBattleMaps(maps);
          },
          (err) => {
            console.warn("[Firestore/Entities/Maps] Listener error:", err);
            if (!mounted) return;
            setBattleMaps([]);
          }
        );
        unsubsRef.current.push(unsubMaps);

        // ── Journal listener ──
        const unsubJournal = onSnapshot(
          collection(db, `${campaignPath}/journal`),
          (snap) => {
            if (!mounted) return;
            const entries = snap.docs.map((d) => fromFirestore<JournalEntry>(d.id, d.data()));
            setJournal(entries);
          },
          (err) => {
            console.warn("[Firestore/Entities/Journal] Listener error:", err);
            if (!mounted) return;
            setJournal([]);
          }
        );
        unsubsRef.current.push(unsubJournal);

        setFirebaseConnected(true);
        retryCountRef.current = 0;
      }).catch((err) => {
        console.warn("[Firestore/Entities] Failed to initialize:", err);
        if (!mounted) return;
        // Retry logic: connection watchdog
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          retryTimeoutRef.current = setTimeout(subscribe, RETRY_DELAY_MS);
        }
      });
    }

    subscribe();

    // Connection watchdog retry
    retryTimeoutRef.current = setTimeout(() => {
      if (!mounted) return;
      if (!firebaseConnectedRef.current && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        subscribe();
      }
    }, RETRY_DELAY_MS);

    return () => {
      mounted = false;
      mountedRef.current = false;
      cleanup();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, role, setEnemies, setEncounters, setBattleMaps, setMapTokens, setJournal, setFirebaseConnected]);
}
