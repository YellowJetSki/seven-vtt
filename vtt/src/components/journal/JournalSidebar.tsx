/**
 * STᚱ VTT — Journal Sidebar (Enhanced — Sprint 14)
 *
 * Left sidebar with session grouping, type filter tabs, search,
 * pinned entries at top, and entry list with relative timestamps.
 * Shows session entries grouped by session number
 * with quest pins and lore markers.
 */

import { useMemo, useState } from "react";
import type { JournalEntry, JournalEntryType } from "@/types";

const ENTRY_TYPES: { type: JournalEntryType | "all"; label: string; icon: string }[] = [
  { type: "all", label: "All", icon: "📋" },
  { type: "session", label: "Sessions", icon: "🎲" },
  { type: "quest", label: "Quests", icon: "⚔" },
  { type: "lore", label: "Lore", icon: "📜" },
  { type: "note", label: "Notes", icon: "📝" },
  { type: "handout", label: "Handouts", icon: "📄" },
];

interface JournalSidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (id: string) => void;
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function JournalSidebar({ entries, activeEntryId, onSelectEntry }: JournalSidebarProps) {
  const [filterType, setFilterType] = useState<JournalEntryType | "all">("all");
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (filterType !== "all") {
      result = result.filter((e) => e.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => {
      // Pinned first
      const aPinned = a.tags?.includes("pinned") ?? false;
      const bPinned = b.tags?.includes("pinned") ?? false;
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [entries, filterType, search]);

  // Group by session number or date
  const groupedEntries = useMemo(() => {
    const groups: { label: string; entries: JournalEntry[] }[] = [];
    const pinned = filteredEntries.filter((e) => e.tags?.includes("pinned"));
    const unpinned = filteredEntries.filter((e) => !e.tags?.includes("pinned"));

    // Pinned group
    if (pinned.length > 0) {
      groups.push({ label: "📌 Pinned", entries: pinned });
    }

    // Sessions group
    const sessionEntries = unpinned.filter((e) => e.type === "session");
    const otherEntries = unpinned.filter((e) => e.type !== "session");

    if (sessionEntries.length > 0) {
      const sessionMap = new Map<string, JournalEntry[]>();
      sessionEntries.forEach((e) => {
        const key = e.sessionNumber ? `Session ${e.sessionNumber}` : "Unnumbered Sessions";
        if (!sessionMap.has(key)) sessionMap.set(key, []);
        sessionMap.get(key)!.push(e);
      });
      sessionMap.forEach((ses, label) => {
        groups.push({ label, entries: ses });
      });
    }

    if (otherEntries.length > 0) {
      groups.push({ label: "Other", entries: otherEntries });
    }

    return groups;
  }, [filteredEntries]);

  const getTypeIcon = (type: JournalEntryType): string => {
    const found = ENTRY_TYPES.find((t) => t.type === type);
    return found?.icon || "📝";
  };

  const getTypeColor = (type: JournalEntryType): string => {
    switch (type) {
      case "session": return "text-amber-400 bg-amber-500/10 border-amber-500/15";
      case "quest": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
      case "lore": return "text-indigo-400 bg-indigo-500/10 border-indigo-500/15";
      case "note": return "text-sky-400 bg-sky-500/10 border-sky-500/15";
      case "handout": return "text-rose-400 bg-rose-500/10 border-rose-500/15";
    }
  };

  return (
    <div className="w-64 border-r border-white/[0.04] flex flex-col h-full bg-obsidian/60">
      {/* ── Type Filters ── */}
      <div className="shrink-0 p-2.5 space-y-2">
        <div className="flex flex-wrap gap-1">
          {ENTRY_TYPES.map((t) => (
            <button
              key={t.type}
              onClick={() => setFilterType(t.type)}
              className={`text-[10px] px-1.5 py-1 rounded transition-all duration-150 active:scale-95 ${
                filterType === t.type
                  ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                  : "text-surface-500 hover:text-surface-300 border border-transparent hover:border-white/[0.06]"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search journal..."
            className="w-full py-1.5 pl-7 pr-2 rounded text-[10px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-600"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-surface-600">🔍</span>
        </div>
      </div>

      {/* ── Entry List ── */}
      <div className="flex-1 overflow-y-auto scrollbar-gold">
        {groupedEntries.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-[10px] text-surface-600">No entries found</p>
          </div>
        )}

        {groupedEntries.map((group) => (
          <div key={group.label}>
            <div className="px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="text-[9px] text-surface-600 uppercase tracking-wider font-semibold">
                {group.label}
              </span>
              <span className="text-[8px] text-surface-700">({group.entries.length})</span>
            </div>
            {group.entries.map((entry) => {
              const isPinned = entry.tags?.includes("pinned") ?? false;
              return (
                <button
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.id)}
                  className={`w-full text-left px-2.5 py-1.5 transition-all duration-150 border-l-[2px] ${
                    activeEntryId === entry.id
                      ? "bg-gold-500/8 border-gold/40 text-gold-200"
                      : "border-transparent hover:bg-gold-500/[0.02] hover:border-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {/* Pin icon */}
                    {isPinned && (
                      <span className="text-[8px] text-gold-400 shrink-0">★</span>
                    )}
                    <span className={`text-[10px] px-1 py-0.5 rounded ${getTypeColor(entry.type)}`}>
                      {getTypeIcon(entry.type)}
                    </span>
                    <span className="text-[11px] truncate flex-1">{entry.title}</span>
                    {/* Relative time */}
                    <span className="text-[8px] text-surface-700 shrink-0 tabular-nums">
                      {getRelativeTime(entry.updatedAt)}
                    </span>
                  </div>
                  <div className="text-[9px] text-surface-600 mt-0.5 ml-5 truncate">
                    {entry.content.slice(0, 60)}
                    {entry.content.length > 60 ? "..." : ""}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 ml-5">
                    {entry.sessionNumber && (
                      <span className="text-[8px] text-amber-500/40">S#{entry.sessionNumber}</span>
                    )}
                    {entry.tags && entry.tags.filter((t) => t !== "pinned").length > 0 && (
                      <span className="text-[8px] text-gold-500/30">
                        · {entry.tags.filter((t) => t !== "pinned").slice(0, 2).join(", ")}
                        {entry.tags.filter((t) => t !== "pinned").length > 2 ? "..." : ""}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Stats footer ── */}
      <div className="shrink-0 px-2.5 py-1.5 border-t border-white/[0.03]">
        <div className="flex items-center justify-between text-[9px] text-surface-600">
          <span>{entries.length} entries</span>
          <span>
            {entries.filter((e) => e.type === "session").length} sessions
            · {entries.filter((e) => e.tags?.includes("pinned")).length} pinned
          </span>
        </div>
      </div>
    </div>
  );
}
