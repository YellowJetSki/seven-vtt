/**
 * STᚱ VTT — Player Sheet (Premium Gold — Mobile-First Modal)
 *
 * Orchestrates the mobile-optimized player character sheet view.
 * Gold-accented obsidian background with glassmorphism cards.
 * Swipeable 3-tab layout (Stats, Combat, Inventory) with 44px+ touch targets.
 * No horizontal overflow — strict viewport-bound.
 */

import { useState, useCallback, useRef } from "react";
import type { PlayerCharacter } from "@/types";
import PlayerSheetHeader from "./PlayerSheetHeader";
import PlayerSheetTabBar from "./PlayerSheetTabBar";
import PlayerSheetStatsTab from "./PlayerSheetStatsTab";
import PlayerSheetCombatTab from "./PlayerSheetCombatTab";
import PlayerSheetInventoryTab from "./PlayerSheetInventoryTab";
import type { TabId } from "./PlayerSheetTabBar";

interface PlayerSheetProps {
  character: PlayerCharacter;
  onClose: () => void;
}

const TAB_ORDER: TabId[] = ["stats", "combat", "inventory"];

export default function PlayerSheet({ character, onClose }: PlayerSheetProps) {
  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      const threshold = 50;
      const idx = TAB_ORDER.indexOf(activeTab);
      if (diff > threshold && idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
      else if (diff < -threshold && idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
      setTouchStartX(null);
    },
    [touchStartX, activeTab]
  );

  const renderContent = () => {
    switch (activeTab) {
      case "stats":
        return <PlayerSheetStatsTab character={character} />;
      case "combat":
        return <PlayerSheetCombatTab character={character} />;
      case "inventory":
        return <PlayerSheetInventoryTab character={character} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-obsidian/98 backdrop-blur-md animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Ambient gold gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        <PlayerSheetHeader character={character} onClose={onClose} />
        <PlayerSheetTabBar activeTab={activeTab} onTabChange={setActiveTab} />

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
