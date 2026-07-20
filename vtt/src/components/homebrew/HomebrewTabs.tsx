/**
 * STᚱ VTT — Homebrew Tabs (Premium Pill Indicator v3.1)
 *
 * Premium tab navigation for Items / Spells / Feats with gold pill indicator,
 * hover scale feedback, staggered entrance, and consistent gold accent styling.
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

export default function HomebrewTabs({ activeTab, onChange }: HomebrewTabsProps) {
  return (
    <div
      className="flex items-center gap-1.5 p-0.5 rounded-lg bg-[#0c0d15]/60 border border-white/[0.04]"
      style={{ animation: "slide-in-up 0.35s ease-out both" }}
    >
      {TABS.map((tab, idx) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{ animation: `slide-in-up 0.3s ease-out ${50 + idx * 40}ms both` }}
          className={`relative px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95 ${
            activeTab === tab.id
              ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 text-gold-400 border border-gold-500/20 shadow-[0_0_8px_rgba(234,179,8,0.03)]"
              : "text-surface-400 hover:text-surface-200 border border-transparent hover:border-white/[0.06]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
