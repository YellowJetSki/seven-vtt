/**
 * STᚱ VTT — Player Sheet (Premium Gold — Mobile-First Modal)
 *
 * Orchestrator with persistent AC, HP, Init, Speed, PB, Inspiration bar visible on ALL tabs.
 * Dynamic tabs: Stats, Combat, Spells (if caster), Items, Rules.
 * All derived stats auto-calculated (AC, Init, PB, DC, ATK, etc.)
 * HP management expandable — Death Saves inline when HP = 0.
 * Combat tab shows all weapon attacks, spell attacks, features.
 * 44px+ touch targets, swipeable tabs, no horizontal overflow.
 */

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import type { PlayerCharacter } from "@/types";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import PlayerSheetHeader from "./PlayerSheetHeader";
import PlayerSheetTabBar, { type CoreTabId } from "./PlayerSheetTabBar";
import PlayerSheetPersistentStats from "./PlayerSheetPersistentStats";
import PlayerSheetStatsTab from "./PlayerSheetStatsTab";
import PlayerSheetCombatTab from "./PlayerSheetCombatTab";
import PlayerSheetSpellsTab from "./PlayerSheetSpellsTab";
import PlayerSheetInventoryTab from "./PlayerSheetInventoryTab";
import PlayerSheetRulesTab from "./PlayerSheetRulesTab";

interface PlayerSheetProps {
  character: PlayerCharacter;
  onClose: () => void;
}

export default function PlayerSheet({ character, onClose }: PlayerSheetProps) {
  const [activeTab, setActiveTab] = useState<CoreTabId>("combat");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  const spellcasting = useMemo(() => computeSpellcasting(character), [character]);
  const isCaster = spellcasting.isCaster;

  // Build dynamic tab order based on whether character is a caster
  const tabOrder = useMemo((): CoreTabId[] => {
    const base: CoreTabId[] = ["combat", "stats", "inventory", "rules"];
    const withSpells: CoreTabId[] = ["combat", "stats", "spells", "inventory", "rules"];
    return isCaster ? withSpells : base;
  }, [isCaster]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      const threshold = 50;
      const idx = tabOrder.indexOf(activeTab);
      if (diff > threshold && idx > 0) setActiveTab(tabOrder[idx - 1]);
      else if (diff < -threshold && idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
      setTouchStartX(null);
    },
    [touchStartX, activeTab, tabOrder]
  );

  const renderContent = () => {
    switch (activeTab) {
      case "combat":
        return <PlayerSheetCombatTab character={character} />;
      case "stats":
        return <PlayerSheetStatsTab character={character} />;
      case "spells":
        return <PlayerSheetSpellsTab character={character} />;
      case "inventory":
        return <PlayerSheetInventoryTab character={character} />;
      case "rules":
        return <PlayerSheetRulesTab character={character} />;
    }
  };

  // ── ESC key to close ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    // Using dvh/dvw for dynamic viewport — handles mobile URL bars properly
    <div className="fixed inset-0 z-50 flex flex-col bg-obsidian/98 backdrop-blur-md animate-in slide-in-from-bottom duration-300 overflow-hidden"
      style={{ height: '100dvh', width: '100dvw' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Ambient gold gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full min-h-0">
        {/* Header (with optional banner portrait) */}
        <PlayerSheetHeader character={character} onClose={onClose} />

        {/* PERSISTENT STATS BAR — AC, HP, Init, Speed, PB, Inspiration — Always visible */}
        <PlayerSheetPersistentStats character={character} />

        {/* Tab navigation */}
        <PlayerSheetTabBar activeTab={activeTab} onTabChange={setActiveTab} isCaster={isCaster} />

        {/* Scrollable tab content */}
        <div
          ref={tabContentRef}
          className="flex-1 overflow-y-auto scrollbar-gold"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {renderContent()}
        </div>

        {/* Bottom safe-area spacer */}
        <div className="h-4 shrink-0" />
      </div>
    </div>
  );
}
