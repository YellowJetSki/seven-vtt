/**
 * STᚱ VTT — CompendiumFilters
 *
 * Premium filter section with:
 * - Animated category/school chips with active pill states
 * - Gold active state with border glow
 * - SRD toggle checkbox with premium styling
 * - Flex-wrap layout that adapts to drawer width
 * - Staggered entrance animation (delayed)
 */

import { ITEM_CATEGORIES, SPELL_SCHOOLS } from "@/stores/compendium";

interface CompendiumFiltersProps {
  activeTab: string;
  categoryFilter: string | null;
  schoolFilter: string | null;
  showSRD: boolean;
  onCategoryChange: (val: string | null) => void;
  onSchoolChange: (val: string | null) => void;
  onToggleSRD: () => void;
}

const categoryIcons: Record<string, string> = {
  weapon: "⚔", armor: "🛡", potion: "🧪", scroll: "📜", wand: "🪄",
  ring: "💍", wondrous: "✨", tool: "🔧", ammunition: "🏹",
  food: "🍖", poison: "☠", other: "📦",
};

const schoolIcons: Record<string, string> = {
  Abjuration: "🛡", Conjuration: "✨", Divination: "👁",
  Enchantment: "💫", Evocation: "💥", Illusion: "🌀",
  Necromancy: "💀", Transmutation: "🔨",
};

export default function CompendiumFilters({
  activeTab,
  categoryFilter,
  schoolFilter,
  showSRD,
  onCategoryChange,
  onSchoolChange,
  onToggleSRD,
}: CompendiumFiltersProps) {
  return (
    <div className="space-y-2.5 animate-slide-in-from-bottom" style={{ animationDelay: "80ms" }}>
      {/* Category or School filter chips */}
      {activeTab === "items" && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] uppercase tracking-[0.15em] text-surface-500 font-black mr-1">
            Category:
          </span>
          {/* All chip */}
          <button
            onClick={() => onCategoryChange(null)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              !categoryFilter
                ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                : "text-surface-400 hover:text-surface-200 border border-transparent hover:border-white/[0.06]"
            }`}
          >
            All
          </button>
          {/* Category chips */}
          {ITEM_CATEGORIES.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(categoryFilter === cat ? null : cat)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
                categoryFilter === cat
                  ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                  : "text-surface-400 hover:text-surface-200 border border-transparent hover:border-white/[0.06]"
              }`}
            >
              <span>{categoryIcons[cat] ?? "📦"}</span>
              <span className="capitalize">{cat}</span>
            </button>
          ))}
          {ITEM_CATEGORIES.length > 6 && (
            <span className="text-[9px] text-surface-600 ml-1">+{ITEM_CATEGORIES.length - 6} more</span>
          )}
        </div>
      )}

      {activeTab === "spells" && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] uppercase tracking-[0.15em] text-surface-500 font-black mr-1">
            School:
          </span>
          {/* All chip */}
          <button
            onClick={() => onSchoolChange(null)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
              !schoolFilter
                ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                : "text-surface-400 hover:text-surface-200 border border-transparent hover:border-white/[0.06]"
            }`}
          >
            All
          </button>
          {/* School chips */}
          {SPELL_SCHOOLS.slice(0, 8).map((school) => (
            <button
              key={school}
              onClick={() => onSchoolChange(schoolFilter === school ? null : school)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-200 active:scale-95 ${
                schoolFilter === school
                  ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                  : "text-surface-400 hover:text-surface-200 border border-transparent hover:border-white/[0.06]"
              }`}
            >
              <span>{schoolIcons[school] ?? "🔮"}</span>
              <span>{school}</span>
            </button>
          ))}
        </div>
      )}

      {/* SRD toggle */}
      <div className="flex items-center justify-end">
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={showSRD}
            onChange={onToggleSRD}
            className="w-3.5 h-3.5 rounded border-surface-600 bg-[#0c0d15] accent-gold-500 
              transition-all duration-200 cursor-pointer
              focus:ring-1 focus:ring-gold-500/30 focus:ring-offset-0"
          />
          <span className="text-[9px] text-surface-500 uppercase tracking-[0.12em] font-medium group-hover:text-surface-300 transition-colors duration-200">
            Show SRD
          </span>
        </label>
      </div>
    </div>
  );
}
