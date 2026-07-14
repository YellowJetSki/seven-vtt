/* ── DM Journal ────────────────────────────────────────────────
 * Full journal management with CRUD, tag filtering, search,
 * type badges, and session numbering.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    journal.forEach((entry) => entry.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [journal]);

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

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
          <Button variant="ghost" size="xs" onClick={() => { setSelectedTags(new Set()); setTypeFilter("all"); }}>
            {selectedTags.size > 0 || typeFilter !== "all" ? "Clear filters" : "All entries"}
          </Button>
          <Button size="sm" onClick={() => { setEditingEntry(undefined); setShowForm(true); }}>+ New Entry</Button>
        </div>
      </div>

      {/* Search + Type Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search entries..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "session", "note", "lore", "quest"] as const).map((type) => (
            <button key={type} onClick={() => setTypeFilter(type)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${typeFilter === type ? "bg-accent-500/15 text-accent-300" : "text-surface-500 hover:bg-surface-800 hover:text-surface-300"}`}>
              {type === "all" ? "All" : ENTRY_TYPE_CONFIG[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button key={tag} onClick={() => toggleTag(tag)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors ${selectedTags.has(tag) ? "bg-accent-500/20 text-accent-300" : "bg-surface-800 text-surface-500 hover:text-surface-300"}`}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Entry List */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16">
          <span className="text-4xl text-surface-600">{searchQuery || typeFilter !== "all" ? "🔍" : "📖"}</span>
          <p className="mt-3 text-sm text-surface-500">{searchQuery ? `No entries match "${searchQuery}".` : "No journal entries yet. Start documenting your campaign!"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry) => (
            <button key={entry.id} onClick={() => setSelectedEntry(entry)}
              className="w-full text-left rounded-lg border border-surface-700 bg-surface-850 p-4 transition-all hover:border-surface-600 hover:bg-surface-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${ENTRY_TYPE_CONFIG[entry.type].color}`}>
                      {ENTRY_TYPE_CONFIG[entry.type].icon} {ENTRY_TYPE_CONFIG[entry.type].label}
                    </span>
                    <h3 className="text-sm font-semibold text-surface-200 truncate">{entry.title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-surface-500 line-clamp-2">{entry.content}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {entry.tags.map((tag) => <span key={tag} className="text-[10px] text-surface-500">#{tag}</span>)}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-surface-600">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  {entry.sessionNumber && <Badge variant="accent">S{entry.sessionNumber}</Badge>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <Modal modalId="journal-detail" title={selectedEntry.title} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ENTRY_TYPE_CONFIG[selectedEntry.type].color}`}>
                {ENTRY_TYPE_CONFIG[selectedEntry.type].icon} {ENTRY_TYPE_CONFIG[selectedEntry.type].label}
              </span>
              {selectedEntry.sessionNumber && <Badge variant="accent">Session {selectedEntry.sessionNumber}</Badge>}
              <span className="text-xs text-surface-500">{new Date(selectedEntry.createdAt).toLocaleString()}</span>
            </div>
            <div className="whitespace-pre-wrap text-sm text-surface-300 leading-relaxed">{selectedEntry.content}</div>
            <div className="flex flex-wrap gap-1.5">
              {selectedEntry.tags.map((tag) => <span key={tag} className="rounded-full bg-surface-800 px-2.5 py-0.5 text-xs text-surface-400">#{tag}</span>)}
            </div>
            <div className="flex justify-between border-t border-surface-700 pt-3">
              <Button variant="ghost" size="xs" onClick={() => setConfirmDelete(selectedEntry)}>🗑️ Delete</Button>
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" onClick={() => setSelectedEntry(null)}>Close</Button>
                <Button size="xs" onClick={() => handleEdit(selectedEntry)}>Edit</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Entry Form Modal */}
      {showForm && (
        <Modal modalId="journal-form" title={editingEntry ? `Edit: ${editingEntry.title}` : "New Journal Entry"} size="lg">
          <JournalForm
            initialData={editingEntry}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingEntry(undefined); }}
          />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Entry"
          message={`Are you sure you want to delete "${confirmDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

/* ── Journal Entry Form ─────────────────────────────────────── */

function JournalForm({
  initialData,
  onSave,
  onCancel,
}: {
  initialData?: JournalEntry;
  onSave: (entry: JournalEntry) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [type, setType] = useState<JournalEntry["type"]>(initialData?.type ?? "note");
  const [sessionNumber, setSessionNumber] = useState(initialData?.sessionNumber ?? undefined);
  const [tagsInput, setTagsInput] = useState(initialData?.tags.join(", ") ?? "");
  const campaign = useCampaignStore((s) => s.campaign);

  const currentSessionNumber = campaign?.journal.filter((e) => e.type === "session").length ?? 0;
  const suggestedNumber = type === "session" ? (sessionNumber ?? currentSessionNumber + 1) : undefined;

  const handleSubmit = () => {
    if (!title.trim()) return;
    const tags = tagsInput.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const entry: JournalEntry = {
      id: initialData?.id ?? uid("jrn"),
      title: title.trim(),
      content: content.trim(),
      tags,
      type,
      sessionNumber: type === "session" ? (sessionNumber ?? currentSessionNumber + 1) : undefined,
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    onSave(entry);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as JournalEntry["type"])}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent-500 focus:outline-none">
            <option value="session">Session</option>
            <option value="note">Note</option>
            <option value="lore">Lore</option>
            <option value="quest">Quest</option>
          </select>
        </div>
        {type === "session" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-surface-400">Session Number</label>
            <input type="number" min={1} value={sessionNumber ?? suggestedNumber ?? ""} onChange={(e) => setSessionNumber(parseInt(e.target.value) || undefined)}
              placeholder="Auto"
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
          </div>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10} placeholder="Write your journal entry here..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-y min-h-[200px]" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Tags (comma-separated)</label>
        <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. combat, session, loot, lore"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          {initialData ? "Update Entry" : "Create Entry"}
        </Button>
      </div>
    </div>
  );
}
