/**
 * STᚱ VTT — Journal Editor
 *
 * Rich editor for DM journal entries with:
 * - Title, type selector, tags
 * - Full content editing
 * - Session number for session entries
 * - Delete and save actions
 * - Read-only viewing when not editing
 */

import { useState, useCallback, useEffect } from "react";
import type { JournalEntry, JournalEntryType } from "@/types";

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
const ALL_TAGS = ["combat", "roleplay", "exploration", "dungeon", "city", "wilderness", "underdark", "feywild", "shadowfell", "boss", "treasure", "npcs", "faction"];

export default function JournalEditor({ entry, onSave, onDelete, onCreate, isNew }: JournalEditorProps) {
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [type, setType] = useState<JournalEntryType>(entry?.type || "note");
  const [sessionNumber, setSessionNumber] = useState(entry?.sessionNumber || undefined);
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Reset form when entry changes
  useEffect(() => {
    setTitle(entry?.title || "");
    setContent(entry?.content || "");
    setType(entry?.type || "note");
    setSessionNumber(entry?.sessionNumber || undefined);
    setTags(entry?.tags || []);
    setIsEditing(isNew || false);
  }, [entry?.id, isNew]);

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
  }, [title, content, type, sessionNumber, tags, entry, onSave]);

  const handleDelete = useCallback(() => {
    if (!entry) return;
    onDelete(entry.id);
  }, [entry, onDelete]);

  const handleCancel = useCallback(() => {
    if (isNew) {
      onCreate(); // Cancel new = go back to empty state
      return;
    }
    setTitle(entry?.title || "");
    setContent(entry?.content || "");
    setType(entry?.type || "note");
    setSessionNumber(entry?.sessionNumber || undefined);
    setTags(entry?.tags || []);
    setIsEditing(false);
  }, [isNew, entry, onCreate]);

  const addTag = useCallback((tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  }, [tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  }, [tags]);

  // ── Empty / No Selection ──
  if (!entry && !isNew) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-3xl">📖</div>
          <p className="text-sm text-surface-500">Select a journal entry or create a new one</p>
          <button
            onClick={onCreate}
            className="px-3 py-1.5 rounded text-[11px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
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
            <span className="text-[10px] px-2 py-0.5 rounded bg-gold-500/10 border border-gold/15 text-gold-400">
              {ENTRY_TYPES.find((t) => t.type === entry.type)?.icon} {ENTRY_TYPES.find((t) => t.type === entry.type)?.label}
            </span>
            {entry.sessionNumber && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400">
                Session #{entry.sessionNumber}
              </span>
            )}
            <span className="text-[9px] text-surface-600">
              Updated {new Date(entry.updatedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-surface-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl font-bold text-gold-200">{entry.title}</h2>

          {/* Content */}
          <div className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
            {entry.content || <span className="text-surface-600 italic">No content</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 border-t border-white/[0.03] px-6 py-3 flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 rounded text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all"
          >
            ✏ Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 rounded text-[10px] border border-red-500/15 text-red-400 hover:bg-red-500/10 active:scale-95 transition-all"
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
                  ? "bg-gold-500/10 text-gold-400 border border-gold/20"
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
              onChange={(e) => setSessionNumber(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-16 py-1 px-2 rounded text-[10px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
            />
          </div>
        )}

        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title..."
          className="w-full py-2 px-3 rounded-lg text-sm font-bold bg-[#07080d] border border-white/[0.06] text-gold-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700"
        />

        {/* Content textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your journal entry here... Use markdown or plain text."
          rows={12}
          className="w-full py-2 px-3 rounded-lg text-xs leading-relaxed bg-[#07080d] border border-white/[0.06] text-surface-300 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700 resize-y min-h-[200px]"
        />

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-surface-500">Tags</label>
          <div className="flex flex-wrap gap-1 mb-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold/15 text-gold-400 flex items-center gap-1"
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
              className="flex-1 py-1 px-2 rounded text-[10px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-600"
            />
            <button
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
              className="px-2 py-1 rounded text-[10px] bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 disabled:opacity-30 transition-all"
            >
              Add
            </button>
          </div>
          {/* Quick tag suggestions */}
          <div className="flex flex-wrap gap-0.5">
            {ALL_TAGS.filter((t) => !tags.includes(t)).slice(0, 6).map((t) => (
              <button
                key={t}
                onClick={() => addTag(t)}
                className="text-[8px] px-1 py-0.5 rounded bg-white/[0.02] border border-white/[0.04] text-surface-600 hover:text-surface-400 hover:border-white/[0.08] active:scale-95 transition-all"
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
          className="px-4 py-1.5 rounded text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 disabled:opacity-30 transition-all"
        >
          💾 Save Entry
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 rounded text-[10px] border border-white/[0.06] text-surface-500 hover:text-surface-300 active:scale-95 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
