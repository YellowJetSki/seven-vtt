/**
 * STᚱ VTT — Spell Slot Status
 *
 * Per-level spell slot display with visual gauges, quick-cast/restore,
 * and auto-injection into the Combat Tab entity system.
 *
 * Features:
 * - Per-level slot gauges with current/max and percentage
 * - Color-coded usage: green (full), amber (partial), red (exhausted)
 * - Cast button (decrements one slot at that level)
 * - Restore button (restores one slot)
 * - Compact mode (slots only, no buttons)
 * - Spellcasting stats header (DC, ATK, Mod)
 *
 * Usage:
 *   <SpellSlotStatus
 *     slots={spellcasting.spellSlots}
 *     spellcastingAbility={spellcasting.ability}
 *     spellSaveDC={spellcasting.spellSaveDC}
 *     spellAttackBonus={spellcasting.spellAttackBonus}
 *     onCast={(level) => handleCastSpell(character, level)}
 *     onRestore={(level) => handleRestoreSlots(character, level)}
 *   />
 */

import type { SpellSlotsFull, SpellLevel } from "@/types";

interface SpellSlotStatusProps {
  slots: SpellSlotsFull | undefined;
  spellcastingAbility?: string;
  spellSaveDC: number;
  spellAttackBonus: number;
  onCast: (level: SpellLevel) => void;
  onRestore: (level?: SpellLevel) => void;
  /** Optional compact mode (hides buttons, shows only gauges) */
  compact?: boolean;
  /** Current concentration spell name (shown in header) */
  concentrationSpell?: string | null;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "1st", 2: "2nd", 3: "3rd",
  4: "4th", 5: "5th", 6: "6th",
  7: "7th", 8: "8th", 9: "9th",
};

/** Get the usage tier for a slot pool */
function getSlotTier(current: number, max: number): { className: string; barClass: string; label: string } {
  if (max === 0) return { className: "text-surface-500", barClass: "bg-surface-600", label: "None" };
  const pct = current / max;
  if (current === 0) return { className: "text-red-400", barClass: "bg-red-500", label: "Exhausted" };
  if (pct <= 0.25) return { className: "text-rose-400", barClass: "bg-rose-500", label: "Low" };
  if (pct <= 0.5) return { className: "text-amber-400", barClass: "bg-amber-500", label: "Partial" };
  if (pct < 1) return { className: "text-gold-400", barClass: "bg-gold-500", label: "Available" };
  return { className: "text-emerald-400", barClass: "bg-emerald-500", label: "Full" };
}

export default function SpellSlotStatus({
  slots,
  spellcastingAbility,
  spellSaveDC,
  spellAttackBonus,
  onCast,
  onRestore,
  compact = false,
  concentrationSpell,
}: SpellSlotStatusProps) {
  if (!slots) return null;

  // Build slot levels 1-9 that have max > 0
  const available = [];
  for (let i = 1; i <= 9; i++) {
    const key = `level${i}` as keyof SpellSlotsFull;
    const pool = slots[key];
    if (pool && pool.max > 0) {
      available.push({ level: i as SpellLevel, current: pool.current, max: pool.max });
    }
  }

  if (available.length === 0) return null;

  const totalCurrent = available.reduce((sum, s) => sum + s.current, 0);
  const totalMax = available.reduce((sum, s) => sum + s.max, 0);
  const totalPct = totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 0;

  return (
    <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3">
      {/* ── Header: Spellcasting Stats ── */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-amber-500/40" />
          Spell Slots
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono tabular-nums text-gold-400">
            {totalCurrent}/{totalMax}
          </span>
          {!compact && (
            <button
              onClick={() => onRestore()}
              className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15 active:scale-90 transition-all"
              title="Restore all spell slots"
            >
              Restore All
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="flex flex-col items-center py-1.5 rounded-lg bg-obsidian/60 border border-surface-700/20">
          <span className="text-[7px] uppercase tracking-widest font-medium text-surface-500">DC</span>
          <span className="text-sm font-bold tabular-nums text-amber-300">{spellSaveDC}</span>
        </div>
        <div className="flex flex-col items-center py-1.5 rounded-lg bg-obsidian/60 border border-surface-700/20">
          <span className="text-[7px] uppercase tracking-widest font-medium text-surface-500">ATK</span>
          <span className="text-sm font-bold tabular-nums text-gold-400">+{spellAttackBonus}</span>
        </div>
        <div className="flex flex-col items-center py-1.5 rounded-lg bg-obsidian/60 border border-surface-700/20">
          <span className="text-[7px] uppercase tracking-widest font-medium text-surface-500">Mod</span>
          <span className="text-sm font-bold tabular-nums text-violet-400">{spellcastingAbility || "—"}</span>
        </div>
      </div>

      {/* ── Total usage bar ── */}
      <div className="h-1.5 rounded-full bg-obsidian/60 overflow-hidden mb-2.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            totalPct <= 25 ? "bg-red-500" : totalPct <= 50 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${totalPct}%` }}
        />
      </div>

      {/* ── Slot levels ── */}
      <div className="space-y-1.5">
        {available.map(({ level, current, max }) => {
          const { barClass, label } = getSlotTier(current, max);
          const pct = max > 0 ? Math.round((current / max) * 100) : 0;

          return (
            <div key={level} className="flex items-center gap-1.5">
              {/* Level label */}
              <span className={`text-[9px] font-mono font-bold w-6 text-right shrink-0 ${
                current === 0 ? "text-surface-600" : "text-gold-400"
              }`}>
                {LEVEL_LABELS[level]}
              </span>

              {/* Gauge bar */}
              <div className="flex-1 h-3 rounded-full bg-obsidian/60 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                  style={{ width: `${pct}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-bold text-white/70">
                  {current}/{max}
                </span>
              </div>

              {/* Action buttons */}
              {!compact && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => onCast(level)}
                    disabled={current <= 0}
                    className="px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    title={`Cast a level ${level} spell`}
                  >
                    Cast
                  </button>
                  <button
                    onClick={() => onRestore(level)}
                    disabled={current >= max}
                    className="px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                    title={`Restore a level ${level} slot`}
                  >
                    +
                  </button>
                </div>
              )}

              {/* Status dot */}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                current === 0 ? "bg-red-500/60" :
                pct <= 50 ? "bg-amber-500/60" :
                "bg-emerald-500/60"
              }`} />
            </div>
          );
        })}
      </div>

      {/* ── Concentration indicator ── */}
      {concentrationSpell && (
        <div className="mt-2 pt-2 border-t border-surface-700/10 flex items-center gap-1.5">
          <span className="text-[10px]">🧘</span>
          <span className="text-[9px] text-emerald-400 font-semibold">Concentrating:</span>
          <span className="text-[9px] text-surface-300">{concentrationSpell}</span>
        </div>
      )}
    </div>
  );
}
