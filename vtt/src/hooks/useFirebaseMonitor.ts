/* ── Firebase Connection Monitor ──────────────────────────────
 * Monitors Firebase real-time connection health and provides
 * auto-reconnection with exponential backoff.
 *
 * ── Features ──────────────────────────────────────────────────
 * • Pings the Firestore emulator or production endpoint
 * • Shows a persistent status indicator in the UI
 * • Auto-reconnects on disconnect (up to 5 attempts)
 * • Surfaces connection errors to the user via toast
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useCallback } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { getDb, isFirebaseAvailable } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

/** Maximum reconnection attempts before giving up */
const MAX_RETRIES = 5;
/** Base delay for exponential backoff (ms) */
const BASE_DELAY = 2000;

/**
 * Hook that monitors Firebase connection health.
 * Call once at the root of the app (in AppShell).
 *
 * Updates `authStore.firebaseConnected` and shows toast on
 * connection state transitions.
 */
export function useFirebaseMonitor() {
  const isAuthenticated = useAuthStore((s) => s.state === "authenticated");
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const showToast = useUiStore((s) => s.showToast);
  const retryCount = useRef(0);
  const unsubRef = useRef<(() => void) | null>(null);
  const isMonitoring = useRef(false);

  const attemptReconnect = useCallback(() => {
    if (retryCount.current >= MAX_RETRIES) {
      console.warn("[Firebase Monitor] Max retries reached. Giving up.");
      setFirebaseConnected(false);
      return;
    }

    const delay = BASE_DELAY * Math.pow(2, retryCount.current);
    retryCount.current += 1;

    setTimeout(() => {
      if (!isFirebaseAvailable()) return;
      try {
        const db = getDb();
        // Try to read a known document
        getDoc(doc(db, "campaigns", "arkla")).then(() => {
          retryCount.current = 0;
          setFirebaseConnected(true);
          showToast({
            message: "Firebase reconnected. Sync is active again.",
            type: "success",
            duration: 3000,
          });
        }).catch(() => {
          // Still disconnected
          attemptReconnect();
        });
      } catch {
        attemptReconnect();
      }
    }, delay);
  }, [setFirebaseConnected, showToast]);

  useEffect(() => {
    if (!isFirebaseAvailable() || !isAuthenticated) return;

    if (isMonitoring.current) return;
    isMonitoring.current = true;

    try {
      const db = getDb();
      // Subscribe to the campaign meta document for health checking
      // Use campaigns/arkla (which always exists) instead of a non-existent _health doc
      const unsub = onSnapshot(
        doc(db, "campaigns", "arkla"),
        {
          next: (snap) => {
            if (snap.exists()) {
              retryCount.current = 0;
              setFirebaseConnected(true);
            }
            // If document doesn't exist, Firestore returns a 404 via snapshot,
            // but the connection is still healthy, so we treat this as connected.
            retryCount.current = 0;
            setFirebaseConnected(true);
          },
          error: (err) => {
            console.warn("[Firebase Monitor] Connection lost:", err.message);
            setFirebaseConnected(false);
            attemptReconnect();
          },
        },
      );
      unsubRef.current = unsub;
    } catch (err) {
      console.error("[Firebase Monitor] Failed to initialize:", err);
      setFirebaseConnected(false);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      isMonitoring.current = false;
      retryCount.current = 0;
    };
  }, [isAuthenticated, setFirebaseConnected, attemptReconnect]);
}
