/* ── Enemy Group Actions — Bulk Combat Management ──────────────
 * Provides the DM with batch operations for groups of enemies
 * in the active combat encounter: apply damage/heal to all
 * enemies of the same name, toggle death, and view group stats.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

interface GroupedCombatants {
  name: string;
  ids: string[];
  count: number;
  alive: number;
  dead: number;
  avgHp: number;
  totalHp: number;
}

export function EnemyGroupActions() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);
  const toggleDead = useCombatStore((s) => s.toggleDead);
  const showToast = useUiStore((s) => s.showToast);

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [bulkDamageValue, setBulkDamageValue] = useState("");
  const [bulkHealValue, setBulkHealValue] = useState("");

  const groups = useMemo(() => {
    if (!activeEncounter) return [];
    const map = new Map<string, GroupedCombatants>();
    for (const c of activeEncounter.combatants) {
      if (c.type !== "enemy") continue;
      const existing = map.get(c.name);
      if (existing) {
        existing.ids.push(c.id);
        existing.count++;
        if (!c.isDead) existing.alive++;
        else existing.dead++;
        existing.totalHp += c.hitPoints.current;
        existing.avgHp = Math.round(existing.totalHp / existing.count);
      } else {
        map.set(c.name, {
          name: c.name,
          ids: [c.id],
          count: 1,
          alive: c.isDead ? 0 : 1,
          dead: c.isDead ? 1 : 0,
          avgHp: c.hitPoints.current,
          totalHp: c.hitPoints.current,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [activeEncounter]);

  if (!activeEncounter || groups.length === 0) return null;

  const handleBulkDamage = (name: string) => {
    const amount = parseInt(bulkDamageValue);
    if (isNaN(amount) || amount <= 0) return;
    const group = groups.find((g) => g.name === name);
    if (!group) return;
    for (const id of group.ids) {
      damageCombatant(id, amount, "DM (bulk)");
    }
    showToast({ message: `Dealt ${amount} damage to all ${group.name}s.`, type: "info" });
    setBulkDamageValue("");
  };

  const handleBulkHeal = (name: string) => {
    const amount = parseInt(bulkHealValue);
    if (isNaN(amount) || amount <= 0) return;
    const group = groups.find((g) => g.name === name);
    if (!group) return;
    for (const id of group.ids) {
      healCombatant(id, amount, "DM (bulk)");
    }
    showToast({ message: `Healed all ${group.name}s for ${amount}.`, type: "success" });
    setBulkHealValue("");
  };

  const handleKillAll = (name: string) => {
    const group = groups.find((g) => g.name === name);
    if (!group) return;
    for (const id of group.ids) {
      toggleDead(id);
    }
    showToast({ message: `Toggled death on all ${group.name}s.`, type: "info" });
  };

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 flex items-center gap-2">
        <span>👥</span> Enemy Groups
        <span className="text-[10px] text-surface-500 font-normal">({groups.length} type{groups.length !== 1 ? "s" : ""})</span>
      </h3>

      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group.name} className="rounded-lg border border-surface-700 bg-surface-800 overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-surface-700/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-surface-200">{group.name}</span>
                <span className="rounded bg-surface-700 px-1.5 py-0.5 text-[10px] text-surface-400">{group.count}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-surface-500">
                  {group.alive} <span className="text-rogue-400">alive</span>
                  {group.dead > 0 && (
                    <span className="text-warrior-400"> · {group.dead} down</span>
                  )}
                </span>
                <span className={`text-xs transition-transform ${expandedGroup === group.name ? "rotate-90" : ""}`}>▶</span>
              </div>
            </button>

            {/* Expanded Controls */}
            {expandedGroup === group.name && (
              <div className="border-t border-surface-700 px-3 py-3 space-y-3 animate-slide-up">
                {/* Average HP Display */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-400">Average HP</span>
                  <span className="font-mono text-surface-200">{group.avgHp}</span>
                </div>

                {/* Bulk Damage */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={bulkDamageValue}
                    onChange={(e) => setBulkDamageValue(e.target.value)}
                    placeholder="Dmg"
                    className="w-20 rounded-md border border-surface-700 bg-surface-900 px-2 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 text-center focus:border-warrior-500 focus:outline-none"
                  />
                  <Button size="xs" variant="danger" onClick={() => handleBulkDamage(group.name)}>
                    Damage All
                  </Button>
                  <input
                    type="number"
                    min={1}
                    value={bulkHealValue}
                    onChange={(e) => setBulkHealValue(e.target.value)}
                    placeholder="Heal"
                    className="w-20 rounded-md border border-surface-700 bg-surface-900 px-2 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 text-center focus:border-rogue-500 focus:outline-none"
                  />
                  <Button size="xs" variant="secondary" onClick={() => handleBulkHeal(group.name)}>
                    Heal All
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button size="xs" variant="ghost" onClick={() => handleKillAll(group.name)}>
                    💀 Toggle All Dead
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
