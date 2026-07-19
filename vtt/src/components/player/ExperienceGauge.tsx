/**
 * STᚱ VTT — Experience Gauge
 *
 * Premium XP display with gradient progression bar.
 * Used across both player sheet and DM card.
 *
 * Features:
 * - Animated gradient bar from gold to amber
 * - Level badge
 * - XP to next level display
 * - Tappable to expand quick-add presets
 * - Expandable XP controls (player sheet context)
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";

interface ExperienceGaugeProps {
  character: PlayerCharacter;
  onAddXp?: (amount: number) => void;
  expandable?: boolean;
}

export default function ExperienceGauge({
  character: c,
  onAddXp,
  expandable = false,
}: ExperienceGaugeProps) {
  const [showControls, setShowControls] = useState(false);
  const [xpInput, setXpInput] = useState("");

  const xpForNext = c.level < 20 ? c.level * 1000 : 0;
  const xpProgress = c.level < 20 ? Math.min(100, (c.experiencePoints / xpForNext) * 100) : 100;
  const xpToNext = Math.max(0, xpForNext - c.experiencePoints);

  const handleXpInput = useCallback(() => {
    if (!onAddXp) return;
    const val = parseInt(xpInput, 10);
    if (isNaN(val) || val <= 0) return;
    onAddXp(val);
    setXpInput("");
  }, [xpInput, onAddXp]);

  return (
    <div className="w-full">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {expandable ? (
            <button
              onClick={() => setShowControls(!showControls)}
              className="text-[10px] uppercase tracking-widest font-black text-amber-400/70 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>✦ XP</span>
              <span className={`text-[8px] transition-transform duration-200 ${showControls ? "rotate-180" : ""}`}>▼</span>
            </button>
          ) : (
            <span className="text-[10px] uppercase tracking-widest font-black text-amber-400/60">XP</span>
          )}
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-700/40 text-surface-300 border border-surface-600/20">
            Lv.{c.level}
          </span>
        </div>
        <span className="text-sm font-mono font-bold text-amber-300 tabular-nums">
          {c.experiencePoints.toLocaleString()}
        </span>
      </div>

      {/* XP bar */}
      {c.level < 20 && (
        <div className="h-2 bg-surface-700/50 rounded-full overflow-hidden shadow-inner mb-1">
          <div
            className="h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      )}

      {/* Label row */}
      <div className="flex items-center justify-between">
        {c.level < 20 ? (
          <>
            <span className="text-[9px] text-surface-500">
              {xpToNext.toLocaleString()} XP to next level
            </span>
            <span className="text-[9px] text-surface-500 font-mono">
              {Math.round(xpProgress)}%
            </span>
          </>
        ) : (
          <span className="text-[9px] text-gold-400 font-semibold">✦ MAX LEVEL</span>
        )}
      </div>

      {/* Expandable controls */}
      {expandable && showControls && onAddXp && (
        <div className="animate-slide-in-up mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onAddXp(50)}
              className="flex-1 py-2 rounded-lg bg-gold-500/10 border border-gold/15 text-gold-400 text-xs font-bold active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
            >+50 XP</button>
            <button
              onClick={() => onAddXp(100)}
              className="flex-1 py-2 rounded-lg bg-gold-500/12 border border-gold/15 text-gold-400/90 text-xs font-bold active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
            >+100 XP</button>
            <button
              onClick={() => onAddXp(250)}
              className="flex-1 py-2 rounded-lg bg-gold-500/8 border border-gold/10 text-gold-300/80 text-xs font-bold active:scale-90 transition-all duration-150 hover:bg-gold-500/12"
            >+250 XP</button>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={xpInput}
              onChange={(e) => setXpInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleXpInput(); }}
              placeholder="Custom XP amount"
              className="flex-1 py-2.5 px-2 text-[11px] bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
            />
            <button
              onClick={handleXpInput}
              className="px-5 py-2.5 bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold rounded-lg active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
            >Add XP</button>
          </div>
        </div>
      )}
    </div>
  );
}
