/**
 * STᚱ VTT — Player Cards (Lusion-Grade Premium)
 *
 * DM-facing player character roster with cinematically layered cards.
 * Mobile-first: single column → 2-col tablet → 3-col desktop.
 * Each card feels like a tangible character token with gold edge lighting.
 */

import AppShell from "@/components/layout/AppShell";
import PlayerList from "@/components/player/PlayerList";

export default function PlayerCards() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto pb-24 sm:pb-8">
        {/* Page header — Cinematic hero banner matching dashboard */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#181a2a]/80 via-[#12131e]/85 to-[#0c0d15]/90 border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,215,0,0.02)]">
          {/* Depth ring */}
          <div className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.3)_20%,transparent_40%,rgba(234,179,8,0.15)_60%,transparent_80%)] animate-depth-rotate" style={{ animationDuration: '30s' }} />

          {/* Top gold edge */}
          <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />

          {/* Ambient glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold-500/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex items-center gap-4">
              {/* Animated icon */}
              <div className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/15 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gold-500/15 to-transparent opacity-40" />
                <span className="text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.3)] rune-pulse">
                  👥
                </span>
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                  Player Characters
                </h1>
                <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                  Manage your party · Tap a card for full details
                </p>
                {/* Meta badge */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/8 border border-gold-500/15 px-2 py-1 rounded font-medium">
                    ✦ Party Roster
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player list with mobile-first card grid */}
        <div className="px-1 sm:px-0 mt-4 sm:mt-6">
          <PlayerList />
        </div>
      </div>
    </AppShell>
  );
}
