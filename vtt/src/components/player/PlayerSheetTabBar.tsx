import { Shield, Swords, Backpack, ChevronLeft, ChevronRight } from "lucide-react";

export type TabId = "stats" | "combat" | "inventory";

export const TABS: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "stats", label: "Stats", icon: Shield },
  { id: "combat", label: "Combat", icon: Swords },
  { id: "inventory", label: "Items", icon: Backpack },
];

const TAB_ORDER: TabId[] = ["stats", "combat", "inventory"];

interface PlayerSheetTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function PlayerSheetTabBar({ activeTab, onTabChange }: PlayerSheetTabBarProps) {
  const currentIdx = TAB_ORDER.indexOf(activeTab);

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-surface-700/20 shrink-0">
      <button
        onClick={() => currentIdx > 0 && onTabChange(TAB_ORDER[currentIdx - 1])}
        className={`p-1.5 rounded-lg transition-colors ${
          currentIdx > 0
            ? "text-surface-400 hover:bg-surface-700/50 active:scale-90"
            : "text-surface-700"
        }`}
        disabled={currentIdx === 0}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                isActive
                  ? "bg-accent-600/15 text-accent-300"
                  : "text-surface-500 hover:text-surface-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => currentIdx < TAB_ORDER.length - 1 && onTabChange(TAB_ORDER[currentIdx + 1])}
        className={`p-1.5 rounded-lg transition-colors ${
          currentIdx < TAB_ORDER.length - 1
            ? "text-surface-400 hover:bg-surface-700/50 active:scale-90"
            : "text-surface-700"
        }`}
        disabled={currentIdx === TAB_ORDER.length - 1}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
