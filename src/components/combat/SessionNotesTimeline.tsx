/* ── Session Notes Timeline ────────────────────────────────────
 * Auto-timestamped note-taking panel for live sessions.
 * Each note is tagged with the current round/phase and timestamp.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

interface SessionNote {
  id: string;
  text: string;
  timestamp: number;
  round: number;
  phase: string;
  author: string;
}

function uid(): string {
  return `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function SessionNotesTimeline() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);
  const showToast = useUiStore((s) => s.showToast);

  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [showPanel, setShowPanel] = useState(false);

  const isActive = liveSession.sessionStartedAt;

  const handleAddNote = () => {
    const text = newNoteText.trim();
    if (!text) return;
    const note: SessionNote = {
      id: uid(),
      text,
      timestamp: Date.now(),
      round: activeEncounter?.round ?? 0,
      phase: activeEncounter?.phase ?? "exploration",
      author: "DM",
    };
    setNotes((prev) => [note, ...prev]);
    setNewNoteText("");
    showToast({ message: "Note added to timeline.", type: "success" });
  };

  const handleExportNotes = () => {
    if (notes.length === 0) {
      showToast({ message: "No notes to export.", type: "warning" });
      return;
    }
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-notes-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: `${notes.length} notes exported.`, type: "success" });
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-surface-200 hover:bg-surface-800 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span>📋</span>
          <span>Session Notes</span>
          {notes.length > 0 && (
            <span className="rounded-full bg-accent-500/20 px-2 py-0.5 text-[10px] text-accent-400">
              {notes.length}
            </span>
          )}
        </span>
        <span className={`text-xs text-surface-500 transition-transform ${showPanel ? "rotate-180" : ""}`}>▼</span>
      </button>

      {showPanel && (
        <div className="border-t border-surface-700">
          {/* Input */}
          <div className="p-3 border-b border-surface-700/50">
            <div className="flex gap-2">
              <input
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Type a session note..."
                className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddNote} disabled={!newNoteText.trim()}>
                Add
              </Button>
            </div>
            {activeEncounter && (
              <p className="mt-1 text-[10px] text-surface-500">
                Round {activeEncounter.round} · {activeEncounter.phase} phase
              </p>
            )}
          </div>

          {/* Notes List */}
          <div className="max-h-[300px] overflow-y-auto space-y-1 p-2">
            {notes.length === 0 ? (
              <p className="text-center text-xs text-surface-500 py-6">No notes yet. Start typing above.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-lg bg-surface-800/50 px-3 py-2 group">
                  <p className="text-xs text-surface-300 leading-relaxed">{note.text}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] text-surface-500">
                      Round {note.round}
                    </span>
                    <span className="text-[10px] text-surface-500">·</span>
                    <span className="text-[10px] text-surface-500">
                      {new Date(note.timestamp).toLocaleTimeString()}
                    </span>
                    <button
                      onClick={() => {
                        setNotes((prev) => prev.filter((n) => n.id !== note.id));
                      }}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-warrior-400 hover:text-warrior-300 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notes.length > 0 && (
            <div className="flex items-center justify-between border-t border-surface-700/50 px-3 py-2">
              <span className="text-[10px] text-surface-500">{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
              <button onClick={handleExportNotes} className="text-[10px] text-surface-500 hover:text-surface-300 transition-colors">
                📥 Export
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
