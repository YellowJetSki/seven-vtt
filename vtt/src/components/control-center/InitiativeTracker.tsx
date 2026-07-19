/**
 * STᚱ VTT — Initiative Tracker
 *
 * DM-only panel displaying combat initiative order with drag-and-drop reordering,
 * inline HP/condition editing, and quick damage/heal controls.
 * Composed of InitiativeHeader, InitiativeCombatantRow, and InitiativeEmptyState.
 *
 * Refactored Cycle 2: All mutations route through useCombatMutations hooks,
 * which write to BOTH Zustand (instant) and Firestore (real-time sync).
 * This ensures cross-device turn-by-turn consistency.
 */

import { useState, useRef, useCallback } from "react";
import type { CombatEncounter } from "@/types";
import {
  useCombatHpMutations,
  useCombatEffectMutations,
  useCombatEncounterMutations,
} from "@/hooks/useCombatMutations";
import InitiativeHeader from "./InitiativeHeader";
import InitiativeCombatantRow from "./InitiativeCombatantRow";
import InitiativeEmptyState from "./InitiativeEmptyState";

interface InitiativeTrackerProps {
  encounter: CombatEncounter;
  onSelectCombatant?: (id: string) => void;
  selectedCombatantId?: string | null;
}

export default function InitiativeTracker({
  encounter,
  onSelectCombatant,
  selectedCombatantId,
}: InitiativeTrackerProps) {
  // Centralized mutation hooks — writes to Zustand + Firestore
  const { damageCombatant, healCombatant } = useCombatHpMutations();
  const { addStatusEffect, removeStatusEffect, toggleDead } = useCombatEffectMutations();
  const { reorderCombatants } = useCombatEncounterMutations();

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const sortedCombatants = [...encounter.combatants].sort(
    (a, b) => b.initiative - a.initiative
  );

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragIdx === null || dragOverIdx.current === null) return;
    const reordered = [...sortedCombatants];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dragOverIdx.current, 0, moved);
    reorderCombatants(reordered.map((c) => c.id));
    setDragIdx(null);
    dragOverIdx.current = null;
  }, [dragIdx, sortedCombatants, reorderCombatants]);

  return (
    <div className="flex flex-col h-full">
      <InitiativeHeader
        combatantCount={sortedCombatants.length}
        round={encounter.round || 1}
      />

      {/* Combatant list */}
      <div className="flex-1 overflow-y-auto space-y-1 px-2 py-2">
        {sortedCombatants.length === 0 && <InitiativeEmptyState />}

        {sortedCombatants.map((c, idx) => (
          <InitiativeCombatantRow
            key={c.id}
            combatant={c}
            index={idx}
            encounter={encounter}
            isSelected={c.id === selectedCombatantId}
            isCurrentTurn={
              encounter.currentCombatantIndex === idx &&
              encounter.phase === "active"
            }
            onSelect={(id) => onSelectCombatant?.(id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDamage={damageCombatant}
            onHeal={healCombatant}
            onToggleDead={toggleDead}
            onAddEffect={addStatusEffect}
            onRemoveEffect={removeStatusEffect}
          />
        ))}
      </div>
    </div>
  );
}
