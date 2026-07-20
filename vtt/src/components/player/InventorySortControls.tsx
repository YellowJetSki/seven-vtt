/**
 * STᚱ VTT — InventorySortControls
 *
 * Sort-by dropdown + direction toggle for inventory list.
 *
 * Extracted from PlayerSheetInventoryTab.tsx monolith (Sprint 8 refactor).
 */

import type { SortField, SortDirection } from "@/lib/inventory-utils";

interface InventorySortControlsProps {
  sortBy: SortField;
  sortDir: SortDirection;
  onSortByChange: (field: SortField) => void;
  onSortDirToggle: () => void;
}

export default function InventorySortControls({
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirToggle,
}: InventorySortControlsProps) {
  return (
    <div className="ml-auto flex items-center gap-0.5">
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as SortField)}
        className="bg-transparent text-[8px] text-surface-500 border border-surface-700/30 rounded px-1 py-0.5 focus:outline-none focus:border-gold/20"
      >
        <option value="name">Name</option>
        <option value="weight">Weight</option>
        <option value="category">Category</option>
      </select>
      <button
        onClick={onSortDirToggle}
        className="text-[9px] text-surface-500 hover:text-gold-400 transition-colors px-1"
        title={sortDir === "asc" ? "Ascending" : "Descending"}
      >
        {sortDir === "asc" ? "\u2191" : "\u2193"}
      </button>
    </div>
  );
}
