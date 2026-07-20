/**
 * STᚱ VTT — HpKeypadSection (Premium)
 *
 * Lusion/Overrrides-grade HP management section:
 * - 6-button damage/heal keypad with press-spring feedback
 * - Tier-colored HP bar with gradient + temp HP overlay
 * - Custom numeric input with floating label
 * - Temporary HP section with gold styling
 * - Rest & Recovery 3-button grid with icon badges
 * - Animated pulse on HP display
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";

interface HpKeypadSectionProps {
  character: PlayerCharacter;
  hpRatio: number;
  hpColor: string;
  hasTemp: boolean;
  onHpChange: (delta: number) => void;
  onSetTempHp: (amount: number) => void;
  onShortRest: () => void;
  onLongRest: () => void;
  onQuickRest: () => void;
}

export default function HpKeypadSection({
  character,
  hpRatio,
  hpColor,
  hasTemp,
  onHpChange,
  onSetTempHp,
  onShortRest,
  onLongRest,
  onQuickRest,
}: HpKeypadSectionProps) {
  const [hpInput, setHpInput] = useState("");

  const onHpInput = useCallback(() => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val)) return;
    onHpChange(val);
    setHpInput("");
  }, [hpInput, onHpChange]);

  // Color tier for HP bar
  const barGradient = hpRatio > 0.5
    ? "from-emerald-500 to-emerald-400"
    : hpRatio > 0.25
      ? "from-amber-500 to-amber-400"
      : "from-rose-500 to-red-500";

  return (
    <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-3 overflow-hidden group hover:border-white/[0.07] transition-all duration-200">
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      {/* Section header */}
      <div className="flex items-center justify-between mb-2 relative z-[1]">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-gold-500/40" />
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            Hit Points
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg font-black tabular-nums font-mono text-gold-300">
            {character.hitPoints.current}
          </span>
          <span className="text-[10px] text-surface-500 font-mono">
            /{character.hitPoints.max}
          </span>
          {hasTemp && (
            <span className="text-[9px] text-amber-400 font-mono ml-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">
              +{character.temporaryHitPoints} THP
            </span>
          )}
        </div>
      </div>

      {/* HP Bar — premium multi-layer */}
      <div className="relative h-4 bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 rounded-full overflow-hidden border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] group mb-1">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out relative`}
          style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
        >
          {/* Shimmer on bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-shimmer" />
        </div>
        {/* Temp HP overlay */}
        {hasTemp && (
          <div
            className="absolute top-0 h-full bg-gradient-to-r from-amber-500/25 to-amber-400/15 rounded-full"
            style={{
              left: `${Math.min(100, hpRatio * 100)}%`,
              width: `${Math.min(100 - hpRatio * 100, ((character.temporaryHitPoints || 0) / character.hitPoints.max) * 100)}%`,
            }}
          />
        )}
        {/* Pct label */}
        <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
          <span className="text-[7px] font-bold text-white/40 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] tabular-nums">
            {Math.round(hpRatio * 100)}%
          </span>
        </div>
      </div>

      {/* Quick Damage/Heal Keypad */}
      <div className="grid grid-cols-6 gap-1.5 mt-2 relative z-[1]">
        {[
          { label: "-10", delta: -10, className: "from-red-500/15 to-red-600/10 text-red-400 border-red-500/20 hover:from-red-500/20 hover:to-red-600/15" },
          { label: "-5", delta: -5, className: "from-red-500/15 to-red-600/10 text-red-400 border-red-500/20 hover:from-red-500/20 hover:to-red-600/15" },
          { label: "-1", delta: -1, className: "from-rose-500/10 to-rose-600/8 text-rose-400 border-rose-500/15 hover:from-rose-500/15 hover:to-rose-600/10" },
          { label: "+1", delta: 1, className: "from-emerald-500/10 to-emerald-600/8 text-emerald-400 border-emerald-500/15 hover:from-emerald-500/15 hover:to-emerald-600/10" },
          { label: "+5", delta: 5, className: "from-emerald-500/15 to-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-600/15" },
          { label: "+10", delta: 10, className: "from-emerald-500/15 to-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:from-emerald-500/20 hover:to-emerald-600/15" },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => onHpChange(btn.delta)}
            className={`py-3 rounded-xl text-base font-bold active:scale-90 transition-all duration-150 bg-gradient-to-b border ${btn.className}`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Custom HP Input */}
      <div className="flex items-center gap-2 mt-2 relative z-[1]">
        <div className="relative flex-1">
          <input
            type="number"
            value={hpInput}
            onChange={(e) => setHpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onHpInput();
            }}
            placeholder="Custom (+/-) HP"
            className="w-full py-3 px-3 text-sm bg-gradient-to-b from-[#0c0d15]/80 to-[#07080d]/90 border border-surface-700/30 rounded-xl text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15 transition-all"
          />
        </div>
        <button
          onClick={onHpInput}
          className="px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-gradient-to-b from-gold-500/12 to-gold-500/5 text-gold-400 border border-gold/15 hover:from-gold-500/20 hover:to-gold-500/10 active:scale-95"
        >
          Apply
        </button>
      </div>

      {/* Temp HP Section */}
      <div className="mt-2 pt-2.5 border-t border-white/[0.04] relative z-[1]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Temporary HP</span>
          <span className="text-xs font-bold font-mono text-gold-300 tabular-nums">
            {character.temporaryHitPoints || 0}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "+1 THP", amount: 1, color: "text-gold-400 border-gold/15 bg-gold-500/8" },
            { label: "+5 THP", amount: 5, color: "text-gold-400 border-gold/15 bg-gold-500/8" },
            { label: "+10 THP", amount: 10, color: "text-gold-400 border-gold/15 bg-gold-500/8" },
            { label: "Clear", amount: 0, color: "text-surface-500 border-surface-700/30 bg-surface-800/40 hover:border-surface-600/40" },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => onSetTempHp(btn.amount)}
              className={`py-2 rounded-lg text-xs font-bold active:scale-90 transition-all duration-150 border ${btn.color}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rest & Recovery 3-button grid */}
      <div className="grid grid-cols-3 gap-1.5 mt-2.5 relative z-[1]">
        <button
          onClick={onShortRest}
          className="py-2 rounded-xl text-[9px] font-bold transition-all duration-200 bg-gradient-to-b from-gold-500/10 to-gold-500/3 border border-gold/15 text-gold-400 hover:from-gold-500/15 hover:to-gold-500/8 active:scale-95"
        >
          😴 Short Rest
        </button>
        <button
          onClick={onLongRest}
          className="py-2 rounded-xl text-[9px] font-bold transition-all duration-200 bg-gradient-to-b from-emerald-500/10 to-emerald-500/3 border border-emerald-500/15 text-emerald-400 hover:from-emerald-500/15 hover:to-emerald-500/8 active:scale-95"
        >
          🛌 Long Rest
        </button>
        <button
          onClick={onQuickRest}
          className="py-2 rounded-xl text-[9px] font-bold transition-all duration-200 bg-gradient-to-b from-amber-500/10 to-amber-500/3 border border-amber-500/15 text-amber-400 hover:from-amber-500/15 hover:to-amber-500/8 active:scale-95"
        >
          ⚡ Quick Rest
        </button>
      </div>
    </div>
  );
}
