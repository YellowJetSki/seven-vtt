/**
 * STᚱ VTT — useFirestoreSync (Optimized)
 *
 * Bridges the gap between local Zustand state and Firestore real-time data.
 *
 * Architecture:
 *   Firestore ──(onSnapshot)──► useFirestoreSync ──(setState)──► Zustand Store
 *   UI mutations ──► useCharacterMutations ──(setDoc)──► Firestore ◄──(onSnapshot)──► other tabs
 *
 * OPTIMIZATION (Sprint 6):
 *   - Fixed the dangerous `Promise<Unsubscribe> as unknown as Unsubscribe` pattern.
 *   - `listenCharacters` now returns a sync `Unsubscribe` immediately.
 *   - Added retry logic: up to 3 attempts with 2s delay on failure.
 *   - Added `retryTimeoutRef` to clear pending retries on unmount.
 *   - Mounted flag correctly handles React strict mode double-invoke.
 *   - Error callback from onSnapshot triggers retry sequence.
 *
 * MUST be mounted once at the top of the app tree (App.tsx or CampaignPage).
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { listenCharacters } from "@/lib/firestore-service";

const FALLBACK_CAMPAIGN_ID = "arkla-campaign";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function useFirestoreSync(): void {
  const mountedRef = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setCharacters = useCampaignStore((s) => s.setCharacters);

  useEffect(() => {
    if (authState !== "authenticated" || !role) return;
    if (mountedRef.current) return;
    mountedRef.current = true;

    let mounted = true;

    function subscribe() {
      // Clean up previous subscription if retrying
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }

      const unsub = listenCharacters(FALLBACK_CAMPAIGN_ID, (characters) => {
        if (!mounted) return;
        setCharacters(characters);
        setFirebaseConnected(true);
        retryCountRef.current = 0; // Reset retry count on successful sync
      });

      unsubRef.current = unsub;
    }

    function subscribeWithRetry() {
      subscribe();

      // The error path is handled inside listenCharacters's onSnapshot error callback.
      // We can't catch FS init errors synchronously because getFirestoreDb is async.
      // Instead, we rely on the `listenCharacters` internal error path to call callback([])
      // and set FirebaseConnected to false by the listener supervisor.
      // The retry is triggered by externally checking if connection succeeded.
      //
      // Use a connection watchdog: if no sync arrives within RETRY_DELAY_MS, retry.
      // This catches silent failures where Firestore init hangs.

      retryTimeoutRef.current = setTimeout(() => {
        if (!mounted) return;

        const storeState = useAuthStore.getState();
        if (!storeState.firebaseConnected && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.info(`[FirestoreSync] Retry ${retryCountRef.current}/${MAX_RETRIES}...`);
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

      setFirebaseConnected(false);
    };
  }, [authState, role, setCharacters, setFirebaseConnected]);
}

export { FALLBACK_CAMPAIGN_ID };
