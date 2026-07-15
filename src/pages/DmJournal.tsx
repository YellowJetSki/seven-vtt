/* ── DM Journal ────────────────────────────────────────────────
 * Full journal management with CRUD, tag filtering, search,
 * type badges, session numbering, and tag management.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TagManager } from "@/components/journal/TagManager";
import type { JournalEntry } from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const ENTRY_TYPE_CONFIG: Record<JournalEntry["type"], { icon: string; label: string; color: string }> = {
  session: { icon: "🎲", label: "Session", color: "text-accent-400 bg-accent-500/10" },
  note: { icon: "📝", label: "Note", color: "text-mage-400 bg-mage-500/10" },
  lore: { icon: "📜", label: "Lore", color: "text-divine-400 bg-divine-500/10" },
  quest: { icon: "⚔", label: "Quest", color: "text-rogue-400 bg-rogue-500/10" },
};

export function DmJournal() {
  const journal = useCampaignStore((s) => s.campaign?.journal ?? []);
  const addJournalEntry = useCampaignStore((s) => s.addJournalEntry);
  const updateJournalEntry = useCampaignStore((s) => s.updateJournalEntry);
  const removeJournalEntry = useCampaignStore((s) => s.removeJournalEntry);
  const showToast = useUiStore((s) => s.showToast);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<JournalEntry["type"] | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<JournalEntry | null>(null);

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const nextSessionNumber = useMemo(() => {
    const sessions = journal.filter((e) => e.type === "session");
    return sessions.length + 1;
  }, [journal]);

  const filteredEntries = useMemo(() => {
    let list = [...journal];
    if (typeFilter !== "all") list = list.filter((e) => e.type === typeFilter);
    if (selectedTags.size > 0) list = list.filter((e) => e.tags.some((t) => selectedTags.has(t)));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q)));
    }
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  }, [journal, searchQuery, typeFilter, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setSelectedEntry(null);
    setShowForm(true);
  };

  const handleDelete = (entry: JournalEntry) => {
    removeJournalEntry(entry.id);
    setSelectedEntry(null);
    setConfirmDelete(null);
    showToast({ message: `"${entry.title}" deleted.`, type: "info" });
  };

  const handleSave = (data: JournalEntry) => {
    if (editingEntry) {
      updateJournalEntry(editingEntry.id, data);
      showToast({ message: `"${data.title}" updated.`, type: "success" });
    } else {
      addJournalEntry(data);
      showToast({ message: `"${data.title}" added!`, type: "success" });
    }
    setShowForm(false);
    setEditingEntry(undefined);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">DM Journal</h2>
          <p className="mt-1 text-sm text-surface-400">{journal.length} entr{journal.length !== 1 ? "ies" : "y"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { setEditingEntry(undefined); setShowForm(true); }}>
            + New Entry
          </Button>
        </div>
      </div>

      {/* Search + Type Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search journal..."
              className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">✕</button>
            )}
          </div>
          <div className="flex gap-1 rounded-lg bg-surface-850 p-1 overflow-x-auto">
            {(["all", "session", "note", "lore", "quest"] as const).map((type) => (
              <button key={type} onClick={() => setTypeFilter(type)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  typeFilter === type ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
                }`}>
                {type === "all" ? "All" : ENTRY_TYPE_CONFIG[type]?.icon + " " + ENTRY_TYPE_CONFIG[type]?.label}
              </button>
            ))}
          </div>
        </div>
        <TagManager selectedTags={selectedTags} onToggleTag={toggleTag} onClearTags={() => setSelectedTags(new Set())} />
      </div>

      {/* Journal Entry List */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16">
          <span className="text-4xl text-surface-600">{searchQuery || selectedTags.size > 0 ? "🔍" : "📖"}</span>
          <p className="mt-3 text-sm text-surface-500">
            {searchQuery || selectedTags.size > 0 ? "No entries match your filters." : "No journal entries yet."}
          </p>
          {!searchQuery && selectedTags.size === 0 && (
            <Button className="mt-4" size="sm" onClick={() => { setEditingEntry(undefined); setShowForm(true); }}>
              + First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const config = ENTRY_TYPE_CONFIG[entry.type];
            const isSelected = selectedEntry?.id === entry.id;
            return (
              <div key={entry.id}
                className={`rounded-xl border p-4 transition-all cursor-pointer ${
                  isSelected
                    ? "border-accent-500/50 bg-accent-500/5"
                    : "border-surface-700 bg-surface-850 hover:border-surface-600"
                }`}
                onClick={() => setSelectedEntry(isSelected ? null : entry)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${config.color}`}>
                        {config.icon} {config.label}
                      </span>
                      <h3 className="text-sm font-semibold text-surface-100 truncate">{entry.title}</h3>
                      {entry.sessionNumber && (
                        <Badge variant="neutral" size="xs">S{entry.sessionNumber}</Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-surface-400 line-clamp-2 leading-relaxed">{entry.content}</p>
                    {entry.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="rounded bg-surface-800 px-1.5 py-0.5 text-[10px] text-surface-500">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-surface-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                </div>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-2 border-t border-surface-700 pt-3">
                    <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(entry); }}>
                      ✏️ Edit
                    </Button>
                    <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setConfirmDelete(entry); }}>
                      🗑️ Delete
                    </Button>
                    <span className="text-[10px] text-surface-500 ml-auto">
                      Updated {new Date(entry.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Entry"
          message={`Are you sure you want to delete "${confirmDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <Modal
          modalId="journal-form"
          title={editingEntry ? `Edit: ${editingEntry.title}` : "New Journal Entry"}
          size="lg"
        >
          <JournalForm
            existingEntry={editingEntry}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingEntry(undefined); }}
            nextSessionNumber={nextSessionNumber}
          />
        </Modal>
      )}
    </div>
  );
}

