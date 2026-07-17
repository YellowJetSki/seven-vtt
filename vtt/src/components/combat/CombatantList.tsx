/* ── CombatantList ─────────────────────────────────────────────
 * Drag-reorderable turn order list with per-combatant expansion.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { Combatant } from "@/types/combat";
import { STATUS_EFFECTS } from "@/data/statusEffects";
import { CombatantDragSort } from "./CombatantDragSort";
import { CombatantActions } from "./CombatantActions";
import { CombatantTurnTimer } from "./CombatantTurnTimer";

interface CombatantListProps {
  combatants: Combatant[];
  currentIndex: number;
  isActive: boolean;
  isPaused: boolean;
  turnStartedAt: number | null;
  reorderCombatants: (ids: string[]) => void;
}

export function CombatantList({
  combatants, currentIndex, isActive, isPaused, turnStartedAt, reorderCombatants,
}: CombatantListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Turn Order</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-500">Drag to reorder · ↑↓ keys</span>
          <span className="text-xs text-surface-500">{combatants.length} combatant{combatants.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {combatants.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-700 bg-surface-850 py-8">
          <p className="text-sm text-surface-500">No combatants added yet. Import PCs or add enemies.</p>
        </div>
      ) : (
        <CombatantDragSort reorderCombatants={reorderCombatants} className="space-y-1.5">
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
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Initiative / Turn indicator */}
                  <div className="flex w-7 items-center justify-center">
                    {isCurrentTurn ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">▶</span>
                    ) : (
                      <span className="text-xs font-bold text-surface-500">
                        {combatant.initiative > 0 ? `+${combatant.initiative}` : combatant.initiative}
                      </span>
                    )}
                  </div>

                  {/* Type icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    combatant.type === "player"
                      ? "bg-rogue-500/15 text-rogue-400"
                      : combatant.type === "ally"
                        ? "bg-divine-500/15 text-divine-400"
                        : "bg-warrior-500/15 text-warrior-400"
                  }`}>
                    {combatant.type === "player" ? "⚔" : combatant.type === "ally" ? "🛡" : "👹"}
                  </div>

                  {/* Name + Stats */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm font-semibold ${isDead ? "text-warrior-400 line-through" : "text-surface-100"}`}>
                        {combatant.name}
                      </p>
                      {combatant.isConcentrating && (
                        <span className="shrink-0 rounded bg-mage-500/20 px-1.5 py-0.5 text-[10px] font-medium text-mage-400">🧘 Conc</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] text-surface-500">AC {combatant.armorClass}</p>
                      <p className={`text-[11px] font-medium ${
                        combatant.hitPoints.current <= 0
                          ? "text-warrior-400"
                          : combatant.hitPoints.current <= combatant.hitPoints.max * 0.25
                            ? "text-warrior-500"
                            : "text-surface-400"
                      }`}>
                        {combatant.hitPoints.current}/{combatant.hitPoints.max}
                        {combatant.hitPoints.temporary > 0 && (
                          <span className="ml-1 text-divine-400">(+{combatant.hitPoints.temporary}tmp)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Per-Combatant Turn Timer */}
                  {isCurrentTurn && (
                    <div className="shrink-0">
                      <CombatantTurnTimer turnStartedAt={turnStartedAt} isPaused={isPaused} compact />
                    </div>
                  )}

                  {/* Status Effect Badges */}
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

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : combatant.id)}
                    className="rounded p-1 text-surface-500 transition-colors hover:bg-surface-700 hover:text-surface-200"
                  >
                    <span className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </button>
                </div>

                {isExpanded && <CombatantActions combatant={combatant} />}
              </div>
            );
          })}
        </CombatantDragSort>
      )}
    </div>
  );
}
