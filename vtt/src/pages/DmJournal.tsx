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
  handout: { icon: "📋", label: "Handout", color: "text-warrior-400 bg-warrior-500/10" },
};

export function DmJournal() {
  const journal = useCampaignStore((s) => s.campaign?.journal ?? []);
  const addJournalEntry = useCampaignStore((s) => s.addJournalEntry);
  const updateJournalEntry = useCampaignStore((s) => s.updateJournalEntry);
  const removeJournalEntry = useCampaignStore((s) => s.removeJournalEntry);
  const showToast = useUiStore((s) => s.showToast);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "title" | "type">("date");
  const [filterType, setFilterType] = useState<JournalEntry["type"] | "all">("all");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [deleteEntry, setDeleteEntry] = useState<JournalEntry | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Collect all unique tags across all entries
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    journal.forEach((entry) => entry.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [journal]);

  // Track which tags are selected for filtering
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = [...journal];
    if (filterType !== "all") list = list.filter((e) => e.type === filterType);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedTags.size > 0) {
      list = list.filter((e) => e.tags?.some((t) => selectedTags.has(t)));
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "title": return a.title.localeCompare(b.title);
        case "type": return a.type.localeCompare(b.type);
        default: return b.createdAt - a.createdAt;
      }
    });
    return list;
  }, [journal, searchQuery, sortKey, filterType, selectedTags]);

  const handleCreate = () => {
    setEditingEntry({
      id: uid("je"),
      title: "",
      content: "",
      tags: [],
      type: "note",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setIsNewEntry(true);
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry({ ...entry });
    setIsNewEntry(false);
  };

  const handleSave = () => {
    if (!editingEntry) return;
    const now = Date.now();
    const entry = { ...editingEntry, updatedAt: now };

    if (isNewEntry) {
      addJournalEntry(entry);
      showToast({ message: `"${entry.title}" created.`, type: "success" });
    } else {
      updateJournalEntry(entry.id, entry);
      showToast({ message: `"${entry.title}" updated.`, type: "success" });
    }
    setEditingEntry(null);
    setIsNewEntry(false);
  };

  const handleDelete = () => {
    if (!deleteEntry) return;
    removeJournalEntry(deleteEntry.id);
    showToast({ message: `"${deleteEntry.title}" deleted.`, type: "info" });
    setDeleteEntry(null);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleClearTags = () => {
    setSelectedTags(new Set());
    setTagFilter(null);
  };

  const entryTypes: { value: JournalEntry["type"] | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "session", label: "Session" },
    { value: "note", label: "Note" },
    { value: "lore", label: "Lore" },
    { value: "quest", label: "Quest" },
    { value: "handout", label: "Handout" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">DM Journal</h2>
          <p className="mt-1 text-sm text-surface-400">
            {journal.length} entr{journal.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="xs" onClick={() => setShowTagManager(true)}>🏷️ Tags</Button>
          <Button size="sm" onClick={handleCreate}>+ New Entry</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search entries..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">✕</button>
          )}
        </div>

        <div className="flex gap-1 rounded-lg bg-surface-850 p-0.5 overflow-x-auto">
          {entryTypes.map((t) => (
            <button key={t.value} onClick={() => setFilterType(t.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${filterType === t.value ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-lg bg-surface-850 p-0.5">
          {(["date", "title", "type"] as const).map((key) => (
            <button key={key} onClick={() => setSortKey(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${sortKey === key ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}>
              {key === "date" ? "📅 Date" : key === "title" ? "📄 Title" : "🏷️ Type"}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Entry List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-12 text-center">
          <span className="text-4xl">📓</span>
          <p className="mt-3 text-sm text-surface-500">
            {journal.length === 0 ? "No journal entries yet. Start chronicling your campaign!" : "No entries match your filters."}
          </p>
          {journal.length === 0 && (
            <Button className="mt-4" size="sm" onClick={handleCreate}>
              + First Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const typeCfg = ENTRY_TYPE_CONFIG[entry.type];
            const dateStr = new Date(entry.createdAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
            return (
              <div key={entry.id}
                className="group rounded-xl border border-surface-700 bg-surface-850 p-4 transition-all hover:border-surface-600 cursor-pointer"
                onClick={() => handleEdit(entry)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${typeCfg.color}`}>
                        {typeCfg.icon} {typeCfg.label}
                      </span>
                      {entry.sessionNumber && (
                        <span className="text-[10px] text-surface-500">S{entry.sessionNumber}</span>
                      )}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-surface-100 truncate group-hover:text-accent-300 transition-colors">
                      {entry.title || "Untitled"}
                    </h3>
                    <p className="mt-0.5 text-xs text-surface-500 line-clamp-2">{entry.content || "No content."}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-surface-600">{dateStr}</span>
                      {entry.tags && entry.tags.length > 0 && entry.tags.map((tag) => (
                        <Badge key={tag} size="xs" variant={selectedTags.has(tag) ? "accent" : "neutral"}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteEntry(entry); }}
                    className="shrink-0 rounded p-1 text-surface-600 opacity-0 group-hover:opacity-100 hover:text-warrior-400 transition-all">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Editor Modal */}
      {editingEntry && (
        <Modal
          modalId="journal-editor"
          title={isNewEntry ? "New Journal Entry" : `Edit: ${editingEntry.title}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-surface-400">Title</label>
              <input value={editingEntry.title} onChange={(e) => setEditingEntry({ ...editingEntry, title: e.target.value })}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-400">Type</label>
                <select value={editingEntry.type} onChange={(e) => setEditingEntry({ ...editingEntry, type: e.target.value as JournalEntry["type"] })}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent-500 focus:outline-none">
                  {entryTypes.filter((t) => t.value !== "all").map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-surface-400">Session #</label>
                <input type="number" min={0} value={editingEntry.sessionNumber ?? ""}
                  onChange={(e) => setEditingEntry({ ...editingEntry, sessionNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-surface-400">Tags (comma-separated)</label>
              <input value={(editingEntry.tags ?? []).join(", ")} onChange={(e) =>
                setEditingEntry({ ...editingEntry, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-surface-400">Content (Markdown supported)</label>
              <textarea value={editingEntry.content} onChange={(e) => setEditingEntry({ ...editingEntry, content: e.target.value })}
                rows={10}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none font-mono" />
            </div>

            <div className="flex justify-end gap-2 border-t border-surface-700 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setEditingEntry(null)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={!editingEntry.title.trim()}>
                {isNewEntry ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteEntry && (
        <ConfirmDialog
          title={`Delete "${deleteEntry.title}"?`}
          message="This action cannot be undone. The entry will be permanently removed."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteEntry(null)}
        />
      )}

      {/* Tag Manager Modal */}
      {showTagManager && (
        <Modal modalId="tag-manager" title="🏷️ Tag Manager" size="md">
          <TagManager
            selectedTags={selectedTags}
            onToggleTag={handleToggleTag}
            onClearTags={handleClearTags}
          />
        </Modal>
      )}
    </div>
  );
}
