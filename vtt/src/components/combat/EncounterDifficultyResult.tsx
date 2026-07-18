/* ── Encounter Difficulty Result Card ───────────────────────────
 * Displays the computed encounter difficulty with XP breakdown,
 * thresholds, and visual rating indicator.
 * Extracted from EncounterDifficulty.tsx.
 * ─────────────────────────────────────────────────────────────── */

import type { DifficultyResult } from "./encounter-difficulty-data";

interface Props {
  difficulty: DifficultyResult;
}

const DIFFICULTY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  medium: { label: "Medium", color: "text-mage-400", bg: "bg-mage-500/10" },
  hard: { label: "Hard", color: "text-warrior-400", bg: "bg-warrior-500/10" },
  deadly: { label: "Deadly", color: "text-rogue-400", bg: "bg-rogue-500/10" },
};

export function EncounterDifficultyResult({ difficulty }: Props) {
  const style = DIFFICULTY_STYLES[difficulty.rating];

  return (
    <div className={`rounded-lg p-3 ${style.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-surface-100">Difficulty: </span>
        <span className={`text-lg font-bold ${style.color}`}>{style.label}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="text-surface-400">
          Total XP: <span className="text-surface-200">{difficulty.totalXp}</span>
        </div>
        <div className="text-surface-400">
          Adjusted XP: <span className="text-surface-200">{difficulty.adjustedXp}</span>
        </div>
        <div className="text-surface-400">
          Multiplier: <span className="text-surface-200">×{difficulty.multiplier}</span>
        </div>
        <div className="text-surface-400">
          XP/Player: <span className="text-surface-200">{difficulty.xpPerPlayer}</span>
        </div>
      </div>
      <div className="mt-2 flex gap-3 text-[10px]">
        <span className="text-emerald-400">E: {difficulty.thresholds.easy}</span>
        <span className="text-mage-400">M: {difficulty.thresholds.medium}</span>
        <span className="text-warrior-400">H: {difficulty.thresholds.hard}</span>
        <span className="text-rogue-400">D: {difficulty.thresholds.deadly}</span>
      </div>
    </div>
  );
}
