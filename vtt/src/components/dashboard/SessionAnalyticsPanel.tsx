/* ── Session Analytics Panel ───────────────────────────────────
 * Displays real-time session metrics on the DM Dashboard.
 * Pulls data from sessionAnalyticsStore.
 *
 * ── Features ─────────────────────────────────────────────────
 * • Duration per phase (exploration, combat, rest, downtime)
 * • Total rounds fought
 * • Damage dealt/taken breakdown
 * • Peak combatant count
 * • Encounter log
 * • Collapsible for compact display
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useSessionAnalyticsStore } from "@/stores/sessionAnalyticsStore";
import { useCombatStore } from "@/stores/combatStore";

export function SessionAnalyticsPanel() {
  const currentSession = useSessionAnalyticsStore((s) => s.currentSession);
  const sessionHistory = useSessionAnalyticsStore((s) => s.sessionHistory);
  const currentEncounter = useSessionAnalyticsStore((s) => s.currentEncounter);
  const clearHistory = useSessionAnalyticsStore((s) => s.clearHistory);
  const liveSession = useCombatStore((s) => s.liveSession);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const sessionActive = liveSession.sessionStartedAt !== null;

  // Determine which session to display
  const analytics = currentSession;
  const hasData = analytics !== null;
  const hasHistory = sessionHistory.length > 0;

  // Format milliseconds for display
  const formatDuration = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Phase duration calculations
  const phaseDurations = useMemo(() => {
    if (!analytics) return [];
    const now = Date.now();
    return analytics.phaseTimers.map((pt) => {
      const totalMs = pt.startedAt !== null
        ? pt.totalMs + (now - pt.startedAt)
        : pt.totalMs;
      return { ...pt, totalMs };
    });
  }, [analytics]);

  // Only show if there's data or if we're in a session
  if (!sessionActive && !hasData && !hasHistory) {
    return null;
  }

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded((p) => !p)}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-800"
      >
        <span className="flex items-center gap-2">
          <span>📊</span>
          <span>Session Analytics</span>
          {analytics && (
            <span className="rounded-full bg-accent-500/20 px-2 py-0.5 text-[10px] text-accent-400">
              {formatDuration(analytics.totalDurationMs || Date.now() - analytics.startedAt)}
            </span>
          )}
        </span>
        <span className={`text-xs text-surface-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="border-t border-surface-700 p-5">
          {activeSession && analytics ? (
            <div className="space-y-5">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  label="Total Time"
                  value={formatDuration(analytics.totalDurationMs || Date.now() - analytics.startedAt)}
                  icon="⏱️"
                />
                <MetricCard
                  label="Combats"
                  value={analytics.totalCombats + (currentEncounter ? 1 : 0)}
                  icon="⚔️"
                  detail={analytics.totalRounds > 0 ? `${analytics.totalRounds} rounds` : "No rounds"}
                />
                <MetricCard
                  label="Peak Enemies"
                  value={analytics.peakCombatants}
                  icon="👹"
                />
                <MetricCard
                  label="Notes"
                  value={analytics.noteCount}
                  icon="📋"
                />
              </div>

              {/* Phase Breakdown */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Phase Time</h4>
                <div className="space-y-1.5">
                  {phaseDurations.map((pt) => {
                    const totalMs = analytics.totalDurationMs || Date.now() - analytics.startedAt;
                    const percentage = totalMs > 0 ? Math.round((pt.totalMs / totalMs) * 100) : 0;
                    const isActive = pt.startedAt !== null && sessionActive;
                    return (
                      <div key={pt.phase}>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`flex items-center gap-1.5 text-surface-300 ${isActive ? "font-medium text-accent-300" : ""}`}>
                            {isActive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />}
                            {pt.phase.charAt(0).toUpperCase() + pt.phase.slice(1)}
                          </span>
                          <span className="text-surface-500">{formatDuration(pt.totalMs)}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-surface-800">
                          <div
                            className="h-full rounded-full bg-accent-500/40 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Damage Breakdown */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Damage Summary</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-rogue-500/10 p-3">
                    <p className="text-[10px] font-medium text-rogue-400">Party Dealt</p>
                    <p className="text-lg font-bold text-rogue-300">{analytics.totalPartyDamageDealt}</p>
                  </div>
                  <div className="rounded-lg bg-warrior-500/10 p-3">
                    <p className="text-[10px] font-medium text-warrior-400">Party Taken</p>
                    <p className="text-lg font-bold text-warrior-300">{analytics.totalPartyDamageTaken}</p>
                  </div>
                </div>
              </div>

              {/* Current Encounter */}
              {currentEncounter && (
                <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
                    <span className="text-xs font-medium text-accent-300">Active: {currentEncounter.encounterName}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                    <span className="text-surface-400">R{currentEncounter.totalRounds}</span>
                    <span className="text-rogue-400">⚔ {currentEncounter.partyDamageDealt}</span>
                    <span className="text-warrior-400">💥 {currentEncounter.partyDamageTaken}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-surface-500">
              No active session. Start a session to begin tracking analytics.
            </p>
          )}

          {/* Historical Sessions */}
          {hasHistory && (
            <div className="mt-4">
              <button
                onClick={() => setShowHistory((p) => !p)}
                className="flex items-center gap-1 text-xs text-surface-500 hover:text-surface-300 transition-colors"
              >
                📚 {showHistory ? "Hide" : "Show"} Past Sessions ({sessionHistory.length})
              </button>
              {showHistory && (
                <div className="mt-2 max-h-[200px] space-y-2 overflow-y-auto">
                  {sessionHistory.map((s) => (
                    <div key={s.sessionId} className="rounded-lg bg-surface-800/50 p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-surface-300">
                          {new Date(s.sessionDate).toLocaleDateString()}
                        </span>
                        <span className="text-surface-500">{formatDuration(s.totalDurationMs)}</span>
                      </div>
                      <div className="mt-1 flex gap-3 text-[10px] text-surface-500">
                        <span>{s.totalCombats} combat{s.totalCombats !== 1 ? "s" : ""}</span>
                        <span>{s.totalRounds} round{s.totalRounds !== 1 ? "s" : ""}</span>
                        <span>{s.noteCount} note{s.noteCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                  {showClearConfirm ? (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-warrior-400">Clear all history?</span>
                      <button
                        onClick={() => { clearHistory(); setShowClearConfirm(false); }}
                        className="text-[10px] font-medium text-warrior-400 hover:text-warrior-300"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="text-[10px] text-surface-500 hover:text-surface-300"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="mt-1 text-[10px] text-surface-600 hover:text-warrior-400"
                    >
                      🗑️ Clear history
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Metric Card Sub-Component ──────────────────────────────── */

function MetricCard({
  label,
  value,
  icon,
  detail,
}: {
  label: string;
  value: string | number;
  icon: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg bg-surface-800/50 p-3">
      <p className="flex items-center gap-1 text-[10px] text-surface-500">
        <span>{icon}</span>
        <span>{label}</span>
      </p>
      <p className="mt-0.5 text-lg font-bold text-surface-200">{value}</p>
      {detail && <p className="text-[10px] text-surface-500">{detail}</p>}
    </div>
  );
}
