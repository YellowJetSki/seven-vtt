/**
 * STᚱ VTT — Global Quick Note (Premium Glass — Globally Accessible)
 *
 * A globally accessible floating quick-note FAB available from ANY page
 * for BOTH DM and Player roles. One-tap to jot down an idea, NPC name,
 * quest detail, or combat note without navigating to the Journal page.
 *
 * Saves entries to the campaign's journal collection via addJournalEntry.
 * Features:
 * - Fixed position bottom-right FAB with gold gradient and pulse ring
 * - Glass modal with edge light, word/char count, auto-timestamp
 * - Cmd+Enter / Escape keyboard shortcuts
 * - Premium Overrrides/Lusion-grade glassmorphism
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAuthStore } from "@/stores/authStore";

interface GlobalQuickNoteProps {
  /** Optional journal save handler. Falls back to campaignStore.addJournalEntry */
  onSave?: (entry: { title: string; content: string; type: "note" }) => void;
}

export default function GlobalQuickNote({ onSave }: GlobalQuickNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addJournalEntry = useCampaignStore((s) => s.addJournalEntry);
  const role = useAuthStore((s) => s.role);

  // Auto-transform for quick notes using a stable default handler
  const addEntry = useCallback(
    (entry: { title: string; content: string; type: "note" }) => {
      if (onSave) {
        onSave(entry);
      } else {
        addJournalEntry({
          id: `quicknote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: entry.title,
          content: entry.content,
          type: entry.type,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    },
    [onSave, addJournalEntry]
  );

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

    addEntry({
      title: `Quick Note — ${dateStr} ${timeStr}`,
      content: trimmed,
      type: "note",
    });

    setContent("");
    setIsOpen(false);
  }, [content, addEntry]);

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
      {/* ── Floating Action Button ──
          Visible from ANY page for both DM and Player roles.
          Positioned bottom-right, above mobile bottom nav (z-30). */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-gold-500/20 to-amber-500/10 border border-gold-500/25 text-gold-400 shadow-[0_4px_20px_rgba(234,179,8,0.12)] hover:shadow-[0_4px_24px_rgba(234,179,8,0.2)] hover:from-gold-500/25 hover:border-gold-500/35 active:scale-90 transition-all duration-200 flex items-center justify-center group"
          title="Quick Note (Ctrl+N)"
          aria-label="Open quick note"
        >
          {/* Premium feather quill icon */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {/* Subtle pulse ring */}
          <span className="absolute inset-0 rounded-full animate-ping opacity-10 bg-gold-400" style={{ animationDuration: "3s" }} />
        </button>
      )}

      {/* ── Quick Note Modal ── */}
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

            {/* ── Header ── */}
            <div className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gold tracking-tight">Quick Note</h3>
                  <span className="text-[8px] text-surface-500 uppercase tracking-wider">
                    {role === "dm" ? "DM" : "Player"} — Any Page
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-surface-500 tabular-nums">{wordCount}w · {charCount}c</span>
                <button
                  onClick={() => { setIsOpen(false); setContent(""); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
                  aria-label="Close quick note"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Body ── */}
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

              {/* Tip */}
              <div className="mt-2 text-[9px] text-surface-500 flex items-center gap-1.5">
                <span>📝</span>
                <span>Auto-saves to campaign journal</span>
                <span className="text-surface-500">·</span>
                <span className="text-gold-500/40">Auto-timestamped</span>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="shrink-0 px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
              <div className="text-[9px] text-surface-500">
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-white/[0.06] text-[8px]">⌘↵</kbd>
                <span className="ml-1">to save · </span>
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-white/[0.06] text-[8px]">Esc</kbd>
                <span className="ml-1">to cancel</span>
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
