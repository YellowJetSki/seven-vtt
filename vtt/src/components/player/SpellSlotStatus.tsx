/**
 * STᚱ VTT — SpellSlotStatus (Premium Lusion/Spotify Edition)
 *
 * Premium per-level spell slot management with:
 * - Lusion-style arc-fill gauge bars with shimmer and depth
 * - 3-stat gold DC/ATK/Mod header card cluster
 * - Total usage bar with tier-based gradient
 * - Cast/Restore buttons with spring press feedback
 * - Concentration indicator with Spotify "now playing" ping dot
 * - Staggered entrance per level slot gauge
 * - Status dot per level (green/amber/red)
 * - Compact mode for sidebar/dashboard use
 */

import type { SpellSlotsFull, SpellLevel } from "@/types";

interface SpellSlotStatusProps {
  slots: SpellSlotsFull | undefined;
  spellcastingAbility?: string;
  spellSaveDC: number;
  spellAttackBonus: number;
  onCast: (level: SpellLevel) => void;
  onRestore: (level?: SpellLevel) => void;
  compact?: boolean;
  concentrationSpell?: string | null;
}

const LEVEL_LABELS: Record<number, string> = {
  1: "1st", 2: "2nd", 3: "3rd",
  4: "4th", 5: "5th", 6: "6th",
  7: "7th", 8: "8th", 9: "9th",
};

