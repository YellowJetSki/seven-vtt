/**
 * STᚱ VTT — InventoryCategoryChips (Premium)
 *
 * Duolingo/Spotify-grade category filter chips:
 * - Pill-shaped buttons with gold active state
 * - Animated entrance stagger
 * - Count badges with color-matched backgrounds
 * - Smooth transition between filter states
 * - Hides empty categories for clean UX
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
    <div className="flex gap-1.5 flex-wrap">
      {INVENTORY_CATEGORIES.map((cat, i) => {
        const count = categoryCounts[cat.key] || 0;
        if (count === 0 && cat.key !== "all") return null;
        const isActive = currentFilter === cat.key;

        return (
          <button
            key={cat.key}
            onClick={() => onFilterChange(isActive ? "all" : cat.key)}
            className={`
              relative group px-2.5 py-1 rounded-full text-[8px] font-semibold
              transition-all duration-200 active:scale-90
              ${isActive
                ? "bg-gold-500/12 text-gold-400 border border-gold/20 shadow-[0_0_6px_rgba(234,179,8,0.08)]"
                : "text-surface-500 border border-surface-700/25 hover:border-surface-600/40 hover:text-surface-300 bg-transparent"
              }
            `}
            style={{
              animationDelay: `${i * 30}ms`,
              animation: "slide-in-up 0.3s ease-out both",
            }}
          >
            <span className="relative z-[1]">
              {cat.icon} {cat.label}
              {count > 0 && (
                <span
                  className={`ml-1 text-[7px] font-mono ${
                    isActive ? "text-gold-500/60" : "text-surface-600"
                  }`}
                >
                  {count}
                </span>
              )}
            </span>
            {/* Active glow dot */}
            {isActive && (
              <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
