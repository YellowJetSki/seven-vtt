/**
 * STᚱ VTT — HpKeypadSection
 *
 * Complete HP management section with:
 * - 6-button damage/heal keypad (-10/-5/-1/+1/+5/+10)
 * - Custom numeric input with Apply button
 * - Temporary HP management with +1/+5/+10/Clear buttons
 * - Rest & Recovery grid (Short Rest, Long Rest, Quick Rest)
 *
 * Extracted from PlayerSheetCombatTab.tsx monolith (Sprint 9 refactor).
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

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-gold-500/40" />
          Hit Points
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-lg font-black tabular-nums font-mono text-gold-300">{character.hitPoints.current}</span>
          <span className="text-xs text-surface-500 font-mono">/{character.hitPoints.max}</span>
          {hasTemp && (
            <span className="text-[10px] text-amber-400 font-mono ml-1">+{character.temporaryHitPoints}</span>
          )}
        </div>
      </div>

      {/* HP Bar */}
      <div className="h-4 bg-surface-700/60 rounded-full overflow-hidden relative shadow-inner">
        <div
          className={`h-full ${hpColor} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
        />
        {hasTemp && (
          <div
            className="absolute top-0 h-full bg-amber-500/30 rounded-full"
            style={{
              left: `${Math.min(100, hpRatio * 100)}%`,
              width: `${Math.min(100 - hpRatio * 100, ((character.temporaryHitPoints || 0) / character.hitPoints.max) * 100)}%`,
            }}
          />
        )}
      </div>

      {/* Quick Damage/Heal Keypad */}
      <div className="flex items-center gap-1.5 mt-2">
        {[
          { label: "-10", delta: -10, className: "bg-red-500/15 border-red-500/20 text-red-400 hover:bg-red-500/20" },
          { label: "-5", delta: -5, className: "bg-red-500/15 border-red-500/20 text-red-400 hover:bg-red-500/20" },
          { label: "-1", delta: -1, className: "bg-rose-500/10 border-rose-500/15 text-rose-400 hover:bg-rose-500/15" },
          { label: "+1", delta: 1, className: "bg-emerald-500/10 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15" },
          { label: "+5", delta: 5, className: "bg-emerald-500/15 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" },
          { label: "+10", delta: 10, className: "bg-emerald-500/15 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={() => onHpChange(btn.delta)}
            className={`flex-1 py-3.5 rounded-xl text-lg font-bold active:scale-95 transition-all duration-150 ${btn.className}`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Custom HP Input */}
      <div className="flex items-center gap-2 mt-2">
        <input
          type="number"
          value={hpInput}
          onChange={(e) => setHpInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onHpInput();
          }}
          placeholder="Custom HP amount (+/-)"
          className="flex-1 py-3 px-3 text-sm bg-obsidian-mid/60 border border-surface-700/30 rounded-xl text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
        />
        <button
          onClick={onHpInput}
          className="px-5 py-3 bg-gold-500/10 border border-gold/20 text-gold-400 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-150 hover:bg-gold-500/15"
        >
          Apply
        </button>
      </div>

      {/* Temp HP Section */}
      <div className="mt-2 pt-2 border-t border-surface-700/20">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Temporary HP</span>
          <span className="text-xs font-mono text-gold-300 tabular-nums">{character.temporaryHitPoints || 0}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "+1 THP", amount: 1 },
            { label: "+5 THP", amount: 5 },
            { label: "+10 THP", amount: 10 },
            { label: "Clear", amount: 0 },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => onSetTempHp(btn.amount)}
              className={`py-2 rounded-lg text-xs font-bold active:scale-90 transition-all duration-150 ${
                btn.amount === 0
                  ? "bg-surface-800/40 border border-surface-700/30 text-surface-500 hover:border-surface-600/40"
                  : "bg-gold-500/8 border border-gold/15 text-gold-400 hover:bg-gold-500/12"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rest & Recovery */}
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        <button
          onClick={onShortRest}
          className="py-2 rounded-xl bg-gold-500/8 border border-gold/15 text-gold-400 text-[10px] font-bold active:scale-95 transition-all duration-150 hover:bg-gold-500/12"
        >
          {"\uD83D\uDE34"} Short Rest
        </button>
        <button
          onClick={onLongRest}
          className="py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 text-[10px] font-bold active:scale-95 transition-all duration-150 hover:bg-emerald-500/12"
        >
          {"\uD83D\uDECC\u200D"} Long Rest
        </button>
        <button
          onClick={onQuickRest}
          className="py-2 rounded-xl bg-amber-500/8 border border-amber-500/15 text-amber-400 text-[10px] font-bold active:scale-95 transition-all duration-150 hover:bg-amber-500/12"
        >
          {"\u26A1"} Quick Rest
        </button>
      </div>
    </div>
  );
}
