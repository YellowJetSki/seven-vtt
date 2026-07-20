/**
 * STᚱ VTT — SpellFilterBar (Premium)
 *
 * Spotify/Duolingo-grade filter strip:
 * - Pill-shaped level chips with staggered entrance
 * - Search field with floating magnifying glass icon
 * - Favorites toggle with animated gold star
 * - Animated active indicator dot on selected chips
 * - Spell count label with subtle tracking
 */

interface SpellFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFavoritesOnly: boolean;
  onFavoritesToggle: (show: boolean) => void;
  filterLevel: number | null;
  onFilterLevel: (level: number | null) => void;
  availableLevels: number[];
  spellCountText: string;
}

const LEVEL_LABELS: Record<number, string> = {
  0: "Cantrips",
};

export default function SpellFilterBar({
  searchQuery,
  onSearchChange,
  showFavoritesOnly,
  onFavoritesToggle,
  filterLevel,
  onFilterLevel,
  availableLevels,
  spellCountText,
}: SpellFilterBarProps) {
  return (
    <div className="space-y-2">
      {/* ── Search + Favorites toggle ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 group">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-surface-500 pointer-events-none transition-colors duration-200 group-focus-within:text-gold-500/60">
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search spells..."
            className="w-full bg-obsidian-mid/60 border border-surface-700/20 rounded-xl pl-7 pr-3 py-2 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15 placeholder:text-surface-700 transition-all duration-200"
          />
        </div>

        {/* Favorites toggle — custom checkbox */}
        <label className="flex items-center gap-1.5 cursor-pointer shrink-0 group">
          <div
            className={`relative w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center ${
              showFavoritesOnly
                ? "bg-gold-500/20 border-gold/30 shadow-[0_0_4px_rgba(234,179,8,0.1)]"
                : "border-surface-600 bg-surface-800/40 group-hover:border-surface-500"
            }`}
          >
            <input
              type="checkbox"
              checked={showFavoritesOnly}
              onChange={(e) => onFavoritesToggle(e.target.checked)}
              className="sr-only"
            />
            {showFavoritesOnly && (
              <span className="text-[8px] text-gold-400">★</span>
            )}
          </div>
          <span className={`text-[9px] transition-colors ${showFavoritesOnly ? "text-gold-400" : "text-surface-500 group-hover:text-surface-300"}`}>
            Faves
          </span>
        </label>
      </div>

      {/* ── Level filter chips ── */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <ChipButton
          label="All"
          isActive={filterLevel === null}
          onClick={() => onFilterLevel(null)}
          delay={0}
        />
        <ChipButton
          label={LEVEL_LABELS[0] || "Cantrips"}
          isActive={filterLevel === 0}
          onClick={() => onFilterLevel(filterLevel === 0 ? null : 0)}
          delay={30}
        />
        {availableLevels.map((lvl, idx) => (
          <ChipButton
            key={lvl}
            label={`Lv.${lvl}`}
            isActive={filterLevel === lvl}
            onClick={() => onFilterLevel(filterLevel === lvl ? null : lvl)}
            delay={(idx + 2) * 30}
          />
        ))}
        <span className="text-[9px] text-surface-500 ml-auto tabular-nums tracking-tight">{spellCountText}</span>
      </div>
    </div>
  );
}

// ── Premium chip button ──

function ChipButton({
  label,
  isActive,
  onClick,
  delay,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  delay: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-2.5 py-1 rounded-full text-[9px] font-semibold transition-all duration-200 active:scale-90 ${
        isActive
          ? "bg-gold-500/12 text-gold-400 border border-gold/20 shadow-[0_0_6px_rgba(234,179,8,0.08)]"
          : "text-surface-500 border border-surface-700/25 hover:border-surface-600/40 hover:text-surface-300 bg-transparent"
      }`}
      style={{
        animationDelay: `${delay}ms`,
        animation: "slide-in-up 0.3s ease-out both",
      }}
    >
      <span className="relative z-[1]">{label}</span>
      {/* Active dot indicator */}
      {isActive && (
        <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
      )}
    </button>
  );
}
