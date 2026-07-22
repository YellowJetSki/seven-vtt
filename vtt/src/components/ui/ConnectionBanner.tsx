/**
 * STᚱ VTT — ConnectionBanner (Redesigned — Non-Intrusive Floating Toast)
 *
 * A discreet, floating snackbar/toast-style indicator that appears in the
 * bottom-left corner of the screen — never overlapping sidebar, header,
 * or content. It auto-dismisses when connected and stays subtle when offline.
 *
 * Design:
 *   - Small, floating, non-overlapping (positioned at bottom-4 left-4)
 *   - Only a colored dot + brief label (no full banner bar)
 *   - "connected" → shows briefly then dismisses
 *   - "offline"/"exhausted" → shows persistently as compact dot
 *   - Zero layout shift — uses `fixed` positioning outside flow
 *   - Won't overlap sidebar (left-4 avoids sidebar area)
 */

import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";

type ConnectionState = "connected" | "offline" | "exhausted";

export default function ConnectionBanner() {
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const syncExhausted = useAuthStore((s) => s.syncExhausted);
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>();
  const prevConnected = useRef(firebaseConnected);

  // Derive connection state
  const connectionState: ConnectionState = !firebaseConnected && syncExhausted
    ? "exhausted"
    : firebaseConnected
      ? "connected"
      : "offline";

  useEffect(() => {
    // Clear any pending dismiss timer
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    const wasConnected = prevConnected.current;
    prevConnected.current = firebaseConnected;

    if (connectionState === "connected") {
      // Transitioning TO connected — show briefly then dismiss
      if (!wasConnected) {
        setMessage("Synced");
        setVisible(true);
        dismissTimer.current = setTimeout(() => {
          setVisible(false);
        }, 2000);
      } else {
        // Already connected — hide
        setVisible(false);
      }
    } else if (connectionState === "offline") {
      setMessage("Offline");
      setVisible(true);
    } else if (connectionState === "exhausted") {
      setMessage("Sync unavailable");
      setVisible(true);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [connectionState, firebaseConnected]);

  if (!visible) return null;

  const isExhausted = connectionState === "exhausted";
  const isOffline = connectionState === "offline";

  const dotColor = isExhausted
    ? "bg-amber-400"
    : isOffline
      ? "bg-rose-400"
      : "bg-emerald-400";

  const textColor = isExhausted
    ? "text-amber-200/80"
    : isOffline
      ? "text-rose-200/80"
      : "text-emerald-200/80";

  const bgGlass = "bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f101a]/[0.95] backdrop-blur-2xl border border-white/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.3)]";

  return (
    <div
      className={`fixed bottom-4 left-4 z-[60] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
      }`}
    >
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bgGlass}`}>
        {/* Colored dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor} ${
          isExhausted || isOffline ? "animate-pulse-soft" : ""
        }`} />
        {/* Text */}
        <span className={`text-[11px] font-medium ${textColor} leading-none`}>
          {message}
        </span>
        {/* Subtle dismiss X for persistent states */}
        {(isExhausted || isOffline) && (
          <button
            onClick={() => setVisible(false)}
            className="ml-1 w-4 h-4 flex items-center justify-center rounded-full text-surface-600 hover:text-surface-400 hover:bg-white/[0.04] transition-all duration-200 active:scale-90"
            aria-label="Dismiss"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
