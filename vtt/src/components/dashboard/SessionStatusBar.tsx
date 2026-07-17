/* ── SessionStatusBar ──────────────────────────────────────────
 * Dashboard widget showing current session status and start/end controls.
 * ─────────────────────────────────────────────────────────────── */

import type { LiveSessionState } from "@/types/combat";
import { Button } from "@/components/ui/Button";

interface Props {
  liveSession: LiveSessionState;
  onStart: () => void;
  onEnd: () => void;
}

export function SessionStatusBar({ liveSession, onStart, onEnd }: Props) {
  const sessionActive = liveSession.sessionStartedAt !== null;

  return (
    <section className="rounded-xl border border-surface-700 bg-surface-850 p-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${sessionActive ? "bg-accent-500/20" : "bg-surface-800"}`}>
            <span className={`h-3 w-3 rounded-full ${sessionActive ? "bg-accent-500 animate-pulse" : "bg-surface-500"}`} />
          </span>
          <div>
            <p className="text-sm font-semibold text-surface-100">{sessionActive ? "Session Active" : "No Active Session"}</p>
            <p className="text-xs text-surface-400">
              {sessionActive ? `Phase: ${liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}` : "Start a session to share live data with players"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!sessionActive ? <Button size="sm" onClick={onStart}>▶ Start Session</Button> : <Button variant="danger" size="sm" onClick={onEnd}>■ End Session</Button>}
        </div>
      </div>
      {sessionActive && (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-lg bg-surface-800 p-2"><p className="text-surface-500">Phase</p><p className="font-medium text-surface-200 capitalize">{liveSession.phase}</p></div>
          <div className="rounded-lg bg-surface-800 p-2"><p className="text-surface-500">Scene</p><p className="font-medium text-surface-200 truncate">{liveSession.currentScene ?? "—"}</p></div>
          <div className="rounded-lg bg-surface-800 p-2"><p className="text-surface-500">Weather</p><p className="font-medium text-surface-200">{liveSession.conditions.weather.charAt(0).toUpperCase() + liveSession.conditions.weather.slice(1)}</p></div>
        </div>
      )}
    </section>
  );
}
