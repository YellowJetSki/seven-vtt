/**
 * STᚱ VTT — Homebrew Empty State (Premium Lusion-Grade)
 *
 * Placeholder display when no homebrew items/spells/feats exist for the active tab.
 * Features floating icon container, gradient gold title, rune divider, and staggered entrance.
 */

interface HomebrewEmptyStateProps {
  tabLabel: string;
}

const TAB_META: Record<string, { icon: string; verb: string; noun: string }> = {
  items: { icon: "📦", verb: "item", noun: "items" },
  spells: { icon: "🔮", verb: "spell", noun: "spells" },
  feats: { icon: "🏅", verb: "feat", noun: "feats" },
};

export default function HomebrewEmptyState({ tabLabel }: HomebrewEmptyStateProps) {
  const meta = TAB_META[tabLabel] || { icon: "✦", verb: "entry", noun: "entries" };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Floating icon container */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold-500/20 flex items-center justify-center">
          <span className="text-2xl drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">
            {meta.icon}
          </span>
        </div>
        {/* Ambient glow */}
        <div className="absolute -inset-4 bg-gold-500/[0.03] rounded-full blur-[20px] pointer-events-none" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-surface-300 mb-1.5">
        No {meta.noun} yet
      </h3>

      {/* Description */}
      <p className="text-[11px] text-surface-500 max-w-xs leading-relaxed mb-6">
        Create your first {meta.verb} to build your campaign's custom content library.
      </p>

      {/* Rune divider */}
      <div className="flex items-center gap-2 text-surface-600/40">
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-surface-600/30 to-transparent" />
        <span className="text-[8px] font-bold tracking-[0.3em]">✦ ✦ ✦</span>
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-surface-600/30 to-transparent" />
      </div>
    </div>
  );
}
