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
        <div className="glass-crystal rounded-2xl p-4 mb-4">
          <h1 className="text-xl sm:text-2xl font-black text-gradient-arcane">Homebrew</h1>
          <p className="text-xs text-surface-400 mt-0.5">
            Create custom items, spells, and feats for your campaign
          </p>
          <div className="rune-divider mt-2">✦ ✦ ✦</div>
        </div>

        <div className="px-1 sm:px-0">
          <HomebrewManager />
        </div>
      </div>
    </AppShell>
  );
}
