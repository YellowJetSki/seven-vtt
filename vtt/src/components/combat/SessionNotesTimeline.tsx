/* ── Session Notes Timeline ────────────────────────────────────
 * Auto-timestamped note-taking panel for live sessions.
 * Each note is tagged with the current round/phase and timestamp.
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
  const showToast = useUiStore((s) => s.showToast);

  const [notes, setNotes] = useState<SessionNote[]>(() => {
    try {
      const saved = localStorage.getItem("vtt-session-notes");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newNoteText, setNewNoteText] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<NoteFilter>("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isActive = liveSession.sessionStartedAt;

  // Persist notes to localStorage
  useEffect(() => {
    localStorage.setItem("vtt-session-notes", JSON.stringify(notes));
  }, [notes]);

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
    const note: SessionNote = {
      id: uid(),
      text,
      timestamp: Date.now(),
      round: activeEncounter?.round ?? 0,
      phase: activeEncounter?.phase ?? liveSession.phase ?? "exploration",
      author: "DM",
    };
    setNotes((prev) => [note, ...prev]);
    setNewNoteText("");
    showToast({ message: "Note added to timeline.", type: "success" });
  }, [newNoteText, activeEncounter, liveSession, showToast]);

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
    setNotes([]);
    setShowClearConfirm(false);
    showToast({ message: "All session notes cleared.", type: "info" });
  }, [showToast]);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

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
        <div className="border-t border-surface-700">
          {/* Input */}
          <div className="border-b border-surface-700/50 p-3">
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

          {/* Search + Filters */}
          {notes.length > 0 && (
            <div className="border-b border-surface-700/50 p-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full rounded-md border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-xs text-surface-200 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(["all", "combat", "exploration", "rest", "downtime"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setPhaseFilter(f)}
                    className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                      phaseFilter === f
                        ? "bg-accent-500/20 text-accent-300"
                        : "bg-surface-800 text-surface-400 hover:bg-surface-700"
                    }`}
                  >
                    {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="max-h-[300px] space-y-1 overflow-y-auto p-2">
            {filteredNotes.length === 0 ? (
              <p className="py-6 text-center text-xs text-surface-500">
                {notes.length === 0
                  ? "No notes yet. Start typing above."
                  : "No notes match your filter."}
              </p>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className="group rounded-lg bg-surface-800/50 px-3 py-2">
                  <p className="text-xs leading-relaxed text-surface-300">{note.text}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-surface-700 px-1.5 py-0.5 text-[9px] font-medium text-accent-400">
                      R{note.round}
                    </span>
                    <span className="text-[10px] text-surface-500">{note.phase}</span>
                    <span className="text-[10px] text-surface-500">·</span>
                    <span className="text-[10px] text-surface-500">
                      {new Date(note.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-[10px] text-surface-600">· {note.author}</span>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="ml-auto text-[10px] text-warrior-400 opacity-0 transition-all hover:text-warrior-300 group-hover:opacity-100"
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-surface-500">
                  {filteredNotes.length}/{notes.length} note{notes.length !== 1 ? "s" : ""}
                </span>
                {showClearConfirm ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-warrior-400">Clear all?</span>
                    <button
                      onClick={handleClearAll}
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
                    className="text-[10px] text-surface-500 hover:text-warrior-400"
                  >
                    🗑️ Clear
                  </button>
                )}
              </div>
              <button
                onClick={handleExportNotes}
                className="text-[10px] text-surface-500 transition-colors hover:text-surface-300"
              >
                📥 Export
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
