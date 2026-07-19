/**
 * STᚱ VTT — Initiative Tracker (DM Combat Command)
 *
 * DM-only panel displaying combat initiative order with:
 * - Drag-and-drop reordering
 * - Inline HP/AC display for attack resolution
 * - Color-coded status effect badges
 * - Quick HP presets (-5/-1/+1/+5) + custom input
 * - Auto-scroll to current turn
 * - Sort toggle (initiative desc / grouped by type)
 * - Turn timer (color-coded: >60s amber, >120s red)
 * - Combat flow controls (Start / Pause / Resume / End / Next/Prev turn)
 *
 * All mutations route through useCombatMutations hooks,
 * which write to BOTH Zustand (instant) and Firestore (real-time sync).
 */

import { useState, useRef, useCallback, useMemo } from "react";
import type { CombatEncounter } from "@/types";
import {
  useCombatHpMutations,
  useCombatEffectMutations,
  useCombatEncounterMutations,
} from "@/hooks/useCombatMutations";
import { useCombatStore } from "@/stores/combatStore";
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

  // Combat flow from store
  const startCombat = useCombatStore((s) => s.startCombat);
  const nextTurn = useCombatStore((s) => s.nextTurn);
  const prevTurn = useCombatStore((s) => s.prevTurn);
  const endCombat = useCombatStore((s) => s.endCombat);
  const pauseCombat = useCombatStore((s) => s.pauseCombat);
  const resumeCombat = useCombatStore((s) => s.resumeCombat);

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);
  const [sortMode, setSortMode] = useState<"initiative" | "grouped">("initiative");

  // Sort combatants
  const sortedCombatants = useMemo(() => {
    if (sortMode === "grouped") {
      // Group by type: players first, then allies, then enemies
      const priority = { player: 0, ally: 1, enemy: 2 };
      return [...encounter.combatants].sort((a, b) => {
        const typeDiff = (priority[a.type] ?? 3) - (priority[b.type] ?? 3);
        if (typeDiff !== 0) return typeDiff;
        return b.initiative - a.initiative;
      });
    }
    // Default: by initiative descending
    return [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);
  }, [encounter.combatants, sortMode]);

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

  const handleToggleSort = useCallback(() => {
    setSortMode((prev) => (prev === "initiative" ? "grouped" : "initiative"));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <InitiativeHeader
        combatantCount={sortedCombatants.length}
        round={encounter.round || 1}
        turnStartedAt={encounter.turnStartedAt ?? null}
        phase={encounter.phase}
        isPaused={encounter.isPaused ?? false}
        onStartCombat={startCombat}
        onNextTurn={nextTurn}
        onPrevTurn={prevTurn}
        onEndCombat={endCombat}
        onPauseCombat={pauseCombat}
        onResumeCombat={resumeCombat}
        sortMode={sortMode}
        onToggleSort={handleToggleSort}
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
