/* ── Combat Log Panel ──────────────────────────────────────────
 * A collapsible panel that shows the full combat log with search,
 * type filtering (damage, heal, status, initiative, death), and
 * export functionality.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import type { CombatLogEntry } from "@/types/combat";
import { Button } from "@/components/ui/Button";

type LogFilter = "all" | "damage" | "heal" | "temp_hp" | "status" | "death" | "note" | "round_start";

const FILTER_CONFIG: { key: LogFilter; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "📋" },
  { key: "damage", label: "Damage", icon: "💥" },
  { key: "heal", label: "Heal", icon: "❤️" },
  { key: "temp_hp", label: "Temp", icon: "🛡️" },
  { key: "status", label: "Status", icon: "🔮" },
  { key: "death", label: "Death", icon: "💀" },
  { key: "round_start", label: "Round", icon: "🔄" },
];

export function CombatLogPanel() {
  const combatLog = useCombatStore((s) => s.combatLog);
  const clearLog = useCombatStore((s) => s.clearLog);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<LogFilter>("all");

  const filteredLog = useMemo(() => {
    let list = [...combatLog];
    if (filter !== "all") {
      list = list.filter((entry) => entry.type === filter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => {
        const desc = e.description ?? "";
        return desc.toLowerCase().includes(q) || (e.actorName?.toLowerCase().includes(q) ?? false);
      });
    }
    return list.reverse(); // newest first
  }, [combatLog, filter, searchQuery]);

  const handleExportLog = useCallback(() => {
    const blob = new Blob([JSON.stringify(combatLog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combat-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [combatLog]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-xs font-medium text-surface-300 transition-colors hover:bg-surface-700"
      >
        📜 Combat Log ({combatLog.length})
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">📜</span>
          <span className="text-sm font-semibold text-surface-200">Combat Log</span>
          <span className="rounded-full bg-surface-800 px-2 py-0.5 text-[10px] text-surface-400">
            {combatLog.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLog}
            className="text-[11px] text-surface-500 transition-colors hover:text-surface-300"
            title="Export log as JSON"
          >
            📥
          </button>
          <button
            onClick={() => {
              clearLog();
            }}
            className="text-[11px] text-surface-500 transition-colors hover:text-warrior-400"
            title="Clear log"
          >
            🗑️
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-surface-500 transition-colors hover:text-surface-200"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="border-b border-surface-700 px-4 py-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search combat log..."
          className="w-full rounded-md border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-xs text-surface-200 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {FILTER_CONFIG.map((cfg) => (
            <button
              key={cfg.key}
              onClick={() => setFilter(cfg.key)}
              className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                filter === cfg.key
                  ? "bg-accent-500/20 text-accent-300"
                  : "bg-surface-800 text-surface-400 hover:bg-surface-700"
              }`}
            >
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLog.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-surface-500">No log entries yet.</p>
          </div>
        ) : (
          filteredLog.map((entry) => (
            <LogEntryCard key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Log Entry Sub-Component ────────────────────────────────── */

const TYPE_ICON: Record<string, string> = {
  damage: "💥",
  heal: "❤️",
  temp_hp: "🛡️",
  status: "🔮",
  death: "💀",
  revive: "✨",
  note: "📝",
  round_start: "🔄",
};

const TYPE_COLOR: Record<string, string> = {
  damage: "border-l-warrior-500/50",
  heal: "border-l-rogue-500/50",
  temp_hp: "border-l-mage-500/50",
  status: "border-l-accent-500/50",
  death: "border-l-warrior-500/70",
  revive: "border-l-divine-500/50",
  note: "border-l-surface-500/50",
  round_start: "border-l-divine-500/50",
};

function LogEntryCard({ entry }: { entry: CombatLogEntry }) {
  return (
    <div className={`border-l-2 px-4 py-2.5 transition-colors hover:bg-surface-800/50 ${TYPE_COLOR[entry.type] ?? "border-l-surface-600"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs">{TYPE_ICON[entry.type] ?? "📋"}</span>
          <span className="text-xs font-medium text-surface-200 truncate">
            {entry.actorName}
          </span>
          {entry.targetName && (
            <>
              <span className="text-[10px] text-surface-500">→</span>
              <span className="text-xs text-surface-300 truncate">{entry.targetName}</span>
            </>
          )}
        </div>
        {entry.value !== undefined && (
          <span className="shrink-0 rounded bg-surface-800 px-1.5 py-0.5 text-[10px] font-bold text-surface-200">
            {entry.value > 0 ? `+${entry.value}` : entry.value}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[11px] text-surface-400 leading-relaxed">{entry.description ?? ""}</p>
      <p className="mt-0.5 text-[9px] text-surface-600">
        {new Date(entry.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
