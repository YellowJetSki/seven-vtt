/**
 * STᚱ VTT — Initiative Tracker (DM Combat Command)
 *
 * DM-only panel displaying combat initiative order with:
 * - Drag-and-drop reordering with visual drop zones and drag ghost
 * - Inline HP/AC display for attack resolution
 * - Color-coded status effect badges
 * - Quick HP presets (-5/-1/+1/+5) + custom input
 * - Auto-scroll to current turn
 * - Sort toggle (initiative desc / grouped by type)
 * - Turn timer (color-coded: >60s amber, >120s red)
 * - Combat flow controls (Start / Pause / Resume / End / Next/Prev turn)
 *
 * Fix Sprint 22: Drag reorder now has visual drop zone indicators,
 * uses combatant ID for current turn tracking (not sorted index),
 * and provides drag ghost for visual feedback.
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

  // Track current turn combatant by ID (not sorted index) for robust highlighting
  const currentTurnCombatantId = useMemo(() => {
    if (encounter.phase !== "active") return null;
    return encounter.combatants[encounter.currentCombatantIndex]?.id ?? null;
  }, [encounter.combatants, encounter.currentCombatantIndex, encounter.phase]);

  // Sort combatants
  const sortedCombatants = useMemo(() => {
    if (sortMode === "grouped") {
      const priority = { player: 0, ally: 1, enemy: 2 };
      return [...encounter.combatants].sort((a, b) => {
        const typeDiff = (priority[a.type] ?? 3) - (priority[b.type] ?? 3);
        if (typeDiff !== 0) return typeDiff;
        return b.initiative - a.initiative;
      });
    }
    return [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);
  }, [encounter.combatants, sortMode]);

  // ── Drag handlers ──
  const handleDragStart = useCallback(
    (idx: number, e?: React.DragEvent) => {
      setDragIdx(idx);
      if (e?.dataTransfer) {
        // Set a drag image so the browser doesn't show a generic text cursor
        e.dataTransfer.effectAllowed = "move";
        // Small text to ensure the drag operation starts
        e.dataTransfer.setData("text/plain", String(idx));
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    dragOverIdx.current = idx;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    dragOverIdx.current = null;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragIdx === null || dragOverIdx.current === null) {
      setDragIdx(null);
      dragOverIdx.current = null;
      return;
    }

    const src = dragIdx;
    const dest = dragOverIdx.current;
    if (src === dest) {
      setDragIdx(null);
      dragOverIdx.current = null;
      return;
    }

    // Reorder the sorted array as the new canonical order
    const reordered = [...sortedCombatants];
    const [moved] = reordered.splice(src, 1);
    reordered.splice(dest, 0, moved);

    // Sync to Zustand + Firestore via the mutation hook
    reorderCombatants(reordered.map((c) => c.id));
    setDragIdx(null);
    dragOverIdx.current = null;
  }, [dragIdx, sortedCombatants, reorderCombatants]);

  const handleToggleSort = useCallback(() => {
    setSortMode((prev) => (prev === "initiative" ? "grouped" : "initiative"));
  }, []);

  // Drag ghost state for visual feedback
  const dragGhost = useMemo(() => {
    if (dragIdx === null) return null;
    return sortedCombatants[dragIdx] ?? null;
  }, [dragIdx, sortedCombatants]);

  // Whether a drop zone indicator should appear above this slot
  const isOverIndex = (idx: number) =>
    dragOverIdx.current === idx && dragIdx !== null && dragOverIdx.current !== dragIdx;

  return (
    <div className="flex flex-col h-full">
      <InitiativeHeader
        combatantCount={sortedCombatants.length}
        round={encounter.round ?? 1}
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
      <div className="flex-1 overflow-y-auto space-y-0.5 px-2 py-2">
        {sortedCombatants.length === 0 && <InitiativeEmptyState />}

        {sortedCombatants.map((c, idx) => (
          <div key={c.id} className="relative">
            {/* ── Drop zone indicator (gold line) ── */}
            {isOverIndex(idx) && (
              <div className="absolute -top-[2px] left-0 right-0 z-10 flex items-center pointer-events-none animate-fade-in-fast">
                <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-gold-500/70 to-transparent shadow-[0_0_8px_rgba(234,179,8,0.25)]" />
              </div>
            )}

            {/* ── Drag ghost indicator (left border glow on source) ── */}
            {dragIdx === idx && (
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold-500/40 rounded-full shadow-[0_0_6px_rgba(234,179,8,0.3)] pointer-events-none" />
            )}

            {/* ── Drop zone indicator below last item ── */}
            {isOverIndex(idx) && idx === sortedCombatants.length - 1 && (
              <div className="relative h-4 flex items-center pointer-events-none">
                <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
              </div>
            )}

            <InitiativeCombatantRow
              combatant={c}
              index={idx}
              encounter={encounter}
              isSelected={c.id === selectedCombatantId}
              isCurrentTurn={c.id === currentTurnCombatantId}
              isDragging={dragIdx === idx}
              isDropTarget={isOverIndex(idx)}
              onSelect={(id) => onSelectCombatant?.(id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onDamage={damageCombatant}
              onHeal={healCombatant}
              onToggleDead={toggleDead}
              onAddEffect={addStatusEffect}
              onRemoveEffect={removeStatusEffect}
            />
          </div>
        ))}
      </div>

      {/* ── Drag ghost floating indicator ── */}
      {dragGhost && (
        <div className="shrink-0 px-2 pb-1 opacity-40 pointer-events-none">
          <div className="px-3 py-2 rounded-lg bg-gold-500/10 border border-dashed border-gold-500/25 flex items-center gap-2">
            <span className="text-[7px] uppercase tracking-wider font-bold text-gold-400">
              Dragging
            </span>
            <span className="text-[9px] font-medium text-gold-300/70 truncate">
              {dragGhost.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
