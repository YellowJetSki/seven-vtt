/**
 * STᚱ VTT — Death Saves (Compact)
 *
 * Compact death save tracker used in the persistent stats bar.
 * Shown conditionally when HP = 0.
 *
 * Features:
 * - 3 success / 3 failure toggleable circles
 * - "Stable" / "Dead" status label
 * - Reset button
 * - Urgent glow when at 0 HP
 * - Compact design for inline use
 */

import type { PlayerCharacter } from "@/types";

interface DeathSavesCompactProps {
  character: PlayerCharacter;
  onToggle: (type: "successes" | "failures", index: number) => void;
  onReset: () => void;
}

export default function DeathSavesCompact({
  character: c,
  onToggle,
  onReset,
}: DeathSavesCompactProps) {
  const isAtZero = c.hitPoints.current <= 0;
  const isDead = c.deathSaves.failures >= 3;
  const isStable = c.deathSaves.successes >= 3 && !isDead;

  if (!isAtZero) return null;

  return (
    <div className="pt-2 border-t border-red-500/15 animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-red-400/80">Death Saves</span>
          {isDead && (
            <span className="text-[9px] uppercase font-bold text-red-400 animate-pulse-soft">☠ DEAD</span>
          )}
          {isStable && (
            <span className="text-[9px] uppercase font-bold text-emerald-400">Stable</span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onReset(); }}
          className="text-[9px] text-surface-500 hover:text-gold-400 transition-colors px-1.5 py-0.5 rounded border border-surface-700/30 hover:border-gold/20"
        >
          Reset
        </button>
      </div>

      {/* Success / Failure circles */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <span className="text-[8px] uppercase tracking-wider text-green-500/60 block mb-0.5">Successes</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <button
                key={`s-${i}`}
                onClick={() => onToggle("successes", i)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-90 ${
                  c.deathSaves.successes > i
                    ? "bg-green-500/20 border-green-500/50 text-green-400"
                    : "bg-obsidian-mid/60 border-surface-700/30 text-surface-600 hover:border-green-500/30"
                }`}
              >
                {c.deathSaves.successes > i ? "✓" : "○"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <span className="text-[8px] uppercase tracking-wider text-red-400/60 block mb-0.5">Failures</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <button
                key={`f-${i}`}
                onClick={() => onToggle("failures", i)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-90 ${
                  c.deathSaves.failures > i
                    ? "bg-red-500/20 border-red-500/50 text-red-400"
                    : "bg-obsidian-mid/60 border-surface-700/30 text-surface-600 hover:border-red-500/30"
                }`}
              >
                {c.deathSaves.failures > i ? "✕" : "○"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
