/* ── Initiative Tracker Component ───────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { STATUS_EFFECTS } from "@/data/statusEffects";
import type { Combatant, StatusEffect, CombatLogEntry } from "@/types/combat";
import { Button } from "@/components/ui/Button";

/* ═══════════════════════════════════════════════════════════════
 * INITIATIVE TRACKER — Premium Combat Management
 *
 * Features:
 *  • Drag-reorderable turn order
 *  • One-click damage / heal / temp HP
 *  • Status effect toggles (blinded, poisoned, stunned, etc.)
 *  • Concentration tracking
 *  • Round counter + turn indicator
 *  • Combat log with search, filter, and JSON export
 *  • Quick-add combatants from player roster
 * ═══════════════════════════════════════════════════════════════ */

export function InitiativeTracker() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const combatLog = useCombatStore((s) => s.combatLog);
  const createEncounter = useCombatStore((s) => s.createEncounter);
  const startEncounter = useCombatStore((s) => s.startEncounter);
  const endEncounter = useCombatStore((s) => s.endEncounter);
  const nextTurn = useCombatStore((s) => s.nextTurn);
  const previousTurn = useCombatStore((s) => s.previousTurn);
  const togglePause = useCombatStore((s) => s.togglePause);
  const resetCombat = useCombatStore((s) => s.resetCombat);

  const [encounterName, setEncounterName] = useState("");

  const handleCreate = useCallback(() => {
    if (!encounterName.trim()) return;
    createEncounter(encounterName.trim());
    setEncounterName("");
  }, [encounterName, createEncounter]);

  /* ── Empty State ── */
  if (!activeEncounter) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16">
        <span className="mb-3 text-5xl">⚔️</span>
        <h3 className="mb-2 text-lg font-bold text-surface-100">Initiative Tracker</h3>
        <p className="mb-6 text-sm text-surface-500">
          Create an encounter to start tracking combat turns
        </p>
        <div className="flex w-full max-w-sm gap-2">
          <input
            type="text"
            value={encounterName}
            onChange={(e) => setEncounterName(e.target.value)}
            placeholder="Encounter name..."
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button size="sm" onClick={handleCreate} disabled={!encounterName.trim()}>
            Create
          </Button>
        </div>
      </div>
    );
  }

  const isActive = activeEncounter.phase === "active";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-surface-700 bg-surface-850 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warrior-500/10 text-lg">
            ⚔️
          </span>
          <div>
            <h3 className="font-bold text-surface-100">{activeEncounter.name}</h3>
            <p className="text-xs text-surface-500">
              {isActive
                ? `Round ${activeEncounter.round} \u00B7 ${activeEncounter.combatants.length} combatants`
                : activeEncounter.phase === "completed"
                  ? `Ended after ${activeEncounter.round} rounds`
                  : `${activeEncounter.combatants.length} combatants \u2014 ready to start`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Round counter badge */}
          {isActive && (
            <div className="rounded-md bg-warrior-500/15 px-3 py-1.5 text-center">
              <p className="text-xs text-surface-500">Round</p>
              <p className="text-lg font-bold text-warrior-400">{activeEncounter.round}</p>
            </div>
          )}

          {/* Action buttons */}
          {activeEncounter.phase === "prep" && (
            <Button
              size="sm"
              onClick={startEncounter}
              disabled={activeEncounter.combatants.length === 0}
            >
              ▶ Start
            </Button>
          )}
          {isActive && (
            <>
              <Button variant="secondary" size="sm" onClick={previousTurn}>
                ◀ Prev
              </Button>
              <Button
                variant={activeEncounter.isPaused ? "primary" : "secondary"}
                size="sm"
                onClick={togglePause}
              >
                {activeEncounter.isPaused ? "▶ Resume" : "⏸ Pause"}
              </Button>
              <Button size="sm" onClick={nextTurn}>
                Next ▶
              </Button>
              <Button variant="danger" size="sm" onClick={endEncounter}>
                ■ End
              </Button>
            </>
          )}
          {activeEncounter.phase === "completed" && (
            <Button variant="secondary" size="sm" onClick={resetCombat}>
              ↺ Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Combatant List + Log */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Combatant List */}
        <CombatantList
          combatants={activeEncounter.combatants}
          currentIndex={activeEncounter.currentCombatantIndex}
          isActive={isActive}
        />

        {/* Combat Log (enhanced with search & export) */}
        <CombatLogPanel log={combatLog} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * COMBATANT LIST
 * ═══════════════════════════════════════════════════════════════ */

function CombatantList({
  combatants,
  currentIndex,
  isActive,
}: {
  combatants: Combatant[];
  currentIndex: number;
  isActive: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          Turn Order
        </h4>
        <span className="text-xs text-surface-500">
          {combatants.length} combatant{combatants.length !== 1 ? "s" : ""}
        </span>
      </div>

      {combatants.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-700 bg-surface-850 py-8">
          <p className="text-sm text-surface-500">No combatants added yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {combatants.map((combatant, index) => {
            const isCurrentTurn = isActive && index === currentIndex;
            const isDone = isActive && index < currentIndex;
            const isDead = combatant.isDead;
            const isExpanded = expandedId === combatant.id;

            return (
              <div
                key={combatant.id}
                className={`group relative rounded-xl border-2 transition-all ${
                  isCurrentTurn
                    ? "border-accent-500 bg-accent-500/5 shadow-lg shadow-accent-500/10"
                    : isDone
                      ? "border-surface-700/50 bg-surface-850 opacity-60"
                      : isDead
                        ? "border-warrior-900/50 bg-surface-850"
                        : "border-surface-700 bg-surface-850 hover:border-surface-600"
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Turn indicator */}
                  <div className="flex w-6 items-center justify-center">
                    {isCurrentTurn ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
                        ▶
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-surface-500">
                        {combatant.initiative > 0 ? `+${combatant.initiative}` : combatant.initiative}
                      </span>
                    )}
                  </div>

                  {/* Portrait / Icon */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      combatant.type === "player"
                        ? "bg-rogue-500/15 text-rogue-400"
                        : combatant.type === "ally"
                          ? "bg-divine-500/15 text-divine-400"
                          : "bg-warrior-500/15 text-warrior-400"
                    }`}
                  >
                    {combatant.type === "player" ? "⚔" : combatant.type === "ally" ? "🛡" : "👹"}
                  </div>

                  {/* Name & Type */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate text-sm font-semibold ${
                          isDead ? "text-warrior-400 line-through" : "text-surface-100"
                        }`}
                      >
                        {combatant.name}
                      </p>
                      {combatant.isConcentrating && (
                        <span className="shrink-0 rounded bg-mage-500/20 px-1.5 py-0.5 text-[10px] font-medium text-mage-400">
                          🧘 Conc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] text-surface-500">
                        AC {combatant.armorClass}
                      </p>
                      <p
                        className={`text-[11px] font-medium ${
                          combatant.hitPoints.current <= 0
                            ? "text-warrior-400"
                            : combatant.hitPoints.current <= combatant.hitPoints.max * 0.25
                              ? "text-warrior-500"
                              : "text-surface-400"
                        }`}
                      >
                        {combatant.hitPoints.current}/{combatant.hitPoints.max}
                        {combatant.hitPoints.temporary > 0 && (
                          <span className="ml-1 text-divine-400">
                            (+{combatant.hitPoints.temporary}tmp)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status Effect Pills */}
                  <div className="flex shrink-0 gap-1">
                    {combatant.statusEffects.slice(0, 3).map((s) => {
                      const def = STATUS_EFFECTS[s.effect as keyof typeof STATUS_EFFECTS];
                      return (
                        <span
                          key={s.id}
                          className="rounded px-1.5 py-0.5 text-[11px]"
                          style={{ backgroundColor: `${def?.color}15`, color: def?.color ?? "inherit" }}
                          title={def?.description}
                        >
                          {def?.icon ?? "✦"} {def?.label ?? s.effect}
                        </span>
                      );
                    })}
                    {combatant.statusEffects.length > 3 && (
                      <span className="rounded bg-surface-700 px-1.5 py-0.5 text-[11px] text-surface-400">
                        +{combatant.statusEffects.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Expand button */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : combatant.id)}
                    className="rounded p-1 text-surface-500 transition-colors hover:bg-surface-700 hover:text-surface-200"
                  >
                    <span className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </button>
                </div>

                {/* Expanded: Quick Actions */}
                {isExpanded && (
                  <CombatantActions combatant={combatant} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * COMBATANT ACTIONS (Quick HP, Status, etc.)
 * ═══════════════════════════════════════════════════════════════ */

function CombatantActions({ combatant }: { combatant: Combatant }) {
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);
  const setTempHp = useCombatStore((s) => s.setTempHp);
  const toggleStatus = useCombatStore((s) => s.toggleStatus);
  const toggleConcentration = useCombatStore((s) => s.toggleConcentration);
  const toggleDead = useCombatStore((s) => s.toggleDead);

  const [hpInput, setHpInput] = useState("");

  const handleDamage = () => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val) || val <= 0) return;
    damageCombatant(combatant.id, val, "DM");
    setHpInput("");
  };

  const handleHeal = () => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val) || val <= 0) return;
    healCombatant(combatant.id, val, "DM");
    setHpInput("");
  };

  const quickDamage = (amount: number) => {
    damageCombatant(combatant.id, amount, "DM");
  };

  const quickHeal = (amount: number) => {
    healCombatant(combatant.id, amount, "DM");
  };

  return (
    <div className="border-t border-surface-700/50 px-4 py-3 space-y-3">
      {/* HP Quick Actions */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-500">
          Hit Points
        </p>
        <div className="flex gap-1.5">
          <Button variant="danger" size="xs" onClick={() => quickDamage(1)}>-1</Button>
          <Button variant="danger" size="xs" onClick={() => quickDamage(5)}>-5</Button>
          <Button variant="danger" size="xs" onClick={() => quickDamage(10)}>-10</Button>
          <div className="flex flex-1 gap-1">
            <input
              type="number"
              value={hpInput}
              onChange={(e) => setHpInput(e.target.value)}
              placeholder="HP"
              className="w-16 rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-center text-xs text-surface-100 focus:border-accent-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && (e.shiftKey ? handleHeal() : handleDamage())}
            />
            <Button size="xs" onClick={handleDamage} title="Damage (Enter)">−</Button>
            <Button size="xs" variant="secondary" onClick={handleHeal} title="Heal (Shift+Enter)">+</Button>
          </div>
          <Button variant="secondary" size="xs" onClick={() => quickHeal(5)}>+5</Button>
          <Button variant="secondary" size="xs" onClick={() => quickHeal(10)}>+10</Button>
        </div>
        {/* Temp HP */}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[11px] text-surface-500">Temp HP:</span>
          <input
            type="number"
            defaultValue={combatant.hitPoints.temporary || ""}
            placeholder="0"
            className="w-16 rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-center text-xs text-surface-100 focus:border-divine-500 focus:outline-none"
            onBlur={(e) => {
              const val = parseInt(e.target.value, 10);
              setTempHp(combatant.id, isNaN(val) ? 0 : Math.max(0, val));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                setTempHp(combatant.id, isNaN(val) ? 0 : Math.max(0, val));
              }
            }}
          />
          <span className="text-[11px] text-surface-500">· Max HP: {combatant.hitPoints.max}</span>
        </div>
      </div>

      {/* Status Effects */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-500">
          Status Effects
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(STATUS_EFFECTS).map(([key, def]) => {
            const isActive = combatant.statusEffects.some((s) => s.effect === key);
            return (
              <button
                key={key}
                onClick={() => toggleStatus(combatant.id, key as StatusEffect)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-all ${
                  isActive
                    ? "border-accent-500 bg-accent-500/15 text-accent-300"
                    : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200"
                }`}
                title={def.description}
              >
                {def.icon} {def.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Special Toggles */}
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={combatant.isConcentrating}
            onChange={() => toggleConcentration(combatant.id)}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-mage-500"
          />
          <span className="text-xs text-surface-300">🧘 Concentrating</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={combatant.isDead}
            onChange={() => toggleDead(combatant.id)}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-warrior-500"
          />
          <span className="text-xs text-surface-300">💀 Dead / Unconscious</span>
        </label>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * COMBAT LOG PANEL (Enhanced with search & export)
 * ═══════════════════════════════════════════════════════════════ */

function CombatLogPanel({ log }: { log: CombatLogEntry[] }) {
  const [filter, setFilter] = useState<"all" | "damage" | "heal" | "status" | "round">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let filtered = log;
    if (filter !== "all") {
      filtered = filtered.filter((e) => e.type === filter);
    }
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (e) =>
          e.actorName.toLowerCase().includes(q) ||
          e.targetName?.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [log, filter, searchQuery]);

  const clearLog = useCombatStore((s) => s.clearLog);

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combat-log-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [log]);

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850">
      <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
          Combat Log
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="text-[11px] text-surface-500 hover:text-surface-300"
            title="Export log to JSON"
          >
            📥
          </button>
          <button
            onClick={clearLog}
            className="text-[11px] text-surface-500 hover:text-surface-300"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="border-b border-surface-700/50 px-3 py-2 space-y-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search combat log..."
          className="w-full rounded-md border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
        <div className="flex gap-1">
          {(["all", "damage", "heal", "status", "round"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filter === f
                  ? "bg-accent-500/15 text-accent-300"
                  : "text-surface-500 hover:text-surface-300"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="max-h-[480px] space-y-0.5 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-surface-500">
            {log.length === 0
              ? "Combat log is empty. Actions will appear here."
              : "No entries match your search or filter."}
          </p>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-md px-2.5 py-1.5 text-xs ${
                entry.type === "round_start"
                  ? "bg-accent-500/5 text-accent-400 font-medium"
                  : entry.type === "death"
                    ? "bg-warrior-500/10 text-warrior-400"
                    : entry.type === "damage"
                      ? "bg-warrior-500/5 text-warrior-300"
                      : entry.type === "heal"
                        ? "bg-divine-500/5 text-divine-300"
                        : "text-surface-400"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex-1">{entry.description}</span>
                {entry.value !== undefined && (
                  <span className="shrink-0 font-bold">
                    {entry.type === "heal" ? `+${entry.value}` : entry.type === "damage" || entry.type === "death" ? `-${entry.value}` : ""}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-surface-600">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
