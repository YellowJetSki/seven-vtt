/**
 * STᚱ VTT — Player Sheet Persistent HP Bar
 *
 * Renders BELOW the header and ABOVE the tab content on ALL tabs.
 * Always visible so players can adjust HP without leaving their current view.
 * Increments: -1, -5, +5, +1 (replaced -10/+10 with -1/+1 for finesse healing/damage).
 * Custom input field remains for any value.
 * Death Saves render inline ONLY when HP is 0.
 *
 * Refactored Cycle 1: All mutations route through useCharacterMutations
 * hook → Zustand (instant) + Firestore (real-time sync).
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { useHpMutations } from "@/hooks/useCharacterMutations";

interface PlayerSheetHpPersistentProps {
  character: PlayerCharacter;
}

export default function PlayerSheetHpPersistent({ character }: PlayerSheetHpPersistentProps) {
  const c = character;
  const [hpInput, setHpInput] = useState("");

  const { handleHpChange, handleDeathSaveToggle, handleResetDeathSaves } = useHpMutations();

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

  const onDeathSaveToggle = useCallback(
    (type: "successes" | "failures", index: number) => handleDeathSaveToggle(c, type, index),
    [c, handleDeathSaveToggle]
  );

  const onResetDeathSaves = useCallback(
    () => handleResetDeathSaves(c),
    [c, handleResetDeathSaves]
  );

  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
  const hasTemp = (c.temporaryHitPoints || 0) > 0;
  const isAtZero = c.hitPoints.current <= 0;
  const isDead = isAtZero && c.deathSaves.failures >= 3;
  const hpColor = isAtZero ? "bg-surface-600" : hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="shrink-0 px-3 py-2 border-b border-gold/5 bg-obsidian/60 backdrop-blur-sm">
      {/* Main HP Row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">HP</span>
        <span className="text-xs font-mono font-bold tabular-nums text-gold-300">
          {isAtZero ? (
            <span className="text-surface-500 italic">0</span>
          ) : (
            c.hitPoints.current
          )}
          <span className="text-surface-500 font-normal">/{c.hitPoints.max}</span>
          {hasTemp && <span className="text-gold-400 text-[10px] ml-1">+{c.temporaryHitPoints} tmp</span>}
        </span>
      </div>

      {/* HP Bar */}
      <div className="h-2.5 bg-surface-700/60 rounded-full overflow-hidden relative shadow-inner">
        <div
          className={`h-full ${hpColor} rounded-full transition-all duration-500 ${isDead ? "animate-pulse-soft" : ""}`}
          style={{ width: `${isAtZero ? 0 : Math.max(0, hpRatio * 100)}%` }}
        />
        {hasTemp && c.hitPoints.current > 0 && (
          <div
            className="absolute top-0 h-full bg-gold-500/30 rounded-full transition-all duration-500"
            style={{
              left: `${Math.min(100, hpRatio * 100)}%`,
              width: `${Math.min(100 - hpRatio * 100, ((c.temporaryHitPoints || 0) / c.hitPoints.max) * 100)}%`,
            }}
          />
        )}
      </div>

      {/* HP Controls */}
      <div className="grid grid-cols-4 gap-1.5 mt-1.5">
        <button onClick={() => onHpChange(-1)}
          className="py-1.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-sm font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/20">-1</button>
        <button onClick={() => onHpChange(-5)}
          className="py-1.5 rounded-lg bg-red-500/12 border border-red-500/15 text-red-400/80 text-sm font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/15">-5</button>
        <button onClick={() => onHpChange(5)}
          className="py-1.5 rounded-lg bg-green-500/12 border border-green-500/15 text-green-400/80 text-sm font-bold active:scale-95 transition-all duration-150 hover:bg-green-500/15">+5</button>
        <button onClick={() => onHpChange(1)}
          className="py-1.5 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-sm font-bold active:scale-95 transition-all duration-150 hover:bg-green-500/20">+1</button>
      </div>

      {/* Custom input row */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onHpInput(); }}
          placeholder="Custom (+/-)"
          className="flex-1 py-1.5 px-2 text-[11px] bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all" />
        <button onClick={onHpInput}
          className="px-3 py-1.5 bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold rounded-lg active:scale-95 transition-all duration-150 hover:bg-gold-500/15">Apply</button>
      </div>

      {/* ── DEATH SAVES ── Only when HP = 0 */}
      {isAtZero && (
        <div className="mt-2 pt-2 border-t border-red-500/15 animate-slide-in-up">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-widest font-black text-red-400/80">Death Saves</span>
              {isDead && (
                <span className="text-[9px] uppercase font-bold text-red-400 animate-pulse-soft">☠ DEAD</span>
              )}
            </div>
            <button onClick={onResetDeathSaves}
              className="text-[9px] text-surface-500 hover:text-gold-400 transition-colors px-1.5 py-0.5 rounded border border-surface-700/30 hover:border-gold/20">Reset</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-[8px] uppercase tracking-wider text-green-500/60 block mb-0.5">Successes</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <button key={`s-${i}`} onClick={() => onDeathSaveToggle("successes", i)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-90 ${
                      c.deathSaves.successes > i
                        ? "bg-green-500/20 border-green-500/50 text-green-400"
                        : "bg-obsidian-mid/60 border-surface-700/30 text-surface-600 hover:border-green-500/30"
                    }`}>
                    {c.deathSaves.successes > i ? "✓" : "○"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-[8px] uppercase tracking-wider text-red-400/60 block mb-0.5">Failures</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <button key={`f-${i}`} onClick={() => onDeathSaveToggle("failures", i)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-90 ${
                      c.deathSaves.failures > i
                        ? "bg-red-500/20 border-red-500/50 text-red-400"
                        : "bg-obsidian-mid/60 border-surface-700/30 text-surface-600 hover:border-red-500/30"
                    }`}>
                    {c.deathSaves.failures > i ? "✕" : "○"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
