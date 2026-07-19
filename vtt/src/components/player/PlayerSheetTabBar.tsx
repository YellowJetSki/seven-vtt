import { Shield, Swords, Backpack, ChevronLeft, ChevronRight, Sparkles, BookOpen } from "lucide-react";

export type CoreTabId = "stats" | "combat" | "inventory" | "spells" | "rules";

export interface TabConfig {
  id: CoreTabId;
  label: string;
  icon: typeof Shield;
  showFor?: "all" | "caster";
}

export const TABS: TabConfig[] = [
  { id: "combat", label: "Combat", icon: Swords, showFor: "all" },
  { id: "stats", label: "Stats", icon: Shield, showFor: "all" },
  { id: "spells", label: "Spells", icon: Sparkles, showFor: "caster" },
  { id: "inventory", label: "Items", icon: Backpack, showFor: "all" },
  { id: "rules", label: "Rules", icon: BookOpen, showFor: "all" },
];

interface PlayerSheetTabBarProps {
  activeTab: CoreTabId;
  onTabChange: (tab: CoreTabId) => void;
  isCaster: boolean;
}

export default function PlayerSheetTabBar({ activeTab, onTabChange, isCaster }: PlayerSheetTabBarProps) {
  const visibleTabs = TABS.filter((t) => t.showFor === "all" || (t.showFor === "caster" && isCaster));
  const currentIdx = visibleTabs.findIndex((t) => t.id === activeTab);

  const handlePrev = () => {
    if (currentIdx > 0) onTabChange(visibleTabs[currentIdx - 1].id);
  };
  const handleNext = () => {
    if (currentIdx < visibleTabs.length - 1) onTabChange(visibleTabs[currentIdx + 1].id);
  };

  return (
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-gold/10 shrink-0">
      <button
        onClick={handlePrev}
        className={`p-1.5 rounded-lg transition-all duration-150 ${
          currentIdx > 0
            ? "text-surface-400 hover:bg-gold-500/10 hover:text-gold-400 active:scale-90"
            : "text-surface-700 cursor-not-allowed"
        }`}
        disabled={currentIdx === 0}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1 overflow-x-auto scrollbar-gold max-w-[80%]">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-150 active:scale-95 shrink-0 ${
                isActive
                  ? "bg-gold-500/10 text-gold-400 shadow-[0_0_8px_rgba(234,179,8,0.06)]"
                  : "text-surface-500 hover:text-surface-300 hover:bg-gold-500/[0.03]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        className={`p-1.5 rounded-lg transition-all duration-150 ${
          currentIdx < visibleTabs.length - 1
            ? "text-surface-400 hover:bg-gold-500/10 hover:text-gold-400 active:scale-90"
            : "text-surface-700 cursor-not-allowed"
        }`}
        disabled={currentIdx === visibleTabs.length - 1}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
