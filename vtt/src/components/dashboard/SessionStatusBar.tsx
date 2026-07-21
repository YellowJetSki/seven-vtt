/**
 * STᚱ VTT — Session Status Bar (Overrrides-Grade Premium)
 *
 * A compact, always-visible status bar showing the LIVE session state.
 * Designed for the DM Dashboard — gives instant awareness of:
 * - Session elapsed time (updates every second while live)
 * - Party health summary (wounded count, dead count)
 * - Active encounter status (emerald pulse when in combat)
 * - Campaign milestone (current session number)
 *
 * Premium glass card with color-coded indicators.
 */

import { useState, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import type { CampaignMeta } from "@/types";
import { glassCardWithEdge, goldEdgeLight, entrance } from "@/lib/design-tokens";

interface SessionStatusBarProps {
  meta: CampaignMeta;
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function SessionStatusBar({ meta }: SessionStatusBarProps) {
  const characters = useCampaignStore((s) => s.characters);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const isInCombat = activeEncounter?.phase === "active" || activeEncounter?.phase === "prep";

  // Session timer (simple ticking clock)
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Derive party health
  const wounded = characters.filter(
    (c) => c.hitPoints && c.hitPoints.current > 0 && c.hitPoints.current < c.hitPoints.max
  ).length;
  const dead = characters.filter(
    (c) => !c.hitPoints || c.hitPoints.current <= 0
  ).length;
  const totalHp = characters.reduce((sum, c) => sum + (c.hitPoints?.max ?? 0), 0);
  const currentHp = characters.reduce(
    (sum, c) => sum + Math.max(0, c.hitPoints?.current ?? 0),
    0
  );
  const hpPercent = totalHp > 0 ? Math.round((currentHp / totalHp) * 100) : 100;

  return (
    <div className={`relative ${glassCardWithEdge("card")}`}>
      <div className={goldEdgeLight} />
      <div className="relative z-10 px-4 py-2.5" style={entrance(0)}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Session control */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-surface-500 font-semibold">
              Session
            </span>
            <span className="text-xs font-bold text-white/80 tabular-nums">
              #{meta.stats?.sessionCount ?? 0}
            </span>
          </div>

          <div className="w-px h-4 bg-white/[0.04]" />

          {/* Timer */}
          <div className="flex items-center gap-1.5">
            {isRunning ? (
              <button
                onClick={() => setIsRunning(false)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 active:scale-95 transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-400 tabular-nums">
                  {formatElapsed(elapsed)}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(true)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] active:scale-95 transition-all"
              >
                <svg className="w-3 h-3 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                <span className="text-[10px] font-medium text-surface-400">Start Timer</span>
              </button>
            )}
          </div>

          <div className="w-px h-4 bg-white/[0.04]" />

          {/* Party health */}
          {characters.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider text-surface-500 font-semibold">
                  Party
                </span>
                <div className="flex items-center gap-1.5">
                  {/* Health bar */}
                  <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${hpPercent}%`,
                        background: hpPercent > 50
                          ? "linear-gradient(90deg, #34d399, #10b981)"
                          : hpPercent > 25
                            ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                            : "linear-gradient(90deg, #f87171, #ef4444)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-surface-400 font-semibold tabular-nums">
                    {currentHp}/{totalHp}
                  </span>
                </div>
              </div>

              {(wounded > 0 || dead > 0) && (
                <>
                  <div className="w-px h-4 bg-white/[0.04]" />
                  <div className="flex items-center gap-1.5">
                    {wounded > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
                        {wounded} wounded
                      </span>
                    )}
                    {dead > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-semibold">
                        {dead} down
                      </span>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Combat indicator */}
          {isInCombat && (
            <>
              <div className="w-px h-4 bg-white/[0.04]" />
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  Combat Active
                </span>
              </div>
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Gold connection hint */}
          <span className="text-[8px] text-surface-600 uppercase tracking-wider">
            Arkla · {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
      </div>
    </div>
  );
}
