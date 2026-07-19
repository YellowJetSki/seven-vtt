/**
 * STᚱ VTT — Homebrew Panel
 *
 * Full CRUD management for homebrew items, spells, and feats.
 * Mobile-first responsive layout with search and tabbed interface.
 * All entries persist via the Zustand compendium store.
 */

import AppShell from "@/components/layout/AppShell";
import HomebrewManager from "@/components/homebrew/HomebrewManager";

export default function HomebrewPanel() {
  return (
    <AppShell>
      <div className="max-w-6xl mx-auto pb-24 sm:pb-8">
        <div className="glass-gold rounded-2xl p-4 sm:p-6 relative overflow-hidden">
          <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
          <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
          <div className="depth-ring absolute inset-0 opacity-20" />
          <div className="relative z-10">
            <h1 className="text-xl sm:text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
              Homebrew
            </h1>
            <p className="text-surface-400 mt-1 text-xs sm:text-sm">
              Create custom items, spells, and feats for your campaign
            </p>
            <div className="rune-gold mt-3 w-full max-w-md">✦ ✦ ✦</div>
          </div>
        </div>

        <div className="px-1 sm:px-0 mt-4 sm:mt-6">
          <HomebrewManager />
        </div>
      </div>
    </AppShell>
  );
}
