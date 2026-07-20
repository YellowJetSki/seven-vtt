/**
 * STᚱ VTT — ConnectionBanner
 *
 * Premium sync status banner that slides in when Firebase connection drops.
 * Shows to both DM and Player views with contextual messaging.
 *
 * Visual Design:
 * - Ambient gold glow for reconnecting, emerald for synced
 * - Premium glass gradient with edge light matching design system
 * - Animated slide-in from top
 * - Staggered entrance/exit animations
 *
 * Connection states:
 *   connected    → hidden (banner dismissed)
 *   reconnecting → amber slide-in with "Reconnecting..." + retry count
 *   offline      → rose slide-in with "Connection lost" + pending count
 */

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { getPendingMutations } from "@/hooks/useOfflineQueue";

type ConnectionState = "connected" | "offline";

export default function ConnectionBanner() {
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const characters = useCampaignStore((s) => s.characters);
  const [animState, setAnimState] = useState<"entering" | "visible" | "exiting">("exiting");
  const [lastPing, setLastPing] = useState<number>(Date.now());

  // Derive connection state
  const connectionState: ConnectionState = firebaseConnected ? "connected" : "offline";

  // Track last time we had a successful sync
  useEffect(() => {
    if (firebaseConnected) {
      setLastPing(Date.now());
    }
  }, [firebaseConnected, characters.length]);

  // Animate banner in/out based on connection state
  useEffect(() => {
    if (connectionState === "connected") {
      // Connected — animate out after a brief hold
      if (animState === "visible") {
        const timeout = setTimeout(() => setAnimState("exiting"), 1200);
        return () => clearTimeout(timeout);
      }
      return;
    }

    // Offline — animate in
    if (animState === "exiting") {
      setAnimState("entering");
      const timeout = setTimeout(() => setAnimState("visible"), 50);
      return () => clearTimeout(timeout);
    }
  }, [connectionState, animState]);

  if (animState === "exiting") return null;

  const pendingMutations = getPendingMutations();

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        animState === "entering"
          ? "-translate-y-full opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      {/* Banner body */}
      <div
        className={`mx-auto max-w-2xl mt-2 rounded-xl border shadow-lg backdrop-blur-2xl ${
          connectionState === "offline"
            ? "bg-gradient-to-r from-rose-950/60 to-amber-950/40 border-rose-500/20 shadow-rose-500/5"
            : "bg-gradient-to-r from-emerald-950/50 to-gold-950/30 border-emerald-500/15 shadow-emerald-500/5"
        }`}
      >
        {/* Edge light */}
        <div
          className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${
            connectionState === "offline"
              ? "via-rose-500/20"
              : "via-emerald-500/20"
          } to-transparent`}
        />

        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Connection dot */}
          <div className="relative shrink-0">
            <span
              className={`w-2 h-2 rounded-full block ${
                connectionState === "offline"
                  ? "bg-rose-500"
                  : "bg-emerald-500"
              }`}
            />
            {}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${
              connectionState === "offline" ? "text-rose-200" : "text-emerald-200"
            }`}>
              {connectionState === "offline"
                ? "Connection lost"
                : "Synced"
              }
            </p>
            <p className={`text-[10px] mt-0.5 ${
              connectionState === "offline" ? "text-rose-300/50" : "text-emerald-300/50"
            }`}>
              {connectionState === "offline"
                ? `Last synced ${formatTimeSince(lastPing)} ago${pendingMutations.length > 0 ? ` · ${pendingMutations.length} pending updates` : ""}`
                : "All data synced"
              }
            </p>
          </div>

          {/* Pending count badge */}
          {pendingMutations.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-mono text-rose-300/80">{pendingMutations.length}</span>
            </div>
          )}

          {/* Reconnect indicator — only shows when connected */}
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
