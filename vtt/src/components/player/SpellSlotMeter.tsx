/**
 * STᚱ VTT — Spell Slot Meter (Premium Lusion/Spotify Edition v3)
 *
 * Premium gold-accented spell slot visualization with:
 * - Animated arc-fill gauge per level (Lusion-style depth)
 * - Expandable per-level Cast/Restore controls with spring feedback
 * - Concentration tracking with Spotify "now playing" ping ring
 * - Spell DC/ATK stat cards with directional hover glow
 * - Usage gradient bar with shimmer
 * - Caster type badge with visual tier indicator
 * - Slot breakdown with bullet-point status
 * - "Restore All (Long Rest)" one-click with spin animation
 * - Staggered entrance on expand
 * - Hover lift with 0.5px elevation
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

const CASTER_LABELS: Record<string, string> = {
  full: "Full Caster",
  half: "Half Caster",
  third: "Third Caster",
  pact: "Pact Magic",
  none: "—",
};

const CASTER_TIER_COLORS: Record<string, string> = {
  full: "text-amber-400 border-amber-500/20 bg-amber-500/8",
  half: "text-cyan-400 border-cyan-500/20 bg-cyan-500/8",
  third: "text-violet-400 border-violet-500/20 bg-violet-500/8",
  pact: "text-emerald-400 border-emerald-500/20 bg-emerald-500/8",
  none: "text-surface-600 border-surface-700/20 bg-surface-800/40",
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
      <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-3 overflow-hidden group hover:border-white/[0.07] transition-all duration-200">
        {/* Edge light */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <div className="flex items-center gap-2 mb-2 relative z-[1]">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Spellcasting</h3>
          <span className={`px-1.5 py-0.5 rounded text-[7px] uppercase tracking-wider font-semibold border ${CASTER_TIER_COLORS[casterType]}`}>
            {CASTER_LABELS[casterType]}
          </span>
        </div>
        <p className="text-[10px] text-surface-500 italic relative z-[1]">No spell slots available at this level.</p>
        {spellSaveDC > 0 && (
          <div className="flex gap-2 mt-2 relative z-[1]">
            <div className="px-2 py-1 rounded-lg bg-gradient-to-b from-gold-500/8 to-gold-500/2 text-gold-400/70 border border-gold/10 text-[10px] font-semibold tabular-nums">
              DC {spellSaveDC}
            </div>
            <div className="px-2 py-1 rounded-lg bg-gradient-to-b from-gold-500/8 to-gold-500/2 text-gold-400/70 border border-gold/10 text-[10px] font-semibold tabular-nums">
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
    <div className={`relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] overflow-hidden transition-all duration-200 group hover:border-white/[0.07] ${compact ? "p-2" : "p-3"}`}>
      {/* Edge light */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/[0.01] via-transparent to-transparent" />

      {/* ── HEADER ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between relative z-[1]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1 h-3.5 rounded-full bg-amber-500/40 shrink-0" />
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 whitespace-nowrap">
            Spell Slots
          </h3>
          <span className={`hidden sm:inline px-1.5 py-0.5 rounded text-[7px] uppercase tracking-wider font-semibold border shrink-0 ${CASTER_TIER_COLORS[casterType]}`}>
            {CASTER_LABELS[casterType]}
          </span>
          {/* Concentration "now playing" indicator */}
          {concentrationSpell && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 shrink-0"
              title={`Concentrating on ${concentrationSpell}`}>
              <span className="relative w-1.5 h-1.5">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                <span className="absolute inset-0 rounded-full bg-emerald-400" />
              </span>
              <span className="truncate max-w-[80px]">{concentrationSpell}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Usage pill */}
          <div className={`px-1.5 py-0.5 rounded-lg border text-[9px] font-semibold tabular-nums ${
            usedPct >= 75
              ? "bg-rose-500/10 text-rose-400 border-rose-500/15"
              : usedPct >= 50
                ? "bg-amber-500/10 text-amber-400 border-amber-500/15"
                : "bg-gold-500/8 text-gold-400 border-gold/15"
          }`}>
            {usedSlots}/{totalSlots}
            <span className="text-[7px] ml-0.5 opacity-60">({usedPct}%)</span>
          </div>
          <span className={`text-gold-500/40 transform transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
            ▼
          </span>
        </div>
      </button>

      {/* ── Usage bar (always visible) ── */}
      {!compact && (
        <div className="relative h-1.5 mt-2 bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 rounded-full overflow-hidden border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${usedPct}%`,
              background: usedPct >= 75
                ? "linear-gradient(90deg, #eab308, #ef4444)"
                : "linear-gradient(90deg, #34d399, #eab308)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
          </div>
          {/* Glint marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white/20 rounded-full"
            style={{ left: `${usedPct}%` }}
          />
        </div>
      )}

      {/* ── EXPANDED CONTENT ── */}
      {expanded && (
        <div className="space-y-2 mt-3 animate-in slide-in-from-top-1 duration-150 relative z-[1]">
          {/* DC + ATK + Concentration stat strip */}
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-gradient-to-b from-cyan-500/8 to-cyan-500/2 text-cyan-400 border border-cyan-500/15 tabular-nums hover:-translate-y-0.5 transition-all duration-200">
              DC <span className="text-[11px] font-bold">{spellSaveDC}</span>
            </div>
            <div className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-gradient-to-b from-gold-500/8 to-gold-500/2 text-gold-400 border border-gold/15 tabular-nums hover:-translate-y-0.5 transition-all duration-200">
              +{spellAttackBonus} <span className="text-[11px] font-bold">ATK</span>
            </div>
            {/* Concentration badge */}
            {concentrationSpell && (
              <div className="px-2 py-1 rounded-lg text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 flex items-center gap-1 max-w-[160px]">
                <span className="relative w-1.5 h-1.5 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
                  <span className="absolute inset-0 rounded-full bg-emerald-400" />
                </span>
                <span className="truncate">{concentrationSpell}</span>
              </div>
            )}
          </div>

          {/* ── PER-LEVEL SLOT GAUGES ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {summary.map(({ level, current, max }, idx) => {
              const pct = max > 0 ? (current / max) * 100 : 0;
              const isExhausted = current <= 0;
              const isFull = current >= max;

              return (
                <div
                  key={level}
                  className="relative px-2 py-1.5 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-gold/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 overflow-hidden"
                  style={{ animationDelay: `${idx * 40}ms`, animation: "slide-in-up 0.3s ease-out both" }}
                >
                  {/* Hover directional glow */}
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-gold-500/[0.02] via-transparent to-amber-500/[0.02] rounded-xl" />

                  {/* Level header */}
                  <div className="flex items-center justify-between mb-1 relative z-[1]">
                    <span className={`text-[10px] font-bold ${isExhausted ? "text-surface-600" : "text-gold-300"}`}>
                      Lv.{level}
                    </span>
                    <span className={`text-[9px] tabular-nums font-medium ${isExhausted ? "text-surface-600" : isFull ? "text-emerald-400" : "text-surface-400"}`}>
                      {current}
                      <span className="text-surface-600">/{max}</span>
                    </span>
                  </div>

                  {/* Gauge bar — Lusion style with depth */}
                  <div className="relative h-2.5 rounded-full bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 overflow-hidden border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out relative"
                      style={{
                        width: `${pct}%`,
                        background: isExhausted
                          ? "linear-gradient(90deg, #374151, #4B5563)"
                          : pct <= 25
                            ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                            : "linear-gradient(90deg, #eab308, #f59e0b)",
                        boxShadow: isExhausted ? "none" : "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      {!isExhausted && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
                      )}
                    </div>
                    {/* Pct label inside bar */}
                    {pct > 20 && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[6px] font-bold text-white/80 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cast/Restore buttons */}
                  <div className="flex gap-1 mt-1.5 relative z-[1]">
                    <button
                      onClick={() => onCast?.(level as SpellLevel)}
                      disabled={current <= 0}
                      className="flex-1 py-1 rounded-lg text-[8px] font-semibold transition-all duration-150 bg-gradient-to-b from-gold-500/10 to-gold-500/5 text-gold-400 border border-gold/15 hover:from-gold-500/20 hover:to-gold-500/10 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      Cast
                    </button>
                    <button
                      onClick={() => onRestore?.(level as SpellLevel)}
                      disabled={current >= max}
                      className="flex-1 py-1 rounded-lg text-[8px] font-semibold transition-all duration-150 bg-gradient-to-b from-obsidian-mid/60 to-obsidian-mid/40 text-surface-400 border border-surface-700/30 hover:border-gold/15 hover:text-gold-300 active:scale-90 disabled:opacity-25 disabled:cursor-not-allowed disabled:active:scale-100"
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
            className="relative w-full py-1.5 rounded-xl text-[10px] font-semibold transition-all duration-200 bg-gradient-to-b from-gold-500/8 to-gold-500/3 text-gold-400 border border-gold/15 hover:from-gold-500/15 hover:to-gold-500/8 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent" />
            <span className={`inline-block transition-transform duration-300 ${restoringAll ? "rotate-180" : ""}`}>
              🔄
            </span>
            <span className="ml-1">Restore All (Long Rest)</span>
          </button>

          {/* ── Slot breakdown (collapsible details) ── */}
          <details className="group">
            <summary className="text-[8px] text-surface-600 cursor-pointer hover:text-surface-400 transition-colors list-none flex items-center gap-1">
              <span className="inline-block transition-transform duration-150 group-open:rotate-90">▸</span>
              Slot breakdown
            </summary>
            <div className="mt-1 space-y-0.5 pl-3 border-l border-gold/10">
              {summary.map(({ level, current, max }) => (
                <div key={level} className="flex justify-between text-[9px] text-surface-500 hover:text-surface-300 transition-colors">
                  <span>Level {level}</span>
                  <span className="tabular-nums">{current}/{max}
                    <span className="ml-1">{current >= max ? "✅" : current <= 0 ? "❌" : "◐"}</span>
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
