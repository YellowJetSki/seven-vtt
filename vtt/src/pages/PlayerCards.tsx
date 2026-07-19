/**
 * STᚱ VTT — Player Cards (Premium Gold)
 *
 * The player-facing character management page.
 * Gold/amber fantasy aesthetic design system.
 * Mobile-first responsive layout:
 *   - Mobile: single column card list + full-screen sheet modal
 *   - Tablet: 2-column grid
 *   - Desktop: 3-column grid + sidebar navigation
 *
 * Each card provides at-a-glance HP, AC, initiative, and conditions.
 * Tapping a card opens the full PlayerSheet modal with swipeable tabs.
 */

import AppShell from "@/components/layout/AppShell";
import PlayerList from "@/components/player/PlayerList";

export default function PlayerCards() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto pb-24 sm:pb-8">
        {/* Page header — Gold fantasy banner */}
        <div className="glass-gold rounded-2xl p-4 sm:p-6 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
              Player Characters
            </h1>
            <p className="text-surface-400 mt-1 text-xs sm:text-sm">
              Manage your party · Tap a card for full details
            </p>
            <div className="rune-gold mt-3 w-full max-w-md">✦ ✦ ✦</div>
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
