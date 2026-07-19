/**
 * STᚱ VTT — Player Sheet Death Saves (Enhanced)
 *
 * Premium death saves interface with:
 * - Clickable success/failure circles (3 each)
 * - "Roll Death Save" auto-rolls one random save
 * - Stabilize button at 2 success/2 failure
 * - Visual death spiral progression
 * - Stabile/Dead status indicator
 * - All mutations → Zustand + Firestore
 */

import { useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
import { useHpMutations } from "@/hooks/useCharacterMutations";

interface PlayerSheetDeathSavesProps {
  character: PlayerCharacter;
  /** If true, applies hover/active glow effects for combat urgency */
  urgent?: boolean;
  /** Title display: "Death Saves" or compact */
  compact?: boolean;
  /** Show roll button */
  showRollButton?: boolean;
}

export default function PlayerSheetDeathSaves({
  character,
  urgent = false,
  compact = false,
  showRollButton = true,
}: PlayerSheetDeathSavesProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const { handleDeathSaveToggle, handleResetDeathSaves } = useHpMutations();
  const isAtZero = c.hitPoints.current <= 0;

  const { successes, failures } = c.deathSaves;
  const isStable = successes >= 3;
  const isDead = failures >= 3;
  const isRolling = successes === 0 && failures === 0;

  const deathStatus = useMemo(() => {
    if (isStable) return { label: "Stable", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" };
    if (isDead) return { label: "Dead", color: "text-red-400", bg: "bg-red-500/10 border-red-500/25" };
    if (successes === 2) return { label: "Near Stable", color: "text-green-400/60", bg: "bg-green-500/5 border-green-500/10" };
    if (failures === 2) return { label: "Near Death", color: "text-red-400/60", bg: "bg-red-500/5 border-red-500/15" };
    return { label: "Rolling", color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/15" };
  }, [successes, failures, isStable, isDead]);

  const handleDeathSaveClick = useCallback(
    (type: "success" | "failure") => {
      const ds = { ...c.deathSaves };
      if (type === "success") {
        ds.successes = Math.min(3, ds.successes + 1);
        if (ds.successes >= 3) { ds.successes = 0; ds.failures = 0; }
      } else {
        ds.failures = Math.min(3, ds.failures + 1);
        if (ds.failures >= 3) { ds.successes = 0; ds.failures = 0; }
      }
      updateCharacter(c.id, { deathSaves: ds });
    },
    [c, updateCharacter]
  );

  const handleStabilize = useCallback(() => {
    updateCharacter(c.id, { deathSaves: { successes: 0, failures: 0 } });
  }, [c.id, updateCharacter]);

  const handleRollDeathSave = useCallback(() => {
    const roll = Math.floor(Math.random() * 20) + 1;
    if (roll === 20) {
      // Revive with 1 HP
      handleDeathSaveToggle(c, "successes", 3);
      setTimeout(() => {
        updateCharacter(c.id, {
          hitPoints: { ...c.hitPoints, current: 1 },
          deathSaves: { successes: 0, failures: 0 },
        });
      }, 100);
    } else if (roll >= 10) {
      handleDeathSaveClick("success");
    } else if (roll === 1) {
      handleDeathSaveClick("failure");
      handleDeathSaveClick("failure");
    } else {
      handleDeathSaveClick("failure");
    }
  }, [c, handleDeathSaveClick, handleDeathSaveToggle, updateCharacter]);

  if (compact) {
    return (
      <div className={`flex items-center justify-between rounded-xl border p-2.5 transition-all duration-200 ${
        isAtZero ? "bg-red-500/5 border-red-500/15" : "bg-obsidian-mid/40 border-surface-700/20"
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-surface-400">Death Saves</span>
          <span className={`text-[10px] font-medium ${deathStatus.color}`}>{deathStatus.label}</span>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span key={`cs-${i}`} className={`w-4 h-4 rounded-full border flex items-center justify-center text-[7px] font-bold ${
              successes > i ? "bg-green-500/20 border-green-500/40 text-green-400" : "border-surface-600/30 text-surface-600"
            }`}>
              {successes > i ? "✓" : ""}
            </span>
          ))}
          <span className="w-[1px] h-3 bg-surface-700/40 mx-0.5" />
          {[0, 1, 2].map((i) => (
            <span key={`cf-${i}`} className={`w-4 h-4 rounded-full border flex items-center justify-center text-[7px] font-bold ${
              failures > i ? "bg-red-500/20 border-red-500/40 text-red-400" : "border-surface-600/30 text-surface-600"
            }`}>
              {failures > i ? "✕" : ""}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-3 transition-all duration-300 ${
      isAtZero
        ? deathStatus.bg + " " + (urgent ? "animate-pulse-soft shadow-[0_0_12px_rgba(239,68,68,0.08)]" : "")
        : "bg-obsidian-mid/40 border-surface-700/20"
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Death Saves</span>
          {(successes > 0 || failures > 0) && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${deathStatus.bg} ${deathStatus.color}`}>
              {deathStatus.label}
            </span>
          )}
        </div>
        <button
          onClick={() => handleResetDeathSaves(c)}
          className="text-[9px] text-surface-500 hover:text-gold-400 transition-colors px-1.5 py-0.5 rounded border border-surface-700/30 hover:border-gold/20"
        >Reset</button>
      </div>

      {/* Death spiral circles */}
      <div className="flex items-center justify-center gap-6">
        {/* Successes */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] uppercase tracking-wider text-green-500/60 font-semibold">Saved</span>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <button
                key={`s-${i}`}
                onClick={() => handleDeathSaveClick("success")}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-all duration-200 ${
                  successes > i
                    ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.15)]"
                    : "bg-obsidian-mid/60 border-surface-600/30 text-surface-500 hover:border-green-500/30 hover:bg-green-500/5"
                } ${urgent && isAtZero ? "hover:shadow-[0_0_6px_rgba(34,197,94,0.1)]" : ""}`}
              >
                {successes > i ? "✓" : "○"}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[6px] text-surface-600 uppercase tracking-widest">VS</span>
          <span className="w-[1px] h-8 bg-gradient-to-b from-transparent via-surface-600/40 to-transparent" />
        </div>

        {/* Failures */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] uppercase tracking-wider text-red-400/60 font-semibold">Failed</span>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <button
                key={`f-${i}`}
                onClick={() => handleDeathSaveClick("failure")}
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-all duration-200 ${
                  failures > i
                    ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
                    : "bg-obsidian-mid/60 border-surface-600/30 text-surface-500 hover:border-red-500/30 hover:bg-red-500/5"
                } ${urgent && isAtZero ? "hover:shadow-[0_0_6px_rgba(239,68,68,0.1)]" : ""}`}
              >
                {failures > i ? "✕" : "○"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons row */}
      {showRollButton && (
        <div className="flex items-center justify-center gap-2 mt-2.5">
          <button
            onClick={handleRollDeathSave}
            disabled={isStable || isDead}
            className="px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold/15 text-gold-400 text-[10px] font-semibold active:scale-90 transition-all duration-150 hover:bg-gold-500/15 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            🎲 Roll Death Save
          </button>
          <button
            onClick={handleStabilize}
            disabled={isStable || isDead}
            className="px-3 py-1.5 rounded-lg bg-green-500/8 border border-green-500/15 text-green-400 text-[10px] font-semibold active:scale-90 transition-all duration-150 hover:bg-green-500/12 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ❤️ Stabilize
          </button>
        </div>
      )}

      {/* Status message */}
      {isStable && (
        <p className="text-center text-[10px] text-green-400 mt-2">✓ Stabilized at 0 HP</p>
      )}
      {isDead && (
        <p className="text-center text-[10px] text-red-400 mt-2">✕ Three failed saves — Character is dead</p>
      )}
      {isRolling && isAtZero && (
        <p className="text-center text-[10px] text-surface-500 mt-2">Click circles to record saves, or Roll Death Save</p>
      )}
    </div>
  );
}
