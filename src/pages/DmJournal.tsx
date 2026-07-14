import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { JournalEntry } from "@/types";

const ENTRY_TYPE_CONFIG: Record<JournalEntry["type"], { icon: string; label: string; color: string }> = {
  session: { icon: "🎲", label: "Session", color: "text-accent-400 bg-accent-500/10" },
  note: { icon: "📝", label: "Note", color: "text-mage-400 bg-mage-500/10" },
  lore: { icon: "📜", label: "Lore", color: "text-divine-400 bg-divine-500/10" },
  quest: { icon: "⚔", label: "Quest", color: "text-rogue-400 bg-rogue-500/10" },
};

export function DmJournal() {
  const journal = useCampaignStore((s) => s.campaign?.journal ?? []);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<JournalEntry["type"] | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    journal.forEach((entry) => entry.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [journal]);

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const filteredEntries = useMemo(() => {
    let list = [...journal];

    if (typeFilter !== "all") {
      list = list.filter((e) => e.type === typeFilter);
    }

    if (selectedTags.size > 0) {
      list = list.filter((e) => e.tags.some((t) => selectedTags.has(t)));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    list.sort((a, b) => b.createdAt - a.createdAt);

    return list;
  }, [journal, typeFilter, selectedTags, searchQuery]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">
            DM Journal
          </h2>
          <p className="mt-1 text-sm text-surface-400">
            {journal.length} entr{journal.length === 1 ? "y" : "ies"} · Session notes, lore, and quest tracking
          </p>
        </div>
        <Button size="sm">+ New Entry</Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === "all"
                ? "bg-accent-500/15 text-accent-400"
                : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
            }`}
          >
            All
          </button>
          {(Object.entries(ENTRY_TYPE_CONFIG) as [JournalEntry["type"], typeof ENTRY_TYPE_CONFIG["session"]][]).map(
            ([type, config]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === type
                    ? `${config.color}`
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                }`}
              >
                {config.icon} {config.label}
              </button>
            ),
          )}
        </div>

        {allTags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  selectedTags.has(tag)
                    ? "bg-accent-500/20 text-accent-400"
                    : "bg-surface-800 text-surface-500 hover:bg-surface-700 hover:text-surface-300"
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button
                onClick={() => setSelectedTags(new Set())}
                className="text-[11px] text-warrior-400 hover:text-warrior-300 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Journal Entries */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16">
          <span className="text-4xl text-surface-600">
            {searchQuery || typeFilter !== "all" || selectedTags.size > 0 ? "🔍" : "📖"}
          </span>
          <p className="mt-3 text-sm text-surface-500">
            {searchQuery || typeFilter !== "all" || selectedTags.size > 0
              ? "No entries match your filters."
              : "Your journal is empty. Start chronicling the Arkla campaign!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const typeConfig = ENTRY_TYPE_CONFIG[entry.type];
            return (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="w-full text-left rounded-xl border border-surface-700 bg-surface-850 p-4 transition-all hover:border-surface-600 hover:bg-surface-800 focus-visible:outline-2 focus-visible:outline-accent-500"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${typeConfig.color}`}>
                        {typeConfig.icon} {typeConfig.label}
                      </span>
                      {entry.sessionNumber && (
                        <span className="text-[10px] text-surface-500">
                          Session #{entry.sessionNumber}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 font-semibold text-surface-100">{entry.title}</h3>
                    <p className="mt-1 text-sm text-surface-500 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                  <span className="text-xs text-surface-500 shrink-0 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {entry.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} size="xs" variant="accent">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <Modal
          modalId="journal-entry-detail"
          title={selectedEntry.title}
          size="lg"
        >
          <JournalEntryDetail entry={selectedEntry} />
        </Modal>
      )}
    </div>
  );
}

/* ── Journal Entry Detail ───────────────────────────────────── */

function JournalEntryDetail({ entry }: { entry: JournalEntry }) {
  const typeConfig = ENTRY_TYPE_CONFIG[entry.type];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`rounded-md px-2.5 py-0.5 text-xs font-medium ${typeConfig.color}`}>
          {typeConfig.icon} {typeConfig.label}
        </span>
        {entry.sessionNumber && (
          <span className="text-xs text-surface-500">Session #{entry.sessionNumber}</span>
        )}
        <span className="text-xs text-surface-500">
          {new Date(entry.createdAt).toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="rounded-lg bg-surface-800 p-4">
        <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
          {entry.content}
        </p>
      </div>

      {entry.tags.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
            Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <Badge key={tag} variant="accent">#{tag}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
