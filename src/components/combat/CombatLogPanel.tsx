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
      list = list.filter((e) => e.description.toLowerCase().includes(q) || (e.actorName?.toLowerCase().includes(q)));
    }
    return list.reverse(); // newest first
  }, [combatLog, filter, searchQuery]);

  const typeColors: Record<string, string> = {
    damage: "text-warrior-400 bg-warrior-500/10",
    heal: "text-rogue-400 bg-rogue-500/10",
    temp_hp: "text-mage-400 bg-mage-500/10",
    status: "text-mage-400 bg-mage-500/10",
    death: "text-warrior-400 bg-warrior-500/10",
    note: "text-surface-400 bg-surface-800",
    round_start: "text-divine-400 bg-divine-500/10",
  };

  const handleExportLog = useCallback(() => {
    const blob = new Blob([JSON.stringify(combatLog, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combat-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [combatLog]);

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-xs font-medium text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors">
        <span>📜</span>
        <span>Log ({combatLog.length})</span>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-700 bg-surface-850 shadow-2xl md:left-64 md:right-0">
          <div className="flex flex-col h-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-700 px-4 py-2">
              <h3 className="text-xs font-semibold text-surface-200 uppercase tracking-wider">Combat Log</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="xs" onClick={handleExportLog}>📤 Export</Button>
                <Button variant="ghost" size="xs" onClick={clearLog}>Clear</Button>
                <button onClick={() => setIsOpen(false)} className="text-surface-500 hover:text-surface-200 text-xs">✕</button>
              </div>
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-2 border-b border-surface-700 px-4 py-2">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search log..."
                className="flex-1 rounded-md border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              <div className="flex gap-1">
                {FILTER_CONFIG.map((f) => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                      filter === f.key ? "bg-accent-500/15 text-accent-300" : "text-surface-500 hover:text-surface-300"
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Log entries */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {filteredLog.length === 0 ? (
                <div className="flex items-center justify-center h-full text-surface-500 text-xs">
                  {combatLog.length === 0 ? "No combat actions yet." : "No entries match your filter."}
                </div>
              ) : (
                filteredLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2 rounded-md px-2.5 py-1.5 hover:bg-surface-800">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${typeColors[entry.type] ?? "text-surface-400 bg-surface-800"}`}>
                      {entry.type === "temp_hp" ? "TEMP" : entry.type === "round_start" ? "ROUND" : entry.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-surface-300 leading-relaxed">{entry.description}</p>
                      <p className="text-[9px] text-surface-500 mt-0.5">
                        {entry.actorName}{entry.targetName ? ` → ${entry.targetName}` : ""} · {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {entry.value !== undefined && (
                      <span className={`shrink-0 font-bold text-sm ${entry.type === "damage" ? "text-warrior-400" : entry.type === "heal" ? "text-rogue-400" : "text-surface-400"}`}>
                        {entry.value > 0 ? "+" : ""}{entry.value}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
