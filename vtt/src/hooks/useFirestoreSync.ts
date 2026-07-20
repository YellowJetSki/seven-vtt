/**
 * STᚱ VTT — useFirestoreSync (Optimized + Retry Exhaustion)
 *
 * Bridges the gap between local Zustand state and Firestore real-time data.
 *
 * Architecture:
 *   Firestore ──(onSnapshot)──► useFirestoreSync ──(setState)──► Zustand Store
 *   UI mutations ──► useCharacterMutations ──(setDoc)──► Firestore ◄──(onSnapshot)──► other tabs
 *
 * OPTIMIZATIONS (Sprints 6, 25):
 *   - Fixed `Promise<Unsubscribe> as unknown as Unsubscribe` anti-pattern.
 *   - `listenCharacters` returns sync `Unsubscribe` immediately.
 *   - Retry logic: up to 3 attempts with 2s delay on failure.
 *   - Stale closure fix: uses `firebaseConnectedRef` in timeout callbacks.
 *   - Connection watchdog: if no sync arrives within RETRY_DELAY_MS, retry.
 *   - Retry exhaustion: when all MAX_RETRIES fail, signals `syncExhausted`.
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
  const firebaseConnectedRef = useRef(false);

  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setSyncExhausted = useAuthStore((s) => s.setSyncExhausted);
  const setCharacters = useCampaignStore((s) => s.setCharacters);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  firebaseConnectedRef.current = firebaseConnected;

  useEffect(() => {
    if (authState !== "authenticated" || !role) return;
    if (mountedRef.current) return;
    mountedRef.current = true;

    let mounted = true;

    function subscribe() {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }

      const unsub = listenCharacters(FALLBACK_CAMPAIGN_ID, (characters) => {
        if (!mounted) return;
        setCharacters(characters);
        setFirebaseConnected(true);
        retryCountRef.current = 0;
      });

      unsubRef.current = unsub;
    }

    function subscribeWithRetry() {
      subscribe();

      // Connection watchdog: if no sync within RETRY_DELAY_MS, retry
      retryTimeoutRef.current = setTimeout(() => {
        if (!mounted) return;

        if (!firebaseConnectedRef.current && retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          console.info(`[FirestoreSync] Retry ${retryCountRef.current}/${MAX_RETRIES}...`);
          subscribeWithRetry();
        } else if (!firebaseConnectedRef.current) {
          // Retries exhausted — signal UI for persistent failure banner
          console.warn("[FirestoreSync] All retries exhausted.");
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
  }, [authState, role, setCharacters, setFirebaseConnected, setSyncExhausted]);
}

export { FALLBACK_CAMPAIGN_ID };
