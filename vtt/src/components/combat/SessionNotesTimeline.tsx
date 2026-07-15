/* ── Session Notes Timeline ────────────────────────────────────
 * Shows a timeline of DM notes during a live session.
 * Notes are extracted from the combat log (type: "note").
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { Button } from "@/components/ui/Button";

interface SessionNote {
  id: string;
  text: string;
  timestamp: number;
  round: number;
  phase: string;
  author: string;
}

export function SessionNotesTimeline() {
  const combatLog = useCombatStore((s) => s.combatLog);
  const liveSession = useCombatStore((s) => s.liveSession);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [showNotes, setShowNotes] = useState(false);

  const isActive = liveSession.sessionStartedAt;

  // Sync notes from combatLog (Firebase-synced source of truth)
  useEffect(() => {
    const sessionNotes: SessionNote[] = combatLog
      .filter((entry) => entry.type === "note")
      .map((entry) => ({
        id: entry.id,
        text: entry.description ?? "",
        timestamp: entry.timestamp,
        round: 0,
        phase: "exploration" as const,
        author: "DM",
      }));
    setNotes(sessionNotes);
  }, [combatLog]);

  if (!isActive) return null;

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
      <button onClick={() => setShowNotes(!showNotes)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-800 transition-colors">
        <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          📝 Session Notes {notes.length > 0 && `(${notes.length})`}
        </span>
        <span className="text-surface-500">{showNotes ? "▲" : "▼"}</span>
      </button>

      {showNotes && (
        <div className="max-h-60 overflow-y-auto border-t border-surface-700 p-3 space-y-2">
          {notes.length === 0 ? (
            <p className="py-4 text-center text-xs text-surface-500">
              No notes recorded this session.
            </p>
          ) : (
            [...notes].reverse().map((note) => (
              <div key={note.id} className="rounded-lg bg-surface-800 p-3">
                <div className="flex items-center justify-between text-[10px] text-surface-500 mb-1">
                  <span>{note.author}</span>
                  <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-surface-200 whitespace-pre-wrap">{note.text}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
