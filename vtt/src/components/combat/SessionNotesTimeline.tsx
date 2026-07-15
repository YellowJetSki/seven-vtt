/* ── Session Notes Timeline ────────────────────────────────────
 * Auto-timestamped note-taking panel for live sessions.
 * Each note is tagged with the current round/phase and timestamp.
 *
 * FIREBASE SYNC: Notes are synced to the combat store's combatLog,
 * which is pushed to Firestore via useFirebaseSync. This ensures
 * session notes are available across all DM devices in real-time.
 *
 * UPGRADED:
 *  • Search/filter across notes
 *  • Phase and round filters
 *  • Clear all with confirmation
 *  • Improved UI with note preview
 *  • Keyboard shortcut (Ctrl+Shift+T) to toggle
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback, useEffect } from "react";
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

type NoteFilter = "all" | "combat" | "exploration" | "rest" | "downtime";

let _noteIdCounter = 0;

function uid(): string {
  _noteIdCounter += 1;
  return `note_${Date.now()}_${_noteIdCounter}`;
}

export function SessionNotesTimeline() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);
  const combatLog = useCombatStore((s) => s.combatLog);
  const addNote = useCombatStore((s) => s.addNote);
  const showToast = useUiStore((s) => s.showToast);

  // Derive notes from the combat log (which is synced to Firebase)
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<NoteFilter>("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isActive = liveSession.sessionStartedAt;

  // Sync notes from combatLog (Firebase-synced source of truth)
  useEffect(() => {
    const sessionNotes: SessionNote[] = combatLog
      .filter((entry) => entry.type === "note")
      .map((entry) => ({
        id: entry.id,
        text: entry.detail,
        timestamp: entry.timestamp,
        round: entry.round,
        phase: entry.phase ?? "exploration",
        author: "DM",
      }));
    setNotes(sessionNotes);
  }, [combatLog]);

  // Keyboard shortcut: Ctrl+Shift+T to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "T") {
        e.preventDefault();
        setShowPanel((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleAddNote = useCallback(() => {
    const text = newNoteText.trim();
    if (!text) return;
    // Use the combat store's addNote which pushes to combatLog (synced to Firebase)
    addNote(text);
    setNewNoteText("");
    showToast({ message: "Note added to timeline.", type: "success" });
  }, [newNoteText, addNote, showToast]);

  const handleExportNotes = useCallback(() => {
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
  }, [notes, showToast]);

  const handleClearAll = useCallback(() => {
    useCombatStore.getState().clearLog();
    setShowClearConfirm(false);
    showToast({ message: "All session notes cleared.", type: "info" });
  }, [showToast]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    let list = [...notes];

    // Phase filter
    if (phaseFilter !== "all") {
      list = list.filter((n) => n.phase === phaseFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.text.toLowerCase().includes(q) ||
          n.author.toLowerCase().includes(q) ||
          n.phase.includes(q),
      );
    }

    return list;
  }, [notes, phaseFilter, searchQuery]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-700 bg-surface-850">
      <button
        onClick={() => setShowPanel((p) => !p)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-800"
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
        <span className="text-[10px] text-surface-500">Ctrl+Shift+T</span>
      </button>

      {showPanel && (
        <div className="border-t border-surface-700 p-3 space-y-3">
          {/* New Note Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              placeholder="Type a session note..."
              className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            />
            <Button size="sm" onClick={handleAddNote} disabled={!newNoteText.trim()}>
              + Add
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["all", "combat", "exploration", "rest", "downtime"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setPhaseFilter(f)}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                    phaseFilter === f
                      ? "bg-accent-500/20 text-accent-400"
                      : "text-surface-500 hover:text-surface-300"
                  }`}
                >
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button
              onClick={handleExportNotes}
              disabled={notes.length === 0}
              className="text-[10px] text-surface-500 hover:text-surface-300 transition-colors disabled:opacity-50"
            >
              Export
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />

          {/* Notes List */}
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <p className="py-4 text-center text-xs text-surface-500">
                {searchQuery || phaseFilter !== "all"
                  ? "No matching notes."
                  : "No session notes yet. Start typing above!"}
              </p>
            ) : (
              filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="group flex items-start gap-2 rounded-lg bg-surface-800/50 px-3 py-2"
                >
                  <div className="flex shrink-0 flex-col items-center gap-0.5 pt-0.5">
                    <span className="text-[9px] font-medium text-surface-500">
                      R{note.round}
                    </span>
                    <span className="text-[8px] text-surface-600">
                      {new Date(note.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="flex-1 text-xs text-surface-200 leading-relaxed">
                    {note.text}
                  </p>
                  <span className="shrink-0 rounded bg-surface-700 px-1.5 py-0.5 text-[8px] text-surface-400">
                    {note.phase}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Clear All */}
          {notes.length > 0 && (
            <div className="flex justify-end">
              {showClearConfirm ? (
                <div className="flex gap-2">
                  <Button variant="ghost" size="xs" onClick={() => setShowClearConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="xs" onClick={handleClearAll}>
                    Confirm Clear
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="xs" onClick={() => setShowClearConfirm(true)}>
                  Clear All Notes
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
