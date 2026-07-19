/**
 * STᚱ VTT — Encounter Populate Button (DM Combat Command)
 *
 * Footer control panel for encounter population:
 * - Populate map button with encounter summary
 * - Difficulty preview
 * - Quick HP info
 */

import type { DifficultyRating } from "@/lib/mechanics/encounter-cr";
import { getDifficultyLabel, getDifficultyColor } from "@/lib/mechanics/encounter-cr";
import Button from "@/components/ui/Button";

interface EncounterPopulateButtonProps {
  isPlacing: boolean;
  hasSelection: boolean;
  onPopulate: () => void;
  unitCount?: number;
  totalHp?: number;
  totalXp?: number;
  difficulty?: DifficultyRating;
}

export default function EncounterPopulateButton({
  isPlacing,
  hasSelection,
  onPopulate,
  unitCount,
  totalHp,
  totalXp,
  difficulty,
}: EncounterPopulateButtonProps) {
  return (
    <div className="shrink-0 border-t border-gold/10 px-3 py-2.5 space-y-2">
      {/* Stats summary when selected */}
      {hasSelection && (
        <div className="flex items-center gap-3 text-[9px] text-surface-500 justify-center">
          {unitCount !== undefined && (
            <span>{unitCount} unit{unitCount !== 1 ? "s" : ""}</span>
          )}
          {difficulty && (
            <span className={`px-1.5 py-0.5 rounded-full border ${getDifficultyColor(difficulty)}`}>
              {getDifficultyLabel(difficulty)}
            </span>
          )}
          {totalHp !== undefined && (
            <span>❤️ {totalHp} HP</span>
          )}
          {totalXp !== undefined && (
            <span>✦ {totalXp.toLocaleString()} XP</span>
          )}
        </div>
      )}

      <Button
        variant="gold"
        size="sm"
        className="w-full"
        onClick={onPopulate}
        disabled={!hasSelection}
        isLoading={isPlacing}
      >
        {isPlacing ? "✦ Placing tokens..." : "✦ Populate Map with Encounter"}
      </Button>

      {!hasSelection && (
        <p className="text-[9px] text-gold-500/40 text-center">
          Select an encounter above to populate the battle map
        </p>
      )}
    </div>
  );
}
