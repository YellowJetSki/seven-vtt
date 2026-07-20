/**
 * STᚱ VTT — useFirestoreCombatSync (Fixed + Retry Exhaustion)
 *
 * Bridges the combatStore (Zustand) with Firestore real-time data.
 *
 * FIXES:
 *   - Sprint 25: Fixed stale closure where `firebaseConnected` was captured
 *     in the `subscribeWithRetry` timeout closure at initial render time.
 *   - Sprint 6: Added retry exhaustion tracking — when all MAX_RETRIES fail,
 *     signals `syncExhausted` on the auth store so the ConnectionBanner
 *     can display a persistent "Sync Unavailable" state.
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCombatStore } from "@/stores/combatStore";
import { listenActiveEncounter } from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useFirestoreCombatSync(): void {
  const mountedRef = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firebaseConnectedRef = useRef(false);

  const authState = useAuthStore((s) => s.state);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setSyncExhausted = useAuthStore((s) => s.setSyncExhausted);
  const setEncounter = useCombatStore((s) => s.setEncounter);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  firebaseConnectedRef.current = firebaseConnected;

  useEffect(() => {
    if (authState !== "authenticated") return;
    if (mountedRef.current) return;
    mountedRef.current = true;

    let mounted = true;

    function subscribe() {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }

      const unsub = listenActiveEncounter(FALLBACK_CAMPAIGN_ID, (encounter) => {
        if (!mounted) return;
        if (encounter) {
          setEncounter(encounter);
        }
        setFirebaseConnected(true);
        retryCountRef.current = 0;
      });

      unsubRef.current = unsub;
    }

    function subscribeWithRetry() {
      subscribe();

      retryTimeoutRef.current = setTimeout(() => {
        if (!mounted) return;

        if (!firebaseConnectedRef.current && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.info(`[FirestoreCombatSync] Retry ${retryCountRef.current}/${MAX_RETRIES}...`);
          subscribeWithRetry();
        } else if (!firebaseConnectedRef.current) {
          // Retries exhausted — signal persistent failure
          console.warn("[FirestoreCombatSync] All retries exhausted.");
          setSyncExhausted(true);
        }
      }, RETRY_DELAY_MS);
    }

    subscribeWithRetry();

    return () => {
      mounted = false;
      mountedRef.current = false;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, setEncounter, setFirebaseConnected, setSyncExhausted]);
}
