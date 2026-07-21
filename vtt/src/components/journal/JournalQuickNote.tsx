/**
 * STᚱ VTT — Journal Quick Note (Premium Glass v3.0)
 *
 * Floating quick-note entry form that appears as a floating action button
 * on the journal page. DMs can instantly jot down an idea, NPC name,
 * or combat note without navigating the full editor.
 *
 * On save: creates a new 'note' type journal entry with "Quick Note" prefix
 * and the current timestamp auto-populated.
 *
 * Replaced glass-gold with direct glass gradient + edge light.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { JournalEntry } from "@/types";

interface JournalQuickNoteProps {
  onSave: (entry: { title: string; content: string; type: "note" }) => void;
  lastSessionNumber: number;
}

export default function JournalQuickNote({ onSave, lastSessionNumber }: JournalQuickNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when opening
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const dateStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    onSave({
      title: `Quick Note — ${dateStr} ${timeStr}`,
      content: trimmed,
      type: "note",
    });

    setContent("");
    setIsOpen(false);
  }, [content, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setContent("");
      }
    },
    [handleSubmit]
  );

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-gold-500/20 to-amber-500/10 border border-gold-500/25 text-gold-400 shadow-[0_4px_20px_rgba(234,179,8,0.12)] hover:shadow-[0_4px_24px_rgba(234,179,8,0.2)] hover:from-gold-500/25 hover:border-gold-500/35 active:scale-90 transition-all duration-200 flex items-center justify-center group"
          title="Quick Note (Ctrl+N)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {/* Subtle pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-10 bg-gold-400" style={{ animationDuration: "3s" }} />
        </button>
      )}

      {/* Quick Note Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => { setIsOpen(false); setContent(""); }}
        >
          <div
            className="relative rounded-2xl w-full max-w-lg mx-4 mb-0 sm:mb-4 border border-white/[0.06] shadow-2xl shadow-black/60 overflow-hidden bg-gradient-to-b from-[#181a2a]/95 to-[#0f1019]/95 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold edge light */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />

            {/* Header */}
            <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📝</span>
                <h3 className="text-sm font-bold text-gold tracking-tight">Quick Note</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-surface-500 tabular-nums">{wordCount}w · {charCount}c</span>
                <button
                  onClick={() => { setIsOpen(false); setContent(""); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Jot down an idea, NPC name, quest detail, or combat note..."
                rows={4}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-surface-200 placeholder-surface-500 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 resize-none min-h-[100px] transition-all"
                autoFocus
              />

              {/* Quick session context */}
              {lastSessionNumber > 0 && (
                <div className="mt-2 text-[9px] text-surface-500 flex items-center gap-1.5">
                  <span>🎲 Current session: #{lastSessionNumber}</span>
                  <span className="text-surface-500">·</span>
                  <span className="text-gold-500/40">Auto-timestamped on save</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="text-[9px] text-surface-500">
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-white/[0.06] text-[8px]">⌘↵</kbd> to save
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsOpen(false); setContent(""); }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim()}
                  className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  💾 Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
