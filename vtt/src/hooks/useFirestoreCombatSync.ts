/**
 * STᚱ VTT — useFirestoreCombatSync (Fixed)
 *
 * Bridges the combatStore (Zustand) with Firestore real-time data.
 *
 * FIX (Sprint 25): Fixed stale closure bug where `firebaseConnected` was
 * captured in the `subscribeWithRetry` timeout closure at initial render time,
 * causing the retry watchdog to check a stale value and potentially retry
 * even after successful connection. Now uses `firebaseConnectedRef` to always
 * read the latest value inside the timeout callback.
 *
 * MUST be mounted once alongside useFirestoreSync in the auth gate.
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
  // Ref-based connection tracking to avoid stale closure in timeout callbacks
  const firebaseConnectedRef = useRef(false);

  const authState = useAuthStore((s) => s.state);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setEncounter = useCombatStore((s) => s.setEncounter);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  // Keep ref in sync with zustand value
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

        // Use ref value — always reads LATEST firebaseConnected, not stale closure
        if (!firebaseConnectedRef.current && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.info(`[FirestoreCombatSync] Retry ${retryCountRef.current}/${MAX_RETRIES}...`);
          subscribeWithRetry();
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
    // Note: intentionally OMIT firebaseConnected from deps to prevent
    // re-running the effect on every connection toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, setEncounter, setFirebaseConnected]);
}