/* ── Journal Form ────────────────────────────────────────────── */

function JournalForm({
  existingEntry,
  onSave,
  onCancel,
  nextSessionNumber,
}: {
  existingEntry?: JournalEntry;
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
  nextSessionNumber: number;
}) {
  const [title, setTitle] = useState(existingEntry?.title ?? "");
  const [content, setContent] = useState(existingEntry?.content ?? "");
  const [type, setType] = useState<JournalEntry["type"]>(existingEntry?.type ?? "note");
  const [isSession, setIsSession] = useState(existingEntry?.type === "session");
  const [sessionNumber, setSessionNumber] = useState(existingEntry?.sessionNumber ?? nextSessionNumber);
  const [tags, setTags] = useState<string[]>(existingEntry?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    const entry: JournalEntry = {
      id: existingEntry?.id ?? uid("journal"),
      title: title.trim(),
      content: content.trim(),
      type: isSession ? "session" : type,
      sessionNumber: isSession ? sessionNumber : undefined,
      tags,
      createdAt: existingEntry?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    onSave(entry);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>

      {/* Type Selection */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-surface-850 p-0.5">
          {(["note", "lore", "quest"] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); setIsSession(false); }}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                !isSession && type === t ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"
              }`}>
              {ENTRY_TYPE_CONFIG[t]?.icon} {ENTRY_TYPE_CONFIG[t]?.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isSession} onChange={(e) => setIsSession(e.target.checked)}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500" />
          <span className="text-xs text-surface-300">🎲 Session {sessionNumber}</span>
        </label>
      </div>

      {/* Content */}
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8}
          placeholder="Write your journal entry..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-y min-h-[120px]" />
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Tags</label>
        <div className="flex gap-1">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag..."
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())} />
          <Button size="xs" variant="secondary" onClick={handleAddTag} disabled={!tagInput.trim()}>+</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-full bg-surface-800 px-2.5 py-1 text-[11px] text-surface-300">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="text-surface-500 hover:text-warrior-400">✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={!title.trim() || !content.trim()}>
          {existingEntry ? "Update" : "Create"} Entry
        </Button>
      </div>
    </div>
  );
}
