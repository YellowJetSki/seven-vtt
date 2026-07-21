/**
 * STᚱ VTT — Global Quick Note (Overrrides-Grade Premium Refactor v2.0)
 *
 * A globally accessible floating quick-note FAB available from ANY page
 * for BOTH DM and Player roles. Features:
 *
 * — Overrrides-grade staggered entrance with spring easing
 * — Note history mini-list (last 3 from campaign journal)
 * — Category chips: idea, NPC, quest, loot, combat (color-coded)
 * — Character limit progress bar with tier thresholds
 * — Premium glass modal with corner ornaments and edge lights
 * — Cmd+Enter / Escape keyboard shortcuts
 * — Auto-timestamps and saves to campaign journal
 */

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAuthStore } from "@/stores/authStore";
import type { JournalEntry } from "@/types";

interface GlobalQuickNoteProps {
  onSave?: (entry: { title: string; content: string; type: "note"; tags?: string[] }) => void;
}

type NoteCategory = "idea" | "npc" | "quest" | "loot" | "combat";

const NOTE_CATEGORIES: { id: NoteCategory; label: string; icon: string; color: string; border: string; bg: string }[] = [
  { id: "idea", label: "Idea", icon: "💡", color: "text-gold-400", border: "border-gold-500/25", bg: "bg-gold-500/10" },
  { id: "npc", label: "NPC", icon: "🧑", color: "text-sky-400", border: "border-sky-500/25", bg: "bg-sky-500/10" },
  { id: "quest", label: "Quest", icon: "⚔", color: "text-rose-400", border: "border-rose-500/25", bg: "bg-rose-500/10" },
  { id: "loot", label: "Loot", icon: "💰", color: "text-emerald-400", border: "border-emerald-500/25", bg: "bg-emerald-500/10" },
  { id: "combat", label: "Combat", icon: "🗡", color: "text-red-400", border: "border-red-500/25", bg: "bg-red-500/10" },
];

const MAX_CHARS = 500;

