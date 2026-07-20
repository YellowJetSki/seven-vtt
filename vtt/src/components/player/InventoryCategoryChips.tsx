/**
 * STᚱ VTT — InventoryCategoryChips
 *
 * Category filter chips for the inventory list. Shows active category
 * with gold highlight, hides categories with zero items.
 *
 * Extracted from PlayerSheetInventoryTab.tsx monolith (Sprint 8 refactor).
 */

import { INVENTORY_CATEGORIES } from "@/lib/inventory-utils";
import type { ItemCategory } from "@/lib/inventory-utils";

interface InventoryCategoryChipsProps {
  currentFilter: string;
  onFilterChange: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export default function InventoryCategoryChips({
  currentFilter,
  onFilterChange,
  categoryCounts,
}: InventoryCategoryChipsProps) {
  return (
    <div className="flex gap-1 flex-wrap mb-2">
      {INVENTORY_CATEGORIES.map((cat) => {
        const count = categoryCounts[cat.key] || 0;
        if (count === 0 && cat.key !== "all") return null;
        return (
          <button
            key={cat.key}
            onClick={() => onFilterChange(currentFilter === cat.key ? "all" : cat.key)}
            className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold transition-all duration-200 ${
              currentFilter === cat.key
                ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                : "text-surface-500 border border-surface-700/30 hover:border-surface-600/40"
            }`}
          >
            {cat.icon} {cat.label}
            {count > 0 && (
              <span className="ml-1 text-[7px] text-surface-500 font-mono">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
