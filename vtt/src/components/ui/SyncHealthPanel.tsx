/**
 * STᚱ VTT — Sync Health Panel (Sprint 9: Firebase & Login Phase)
 *
 * DM-accessible panel showing real-time Firebase connection status,
 * sync health, and player authentication states.
 *
 * Features:
 * - Firebase connection: connected/reconnecting/disconnected
 * - Auth state: authenticated with email/role
 * - Sync lag: timestamp comparison for staleness detection
 * - Local storage persist status
 * - Manual sync retry button
 *
 * Mounted as a floating dropdown in the sidebar footer.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";

export default function SyncHealthPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // Auth state
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const username = useAuthStore((s) => s.username);
  const characterId = useAuthStore((s) => s.characterId);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const syncExhausted = useAuthStore((s) => s.syncExhausted);
  const firebaseAuthLoading = useAuthStore((s) => s.firebaseAuthLoading);
  const firebaseAuthError = useAuthStore((s) => s.firebaseAuthError);

  // Campaign store stats
  const charCount = useCampaignStore((s) => s.characters.length);
  const mapCount = useCampaignStore((s) => s.battleMaps.length);
  const metaLastUpdated = useCampaignStore((s) => s.meta?.updatedAt);

  // Combat store
  const encounter = useCombatStore((s) => s.activeEncounter);
  const inCombat = encounter?.phase === "active";

  // Client timestamp for staleness check
  const [clientNow, setClientNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setClientNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Staleness detection
  const dataStale = metaLastUpdated ? (clientNow - metaLastUpdated) > 60000 : false;

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="relative">
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all duration-200 text-[10px] tracking-wide ${
          isOpen
            ? "bg-white/[0.04] text-gold-400"
            : "text-surface-500 hover:text-surface-300 hover:bg-white/[0.02]"
        }`}
      >
        {/* Status dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            syncExhausted
              ? "bg-amber-500"
              : firebaseConnected
                ? "bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]"
                : "bg-amber-500 animate-pulse"
          }`}
        />
        <span className="flex-1 text-left">
          {syncExhausted
            ? "Sync Unavailable"
            : firebaseConnected
              ? "System Online"
              : "Connecting..."
          }
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* ── Dropdown Panel ── */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 z-50 animate-slide-in-up">
          <div className="bg-gradient-to-b from-[#14151f]/95 to-[#0f101a]/98 backdrop-blur-xl border border-white/[0.06] rounded-xl p-4 shadow-xl shadow-black/30">
            {/* Connection Status */}
            <div className="space-y-3">
              <h4 className="text-[9px] uppercase tracking-widest text-gold-400/50 font-medium">
                Connection
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-surface-500">Firebase</span>
                  <span className={`text-[10px] font-medium flex items-center gap-1.5 ${
                    firebaseConnected ? "text-emerald-400" : syncExhausted ? "text-amber-400" : "text-amber-400"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      firebaseConnected ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                    }`} />
                    {firebaseConnected ? "Connected" : syncExhausted ? "Unavailable" : "Connecting..."}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-surface-500">Auth State</span>
                  <span className={`text-[10px] font-medium ${
                    authState === "authenticated" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {authState}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-surface-500">Role</span>
                  <span className="text-[10px] font-medium text-gold-400/80">
                    {role || "none"}
                  </span>
                </div>

                {username && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-surface-500">User</span>
                    <span className="text-[10px] font-medium text-white/70">
                      {username}
                    </span>
                  </div>
                )}

                {characterId && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-surface-500">Character</span>
                    <span className="text-[10px] font-medium text-gold-400/60 truncate max-w-[120px]">
                      {characterId.slice(0, 20)}...
                    </span>
                  </div>
                )}
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Campaign Data */}
              <h4 className="text-[9px] uppercase tracking-widest text-gold-400/50 font-medium">
                Data Store
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-surface-500">Characters</span>
                  <span className="text-[10px] font-medium text-white/70">{charCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-surface-500">Maps</span>
                  <span className="text-[10px] font-medium text-white/70">{mapCount}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-surface-500">In Combat</span>
                  <span className={`text-[10px] font-medium ${inCombat ? "text-rose-400" : "text-surface-500"}`}>
                    {inCombat ? "Yes" : "No"}
                  </span>
                </div>

                {dataStale && (
                  <div className="flex items-center gap-2 text-[9px] text-amber-400/60 bg-amber-500/10 rounded-lg px-2 py-1.5 mt-1">
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    Data may be stale
                  </div>
                )}
              </div>

              {/* Action */}
              {syncExhausted && (
                <button
                  onClick={handleRefresh}
                  className="w-full mt-2 h-8 rounded-lg text-[9px] font-semibold transition-all duration-200
                    bg-amber-500/10 border border-amber-500/15 text-amber-400/80
                    hover:bg-amber-500/15 active:scale-[0.98]"
                >
                  Reconnect
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