export default function GlobalQuickNote({ onSave }: GlobalQuickNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addJournalEntry = useCampaignStore((s) => s.addJournalEntry);
  const journal = useCampaignStore((s) => s.journal);
  const role = useAuthStore((s) => s.role);

  // Get last 3 quick note entries
  const recentNotes = useMemo(() => {
    if (!journal || journal.length === 0) return [];
    return (journal as JournalEntry[])
      .filter((e) => e.type === "note")
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 3);
  }, [journal]);

  // Auto-focus textarea when opening
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const addEntry = useCallback(
    (entry: { title: string; content: string; type: "note"; tags?: string[] }) => {
      if (onSave) {
        onSave(entry);
      } else {
        addJournalEntry({
          id: `quicknote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title: entry.title,
          content: entry.content,
          type: entry.type,
          tags: entry.tags || [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    },
    [onSave, addJournalEntry]
  );

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

    const tags: string[] = [];
    if (category) tags.push(category);
    const catLabel = category ? NOTE_CATEGORIES.find((c) => c.id === category)?.label : null;

    addEntry({
      title: `${catLabel ? `[${catLabel}] ` : ""}Quick Note — ${dateStr} ${timeStr}`,
      content: trimmed,
      type: "note",
      tags,
    });

    setContent("");
    setCategory(null);
    setIsOpen(false);
  }, [content, category, addEntry]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setContent("");
        setCategory(null);
      }
    },
    [handleSubmit]
  );

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charPercent = Math.min(100, Math.round((charCount / MAX_CHARS) * 100));

  const getBarColor = () => {
    if (charPercent > 90) return "bg-red-500";
    if (charPercent > 75) return "bg-amber-500";
    if (charPercent > 50) return "bg-gold-500";
    return "bg-emerald-500";
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-gold-500/20 to-amber-500/10 border border-gold-500/25 text-gold-400 shadow-[0_4px_20px_rgba(234,179,8,0.12)] hover:shadow-[0_4px_24px_rgba(234,179,8,0.2)] hover:from-gold-500/25 hover:border-gold-500/35 active:scale-90 transition-all duration-200 flex items-center justify-center group"
          title="Quick Note (Ctrl+N)"
          aria-label="Open quick note"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="absolute inset-0 rounded-full animate-ping opacity-10 bg-gold-400" style={{ animationDuration: "3s" }} />
          {recentNotes.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_4px_rgba(234,179,8,0.4)]" />
          )}
        </button>
      )}

      {/* ── Quick Note Modal ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
          style={{ animation: "fade-in 0.15s ease-out forwards" }}
          onClick={() => { setIsOpen(false); setContent(""); setCategory(null); }}
        >
          <div
            className="relative rounded-2xl w-full max-w-lg mx-4 mb-0 sm:mb-4 border border-white/[0.06] shadow-2xl shadow-black/60 overflow-hidden bg-gradient-to-b from-[#181a2a]/95 to-[#0f1019]/95 backdrop-blur-xl"
            style={{ animation: "slide-in-up 0.35s cubic-bezier(0.16,1,0.3,1) forwards" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Corner ornaments */}
            <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-gold-500/20 rounded-tl" />
            <div className="absolute top-0 right-0 w-3 h-3 border-r border-t border-gold-500/20 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l border-b border-gold-500/20 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-gold-500/20 rounded-br" />

            {/* Gold edge light */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />
            <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent" />

            {/* ── Header (0.05s stagger) ── */}
            <div
              className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between"
              style={{ animation: "slide-in-up 0.3s ease-out 0.05s forwards", opacity: 0 }}
            >
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
                {recentNotes.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all active:scale-90 ${
                      showHistory
                        ? "bg-gold-500/10 border border-gold-500/20 text-gold-400"
                        : "text-surface-500 hover:text-surface-300 border border-transparent"
                    }`}
                  >
                    📋 History
                  </button>
                )}
                <span className="text-[9px] text-surface-500 tabular-nums">{wordCount}w · {charCount}c</span>
                <button
                  onClick={() => { setIsOpen(false); setContent(""); setCategory(null); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
                  aria-label="Close quick note"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Note History (0.1s stagger) ── */}
            {showHistory && recentNotes.length > 0 && (
              <div
                className="px-4 pt-3 pb-1 border-b border-white/[0.04] bg-white/[0.01]"
                style={{ animation: "slide-in-up 0.25s ease-out 0.1s forwards", opacity: 0 }}
              >
                <p className="text-[8px] uppercase tracking-wider text-surface-500 mb-2 font-semibold">Recent Notes</p>
                <div className="space-y-1.5">
                  {recentNotes.map((note) => (
                    <div key={note.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[9px] text-surface-400 shrink-0 mt-0.5">📝</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-surface-300 font-semibold truncate">{note.title}</p>
                        <p className="text-[9px] text-surface-500 truncate">{note.content}</p>
                      </div>
                      <span className="text-[8px] text-surface-600 shrink-0 mt-0.5 tabular-nums">
                        {note.createdAt ? `${Math.max(1, Math.floor((Date.now() - note.createdAt) / 60000))}m ago` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Category Chips (0.1s stagger) ── */}
            <div
              className="px-4 pt-3 pb-1"
              style={{ animation: "slide-in-up 0.3s ease-out 0.1s forwards", opacity: 0 }}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[8px] uppercase tracking-wider text-surface-500 font-semibold mr-1">Tag:</span>
                {NOTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(category === cat.id ? null : cat.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-semibold border transition-all duration-150 active:scale-90 ${
                      category === cat.id
                        ? `${cat.bg} ${cat.border} ${cat.color}`
                        : "bg-white/[0.02] border-white/[0.04] text-surface-500 hover:text-surface-300 hover:border-white/[0.08]"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Body (0.15s stagger) ── */}
            <div
              className="p-4"
              style={{ animation: "slide-in-up 0.3s ease-out 0.15s forwards", opacity: 0 }}
            >
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder="Jot down an idea, NPC name, quest detail, or combat note..."
                rows={4}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-xl px-3 py-2.5 text-xs text-surface-200 placeholder-surface-500 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 resize-none min-h-[100px] transition-all"
                autoFocus
              />

              {/* Character limit progress bar */}
              <div className="mt-2 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${getBarColor()}`}
                  style={{ width: `${charPercent}%` }}
                />
              </div>

              {/* Tips row */}
              <div className="mt-1.5 text-[9px] text-surface-500 flex items-center gap-1.5">
                <span>📝</span>
                <span>Auto-saves to campaign journal</span>
                <span className="text-surface-500">·</span>
                <span className="text-gold-500/40">Auto-timestamped</span>
                {charCount > MAX_CHARS * 0.8 && (
                  <>
                    <span className="text-surface-500">·</span>
                    <span className={charPercent > 90 ? "text-red-400/60" : "text-amber-400/60"}>
                      {MAX_CHARS - charCount} chars left
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── Footer (0.2s stagger) ── */}
            <div
              className="shrink-0 px-4 py-3 border-t border-white/[0.06] flex items-center justify-between"
              style={{ animation: "slide-in-up 0.3s ease-out 0.2s forwards", opacity: 0 }}
            >
              <div className="text-[9px] text-surface-500">
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-white/[0.06] text-[8px]">⌘↵</kbd>
                <span className="ml-1">to save · </span>
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-white/[0.06] text-[8px]">Esc</kbd>
                <span className="ml-1">to cancel</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setIsOpen(false); setContent(""); setCategory(null); }}
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
