/**
 * STᚱ VTT — Journal Quick Note (Overrrides-Grade Premium Refactor v2.0)
 *
 * Floating quick-note FAB for the Journal page with:
 * — Overrrides-grade staggered entrances
 * — Category chips (idea, NPC, quest, loot, combat)
 * — Character limit progress bar
 * — Corner ornaments + premium glass depth
 * — Session context display
 * — Cmd+Enter / Escape keyboard shortcuts
 * — Auto-timestamped with session context
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { JournalEntry } from "@/types";

interface JournalQuickNoteProps {
  onSave: (entry: { title: string; content: string; type: "note" }) => void;
  lastSessionNumber: number;
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

export default function JournalQuickNote({ onSave, lastSessionNumber }: JournalQuickNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    const catLabel = category ? NOTE_CATEGORIES.find((c) => c.id === category)?.label : null;

    onSave({
      title: `${catLabel ? `[${catLabel}] ` : ""}Quick Note — ${dateStr} ${timeStr}`,
      content: trimmed,
      type: "note",
    });

    setContent("");
    setCategory(null);
    setIsOpen(false);
  }, [content, category, onSave]);

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
          <span className="absolute inset-0 rounded-full animate-ping opacity-10 bg-gold-400" style={{ animationDuration: "3s" }} />
        </button>
      )}

      {/* Quick Note Modal */}
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

            {/* Header (0.05s stagger) */}
            <div
              className="shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between"
              style={{ animation: "slide-in-up 0.3s ease-out 0.05s forwards", opacity: 0 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gold tracking-tight">Quick Note</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-surface-500 tabular-nums">{wordCount}w · {charCount}c</span>
                <button
                  onClick={() => { setIsOpen(false); setContent(""); setCategory(null); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Category Chips (0.1s stagger) */}
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

            {/* Body (0.15s stagger) */}
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

              {/* Session context */}
              <div className="mt-1.5 text-[9px] text-surface-500 flex items-center gap-1.5 flex-wrap">
                <span>📝 Auto-saves to journal</span>
                {lastSessionNumber > 0 && (
                  <>
                    <span className="text-surface-500">·</span>
                    <span>🎲 Session #{lastSessionNumber}</span>
                  </>
                )}
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

            {/* Footer (0.2s stagger) */}
            <div
              className="shrink-0 px-4 py-3 border-t border-white/[0.06] flex items-center justify-between"
              style={{ animation: "slide-in-up 0.3s ease-out 0.2s forwards", opacity: 0 }}
            >
              <div className="text-[9px] text-surface-500">
                <kbd className="px-1 py-0.5 rounded bg-surface-800 border border-white/[0.06] text-[8px]">⌘↵</kbd> to save
                {lastSessionNumber > 0 && (
                  <>
                    <span className="ml-1.5">·</span>
                    <span className="ml-1">Session #{lastSessionNumber}</span>
                  </>
                )}
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
