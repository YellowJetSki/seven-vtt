/**
 * STᚱ VTT — Session Timer (DM War Room)
 *
 * Live session timer showing elapsed time, current phase,
 * and Start/Pause/End session controls.
 * 
 * Critical for DM pacing during a live game:
 * - Know exactly how long the session has been running
 * - Set the current phase (exploration/combat/rest/social)
 * - Start/Pause/End the session timer
 */

import { useState, useEffect, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import type { LiveSessionState } from "@/types";

const PHASES = ["exploration", "combat", "rest", "social"] as const;
const PHASE_LABELS: Record<string, string> = {
  exploration: "Exploration",
  combat: "⚔ Combat",
  rest: "🏕 Rest",
  social: "💬 Social",
};
const PHASE_COLORS: Record<string, string> = {
  exploration: "text-emerald-400",
  combat: "text-red-400",
  rest: "text-amber-400",
  social: "text-sky-400",
};
const PHASE_BG: Record<string, string> = {
  exploration: "bg-emerald-500/10 border-emerald-500/15",
  combat: "bg-red-500/10 border-red-500/15",
  rest: "bg-amber-500/10 border-amber-500/15",
  social: "bg-sky-500/10 border-sky-500/15",
};

export default function SessionTimer() {
  const liveSession = useCombatStore((s) => s.liveSession) as LiveSessionState;
  const setSession = useCombatStore((s) => s.setSession);
  const startSession = useCombatStore((s) => s.startSession);
  const endSession = useCombatStore((s) => s.endSession);

  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Update elapsed time every second when session is running
  useEffect(() => {
    if (!liveSession.sessionStartedAt) {
      setElapsed(0);
      setIsActive(false);
      return;
    }

    setIsActive(true);

    const tick = () => {
      const now = Date.now();
      const diff = Math.floor((now - liveSession.sessionStartedAt!) / 1000);
      setElapsed(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [liveSession.sessionStartedAt]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handlePhaseChange = useCallback(
    (phase: string) => {
      setSession({ phase: phase as LiveSessionState["phase"] });
    },
    [setSession]
  );

  return (
    <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-sm">⏱</span>
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
            Session Timer
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {!liveSession.sessionStartedAt ? (
            <button
              onClick={startSession}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 active:scale-95 transition-all duration-150"
            >
              ▶ Start
            </button>
          ) : (
            <button
              onClick={endSession}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 active:scale-95 transition-all duration-150"
            >
              ■ End
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Timer display */}
        <div className="text-center">
          <span className="text-3xl font-mono font-bold tracking-wider tabular-nums text-white/90 drop-shadow-[0_0_8px_rgba(255,255,255,0.05)]">
            {isActive ? formatTime(elapsed) : "--:--:--"}
          </span>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse-soft" : "bg-surface-600"
              }`}
            />
            <span className="text-[10px] text-surface-500">
              {isActive ? "Session running" : "No active session"}
            </span>
          </div>
        </div>

        {/* Phase selector chips */}
        <div>
          <label className="text-[9px] uppercase tracking-widest text-surface-500 font-medium mb-1.5 block">
            Current Phase
          </label>
          <div className="flex gap-1.5">
            {PHASES.map((phase) => (
              <button
                key={phase}
                onClick={() => handlePhaseChange(phase)}
                className={`
                  flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 border active:scale-95
                  ${liveSession.phase === phase
                    ? `${PHASE_BG[phase]} ${PHASE_COLORS[phase]}`
                    : "bg-[#0c0d15] border-white/[0.04] text-surface-500 hover:text-surface-300 hover:border-white/[0.08]"
                  }
                `}
              >
                {PHASE_LABELS[phase]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
