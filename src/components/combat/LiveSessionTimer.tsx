/* ── Live Session Timer ────────────────────────────────────────
 * Elapsed time display that ticks up while a session is active.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useState } from "react";
import { useCombatStore } from "@/stores/combatStore";

export function LiveSessionTimer() {
  const sessionStartedAt = useCombatStore((s) => s.liveSession.sessionStartedAt);
  const phase = useCombatStore((s) => s.liveSession.phase);
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!sessionStartedAt) {
      setElapsed("");
      return;
    }

    const tick = () => {
      const now = Date.now();
      const diff = now - sessionStartedAt;
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1_000);

      const parts: string[] = [];
      if (hours > 0) parts.push(String(hours).padStart(2, "0"));
      parts.push(String(minutes).padStart(2, "0"));
      parts.push(String(seconds).padStart(2, "0"));
      setElapsed(parts.join(":"));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  if (!sessionStartedAt) return null;

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1 text-xs font-medium text-accent-400">
      <span className="h-2 w-2 rounded-full bg-accent-500 animate-pulse" />
      {elapsed}
      {phase !== "downtime" && (
        <>
          <span className="text-surface-600 mx-0.5">·</span>
          <span className="capitalize">{phase}</span>
        </>
      )}
    </span>
  );
}
