/**
 * STᚱ VTT — Journal Editor (Premium v3.0)
 *
 * Rich editor for DM journal entries with:
 * - Title, type selector, tags, session number
 * - Full content editing with markdown preview mode
 * - Pin/Unpin entries for quick access
 * - Copy to clipboard for handouts and quests
 * - Word count, character count, relative timestamps
 * - Delete and save actions
 * - Read-only viewing with markdown rendering
 *
 * Replaced glass-gold with direct glass gradient + corner ornaments.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { JournalEntry, JournalEntryType } from "@/types";
import JournalMarkdownPreview from "./JournalMarkdownPreview";

interface JournalEditorProps {
  entry: JournalEntry | null;
  onSave: (entry: Partial<JournalEntry> & { id: string }) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  isNew?: boolean;
}

const ENTRY_TYPES: { type: JournalEntryType; label: string; icon: string }[] = [
  { type: "session", label: "Session", icon: "🎲" },
  { type: "quest", label: "Quest", icon: "⚔" },
  { type: "lore", label: "Lore", icon: "📜" },
  { type: "note", label: "Note", icon: "📝" },
  { type: "handout", label: "Handout", icon: "📄" },
];

const ALL_TAGS = [
  "combat", "roleplay", "exploration", "dungeon", "city",
  "wilderness", "underdark", "feywild", "shadowfell", "boss",
  "treasure", "npcs", "faction", "plot", "secret", "pc-backstory",
];

export default function JournalEditor({ entry, onSave, onDelete, onCreate, isNew }: JournalEditorProps) {
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [showPreview, setShowPreview] = useState(false);
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [type, setType] = useState<JournalEntryType>(entry?.type || "note");
  const [sessionNumber, setSessionNumber] = useState(entry?.sessionNumber || undefined);
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>(Date.now());

  // Auto-save: 3 seconds after the user stops typing
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryIdRef = useRef(entry?.id || null);
  entryIdRef.current = entry?.id || null;

  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (!entryIdRef.current) return; // only auto-save existing entries
    if (!isEditing) return;
    if (!title.trim()) return;

    autoSaveTimerRef.current = setTimeout(() => {
      onSave({
        id: entryIdRef.current!,
        title: title.trim(),
        content,
        type,
        sessionNumber,
        tags,
      });
      setLastSaved(Date.now());
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, content, type, sessionNumber, tags, isEditing, onSave]);

  // Reset form when entry changes
  useEffect(() => {
    setTitle(entry?.title || "");
    setContent(entry?.content || "");
    setType(entry?.type || "note");
    setSessionNumber(entry?.sessionNumber || undefined);
    setTags(entry?.tags || []);
    setIsEditing(isNew || false);
    setShowPreview(false);
  }, [entry?.id, isNew]);

  // ── Computed values ──
  const wordCount = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content]
  );
  const charCount = content.length;

  const relativeTime = useMemo(() => {
    if (!entry) return "";
    const diff = Date.now() - entry.updatedAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(entry.updatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [entry?.updatedAt]);

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    const id = entry?.id || `journal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    onSave({
      id,
      title: title.trim(),
      content,
      type,
      sessionNumber,
      tags,
      createdAt: entry?.createdAt || Date.now(),
    });
    setIsEditing(false);
    setShowPreview(false);
  }, [title, content, type, sessionNumber, tags, entry, onSave]);

  const handleDelete = useCallback(() => {
    if (!entry) return;
    onDelete(entry.id);
  }, [entry, onDelete]);

  const handleCancel = useCallback(() => {
    if (isNew) {
      onCreate();
      return;
    }
    setTitle(entry?.title || "");
    setContent(entry?.content || "");
    setType(entry?.type || "note");
    setSessionNumber(entry?.sessionNumber || undefined);
    setTags(entry?.tags || []);
    setIsEditing(false);
    setShowPreview(false);
  }, [isNew, entry, onCreate]);

  const addTag = useCallback(
    (tag: string) => {
      const t = tag.trim().toLowerCase();
      if (t && !tags.includes(t)) {
        setTags([...tags, t]);
      }
      setTagInput("");
    },
    [tags]
  );

  const removeTag = useCallback(
    (tag: string) => {
      setTags(tags.filter((t) => t !== tag));
    },
    [tags]
  );

  const handleCopy = useCallback(() => {
    if (!entry?.content) return;
    navigator.clipboard.writeText(entry.content).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  }, [entry]);

  const handleTogglePin = useCallback(() => {
    if (!entry) return;
    const isPinned = entry.tags?.includes("pinned") ?? false;
    const newTags = isPinned
      ? (entry.tags || []).filter((t) => t !== "pinned")
      : [...(entry.tags || []), "pinned"];
    onSave({ id: entry.id, tags: newTags });
  }, [entry, onSave]);

  const isPinned = entry?.tags?.includes("pinned") ?? false;

  // ── Empty / No Selection ──
  if (!entry && !isNew) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold-500/20 flex items-center justify-center">
            <span className="text-3xl drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">📖</span>
          </div>
          <p className="text-sm text-surface-500">Select a journal entry or create a new one</p>
          <button
            onClick={onCreate}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 active:scale-95 transition-all duration-200"
          >
            ✦ New Entry
          </button>
        </div>
      </div>
    );
  }

  // ── Read Only View ──
  if (!isEditing && entry) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type badge + meta */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pin indicator */}
            <button
              onClick={handleTogglePin}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-all active:scale-90 ${
                isPinned
                  ? "bg-gold-500/15 border border-gold-500/25 text-gold-400"
                  : "bg-transparent border border-transparent text-surface-500 hover:text-surface-400"
              }`}
              title={isPinned ? "Unpin entry" : "Pin entry for quick access"}
            >
              {isPinned ? "★" : "☆"}
            </button>

            <span className="text-[10px] px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/15 text-gold-400">
              {ENTRY_TYPES.find((t) => t.type === entry.type)?.icon}{" "}
              {ENTRY_TYPES.find((t) => t.type === entry.type)?.label}
            </span>
            {entry.sessionNumber && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">
                Session #{entry.sessionNumber}
              </span>
            )}

            {/* Relative timestamp */}
            <span className="text-[9px] text-surface-500" title={new Date(entry.updatedAt).toLocaleString()}>
              Updated {relativeTime}
            </span>

            {/* Copy button */}
            {entry.content && (
              <button
                onClick={handleCopy}
                className="ml-auto text-[9px] px-1.5 py-0.5 rounded text-surface-500 hover:text-surface-300 hover:bg-white/[0.03] active:scale-90 transition-all flex items-center gap-1"
              >
                {copyFeedback ? (
                  <>
                    <span>✓</span>
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Tags */}
          {entry.tags && entry.tags.filter((t) => t !== "pinned").length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags
                .filter((t) => t !== "pinned")
                .map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-surface-500"
                  >
                    #{tag}
                  </span>
                ))}
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl font-bold text-gold-200">{entry.title}</h2>

          {/* Content — Markdown rendered or plain */}
          <JournalMarkdownPreview content={entry.content || ""} />

          {/* Word/char count */}
          {entry.content && (
            <div className="text-[9px] text-surface-500 border-t border-white/[0.03] pt-3 flex items-center gap-3">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 border-t border-white/[0.03] px-6 py-3 flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 active:scale-95 transition-all duration-200"
          >
            ✏ Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg text-[10px] border border-red-500/15 text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
          >
            🗑 Delete
          </button>
        </div>
      </div>
    );
  }

  // ── Edit Mode ──
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Type selector */}
        <div className="flex flex-wrap gap-1">
          {ENTRY_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setType(t.type)}
              className={`text-[10px] px-2 py-1 rounded transition-all duration-150 active:scale-95 ${
                type === t.type
                  ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 text-gold-400 border border-gold-500/20"
                  : "text-surface-500 hover:text-surface-300 border border-transparent hover:border-white/[0.06]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Session number */}
        {type === "session" && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-surface-500">Session #</label>
            <input
              type="number"
              min={1}
              value={sessionNumber || ""}
              onChange={(e) =>
                setSessionNumber(e.target.value ? parseInt(e.target.value) : undefined)
              }
              className="w-16 py-1 px-2 rounded text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
            />
          </div>
        )}

        {/* Title input */}
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Entry title..."
            className="w-full py-2 px-3 rounded-lg text-sm font-bold bg-[#07080d]/70 border border-white/[0.06] text-gold-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-500 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-surface-500">
            {title.length}/120
          </span>
        </div>

        {/* Preview toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(false)}
            className={`text-[10px] px-2 py-0.5 rounded transition-all ${
              !showPreview
                ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 text-gold-400 border border-gold-500/20"
                : "text-surface-500 border border-transparent hover:text-surface-300"
            }`}
          >
            ✏ Edit
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`text-[10px] px-2 py-0.5 rounded transition-all ${
              showPreview
                ? "bg-gradient-to-br from-gold-500/12 to-amber-500/8 text-gold-400 border border-gold-500/20"
                : "text-surface-500 border border-transparent hover:text-surface-300"
            }`}
          >
            👁 Preview
          </button>
        </div>

        {/* Content textarea or markdown preview */}
        {showPreview ? (
          <div className="rounded-xl bg-[#07080d]/50 border border-white/[0.04] p-4 min-h-[200px]">
            <JournalMarkdownPreview content={content} />
            {!content.trim() && (
              <span className="text-surface-500 italic text-[12px]">Nothing to preview</span>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your journal entry here... Use **bold**, *italic*, `code`, - lists, or # headers for markdown."
            rows={12}
            className="w-full py-2 px-3 rounded-lg text-xs leading-relaxed bg-[#07080d]/70 border border-white/[0.06] text-surface-300 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-500 resize-y min-h-[200px] transition-all"
          />
        )}

        {/* Word/char count */}
        <div className="text-[9px] text-surface-500 flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          {entryIdRef.current && (
            <span className="text-[7px] text-gold-500/50 ml-auto">
              {Date.now() - lastSaved < 4000 ? "Saving..." : "Auto-saved"}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-surface-500">Tags</label>
          <div className="flex flex-wrap gap-1 mb-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/15 text-gold-400 flex items-center gap-1"
              >
                #{tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-gold-400/50 hover:text-gold-300 active:scale-90"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Add a tag..."
              className="flex-1 py-1 px-2 rounded text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-500 transition-all"
            />
            <button
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
              className="px-2 py-1 rounded text-[10px] bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 disabled:opacity-30 transition-all"
            >
              Add
            </button>
          </div>
          {/* Quick tag suggestions */}
          <div className="flex flex-wrap gap-0.5">
            {ALL_TAGS.filter((t) => !tags.includes(t))
              .slice(0, 8)
              .map((t) => (
                <button
                  key={t}
                  onClick={() => addTag(t)}
                  className="text-[8px] px-1 py-0.5 rounded bg-white/[0.02] border border-white/[0.04] text-surface-500 hover:text-surface-400 hover:border-white/[0.08] active:scale-95 transition-all"
                >
                  +{t}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="shrink-0 border-t border-white/[0.03] px-6 py-3 flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 disabled:opacity-30 transition-all duration-200"
        >
          💾 Save Entry
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 rounded-lg text-[10px] border border-white/[0.06] text-surface-500 hover:text-surface-300 active:scale-95 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
