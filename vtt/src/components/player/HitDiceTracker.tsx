/**
 * STᚱ VTT — Hit Dice Tracker
 *
 * Visual Hit Dice management component.
 * Shows each remaining HD as an individual die icon,
 * with click-to-spend and click-to-recover functionality.
 *
 * Premium design: glass gradient background, dice animations,
 * color-coded by remaining/count, tactile feedback.
 *
 * Usage:
 *   <HitDiceTracker
 *     hitDie="1d10"
 *     total={5}
 *     spent={2}
 *     onSpend={(count) => spendHd(count)}
 *     onRecover={(count) => recoverHd(count)}
 *   />
 */

import { useState, useCallback } from "react";

interface HitDiceTrackerProps {
  /** Hit die type (e.g. "1d8", "1d10", "1d12") */
  hitDie: string;
  /** Maximum hit dice available (usually = level) */
  total: number;
  /** How many have been spent */
  spent: number;
  /** Called when player spends hit dice */
  onSpend?: (count: number) => void;
  /** Called when player recovers hit dice */
  onRecover?: (count: number) => void;
  /** Maximum recoverable per long rest */
  maxRecover?: number;
  className?: string;
  /** Compact mode for sidebar use */
  compact?: boolean;
}

const HIT_DIE_COLORS: Record<string, string> = {
  "1d6": "from-sky-500/20 to-sky-600/10 border-sky-500/20 text-sky-400",
  "1d8": "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
  "1d10": "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400",
  "1d12": "from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400",
};

const HIT_DIE_ICONS: Record<string, string> = {
  "1d6": "▣", "1d8": "◆", "1d10": "⬟", "1d12": "⬡",
};

export default function HitDiceTracker({
  hitDie = "1d8",
  total = 1,
  spent = 0,
  onSpend,
  onRecover,
  maxRecover: maxRecoverProp,
  className = "",
  compact = false,
}: HitDiceTrackerProps) {
  const [animatingDie, setAnimatingDie] = useState<number | null>(null);
  const remaining = Math.max(0, total - spent);
  const dieColor = HIT_DIE_COLORS[hitDie] || HIT_DIE_COLORS["1d8"];
  const dieIcon = HIT_DIE_ICONS[hitDie] || "◆";
  const maxRecover = maxRecoverProp ?? Math.max(1, Math.floor(total / 2));

  const percentage = total > 0 ? (remaining / total) * 100 : 0;

  const handleSpend = useCallback(() => {
    if (remaining <= 0) return;
    onSpend?.(1);
    setAnimatingDie(remaining - 1);
    setTimeout(() => setAnimatingDie(null), 400);
  }, [remaining, onSpend]);

  const handleRecover = useCallback(() => {
    if (spent <= 0) return;
    const canRecover = Math.min(spent, maxRecover);
    onRecover?.(canRecover);
  }, [spent, maxRecover, onRecover]);

  const handleFullRecover = useCallback(() => {
    if (spent <= 0) return;
    onRecover?.(spent);
  }, [spent, onRecover]);

  // Compact mode: single row with HD count + buttons
  if (compact) {
    return (
      <div className={`flex items-center justify-between py-1 px-2 rounded-lg bg-[#0c0d15] border border-white/[0.04] ${className}`}>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-black tabular-nums ${
            remaining <= 0 ? "text-rose-400" : remaining <= Math.ceil(total / 2) ? "text-amber-400" : "text-gold-400"
          }`}>
            {remaining}
          </span>
          <span className="text-[9px] text-surface-500">/</span>
          <span className="text-[9px] text-surface-500">{total}</span>
          <span className="text-[11px] font-medium text-surface-500">{hitDie}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSpend}
            disabled={remaining <= 0}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
            title="Spend HD"
          >−</button>
          <button
            onClick={handleRecover}
            disabled={spent <= 0}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[9px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
            title={`Recover up to ${maxRecover} HD`}
          >+</button>
        </div>
      </div>
    );
  }

  // Full mode: dice icons + progress
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-black tabular-nums ${
            remaining <= 0 ? "text-rose-400" : remaining <= Math.ceil(total / 2) ? "text-amber-400" : "text-gold-400"
          }`}>
            {remaining}
          </span>
          <span className="text-[11px] text-surface-500">/ {total}</span>
          <span className={`text-[13px] px-1.5 py-0.5 rounded-md border font-mono font-bold ${dieColor}`}>
            {hitDie}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSpend}
            disabled={remaining <= 0}
            className="px-2.5 py-1 rounded-lg text-[9px] font-semibold bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Spend 1
          </button>
          <button
            onClick={handleRecover}
            disabled={spent <= 0}
            className="px-2.5 py-1 rounded-lg text-[9px] font-semibold bg-gold-500/10 border border-gold-500/15 text-gold-400 hover:bg-gold-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Recover ({maxRecover})
          </button>
          <button
            onClick={handleFullRecover}
            disabled={spent <= 0}
            className="px-2.5 py-1 rounded-lg text-[9px] font-semibold bg-gold-500/10 bg-gold-500/10 text-gold-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            title="Full rest: recover all HD"
          >
            Full Rest
          </button>
        </div>
      </div>

      {/* Dice icons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: total }, (_, i) => {
          const isSpent = i < spent;
          return (
            <div
              key={i}
              className={`
                relative w-8 h-8 flex items-center justify-center rounded-lg
                border transition-all duration-300
                ${isSpent
                  ? "border-white/[0.04] text-surface-600 bg-white/[0.02] opacity-50"
                  : `${dieColor} bg-gradient-to-br shadow-sm`
                }
                ${animatingDie === i ? "scale-125 animate-pulse" : ""}
                ${!isSpent ? "hover:scale-110 hover:shadow-[0_0_8px_rgba(234,179,8,0.15)]" : ""}
              `}
            >
              <span className={`text-[12px] font-black ${isSpent ? "line-through" : ""}`}>
                {dieIcon}
              </span>
              {/* Spent overlay */}
              {isSpent && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] text-surface-600">✕</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[7px] text-surface-600">
        Recovers up to {maxRecover} per long rest · Spend during short rests to regain HP
      </p>
    </div>
  );
}
