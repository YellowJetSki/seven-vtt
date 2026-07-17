/* ── SessionTimer ──────────────────────────────────────────────
 * Displays elapsed session time in HH:MM:SS format.
 * Resets when no active session.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";

interface Props {
  sessionStartedAt: number | null;
  sessionStarted: boolean;
}

export function SessionTimer({ sessionStartedAt, sessionStarted }: Props) {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (!sessionStarted) { setTimer(0); return; }
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - sessionStartedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, sessionStartedAt]);

  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);
  const secs = timer % 60;

  return (
    <div className="rounded-md bg-surface-800 px-3 py-1.5 text-center">
      <p className="text-[10px] text-surface-500">Elapsed</p>
      <p className="text-sm font-mono font-bold text-surface-200">
        {hours > 0 ? `${hours}:` : ""}{minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
      </p>
    </div>
  );
}
