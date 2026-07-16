/* ── Campaign Timeline View ─────────────────────────────────────
 * Visual timeline showing journal entries as connected nodes.
 * Sessions appear as major nodes, with related quests and lore
 * branching off as child nodes.
 * ──────────────────────────────────────────────────────────────── */
import { useMemo, useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { JournalEntry } from "@/types";

const TYPE_ICONS: Record<string, string> = {
  session: "📜",
  lore: "📖",
  quest: "⚔️",
  note: "📝",
  handout: "🖼️",
};

const TYPE_COLORS: Record<string, string> = {
  session: "border-accent-500 bg-accent-500/20",
  lore: "border-mage-500 bg-mage-500/20",
  quest: "border-warrior-500 bg-warrior-500/20",
  note: "border-surface-500 bg-surface-500/20",
  handout: "border-divine-500 bg-divine-500/20",
};

export function CampaignTimeline() {
  const journal = useCampaignStore((s) => s.journal ?? []);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Sort entries by date/session number
  const sortedEntries = useMemo(() => {
    return [...journal].sort((a, b) => {
      const aSession = a.sessionNumber ?? 0;
      const bSession = b.sessionNumber ?? 0;
      if (aSession !== bSession) return bSession - aSession;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
  }, [journal]);

  if (sortedEntries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-surface-700 bg-surface-850 p-8 text-center">
        <p className="text-3xl mb-2">📅</p>
        <p className="text-sm text-surface-400">No journal entries yet</p>
        <p className="text-xs text-surface-500 mt-1">Create entries to build your campaign timeline</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline spine */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-surface-700" />

      <div className="space-y-4">
        {sortedEntries.map((entry, i) => {
          const colorClass = TYPE_COLORS[entry.type] ?? TYPE_COLORS.note;
          const isSelected = selectedEntry?.id === entry.id;

          return (
            <div key={entry.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div className={`h-3 w-3 rounded-full border-2 mt-1.5 ${colorClass}`} />
                {i < sortedEntries.length - 1 && (
                  <div className="absolute top-3 left-1.5 bottom-0 w-0.5 bg-surface-700" />
                )}
              </div>

              {/* Entry card */}
              <div
                className={`flex-1 min-w-0 rounded-lg border bg-surface-850 p-3 cursor-pointer transition-all hover:border-surface-600 ${
                  isSelected ? "border-accent-500/50 ring-1 ring-accent-500/20" : "border-surface-700"
                }`}
                onClick={() => setSelectedEntry(isSelected ? null : entry)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{TYPE_ICONS[entry.type] ?? "📝"}</span>
                  <p className="text-sm font-medium text-surface-200 truncate">
                    {entry.title}
                  </p>
                  {entry.sessionNumber && (
                    <span className="text-[10px] text-surface-500 bg-surface-800 px-1.5 py-0.5 rounded">
                      S{entry.sessionNumber}
                    </span>
                  )}
                  {entry.sessionDate && (
                    <span className="text-[10px] text-surface-500 ml-auto">
                      {new Date(entry.sessionDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entry.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-surface-400 bg-surface-800 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                    {entry.tags.length > 4 && (
                      <span className="text-[10px] text-surface-500">
                        +{entry.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Expanded content */}
                {isSelected && entry.content && (
                  <div className="mt-2 pt-2 border-t border-surface-700">
                    <p className="text-xs text-surface-400 leading-relaxed whitespace-pre-wrap line-clamp-6">
                      {entry.content}
                    </p>
                    {entry.content.length > 500 && (
                      <p className="text-[10px] text-accent-500 mt-1">(scroll for more)</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
