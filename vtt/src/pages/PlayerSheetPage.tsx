/**
 * STᚱ VTT — Player Sheet Page (Sprint 7: Auto-Reconnect + Loading)
 *
 * Full-screen premium character sheet.
 * Accessed after player login. Shows all character info.
 * Mobile-first with staggered entrance animations.
 *
 * Sprint 7 upgrades:
 * - Loading state while Firestore syncs characters on page refresh
 * - Premium empty state for persisted login without data
 * - Reconnect hint when character ID is saved but data hasn't loaded
 * - Clean logout state transition that redirects to player login
 */

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerSheet from "@/components/player/PlayerSheet";
import PlayerShareReveal from "@/components/player/PlayerShareReveal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function PlayerSheetPage() {
  const navigate = useNavigate();
  const characterId = useAuthStore((s) => s.characterId);
  const username = useAuthStore((s) => s.username);
  const characters = useCampaignStore((s) => s.characters);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const syncExhausted = useAuthStore((s) => s.syncExhausted);
  const logout = useAuthStore((s) => s.logout);

  const character = characters.find((c) => c.id === characterId);

  // ── Loading: persisted login, awaiting Firestore sync ──
  if (!character && characterId && !firebaseConnected && !syncExhausted) {
    return (
      <div className="h-screen w-screen bg-[#07080d] flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-5">
            <span className="text-2xl text-gold-400">ᚱ</span>
          </div>
          <LoadingSpinner size="lg" label="Loading campaign data..." />
          <p className="text-xs text-surface-600 mt-4 leading-relaxed">
            Your character will load automatically once the connection is established.
            <br />
            <span className="text-surface-700 italic">This should only take a moment...</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Character not found (persisted login but character data missing) ──
  if (!character) {
    // Show different messaging based on whether we're waiting for sync or truly missing
    const isWaitingForSync = characterId && !syncExhausted;

    return (
      <div className="h-screen w-screen bg-[#07080d] flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f101a]/[0.95] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 max-w-sm w-full shadow-[0_32px_80px_rgba(0,0,0,0.55)] text-center animate-in fade-in zoom-in-95 duration-300">
          {/* Gold edge light */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent rounded-t-2xl" />

          <span className="text-5xl block mb-4">⚔</span>
          <h2 className="text-lg font-bold text-white mb-2">
            {isWaitingForSync ? "Loading Character Data..." : "Character Not Found"}
          </h2>
          <p className="text-sm text-surface-400 mb-6 leading-relaxed">
            {isWaitingForSync
              ? "We've saved your login, but the character data hasn't arrived yet. Please wait for the connection to sync."
              : "Your character data wasn't found. It may have been removed by the DM or the campaign was reset."}
          </p>

          {/* Reconnect hint */}
          {!firebaseConnected && !syncExhausted && (
            <p className="text-[10px] text-amber-400/60 mb-4 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Connecting to campaign...
            </p>
          )}

          {/* Sync exhausted message */}
          {syncExhausted && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
              <p className="text-[10px] text-amber-300/70">
                Campaign data is currently unavailable. The DM may not be online or the server is temporarily down.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {/* Retry button when exhausted */}
            {syncExhausted && (
              <button
                onClick={() => window.location.reload()}
                className="w-full h-10 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/15 active:scale-95 transition-all duration-200"
              >
                Try Again
              </button>
            )}

            {/* Back to login */}
            <button
              onClick={() => {
                logout();
                navigate("/player", { replace: true });
              }}
              className="w-full h-10 rounded-xl text-xs font-semibold bg-white/[0.03] border border-white/[0.06] text-surface-400 hover:text-surface-300 hover:bg-white/[0.05] active:scale-95 transition-all duration-200"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07080d] flex flex-col">
      {/* Ambient glow layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.015] via-transparent to-transparent pointer-events-none" />

      {/* ── Premium Player Status Bar ── */}
      <div className="relative shrink-0 z-20 animate-in slide-in-from-top-2 duration-500">
        {/* Glass background */}
        <div className="bg-gradient-to-r from-[#14151f]/[0.92] to-[#0f101a]/[0.95] backdrop-blur-2xl border-b border-white/[0.04]">
          {/* Inner gold edge light */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Avatar emblem */}
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-gold/20">
              <span className="text-lg font-black text-gold-300 drop-shadow-[0_0_6px_rgba(234,179,8,0.15)]">
                {character.name.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-gold-200 truncate drop-shadow-[0_0_6px_rgba(234,179,8,0.06)]">
                {character.name}
              </h1>
              <div className="flex items-center gap-1.5 text-[10px] text-surface-500">
                <span className="uppercase tracking-wider">{character.race}</span>
                <span className="text-surface-700">·</span>
                <span>{character.class} {character.level}</span>
                <span className="text-surface-700">·</span>
                <span className="text-gold-400/60">🎮 {username}</span>

                {/* Sync indicator */}
                {!firebaseConnected && (
                  <>
                    <span className="text-surface-700">·</span>
                    <span className="flex items-center gap-1 text-amber-400/60">
                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                      syncing
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sign Out button */}
            <button
              onClick={() => {
                logout();
                navigate("/player", { replace: true });
              }}
              className="text-[10px] uppercase tracking-wider text-surface-500 hover:text-surface-300 transition-all duration-200 px-3 py-1.5 rounded-lg border border-surface-700/30 hover:border-surface-600/50 hover:bg-surface-800/30 active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── DM Share Reveal (fullscreen overlay for DM image pushes) ── */}
      <PlayerShareReveal />

      {/* ── Player Sheet (full-screen modal) ── */}
      <div className="flex-1 overflow-hidden animate-in fade-in duration-500 delay-200">
        <PlayerSheet character={character} onClose={() => {}} />
      </div>
    </div>
  );
}
