/**
 * STᚱ VTT — Initiative Header (DM Combat Command)
 *
 * Gold-accented title bar with:
 * - Combatant count badge
 * - Round display with turn timer
 * - Sort toggle (initiative desc / group by type)
 * - Combat flow controls (Start / Pause / Resume / End)
 */

import { useEffect, useState, useCallback } from "react";

interface InitiativeHeaderProps {
  combatantCount: number;
  round: number;
  turnStartedAt: number | null;
  phase: "prep" | "active" | "completed";
  isPaused: boolean;
  onStartCombat: () => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onEndCombat: () => void;
  onPauseCombat: () => void;
  onResumeCombat: () => void;
  sortMode: "initiative" | "grouped";
  onToggleSort: () => void;
}

export default function InitiativeHeader({
  combatantCount,
  round,
  turnStartedAt,
  phase,
  isPaused,
  onStartCombat,
  onNextTurn,
  onPrevTurn,
  onEndCombat,
  onPauseCombat,
  onResumeCombat,
  sortMode,
  onToggleSort,
}: InitiativeHeaderProps) {
  const [turnTime, setTurnTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);

  // Turn timer — updates every second during active combat
  useEffect(() => {
    if (phase !== "active" || isPaused || !turnStartedAt) {
      setTurnTime(0);
      return;
    }

    const tick = () => {
      setTurnTime(Math.floor((Date.now() - turnStartedAt) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase, isPaused, turnStartedAt]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const isActive = phase === "active" && !isPaused;

  return (
    <div className="shrink-0">
      {/* ── Combat Flow Controls ── */}
      <div className="flex items-center gap-1 px-2 pt-2 pb-1">
        {phase === "prep" && (
          <button
            onClick={onStartCombat}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 border border-red-500/15 text-red-400 hover:bg-red-500/15 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1"
          >
            <span>▶</span> Start Combat
          </button>
        )}

        {phase === "active" && (
          <>
            <button
              onClick={onPrevTurn}
              className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-surface-400 hover:text-white/80 hover:bg-white/[0.06] active:scale-95 transition-all duration-150"
              title="Previous turn"
            >
              ◀
            </button>

            <button
              onClick={isPaused ? onResumeCombat : onPauseCombat}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold border active:scale-95 transition-all duration-150 ${
                isPaused
                  ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15"
                  : "bg-amber-500/10 border-amber-500/15 text-amber-400 hover:bg-amber-500/15"
              }`}
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>

            <button
              onClick={onNextTurn}
              disabled={isPaused}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold-500/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              End Turn <span className="text-xs">→</span>
            </button>

            <button
              onClick={onEndCombat}
              className="px-2 py-1.5 rounded-lg text-[10px] font-semibold bg-surface-800/50 border border-white/[0.06] text-surface-500 hover:text-red-400 hover:border-red-500/15 active:scale-95 transition-all duration-150"
              title="End combat"
            >
              ✕
            </button>
          </>
        )}

        {phase === "completed" && (
          <span className="flex-1 text-center text-[10px] text-surface-500 italic py-1">
            Combat ended
          </span>
        )}
      </div>

      {/* ── Header Bar ── */}
      <div className="panel-header flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="panel-header-title">Initiative</span>
          <span className="text-[10px] text-gold-400 bg-gold-500/10 border border-gold/15 px-1.5 py-0.5 rounded-full">
            {combatantCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Round info */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gold-400/60 uppercase tracking-wider">
              R{round || 1}
            </span>

            {/* Turn timer — only show during active combat */}
            {isActive && turnTime > 0 && (
              <span className={`text-[10px] font-mono tabular-nums ${
                turnTime > 120 ? "text-red-400" : turnTime > 60 ? "text-amber-400" : "text-surface-400"
              }`}>
                {formatTime(turnTime)}
              </span>
            )}
          </div>

          {/* Sort toggle */}
          <button
            onClick={onToggleSort}
            className="text-[10px] px-1.5 py-0.5 rounded border border-white/[0.06] text-surface-500 hover:text-surface-300 hover:border-white/[0.1] active:scale-95 transition-all duration-150"
            title={`Sort by ${sortMode === "initiative" ? "group" : "initiative"}`}
          >
            {sortMode === "initiative" ? "⇅ Init" : "⇅ Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
