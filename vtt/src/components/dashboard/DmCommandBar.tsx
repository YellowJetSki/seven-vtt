/**
 * STᚱ VTT — DM Command Bar (Token-Systematic Overrrides-Grade v3.0)
 *
 * Premium floating sticky command bar. Uses the global design token system
 * from lib/design-tokens.ts for consistent shadows, glass gradients,
 * animation easings, and spacing.
 *
 * Gives the DM instant at-a-glance awareness of:
 * — Identity (username + DM role badge)
 * — Sync state (Firebase connected/syncing)
 * — Combat state (active/inactive with animated pulse)
 * — Campaign context (Arkla badge)
 */

import { useAuthStore } from "@/stores/authStore";
import { useCombatStore } from "@/stores/combatStore";
import { ease, duration, buttonVariant, goldEdgeLight, glassCardWithEdge } from "@/lib/design-tokens";

export default function DmCommandBar() {
  const username = useAuthStore((s) => s.username);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const isInCombat = activeEncounter?.phase === "active" || activeEncounter?.phase === "prep";

  return (
    <div className="relative mb-5">
      {/* Glass bar with premium shadow + edge light */}
      <div
        className={`relative ${glassCardWithEdge("toolbar")}`}
        style={{
          animation: `slide-in-up ${duration.entrance}ms ${ease.premium} 0.1s forwards`,
          opacity: 0,
        }}
      >
        {/* Gold edge light */}
        <div className={goldEdgeLight} />

        <div className="relative z-10 flex items-center justify-between px-4 py-2.5 sm:px-5">
          {/* Left: DM Identity + Status */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* DM Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/8 border border-gold-500/20 flex items-center justify-center text-xs font-bold text-gold-400 font-serif drop-shadow-[0_0_6px_rgba(234,179,8,0.15)]">
              ᚱ
            </div>

            {/* Name + Role + Sync */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/90">{username || "Dungeon Master"}</span>
                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/15 text-gold-400 font-medium">
                  DM
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Sync status dot */}
                <span
                  className={`w-1 h-1 rounded-full transition-all ${duration.fast}ms ${
                    firebaseConnected
                      ? "bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]"
                      : "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]"
                  }`}
                />
                <span className="text-[9px] text-surface-500 tracking-wide">
                  {firebaseConnected ? "Connected" : "Syncing..."}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Session Status */}
          <div className="flex items-center gap-3">
            {/* Combat indicator */}
            {isInCombat && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/15">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-400">
                  Combat Active
                </span>
              </div>
            )}

            {/* Campaign badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-900/50 border border-white/[0.04]">
              <svg className="w-3 h-3 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-[9px] text-surface-400 tracking-wide">Arkla Campaign</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
