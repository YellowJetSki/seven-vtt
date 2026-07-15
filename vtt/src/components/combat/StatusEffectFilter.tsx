/* ── Status Effect Filter ──────────────────────────────────────
 * A filter bar for the initiative tracker that allows the DM to
 * quickly filter combatants by active status effects.
 * Useful for focusing on stunned/paralyzed/prone targets.
 *
 * ── UX ─────────────────────────────────────────────────────────
 * • Shows a row of clickable status effect pills
 * • Clicking a pill toggles the filter
 * • Active filter highlights matching combatants in the tracker
 * • "Clear all" button to reset
 * ─────────────────────────────────────────────────────────────── */

import { useCallback, useMemo } from "react";
import { useCombatStore } from "@/stores/combatStore";
import type { StatusEffect } from "@/types/combat";

const STATUS_EFFECT_META: { effect: StatusEffect; label: string; icon: string }[] = [
  { effect: "blinded", label: "Blinded", icon: "🙈" },
  { effect: "charmed", label: "Charmed", icon: "💕" },
  { effect: "deafened", label: "Deafened", icon: "🔇" },
  { effect: "frightened", label: "Frightened", icon: "😨" },
  { effect: "grappled", label: "Grappled", icon: "🤝" },
  { effect: "incapacitated", label: "Incapacitated", icon: "💫" },
  { effect: "invisible", label: "Invisible", icon: "👻" },
  { effect: "paralyzed", label: "Paralyzed", icon: "🧊" },
  { effect: "petrified", label: "Petrified", icon: "🗿" },
  { effect: "poisoned", label: "Poisoned", icon: "☠️" },
  { effect: "prone", label: "Prone", icon: "⬇" },
  { effect: "restrained", label: "Restrained", icon: "🔗" },
  { effect: "stunned", label: "Stunned", icon: "💫" },
  { effect: "unconscious", label: "Unconscious", icon: "😴" },
  { effect: "exhaustion1", label: "Exhaustion", icon: "😩" },
];

interface StatusEffectFilterProps {
  activeFilter: StatusEffect | null;
  onFilterChange: (effect: StatusEffect | null) => void;
}

export function StatusEffectFilter({ activeFilter, onFilterChange }: StatusEffectFilterProps) {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const combatants = activeEncounter?.combatants ?? [];

  // Count combatants with each status effect
  const effectCounts = useMemo(() => {
    const counts = new Map<StatusEffect, number>();
    for (const c of combatants) {
      if (c.isDead) continue;
      for (const se of c.statusEffects) {
        counts.set(se.effect, (counts.get(se.effect) ?? 0) + 1);
      }
    }
    return counts;
  }, [combatants]);

  // Only show effects that are present on at least one combatant
  const activeEffects = useMemo(() => {
    return STATUS_EFFECT_META.filter((meta) => (effectCounts.get(meta.effect) ?? 0) > 0);
  }, [effectCounts]);

  const allCount = combatants.filter((c) => !c.isDead).length;

  if (activeEffects.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* All button */}
      <button
        onClick={() => onFilterChange(null)}
        className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all ${
          activeFilter === null
            ? "bg-surface-600 text-surface-100"
            : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200"
        }`}
      >
        All ({allCount})
      </button>

      {activeEffects.map(({ effect, label, icon }) => {
        const count = effectCounts.get(effect) ?? 0;
        const isActive = activeFilter === effect;
        return (
          <button
            key={effect}
            onClick={() => onFilterChange(isActive ? null : effect)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all flex items-center gap-1 ${
              isActive
                ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200"
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
            <span className={`ml-0.5 ${isActive ? "text-accent-400" : "text-surface-500"}`}>
              ({count})
            </span>
          </button>
        );
      })}

      {/* Clear button */}
      {activeFilter !== null && (
        <button
          onClick={() => onFilterChange(null)}
          className="rounded-full px-2 py-1 text-[10px] text-warrior-400 hover:bg-warrior-500/10 transition-colors"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