function getSlotTier(current: number, max: number): { barGradient: string; label: string; dotColor: string } {
  if (max === 0) return { barGradient: "from-surface-600 to-surface-700", label: "None", dotColor: "bg-surface-600" };
  const pct = current / max;
  if (current === 0) return { barGradient: "from-red-500 to-rose-500", label: "Exhausted", dotColor: "bg-red-500" };
  if (pct <= 0.25) return { barGradient: "from-rose-500 to-amber-500", label: "Low", dotColor: "bg-rose-400" };
  if (pct <= 0.5) return { barGradient: "from-amber-500 to-yellow-500", label: "Partial", dotColor: "bg-amber-400" };
  if (pct < 1) return { barGradient: "from-yellow-500 to-emerald-400", label: "Available", dotColor: "bg-emerald-400" };
  return { barGradient: "from-emerald-500 to-emerald-400", label: "Full", dotColor: "bg-emerald-500" };
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
    <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-3 overflow-hidden group hover:border-white/[0.07] transition-all duration-200">
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      {/* ── Header: Spellcasting Stats ── */}
      <div className="flex items-center justify-between mb-2 relative z-[1]">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-amber-500/40" />
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            Spell Slots
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] tabular-nums font-bold text-gold-400">
            {totalCurrent}
            <span className="text-surface-500 font-normal">/{totalMax}</span>
          </span>
          {!compact && (
            <button
              onClick={() => onRestore()}
              className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-gradient-to-b from-cyan-500/10 to-cyan-500/3 border border-cyan-500/15 text-cyan-400 hover:from-cyan-500/15 hover:to-cyan-500/8 active:scale-90 transition-all duration-150"
              title="Restore all spell slots"
            >
              Restore All
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Grid (DC / ATK / Mod) ── */}
      <div className="grid grid-cols-3 gap-1.5 mb-2 relative z-[1]">
        {[
          { label: "DC", value: spellSaveDC, color: "text-amber-300", accent: "from-amber-500/20" },
          { label: "ATK", value: `+${spellAttackBonus}`, color: "text-gold-400", accent: "from-gold-500/20" },
          { label: "Mod", value: spellcastingAbility || "—", color: "text-violet-400", accent: "from-violet-500/20" },
        ].map((stat, idx) => (
          <div
            key={stat.label}
            className="relative group/stat flex flex-col items-center py-1.5 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-amber-500/10 transition-all duration-200 overflow-hidden"
            style={{ animationDelay: `${idx * 60}ms`, animation: "slide-in-up 0.3s ease-out both" }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" style={{ background: `radial-gradient(ellipse 80px 40px at 50% 20%, ${stat.accent.replace("from-", "").replace("/20", "/6")}, transparent)` }} />
            <span className="text-[6px] uppercase tracking-widest font-bold text-surface-500 relative z-[1]">
              {stat.label}
            </span>
            <span className={`text-sm font-black tabular-nums relative z-[1] ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Total usage bar ── */}
      <div className="relative h-1.5 rounded-full bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 overflow-hidden border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] mb-2.5">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${totalPct}%`,
            background: totalPct <= 25
              ? "linear-gradient(90deg, #e11d48, #f43f5e)"
              : totalPct <= 50
                ? "linear-gradient(90deg, #f59e0b, #eab308)"
                : "linear-gradient(90deg, #34d399, #10b981)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
        </div>
        {/* Pct label */}
        <div className="absolute inset-0 flex items-center justify-end pr-1.5 pointer-events-none">
          <span className="text-[6px] font-bold text-white/40 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
            {totalPct}%
          </span>
        </div>
      </div>

      {/* ── Slot levels ── */}
      <div className="space-y-1 relative z-[1]">
        {available.map(({ level, current, max }, idx) => {
          const { barGradient, dotColor } = getSlotTier(current, max);
          const pct = max > 0 ? Math.round((current / max) * 100) : 0;

          return (
            <div
              key={level}
              className="flex items-center gap-1.5 group/row"
              style={{ animationDelay: `${idx * 40}ms`, animation: "slide-in-up 0.3s ease-out both" }}
            >
              {/* Level label */}
              <span className={`text-[9px] font-mono font-bold w-6 text-right shrink-0 ${
                current === 0 ? "text-surface-600" : "text-gold-400"
              }`}>
                {LEVEL_LABELS[level]}
              </span>

              {/* Gauge bar — Lusion premium style */}
              <div className="flex-1 h-3.5 rounded-full bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 overflow-hidden relative border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out relative"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${barGradient.includes("emerald") ? "#34d399" : barGradient.includes("amber") || barGradient.includes("yellow") ? "#f59e0b" : "#f43f5e"}, ${barGradient.includes("rose") ? "#e11d48" : barGradient.includes("emerald") || barGradient.includes("yellow") ? "#eab308" : "#f43f5e"})`,
                    boxShadow: current > 0 ? "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {current > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
                  )}
                </div>
                {/* current/max label */}
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-mono font-bold text-white/60 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                  {current}/{max}
                </span>
              </div>

              {/* Action buttons */}
              {!compact && (
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity duration-150 ml-1">
                  <button
                    onClick={() => onCast(level)}
                    disabled={current <= 0}
                    className="px-1.5 py-1 rounded text-[7px] font-bold uppercase tracking-wider bg-gradient-to-b from-gold-500/10 to-gold-500/3 border border-gold/15 text-gold-400 hover:from-gold-500/20 hover:to-gold-500/10 active:scale-90 transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100"
                    title={`Cast a level ${level} spell`}
                  >
                    Cast
                  </button>
                  <button
                    onClick={() => onRestore(level)}
                    disabled={current >= max}
                    className="px-1.5 py-1 rounded text-[7px] font-bold uppercase tracking-wider bg-gradient-to-b from-emerald-500/10 to-emerald-500/3 border border-emerald-500/15 text-emerald-400 hover:from-emerald-500/20 hover:to-emerald-500/10 active:scale-90 transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100"
                    title={`Restore a level ${level} slot`}
                  >
                    +
                  </button>
                </div>
              )}

              {/* Status dot */}
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}
                style={{
                  boxShadow: current > 0 ? `0 0 4px ${dotColor.replace("bg-", "").replace("-500", "")}` : "none"
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Concentration indicator ── */}
      {concentrationSpell && (
        <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center gap-2 relative z-[1]">
          <div className="relative w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
            <span className="absolute inset-0 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[9px] text-emerald-400 font-semibold">Concentrating:</span>
          <span className="text-[9px] text-surface-300">{concentrationSpell}</span>
        </div>
      )}
    </div>
  );
}
