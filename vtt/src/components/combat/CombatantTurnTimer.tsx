/* ── Combatant Turn Timer ──────────────────────────────────────
 * Per-combatant chess clock timer that tracks the elapsed time
 * of the current turn. Resets when the turn advances.
 *
 * ── Features ─────────────────────────────────────────────────
 * • Real-time elapsed counter (seconds)
 * • Color coding: green (< 30s), yellow (< 60s), red (60s+)
 * • Pause-aware
 * • Compact inline display
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef } from "react";

interface CombatantTurnTimerProps {
  /** Timestamp (ms) when the current turn started */
  turnStartedAt: number | null;
  /** Whether combat is paused */
  isPaused: boolean;
  /** Compact mode for inline display */
  compact?: boolean;
}

export function CombatantTurnTimer({
  turnStartedAt,
  isPaused,
  compact = false,
}: CombatantTurnTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const accumulatedRef = useRef(0);

  useEffect(() => {
    if (!turnStartedAt || isPaused) {
      setElapsed(accumulatedRef.current);
      return;
    }

    const interval = setInterval(() => {
      if (turnStartedAt) {
        const delta = Math.floor((Date.now() - turnStartedAt) / 1000);
        setElapsed(delta);
      }
    }, 250); // Update 4x/sec for smooth display

    return () => {
      clearInterval(interval);
      if (turnStartedAt) {
        accumulatedRef.current = Math.floor((Date.now() - turnStartedAt) / 1000);
      }
    };
  }, [turnStartedAt, isPaused]);

  // Reset when turnStartedAt changes to a new value
  useEffect(() => {
    accumulatedRef.current = 0;
    setElapsed(0);
  }, [turnStartedAt]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  // Color coding
  const getColor = () => {
    if (elapsed >= 60) return "text-warrior-400";
    if (elapsed >= 30) return "text-divine-400";
    return "text-rogue-400";
  };

  if (compact) {
    return (
      <span className={`font-mono text-[11px] font-bold ${getColor()}`}>
        {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}s`}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-mono text-xs font-bold ${getColor()}`}>
        {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
      </span>
      {elapsed >= 30 && (
        <span className="text-[10px] text-surface-500">⏰</span>
      )}
      {isPaused && (
        <span className="text-[10px] text-surface-500">⏸</span>
      )}
    </div>
  );
}
