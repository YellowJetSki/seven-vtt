/**
 * STᚱ VTT — Player Cards (Lusion-Grade Premium Hero Banner)
 *
 * DM-facing player character roster with cinematically layered header.
 * Mobile-first: single column → 2-col tablet → 3-col desktop.
 *
 * Premium header features:
 * - 7-layer depth composition (void bg → conic ring → edge lights → glow pockets → glass surface → content → hover animations)
 * - Animated conic gradient depth ring rotating over 30s
 * - Rune container with ambient glow
 * - Stat badge strip with staggered entrance
 */

import { useCampaignStore } from "@/stores/campaignStore";
import AppShell from "@/components/layout/AppShell";
import PlayerList from "@/components/player/PlayerList";

export default function PlayerCards() {
  const characters = useCampaignStore((s) => s.characters);
  const characterCount = characters.length;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto" style={{ padding: "0 1rem 5rem" }}>
        {/* ── Page header — Cinematic hero banner ── */}
        <div className="relative rounded-2xl overflow-hidden group">
          {/* Layer 1: Deep void background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#181a2a]/90 via-[#12131e]/90 to-[#0c0d15]/95" />

          {/* Layer 2: Conic gradient depth ring */}
          <div
            className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.4)_15%,transparent_30%,rgba(234,179,8,0.2)_50%,transparent_70%,rgba(234,179,8,0.15)_85%,transparent_100%)]"
            style={{ animation: "spin 30s linear infinite" }}
          />

          {/* Layer 3: Top gold edge light */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/40 to-transparent transition-all duration-700" />

          {/* Layer 4: Bottom edge light on hover */}
          <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-700 pointer-events-none" />

          {/* Layer 5: Ambient glow pockets */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-gold-500/[0.06] rounded-full blur-[80px] pointer-events-none group-hover:bg-gold-500/[0.08] transition-all duration-700" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

          {/* Layer 6: Border */}
          <div className="absolute inset-0 rounded-2xl border border-white/[0.06] pointer-events-none" />

          {/* Layer 7: Content */}
          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex items-start gap-4">
              {/* Animated icon container with depth */}
              <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
                <div className="absolute inset-0 rounded-xl border border-gold-500/20" />
                <div className="absolute inset-2 bg-gold-500/10 rounded-lg blur-[4px]" />
                <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                  👥
                </span>
              </div>

              {/* Title block */}
              <div className="min-w-0 pt-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white/95 tracking-tight leading-tight">
                  Player Characters
                </h1>
                <p className="text-xs sm:text-sm text-surface-400 mt-1.5 leading-relaxed">
                  Manage your party · Tap a card for full details
                </p>

                {/* Meta badges */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gold-400/60 bg-gold-500/10 border border-gold-500/15 px-2.5 py-1 rounded font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse-soft" />
                    Party Roster
                  </span>
                  {characterCount > 0 && (
                    <span className="text-[9px] text-surface-500 tracking-wider">
                      {characterCount} hero{characterCount !== 1 ? "es" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player list */}
        <div className="mt-4 sm:mt-6">
          <PlayerList />
        </div>
      </div>
    </AppShell>
  );
}
