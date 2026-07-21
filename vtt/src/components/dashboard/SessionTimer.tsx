/**
 * STᚱ VTT — Session Timer (Premium Chronograph Design)
 *
 * Live session timer with premium chronograph aesthetic:
 * - Large monospace time display with subtle glow
 * - Animated running dot indicator
 * - Phase selector with color-coded glass pills
 * - Start/End buttons with hover depth
 * - Edge light and ambient glow on active state
 *
 * Design inspiration: Premium chronograph watches (IWC, Omega)
 * with a dark dial, luminous hands, and subtle sub-dials.
 */

import { useState, useEffect, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import DashboardPanel from "@/components/ui/DashboardPanel";
import type { LiveSessionState } from "@/types";

const PHASES = ["exploration", "combat", "rest", "social"] as const;

const PHASE_CONFIG: Record<string, { label: string; icon: string; color: string; border: string; bg: string }> = {
  exploration: {
    label: "Explore",
    icon: "🧭",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
  },
  combat: {
    label: "Combat",
    icon: "⚔",
    color: "text-red-400",
    border: "border-red-500/20",
    bg: "bg-red-500/10",
  },
  rest: {
    label: "Rest",
    icon: "🏕",
    color: "text-amber-400",
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
  },
  social: {
    label: "Social",
    icon: "💬",
    color: "text-sky-400",
    border: "border-sky-500/20",
    bg: "bg-sky-500/10",
  },
};

export default function SessionTimer() {
  const liveSession = useCombatStore((s) => s.liveSession) as LiveSessionState;
  const setSession = useCombatStore((s) => s.setSession);
  const startSession = useCombatStore((s) => s.startSession);
  const endSession = useCombatStore((s) => s.endSession);

  const [elapsed, setElapsed] = useState(0);
  const isActive = liveSession.sessionStartedAt != null && liveSession.sessionStartedAt > 0;

  // Update elapsed time every second when session is running
  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = Math.floor((now - liveSession.sessionStartedAt!) / 1000);
      setElapsed(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, liveSession.sessionStartedAt]);

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

  const currentPhase = liveSession.phase || "exploration";
  const phaseCfg = PHASE_CONFIG[currentPhase] || PHASE_CONFIG.exploration;

  return (
    <DashboardPanel
      icon="⏱"
      title="Session Timer"
      action={
        <div className="flex items-center gap-1.5">
          {!isActive ? (
            <button
              onClick={startSession}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:shadow-[0_0_12px_rgba(52,211,153,0.1)] active:scale-95 transition-all duration-150"
            >
              ▶ Start
            </button>
          ) : (
            <button
              onClick={endSession}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 hover:shadow-[0_0_12px_rgba(239,68,68,0.1)] active:scale-95 transition-all duration-150"
            >
              ■ End
            </button>
          )}
        </div>
      }
    >
          {/* ── Timer display (chronograph dial) ── */}
          <div className="relative text-center py-2">
            {/* Subtle dial glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.02] to-transparent rounded-lg" />

            <span
              className="text-4xl font-mono font-bold tracking-[0.05em] tabular-nums text-white/90 drop-shadow-[0_0_12px_rgba(255,255,255,0.06)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {isActive ? formatTime(elapsed) : "--:--:--"}
            </span>

            {/* Status row */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? "bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "bg-surface-600"
                }`}
              />
              <span className="text-[10px] text-surface-500">
                {isActive ? "Session running" : "No active session"}
              </span>
            </div>
          </div>

          {/* ── Phase selector ── */}
          <div>
            <label className="text-[9px] uppercase tracking-widest text-surface-500 font-medium mb-2 block">
              Current Phase
            </label>

            {/* Active phase indicator */}
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-[#0c0d15] border border-white/[0.04]">
              <span className={`w-2 h-2 rounded-full ${phaseCfg.color.replace("text-", "bg-")}`} />
              <span className={`text-[11px] font-bold ${phaseCfg.color}`}>
                {phaseCfg.icon} {phaseCfg.label}
              </span>
            </div>

            {/* Phase chips */}
            <div className="flex gap-1.5">
              {PHASES.map((phase) => {
                const cfg = PHASE_CONFIG[phase];
                const isCurrent = currentPhase === phase;

                return (
                  <button
                    key={phase}
                    onClick={() => handlePhaseChange(phase)}
                    className={`
                      flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold
                      transition-all duration-200 border active:scale-95
                      ${isCurrent
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-[0_0_8px_rgba(255,255,255,0.02)]`
                        : "bg-[#0c0d15] border-white/[0.04] text-surface-500 hover:text-surface-300 hover:border-white/[0.08]"
                      }
                    `}
                  >
                    <span className="block leading-tight">{cfg.icon}</span>
                    <span className="block text-[8px] mt-0.5">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
    </DashboardPanel>
  );
}
