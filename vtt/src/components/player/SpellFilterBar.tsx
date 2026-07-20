/**
 * STᚱ VTT — SpellFilterBar
 *
 * Search field + favorites toggle + level filter chips for the spell list.
 *
 * Extracted from PlayerSheetSpellsTab.tsx monolith (Sprint 7 refactor).
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
    <>
      {/* ── Search + Faves ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-surface-500 pointer-events-none">
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search spells..."
            className="w-full bg-obsidian-mid/60 border border-surface-700/20 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-surface-300 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
          />
        </div>
        <label className="flex items-center gap-1 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => onFavoritesToggle(e.target.checked)}
            className="w-3 h-3 rounded border-surface-600 bg-surface-800 accent-gold-500"
          />
          <span className="text-[9px] text-surface-500">⭐ Faves</span>
        </label>
      </div>

      {/* ── Level filter chips ── */}
      <div className="flex flex-wrap gap-1">
        <ChipButton
          label="All"
          isActive={filterLevel === null}
          onClick={() => onFilterLevel(null)}
        />
        <ChipButton
          label={LEVEL_LABELS[0] || "Cantrips"}
          isActive={filterLevel === 0}
          onClick={() => onFilterLevel(filterLevel === 0 ? null : 0)}
        />
        {availableLevels.map((lvl) => (
          <ChipButton
            key={lvl}
            label={`Lv.${lvl}`}
            isActive={filterLevel === lvl}
            onClick={() => onFilterLevel(filterLevel === lvl ? null : lvl)}
          />
        ))}
        <span className="text-[10px] text-surface-600 self-center ml-auto">{spellCountText}</span>
      </div>
    </>
  );
}

// ── Inline chip button ──

function ChipButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
        isActive
          ? "bg-gold-500/10 text-gold-400 border border-gold/25 ring-1 ring-gold/20"
          : "bg-obsidian-mid/60 text-surface-500 border border-surface-700/30 hover:border-gold/15"
      }`}
    >
      {label}
    </button>
  );
}
