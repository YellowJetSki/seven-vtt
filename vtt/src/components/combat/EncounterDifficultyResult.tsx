/* ── Encounter Difficulty Result Card ───────────────────────────
 * Displays the computed encounter difficulty with XP breakdown,
 * thresholds, and visual rating indicator.
 * Extracted from EncounterDifficulty.tsx.
 * ─────────────────────────────────────────────────────────────── */

import type { DifficultyResult } from "./encounter-difficulty-data";

interface Props {
  difficulty: DifficultyResult;
}

const DIFFICULTY_STYLES: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  easy: { label: "Easy", color: "text-divine-400", bg: "bg-divine-500/8", border: "border-divine-500/20", icon: "🟢" },
  medium: { label: "Medium", color: "text-mage-400", bg: "bg-mage-500/8", border: "border-mage-500/20", icon: "🔵" },
  hard: { label: "Hard", color: "text-warrior-400", bg: "bg-warrior-500/8", border: "border-warrior-500/20", icon: "🟠" },
  deadly: { label: "Deadly", color: "text-rogue-400", bg: "bg-rogue-500/8", border: "border-rogue-500/20", icon: "💀" },
};

export function EncounterDifficultyResult({ difficulty }: Props) {
  const style = DIFFICULTY_STYLES[difficulty.rating];

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${style.bg} ${style.border}`}>
      {/* ── Rating Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{style.icon}</span>
          <span className="text-xs font-semibold text-surface-300">Difficulty Rating</span>
        </div>
        <span className={`text-base font-bold ${style.color}`}>{style.label}</span>
      </div>

      {/* ── XP Grid ── */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[
          { label: "Total XP", value: difficulty.totalXp },
          { label: "Adjusted XP", value: difficulty.adjustedXp },
          { label: "Multiplier", value: `×${difficulty.multiplier}` },
          { label: "XP / Player", value: difficulty.xpPerPlayer },
        ].map((item) => (
          <div key={item.label} className="rounded-lg bg-surface-900/60 px-2.5 py-1.5">
            <p className="text-[9px] uppercase tracking-wider text-surface-500">{item.label}</p>
            <p className="text-xs font-semibold text-surface-200 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* ── Threshold Bar ── */}
      <div>
        <p className="text-[9px] uppercase tracking-wider text-surface-500 mb-1.5">Party Thresholds</p>
        <div className="flex gap-2 text-[10px]">
          {[
            { label: "E", value: difficulty.thresholds.easy, color: "text-divine-400 bg-divine-500/8" },
            { label: "M", value: difficulty.thresholds.medium, color: "text-mage-400 bg-mage-500/8" },
            { label: "H", value: difficulty.thresholds.hard, color: "text-warrior-400 bg-warrior-500/8" },
            { label: "D", value: difficulty.thresholds.deadly, color: "text-rogue-400 bg-rogue-500/8" },
          ].map((t) => (
            <span key={t.label} className={`flex-1 rounded-lg px-2 py-1 text-center font-medium ${t.color}`}>
              <span className="block text-[10px]">{t.label}</span>
              <span className="block text-[9px] opacity-80">{t.value}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
