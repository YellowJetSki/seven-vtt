/**
 * STᚱ VTT — Spell Slot Meter (Premium Gold Conversion)
 *
 * Premium gold-accented spell slot gauge with:
 * - Animated slot bar with gradient fill
 * - Per-level expandable Cast/Restore controls
 * - Concentration tracking with pulse animation
 * - Spell DC/ATK stat badges
 * - Slot usage summary (used/total + %) in header
 * - Empty state with character-appropriate messaging
 * - Long Rest one-click restore
 * - Staggered entrance animation for slot rows
 *
 * All color tokens converted to gold/amber/emerald/rose system.
 * Zero legacy purple tokens (rogue/mage/warrior eliminated).
 */

import { useState, useMemo } from "react";
import type { SpellLevel, SpellSlotsFull, CasterType } from "@/types";
import { getSlotSummary } from "@/lib/mechanics/spell-slot-engine";

interface SpellSlotMeterProps {
  slots: SpellSlotsFull;
  casterType: CasterType;
  spellSaveDC: number;
  spellAttackBonus: number;
  onCast?: (level: SpellLevel) => void;
  onRestore?: (level?: SpellLevel) => void;
  concentrationSpell?: string | null;
  compact?: boolean;
}

const CASTER_LABELS: Record<CasterType, string> = {
  full: "Full Caster",
  half: "Half Caster",
  third: "Third Caster",
};

