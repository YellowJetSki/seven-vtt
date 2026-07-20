/**
 * STᚱ VTT — useFirestoreEntitySync (Campaign Meta + Entities + Retry Exhaustion)
 *
 * Bridges campaign entities (campaign meta, enemies, encounters,
 * battleMaps, journal) between Firestore and Zustand.
 *
 * Sprint 5: Added campaign meta onSnapshot listener.
 * Sprint 6: Added retry exhaustion signaling to authStore.
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { getFirestoreDb } from "@/lib/firebase";
import { collection, onSnapshot, doc, type Unsubscribe } from "firebase/firestore";
import { fromFirestore, CAMPAIGN_COLLECTION } from "@/lib/firestore/helpers";
import type { CampaignMeta, EnemyDoc, Encounter, BattleMap, MapToken, JournalEntry } from "@/types";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useFirestoreEntitySync(): void {
  const mountedRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firebaseConnectedRef = useRef(false);

  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setSyncExhausted = useAuthStore((s) => s.setSyncExhausted);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  const setMeta = useCampaignStore((s) => s.setMeta);
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

        // Campaign Meta
        const unsubMeta = onSnapshot(
          doc(db, CAMPAIGN_COLLECTION, FALLBACK_CAMPAIGN_ID),
          (snap) => {
            if (!mounted) return;
            if (snap.exists()) {
              setMeta(fromFirestore<CampaignMeta>(snap.id, snap.data()));
            }
            setFirebaseConnected(true);
            retryCountRef.current = 0;
          },
          (err) => {
            console.warn("[Firestore/Entities] Meta error:", err);
          }
        );
        unsubsRef.current.push(unsubMeta);

        // Enemies
        const unsubEnemies = onSnapshot(
          collection(db, `${campaignPath}/enemies`),
          (snap) => {
            if (!mounted) return;
            setEnemies(snap.docs.map((d) => fromFirestore<EnemyDoc>(d.id, d.data())));
            setFirebaseConnected(true);
            retryCountRef.current = 0;
          },
          (err) => {
            console.warn("[Firestore/Entities] Enemies error:", err);
            if (!mounted) return;
            setEnemies([]);
          }
        );
        unsubsRef.current.push(unsubEnemies);

        // Encounters
        const unsubEncounters = onSnapshot(
          collection(db, `${campaignPath}/encounters`),
          (snap) => {
            if (!mounted) return;
            setEncounters(snap.docs.map((d) => fromFirestore<Encounter>(d.id, d.data())));
            setFirebaseConnected(true);
            retryCountRef.current = 0;
          },
          (err) => {
            console.warn("[Firestore/Entities] Encounters error:", err);
            if (!mounted) return;
            setEncounters([]);
          }
        );
        unsubsRef.current.push(unsubEncounters);

        // Battle Maps
        const unsubMaps = onSnapshot(
          collection(db, `${campaignPath}/maps`),
          (snap) => {
            if (!mounted) return;
            setBattleMaps(snap.docs.map((d) => fromFirestore<BattleMap>(d.id, d.data())));
            setFirebaseConnected(true);
            retryCountRef.current = 0;
          },
          (err) => {
            console.warn("[Firestore/Entities] Maps error:", err);
            if (!mounted) return;
            setBattleMaps([]);
          }
        );
        unsubsRef.current.push(unsubMaps);

        // Journal
        const unsubJournal = onSnapshot(
          collection(db, `${campaignPath}/journal`),
          (snap) => {
            if (!mounted) return;
            setJournal(snap.docs.map((d) => fromFirestore<JournalEntry>(d.id, d.data())));
            setFirebaseConnected(true);
            retryCountRef.current = 0;
          },
          (err) => {
            console.warn("[Firestore/Entities] Journal error:", err);
            if (!mounted) return;
            setJournal([]);
          }
        );
        unsubsRef.current.push(unsubJournal);

      }).catch((err) => {
        console.warn("[Firestore/Entities] Init error:", err);
        if (!mounted) return;
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          retryTimeoutRef.current = setTimeout(subscribe, RETRY_DELAY_MS);
        } else {
          setSyncExhausted(true);
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
      } else if (!firebaseConnectedRef.current) {
        setSyncExhausted(true);
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
  }, [authState, role, setMeta, setEnemies, setEncounters, setBattleMaps, setMapTokens, setJournal, setFirebaseConnected, setSyncExhausted]);
}
