/**
 * STᚱ VTT — Player Sheet HP Section
 *
 * Heavy-combat HP management block for the Combat tab.
 * Larger touch targets (49px) for tabletop split-second decisions.
 * All mutations route through useCharacterMutations → Zustand + Firestore.
 *
 * Refactored Cycle 1: centralized mutation hook for real-time sync.
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { useHpMutations, useSpellSlotMutations } from "@/hooks/useCharacterMutations";

interface PlayerSheetHpSectionProps {
  character: PlayerCharacter;
}

export default function PlayerSheetHpSection({ character }: PlayerSheetHpSectionProps) {
  const c = character;
  const [hpInput, setHpInput] = useState("");

  const { handleHpChange, handleSetTempHp, handleDeathSaveToggle, handleResetDeathSaves } = useHpMutations();
  const { handleRestoreSlots } = useSpellSlotMutations();

  const onHpChange = useCallback(
    (delta: number) => handleHpChange(c, delta),
    [c, handleHpChange]
  );

  const onHpInput = useCallback(() => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val)) return;
    onHpChange(val);
    setHpInput("");
  }, [hpInput, onHpChange]);

  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
  const hpColor = hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";
  const hasTemp = (c.temporaryHitPoints || 0) > 0;
  const isAtZero = c.hitPoints.current <= 0;

  return (
    <div>
      {/* HP Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Hit Points</span>
        <span className="text-sm font-mono font-bold tabular-nums text-gold-300">
          {c.hitPoints.current}
          <span className="text-surface-500 font-normal">/{c.hitPoints.max}</span>
          {hasTemp && <span className="text-gold-400 text-xs ml-1">+{c.temporaryHitPoints} tmp</span>}
        </span>
      </div>

      {/* HP Bar */}
      <div className="h-4 bg-surface-700/60 rounded-full overflow-hidden relative shadow-inner">
        <div className={`h-full ${hpColor} rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, hpRatio * 100)}%` }} />
        {hasTemp && (
          <div className="absolute top-0 h-full bg-gold-500/30 rounded-full"
            style={{
              left: `${Math.min(100, hpRatio * 100)}%`,
              width: `${Math.min(100 - hpRatio * 100, ((c.temporaryHitPoints || 0) / c.hitPoints.max) * 100)}%`,
            }}
          />
        )}
      </div>

      {/* Quick Damage/Heal Buttons */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        <button onClick={() => onHpChange(-10)} className="py-3.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/20">-10</button>
        <button onClick={() => onHpChange(-5)} className="py-3.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/20">-5</button>
        <button onClick={() => onHpChange(5)} className="py-3.5 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-green-500/20">+5</button>
        <button onClick={() => onHpChange(10)} className="py-3.5 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-green-500/20">+10</button>
      </div>

      {/* Custom Input */}
      <div className="flex items-center gap-2 mt-3">
        <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onHpInput(); }}
          placeholder="Custom amount (+/-)"
          className="flex-1 py-3 px-3 text-sm bg-obsidian-mid/60 border border-surface-700/30 rounded-xl text-surface-200 placeholder-surface-500 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all" />
        <button onClick={onHpInput}
          className="px-5 py-3 bg-gold-500/10 border border-gold/20 text-gold-400 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-150 hover:bg-gold-500/15">
          Apply
        </button>
      </div>

      {/* Temp HP Section */}
      <div className="mt-3 pt-3 border-t border-surface-700/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Temporary HP</span>
          <span className="text-xs font-mono text-gold-300">{c.temporaryHitPoints || 0}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 5, 10].map((amount) => (
            <button
              key={`tmp-${amount}`}
              onClick={() => handleSetTempHp(c, amount + (c.temporaryHitPoints || 0))}
              className="py-2 rounded-lg bg-gold-500/8 border border-gold/15 text-gold-400 text-xs font-bold active:scale-90 transition-all duration-150 hover:bg-gold-500/12"
            >+{amount} THP</button>
          ))}
        </div>
        <button
          onClick={() => handleSetTempHp(c, 0)}
          className="w-full mt-1.5 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/30 text-surface-500 text-[10px] font-medium active:scale-90 transition-all duration-150 hover:border-surface-600/40"
        >Clear Temp HP</button>
      </div>

      {/* ── DEATH SAVES ── Only when HP = 0 */}
      {isAtZero && (
        <div className="mt-3 pt-3 border-t border-red-500/15 animate-slide-in-up">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-widest font-black text-red-400/80">Death Saves</span>
            <button
              onClick={() => handleResetDeathSaves(c)}
              className="text-[9px] text-surface-500 hover:text-gold-400 transition-colors px-1.5 py-0.5 rounded border border-surface-700/30 hover:border-gold/20"
            >Reset</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[8px] uppercase tracking-wider text-green-500/60 block mb-0.5">Successes</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <button
                    key={`s-${i}`}
                    onClick={() => handleDeathSaveToggle(c, "successes", i)}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 active:scale-90 ${
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
                    onClick={() => handleDeathSaveToggle(c, "failures", i)}
                    className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 active:scale-90 ${
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
      )}

      {/* Short Rest Quick Action — restore HP and spell slots */}
      <div className="mt-3 pt-3 border-t border-surface-700/20">
        <button
          onClick={() => {
            // Short rest: heal up to half max, restore some slots
            const halfMax = Math.floor(c.hitPoints.max / 2);
            const shortRestHp = Math.min(c.hitPoints.max, c.hitPoints.current + halfMax);
            handleHpChange(c, shortRestHp - c.hitPoints.current);
          }}
          className="w-full py-2.5 rounded-xl bg-gold-500/8 border border-gold/15 text-gold-400 text-xs font-semibold active:scale-95 transition-all duration-150 hover:bg-gold-500/12"
        >
          🛏 Short Rest (heal ½ max HP)
        </button>
      </div>
    </div>
  );
}
