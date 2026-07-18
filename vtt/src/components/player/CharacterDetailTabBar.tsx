/* ── CharacterDetailTabBar ─────────────────────────────────────
 * Tab navigation for the Character Detail modal.
 * ─────────────────────────────────────────────────────────────── */

interface Props {
  active: string;
  onTab: (tab: string) => void;
}

const TABS = [
  { id: "combat", icon: "⚔", label: "Combat" },
  { id: "abilities", icon: "💪", label: "Abilities" },
  { id: "features", icon: "✨", label: "Features" },
  { id: "inventory", icon: "🎒", label: "Inventory" },
  { id: "bio", icon: "📜", label: "Bio" },
];

export function CharacterDetailTabBar({ active, onTab }: Props) {
  return (
    <div className="shrink-0 flex gap-1.5 border-b border-surface-700/60 bg-surface-900/30 px-4 py-2.5 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTab(tab.id)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
            active === tab.id
              ? "bg-accent-600/20 text-accent-300 shadow-sm ring-1 ring-accent-500/30"
              : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
          }`}
        >
          <span className="text-sm">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
