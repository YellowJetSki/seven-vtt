/**
 * STᚱ VTT — ConnectionBanner (Sprint 6: Retry Exhaustion)
 *
 * Premium sync status banner that slides in when Firebase connection drops.
 * Shows on ALL authenticated pages (DM + Player views).
 *
 * States (Sprint 6):
 *   connected      → emerald, auto-dismiss after 1.2s
 *   offline        → rose, "Connection lost" + pending count
 *   exhausted      → amber, "Sync Unavailable" — persistent until retry succeeds
 *
 * Visual Design:
 *   - Premium glass gradient backdrop
 *   - Edge light matching the design system
 *   - Animated slide-in from top with spring easing
 *   - Color-coded status dot (emerald/rose/amber)
 *   - Pending mutation count badge
 */

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getPendingMutations } from "@/hooks/useOfflineQueue";

type ConnectionState = "connected" | "offline" | "exhausted";

export default function ConnectionBanner() {
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const syncExhausted = useAuthStore((s) => s.syncExhausted);
  const [animState, setAnimState] = useState<"entering" | "visible" | "exiting">("exiting");
  const [lastPing, setLastPing] = useState<number>(Date.now());

  // Derive connection state
  const connectionState: ConnectionState = !firebaseConnected && syncExhausted
    ? "exhausted"
    : firebaseConnected
      ? "connected"
      : "offline";

  // Track last ping (any successful sync)
  useEffect(() => {
    if (firebaseConnected) {
      setLastPing(Date.now());
    }
  }, [firebaseConnected]);

  // Animate banner in/out
  useEffect(() => {
    if (connectionState === "connected") {
      if (animState === "visible") {
        const timeout = setTimeout(() => setAnimState("exiting"), 1200);
        return () => clearTimeout(timeout);
      }
      return;
    }

    // Offline or exhausted — animate in
    if (animState === "exiting") {
      setAnimState("entering");
      const timeout = setTimeout(() => setAnimState("visible"), 50);
      return () => clearTimeout(timeout);
    }
  }, [connectionState, animState]);

  if (animState === "exiting") return null;

  const pendingMutations = getPendingMutations();

  // ── Styling per state ──
  const isExhausted = connectionState === "exhausted";
  const isOffline = connectionState === "offline";

  const bannerBg = isExhausted
    ? "from-amber-950/60 to-rose-950/30 border-amber-500/20 shadow-amber-500/5"
    : isOffline
      ? "from-rose-950/60 to-amber-950/40 border-rose-500/20 shadow-rose-500/5"
      : "from-emerald-950/50 to-gold-950/30 border-emerald-500/15 shadow-emerald-500/5";

  const edgeColor = isExhausted
    ? "via-amber-500/20"
    : isOffline
      ? "via-rose-500/20"
      : "via-emerald-500/20";

  const dotColor = isExhausted
    ? "bg-amber-500"
    : isOffline
      ? "bg-rose-500"
      : "bg-emerald-500";

  const labelColor = isExhausted
    ? "text-amber-200"
    : isOffline
      ? "text-rose-200"
      : "text-emerald-200";

  const subColor = isExhausted
    ? "text-amber-300/50"
    : isOffline
      ? "text-rose-300/50"
      : "text-emerald-300/50";

  const label = isExhausted
    ? "Sync Unavailable"
    : isOffline
      ? "Connection lost"
      : "Synced";

  const subtext = isExhausted
    ? `Last successful sync ${formatTimeSince(lastPing)} ago${pendingMutations.length > 0 ? ` · ${pendingMutations.length} pending updates` : ""}`
    : isOffline
      ? `Last synced ${formatTimeSince(lastPing)} ago${pendingMutations.length > 0 ? ` · ${pendingMutations.length} pending updates` : ""}`
      : "All data synced";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        animState === "entering"
          ? "-translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className={`mx-auto max-w-2xl mt-2 rounded-xl border shadow-lg backdrop-blur-2xl bg-gradient-to-r ${bannerBg}`}>
        {/* Edge light */}
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${edgeColor} to-transparent`} />

        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Connection dot */}
          <div className="relative shrink-0">
            <span className={`w-2 h-2 rounded-full block ${dotColor}`} />
            {isExhausted && (
              <span className="absolute inset-0 w-2 h-2 rounded-full bg-amber-500 animate-ping opacity-60" />
            )}
            {isOffline && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${labelColor}`}>{label}</p>
            <p className={`text-[10px] mt-0.5 ${subColor}`}>{subtext}</p>
          </div>

          {/* Pending count badge */}
          {pendingMutations.length > 0 && (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
              isExhausted
                ? "bg-amber-500/10 border-amber-500/10"
                : "bg-rose-500/10 border-rose-500/10"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                isExhausted ? "bg-amber-500" : "bg-rose-500"
              }`} />
              <span className={`text-[10px] font-mono ${
                isExhausted ? "text-amber-300/80" : "text-rose-300/80"
              }`}>{pendingMutations.length}</span>
            </div>
          )}

          {/* Sync indicator — only shows when connected */}
          {connectionState === "connected" && (
            <svg className="w-4 h-4 text-emerald-400/50 shrink-0 animate-in fade-in duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/** Format a timestamp as a human-readable "time since" string */
function formatTimeSince(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "moments";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}
