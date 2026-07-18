/**
 * STᚱ VTT — Player Cards (Mobile-First)
 *
 * The player-facing character management page.
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
        {/* Page header */}
        <div className="glass-crystal rounded-2xl p-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-gradient-arcane">Player Characters</h1>
          <p className="text-xs text-surface-400 mt-0.5">
            Manage your party · Tap a card for full details
          </p>
          <div className="rune-divider mt-2">✦ ✦ ✦</div>
        </div>

        {/* Player list with mobile-first card grid */}
        <div className="px-1 sm:px-0">
          <PlayerList />
        </div>
      </div>
    </AppShell>
  );
}
