/**
 * STᚱ VTT — CompendiumResultList
 *
 * Wraps the filtered compendium results with:
 * - Scrollable container with 'scrollbar-gold' custom scrollbar
 * - Staggered entrance for children
 * - Empty state with centered message
 * - Optional compact mode (max-h-64)
 * - Footer showing count
 */

import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import CompendiumCard from "./CompendiumCard";

type CompendiumEntry =
  | { type: "item"; data: HomebrewItem }
  | { type: "spell"; data: HomebrewSpell }
  | { type: "feat"; data: HomebrewFeat };

interface CompendiumResultListProps {
  entries: CompendiumEntry[];
  onDragStart?: (entry: CompendiumEntry) => void;
  compact?: boolean;
  emptyMessage?: string;
  countLabel?: string;
}

export default function CompendiumResultList({
  entries,
  onDragStart,
  compact = false,
  emptyMessage = "No results match your search.",
  countLabel,
}: CompendiumResultListProps) {
  return (
    <>
      {/* Results scroll container */}
      <div className={`flex-1 overflow-y-auto scrollbar-gold space-y-1.5 ${compact ? "max-h-64" : ""}`}>
        {entries.length > 0 ? (
          entries.map((entry, idx) => (
            <CompendiumCard
              key={entry.data.id}
              entry={entry}
              onDragStart={onDragStart}
              index={idx}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {/* Empty icon */}
            <div className="w-12 h-12 rounded-2xl bg-gold-500/5 border border-gold/10 flex items-center justify-center mb-3">
              <span className="text-xl text-gold-500/40">🔍</span>
            </div>
            <p className="text-sm text-surface-500 italic">{emptyMessage}</p>
            <p className="text-[9px] text-surface-600 mt-1 uppercase tracking-[0.12em]">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Count footer */}
      <div className="shrink-0 mt-3 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-surface-500 font-medium">
            {countLabel || `${entries.length} entries`}
          </span>
          <span className="text-[9px] text-surface-600 flex items-center gap-1">
            <span className="opacity-60">⠿</span>
            Drag items to sheets
          </span>
        </div>
      </div>
    </>
  );
}
