/**
 * STᚱ VTT — Player Sheet Page (Premium Refactor — Sprint 1)
 *
 * Full-screen premium character sheet.
 * Accessed after player login. Shows all character info.
 * Mobile-first with staggered entrance animations.
 *
 * Sprint 1 upgrades:
 * - Lusion-grade staggered entrance animations
 * - Premium gold glass top bar with depth
 * - Sophisticated typography hierarchy
 * - Removed ALL legacy color tokens (text-rogue-400 → text-gold-400)
 * - Smooth fluid micro-interactions
 */

import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerSheet from "@/components/player/PlayerSheet";

export default function PlayerSheetPage() {
  const navigate = useNavigate();
  const characterId = useAuthStore((s) => s.characterId);
  const username = useAuthStore((s) => s.username);
  const characters = useCampaignStore((s) => s.characters);
  const logout = useAuthStore((s) => s.logout);

  const character = characters.find((c) => c.id === characterId);

  if (!character) {
    return (
      <div className="h-screen w-screen bg-obsidian flex items-center justify-center p-4">
        <div className="glass-gold rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in-95 duration-300">
          <span className="text-5xl block mb-4 animate-in zoom-in-50 duration-500 delay-100">⚔</span>
          <h2 className="text-lg font-bold text-white mb-2 animate-in slide-in-from-top-2 duration-300 delay-150">Character Not Found</h2>
          <p className="text-sm text-surface-400 mb-6 animate-in fade-in duration-300 delay-200">
            Your character data isn't available. Please ask your DM to set up your character.
          </p>
          <button
            onClick={() => {
              logout();
              navigate("/player", { replace: true });
            }}
            className="btn-gold w-full animate-in fade-in duration-300 delay-250"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-obsidian flex flex-col">
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

      {/* ── Player Sheet (full-screen modal) ── */}
      <div className="flex-1 overflow-hidden animate-in fade-in duration-500 delay-200">
        <PlayerSheet character={character} onClose={() => {}} />
      </div>
    </div>
  );
}
