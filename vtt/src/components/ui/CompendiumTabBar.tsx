/**
 * STᚱ VTT — CompendiumTabBar
 *
 * Premium tab bar with:
 * - Animated gold pill indicator that slides between tabs
 * - Tab labels with emoji icons + optional count badge
 * - Smooth pill transition via CSS on selectedIndex
 * - Gold active text, subtle inactive hover
 * - Active scale-95 press feedback
 */

interface Tab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface CompendiumTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function CompendiumTabBar({ tabs, activeTab, onTabChange }: CompendiumTabBarProps) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.02] rounded-xl p-0.5 border border-white/[0.04]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-1.5 flex-1 px-2.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 active:scale-95 ${
              isActive
                ? "text-gold-400 bg-gold-500/8 shadow-[inset_0_1px_0_rgba(255,215,0,0.04)]"
                : "text-surface-400 hover:text-surface-200 hover:bg-white/[0.02]"
            }`}
          >
            <span className={isActive ? "" : "opacity-60 group-hover:opacity-100"}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                isActive
                  ? "bg-gold-500/15 text-gold-300"
                  : "bg-surface-700/30 text-surface-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
