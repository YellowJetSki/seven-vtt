/**
 * STᚱ VTT — InventorySortControls (Premium)
 *
 * Spotify-grade sort controls:
 * - Minimal select dropdown with gold focus
 * - Animated direction arrow with rotation
 * - Compact pill layout for inline placement
 */

import type { SortField, SortDirection } from "@/lib/inventory-utils";

interface InventorySortControlsProps {
  sortBy: SortField;
  sortDir: SortDirection;
  onSortByChange: (field: SortField) => void;
  onSortDirToggle: () => void;
}

const FIELD_LABELS: Record<SortField, string> = {
  name: "Name",
  weight: "Weight",
  category: "Category",
};

export default function InventorySortControls({
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirToggle,
}: InventorySortControlsProps) {
  return (
    <div className="flex items-center gap-0.5 bg-obsidian-mid/30 rounded-lg border border-surface-700/20 px-1 py-0.5">
      {/* Sort field selector */}
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as SortField)}
        className="bg-transparent text-[8px] text-surface-500 focus:text-surface-300 border-0 rounded px-1 py-0.5 focus:outline-none focus:ring-0 cursor-pointer appearance-none transition-colors duration-150"
      >
        {Object.entries(FIELD_LABELS).map(([value, label]) => (
          <option key={value} value={value} className="bg-[#0f1019] text-surface-300">
            {label}
          </option>
        ))}
      </select>

      {/* Separator */}
      <span className="w-px h-3 bg-surface-700/30" />

      {/* Direction toggle */}
      <button
        onClick={onSortDirToggle}
        className="w-5 h-5 flex items-center justify-center text-[9px] text-surface-500 hover:text-gold-400 transition-colors duration-150 active:scale-90"
        title={sortDir === "asc" ? "Ascending" : "Descending"}
      >
        <span
          className="inline-block transition-transform duration-200"
          style={{ transform: sortDir === "asc" ? "rotate(0deg)" : "rotate(180deg)" }}
        >
          ↑
        </span>
      </button>
    </div>
  );
}
