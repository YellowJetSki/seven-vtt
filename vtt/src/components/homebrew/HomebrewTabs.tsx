/**
 * STᚱ VTT — Homebrew Tabs
 *
 * Tab navigation for Items / Spells / Feats in the Homebrew Manager.
 */

export type HomebrewTabId = "items" | "spells" | "feats";

interface HomebrewTabsProps {
  activeTab: HomebrewTabId;
  onChange: (tab: HomebrewTabId) => void;
}

const TABS: { id: HomebrewTabId; label: string; icon: string }[] = [
  { id: "items", label: "📦 Items", icon: "📦" },
  { id: "spells", label: "🔮 Spells", icon: "🔮" },
  { id: "feats", label: "🏅 Feats", icon: "🏅" },
];

export default function HomebrewTabs({
  activeTab,
  onChange,
}: HomebrewTabsProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border active:scale-95 ${
            activeTab === tab.id
              ? "bg-gold-500/10 text-gold-400 border-gold/25"
              : "text-surface-400 hover:text-surface-200 border-transparent hover:border-gold/15"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