export default function SpellSlotMeter({
  slots, casterType, spellSaveDC, spellAttackBonus,
  onCast, onRestore, concentrationSpell, compact = false,
}: SpellSlotMeterProps) {
  const [expanded, setExpanded] = useState(false);
  const [restoringAll, setRestoringAll] = useState(false);

  const summary = useMemo(() => getSlotSummary(slots), [slots]);
  const totalSlots = summary.reduce((s, x) => s + x.max, 0);
  const usedSlots = summary.reduce((s, x) => s + (x.max - x.current), 0);
  const usedPct = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

  // Empty state
  if (totalSlots === 0) {
    return (
      <div className="space-y-2 p-3 rounded-xl bg-obsidian-mid/40 border border-surface-700/20">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">Spellcasting</h3>
          <span className="px-1.5 py-0.5 rounded text-[8px] bg-surface-800/60 text-surface-500 border border-surface-700/20">
            {CASTER_LABELS[casterType] || "Caster"}
          </span>
        </div>
        <p className="text-xs text-surface-500 italic">No spell slots available</p>
        {spellSaveDC > 0 && (
          <div className="flex gap-2 text-[10px] mt-1">
            <div className="px-2 py-1 rounded bg-gold-500/8 text-gold-400/70 border border-gold/10">
              DC {spellSaveDC}
            </div>
            <div className="px-2 py-1 rounded bg-gold-500/8 text-gold-400/70 border border-gold/10">
              +{spellAttackBonus} ATK
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleRestoreAll = () => {
    setRestoringAll(true);
    onRestore?.();
    setTimeout(() => setRestoringAll(false), 600);
  };

  return (
    <div className={`space-y-2 rounded-xl bg-obsidian-mid/40 border border-surface-700/20 hover:border-gold/10 transition-all duration-200 ${compact ? "p-2" : "p-3"}`}>
      {/* ── Header — always visible ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
        aria-label={expanded ? "Collapse spell slots" : "Expand spell slots"}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">
            Spellcasting
          </h3>
          <span className="hidden sm:inline px-1 py-0.5 rounded text-[7px] bg-gold-500/8 text-gold-500/50 border border-gold/8 uppercase tracking-wider">
            {CASTER_LABELS[casterType]}
          </span>
        </div>

        {!compact && (
          <div className="flex items-center gap-2">
            {/* Usage pill */}
            <span className={`text-[10px] font-medium tabular-nums ${
              usedPct >= 75 ? "text-rose-400" : usedPct >= 50 ? "text-amber-400" : "text-gold-300"
            }`}>
              {usedSlots}/{totalSlots}
              <span className="text-[8px] text-surface-600 ml-0.5">({usedPct}%)</span>
            </span>
            <span className={`text-gold-500/40 transform transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
              ▼
            </span>
          </div>
        )}
      </button>

      {/* ── Mini usage bar (always visible) ── */}
      {!compact && (
        <div className="relative h-1 bg-surface-800/60 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${usedPct}%`,
              background: usedPct >= 75
                ? "linear-gradient(90deg, #fbbf24, #ef4444)"
                : "linear-gradient(90deg, #34d399, #eab308)",
            }}
          />
        </div>
      )}

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="space-y-2 animate-in slide-in-from-top-1 duration-150">
          {/* DC & Attack Bonus + Concentration */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="px-2 py-1 rounded text-[10px] font-semibold bg-gold-500/10 text-gold-400 border border-gold/15">
              DC <span className="tabular-nums">{spellSaveDC}</span>
            </div>
            <div className="px-2 py-1 rounded text-[10px] font-semibold bg-gold-500/10 text-gold-400 border border-gold/15">
              <span className="tabular-nums">+{spellAttackBonus}</span> ATK
            </div>

            {/* Concentration */}
            {concentrationSpell && (
              <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                <span className="animate-pulse-soft">🧘</span>
                <span className="truncate max-w-[120px]">{concentrationSpell}</span>
              </div>
            )}
          </div>

          {/* ── Slot gauges per level ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {summary.map(({ level, current, max }, idx) => {
              const pct = max > 0 ? (current / max) * 100 : 0;
              const isExhausted = current <= 0;
              const isFull = current >= max;

              return (
                <div
                  key={level}
                  className="px-2 py-1.5 rounded-lg bg-obsidian-mid/60 border border-surface-700/30 transition-all duration-200 hover:border-gold/10"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Level header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold ${isExhausted ? "text-surface-600" : "text-gold-300"}`}>
                      Lv.{level}
                    </span>
                    <span className={`text-[9px] tabular-nums ${isExhausted ? "text-surface-600" : "text-surface-400"}`}>
                      {current}/{max}
                    </span>
                  </div>

                  {/* Gauge bar */}
                  <div className="relative h-2 bg-surface-800 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: isExhausted
                          ? "#374151"
                          : pct <= 25
                            ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                            : "linear-gradient(90deg, #eab308, #f59e0b)",
                        boxShadow: isExhausted
                          ? "none"
                          : "0 0 4px rgba(234, 179, 8, 0.15)",
                      }}
                    />
                    {pct > 15 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[6px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cast/Restore buttons */}
                  <div className="flex gap-1 mt-1.5">
                    <button
                      onClick={() => onCast?.(level as SpellLevel)}
                      disabled={current <= 0}
                      className="flex-1 py-0.5 rounded text-[8px] font-medium transition-all duration-150
                        bg-gold-500/10 text-gold-400 border border-gold/15
                        hover:bg-gold-500/20 active:scale-95
                        disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100"
                      aria-label={`Cast level ${level} spell`}
                    >
                      Cast
                    </button>
                    <button
                      onClick={() => onRestore?.(level as SpellLevel)}
                      disabled={current >= max}
                      className="flex-1 py-0.5 rounded text-[8px] font-medium transition-all duration-150
                        bg-obsidian-mid/60 text-surface-400 border border-surface-700/30
                        hover:border-gold/15 hover:text-gold-300 active:scale-95
                        disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100"
                      aria-label={`Restore level ${level} slot`}
                    >
                      Rest
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Restore All ── */}
          <button
            onClick={handleRestoreAll}
            disabled={restoringAll}
            className="w-full py-1.5 rounded text-[10px] font-medium transition-all duration-200
              bg-gold-500/8 text-gold-400 border border-gold/15
              hover:bg-gold-500/15 active:scale-[0.99]
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className={`inline-block transition-transform duration-300 ${restoringAll ? "rotate-180" : ""}`}>
              🔄
            </span>
            <span className="ml-1">Restore All (Long Rest)</span>
          </button>

          {/* ── Slot breakdown ── */}
          <details className="text-[9px]">
            <summary className="text-surface-600 cursor-pointer hover:text-surface-400 transition-colors">
              Slot breakdown
            </summary>
            <div className="mt-1 space-y-0.5 pl-2 border-l border-surface-700/20">
              {summary.map(({ level, current, max }) => (
                <div key={level} className="flex justify-between text-surface-500">
                  <span>Level {level}</span>
                  <span className="tabular-nums">{current}/{max} {current >= max ? "✅" : current <= 0 ? "❌" : "◐"}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
