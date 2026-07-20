/**
 * STᚱ VTT — InventoryEmptyState (Premium)
 *
 * Lusion-grade contextual empty states:
 * - Animated icon with floating effect
 * - Context-specific messages with visual hierarchy
 * - Gradient accent CTA button with hover glow
 * - Runed dividers for premium spacing
 */

interface InventoryEmptyStateProps {
  showEquippedOnly: boolean;
  categoryFilter: string;
  searchQuery: string;
  onAddItem: () => void;
}

function getEmptyConfig(
  showEquippedOnly: boolean,
  categoryFilter: string,
  searchQuery: string
): { icon: string; title: string; hint: string; action: string } {
  if (showEquippedOnly) {
    return {
      icon: "⚔️",
      title: "No Items Equipped",
      hint: "Equip items from your inventory or visit a merchant in town.",
      action: "Browse Inventory",
    };
  }
  if (categoryFilter !== "all") {
    return {
      icon: "🔍",
      title: "No Items Match This Filter",
      hint: "Try selecting a different category or clearing the filter.",
      action: "Clear Filter",
    };
  }
  if (searchQuery) {
    return {
      icon: "🔎",
      title: "No Matching Items",
      hint: `Nothing found for "${searchQuery}". Try a different search.`,
      action: "Clear Search",
    };
  }
  return {
    icon: "🎒",
    title: "Empty Inventory",
    hint: "Your pack feels light. Add weapons, potions, and loot from your adventures.",
    action: "Add Your First Item",
  };
}

export default function InventoryEmptyState({
  showEquippedOnly,
  categoryFilter,
  searchQuery,
  onAddItem,
}: InventoryEmptyStateProps) {
  const config = getEmptyConfig(showEquippedOnly, categoryFilter, searchQuery);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Animated icon */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gold-500/5 rounded-full blur-xl animate-pulse" style={{ width: 64, height: 64 }} />
        <div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#14151f]/80 to-[#0f1019]/90 border border-gold/10 flex items-center justify-center"
          style={{ animation: "float-arcane 3s ease-in-out infinite" }}
        >
          <span className="text-xl">{config.icon}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[11px] font-bold text-gold-400 mb-1.5 text-center">
        {config.title}
      </h3>

      {/* Hint */}
      <p className="text-[9px] text-surface-500 text-center max-w-[200px] leading-relaxed mb-4">
        {config.hint}
      </p>

      {/* Runed divider */}
      <div className="flex items-center gap-2 mb-4 w-full max-w-[120px]">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
        <span className="text-[8px] text-gold-500/40 font-mono">✦ ᚱ ✦</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
      </div>

      {/* CTA button */}
      <button
        onClick={onAddItem}
        className="relative px-4 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-b from-gold-500/10 to-gold-500/5 border border-gold/15 text-gold-400 hover:from-gold-500/15 hover:to-gold-500/8 active:scale-95 transition-all duration-200 shadow-[0_0_12px_rgba(234,179,8,0.05)]"
      >
        <span className="relative z-[1]">+ {config.action}</span>
      </button>
    </div>
  );
}
