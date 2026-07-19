/**
 * STᚱ VTT — Player Sheet (Premium Gold — Mobile-First Modal)
 *
 * Orchestrates the mobile-optimized player character sheet view.
 * Dynamic tabs: Stats, Combat, Spells (if caster), Items, Rules.
 * Auto-calculates all derived stats (AC, Init, PB, DC, ATK, etc.)
 * 44px+ touch targets, swipeable tabs, no horizontal overflow.
 */

import { useState, useCallback, useRef, useMemo } from "react";
import type { PlayerCharacter } from "@/types";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import PlayerSheetHeader from "./PlayerSheetHeader";
import PlayerSheetTabBar, { type CoreTabId } from "./PlayerSheetTabBar";
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
  const [activeTab, setActiveTab] = useState<CoreTabId>("stats");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  const spellcasting = useMemo(() => computeSpellcasting(character), [character]);
  const isCaster = spellcasting.isCaster;

  // Build dynamic tab order based on whether character is a caster
  const tabOrder = useMemo((): CoreTabId[] => {
    const base: CoreTabId[] = ["stats", "combat", "inventory", "rules"];
    const withSpells: CoreTabId[] = ["stats", "combat", "spells", "inventory", "rules"];
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
      case "stats":
        return <PlayerSheetStatsTab character={character} />;
      case "combat":
        return <PlayerSheetCombatTab character={character} />;
      case "spells":
        return <PlayerSheetSpellsTab character={character} />;
      case "inventory":
        return <PlayerSheetInventoryTab character={character} />;
      case "rules":
        return <PlayerSheetRulesTab character={character} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-obsidian/98 backdrop-blur-md animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Ambient gold gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <PlayerSheetHeader character={character} onClose={onClose} />
        <PlayerSheetTabBar activeTab={activeTab} onTabChange={setActiveTab} isCaster={isCaster} />

        <div
          ref={tabContentRef}
          className="flex-1 overflow-y-auto scrollbar-gold"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {renderContent()}
        </div>

        <div className="h-4 shrink-0" />
      </div>
    </div>
  );
}
