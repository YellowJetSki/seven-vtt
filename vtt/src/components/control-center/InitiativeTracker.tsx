/**
 * STᚱ VTT — Initiative Tracker
 *
 * DM-only panel displaying combat initiative order with drag-and-drop reordering,
 * inline HP/condition editing, and quick damage/heal controls.
 *
 * All changes instantly reflect on the Theatric Display via shared Zustand store.
 */

import { useState, useCallback, useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import Button from "@/components/ui/Button";
import type { Combatant, CombatEncounter } from "@/types";

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
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);
  const toggleDead = useCombatStore((s) => s.toggleDead);
  const addStatusEffect = useCombatStore((s) => s.addStatusEffect);
  const removeStatusEffect = useCombatStore((s) => s.removeStatusEffect);
  const updateCombatant = useCombatStore((s) => s.updateCombatant);
  const reorderCombatants = useCombatStore((s) => s.reorderCombatants);

  const [quickHpInput, setQuickHpInput] = useState<Record<string, string>>({});
  const [effectInput, setEffectInput] = useState<Record<string, string>>({});
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const sortedCombatants = [...encounter.combatants].sort(
    (a, b) => b.initiative - a.initiative
  );

  const handleQuickDamage = useCallback(
    (id: string) => {
      const val = parseInt(quickHpInput[id] || "0", 10);
      if (val > 0) damageCombatant(id, val);
      else if (val < 0) healCombatant(id, Math.abs(val));
      setQuickHpInput((prev) => ({ ...prev, [id]: "" }));
    },
    [quickHpInput, damageCombatant, healCombatant]
  );

  const handleAddEffect = useCallback(
    (id: string) => {
      const effect = effectInput[id]?.trim();
      if (effect) {
        addStatusEffect(id, effect);
        setEffectInput((prev) => ({ ...prev, [id]: "" }));
      }
    },
    [effectInput, addStatusEffect]
  );

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  };

  const handleDrop = () => {
    if (dragIdx === null || dragOverIdx.current === null) return;
    const reordered = [...sortedCombatants];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(dragOverIdx.current, 0, moved);
    reorderCombatants(reordered.map((c) => c.id));
    setDragIdx(null);
    dragOverIdx.current = null;
  };

  // Color by type
  const typeColor = (type: string) => {
    switch (type) {
      case "player": return "border-l-4 border-l-warrior-500";
      case "enemy": return "border-l-4 border-l-rogue-500";
      case "ally": return "border-l-4 border-l-divine-500";
      default: return "border-l-4 border-l-surface-500";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700/20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gradient-arcane">Initiative</span>
          <span className="text-[10px] text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded-full">
            {sortedCombatants.length}
          </span>
        </div>
        <span className="text-[10px] text-surface-500 uppercase tracking-wider">
          Round {encounter.round || 1}
        </span>
      </div>

      {/* Combatant list */}
      <div className="flex-1 overflow-y-auto space-y-1 px-2 py-2">
        {sortedCombatants.length === 0 && (
          <div className="text-center py-8">
            <p className="text-surface-500 text-xs">No combatants</p>
            <p className="text-surface-600 text-[10px] mt-1">Add tokens or create an encounter</p>
          </div>
        )}

        {sortedCombatants.map((c, idx) => {
          const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
          const hpColor = hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";
          const isCurrentTurn = encounter.currentCombatantIndex === idx && encounter.phase === "active";
          const isSelected = c.id === selectedCombatantId;

          return (
            <div
              key={c.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              onClick={() => onSelectCombatant?.(c.id)}
              className={`
                group relative rounded-lg transition-all duration-150 cursor-pointer
                ${typeColor(c.type)}
                ${isCurrentTurn ? "bg-accent-600/15 ring-1 ring-accent-500/30" : "bg-surface-800/30 hover:bg-surface-700/40"}
                ${isSelected ? "ring-2 ring-accent-400/40" : ""}
                ${c.isDead ? "opacity-50" : ""}
                p-2 pl-3
              `}
            >
              {/* Turn indicator */}
              {isCurrentTurn && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse-soft" />
              )}

              <div className="flex items-center gap-2">
                {/* Initiative number */}
                <span className="text-[10px] font-bold text-accent-400 w-5 text-right shrink-0 font-mono">
                  {c.initiative}
                </span>

                {/* Name */}
                <span className={`text-xs font-semibold truncate flex-1 ${c.isDead ? "line-through text-surface-500" : "text-surface-200"}`}>
                  {c.name}
                </span>

                {/* HP badge */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-12 h-1.5 bg-surface-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${hpColor} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono ${c.hitPoints.current <= 3 && c.hitPoints.current > 0 ? "text-red-400" : "text-surface-400"}`}>
                    {c.hitPoints.current}/{c.hitPoints.max}
                  </span>
                </div>

                {/* Status dots */}
                {c.statusEffects.length > 0 && (
                  <div className="flex gap-0.5 shrink-0">
                    {c.statusEffects.slice(0, 3).map((s) => (
                      <span
                        key={s.id}
                        className="w-1.5 h-1.5 rounded-full bg-mage-400"
                        title={s.effect}
                      />
                    ))}
                    {c.statusEffects.length > 3 && (
                      <span className="text-[8px] text-surface-500">+{c.statusEffects.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick HP input row (visible on hover/select) */}
              <div className={`mt-1.5 flex items-center gap-1.5 transition-all duration-200 ${isSelected || isCurrentTurn ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                <input
                  type="number"
                  value={quickHpInput[c.id] ?? ""}
                  onChange={(e) => setQuickHpInput((p) => ({ ...p, [c.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickDamage(c.id);
                    if (e.key === "Escape") setQuickHpInput((p) => ({ ...p, [c.id]: "" }));
                  }}
                  placeholder="-dmg / +heal"
                  className="w-20 bg-surface-800/60 border border-surface-600/30 rounded px-1.5 py-0.5 text-[10px] text-surface-300 placeholder-surface-600 focus:outline-none focus:border-accent-500/40"
                />
                <button
                  onClick={() => handleQuickDamage(c.id)}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-accent-600/20 text-accent-400 hover:bg-accent-600/30 transition-colors"
                >
                  Apply
                </button>

                {/* Status effect quick add */}
                <input
                  type="text"
                  value={effectInput[c.id] ?? ""}
                  onChange={(e) => setEffectInput((p) => ({ ...p, [c.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddEffect(c.id);
                  }}
                  placeholder="+effect"
                  className="w-16 bg-surface-800/60 border border-surface-600/30 rounded px-1.5 py-0.5 text-[10px] text-surface-300 placeholder-surface-600 focus:outline-none focus:border-accent-500/40"
                />

                {/* Death toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleDead(c.id); }}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                    c.isDead ? "bg-red-500/20 text-red-400" : "bg-surface-700/30 text-surface-500 hover:bg-surface-600/30"
                  }`}
                  title={c.isDead ? "Revive" : "Kill"}
                >
                  {c.isDead ? "♻" : "💀"}
                </button>

                {/* Status effects list */}
                {c.statusEffects.length > 0 && (
                  <div className="flex gap-0.5">
                    {c.statusEffects.map((s) => (
                      <span
                        key={s.id}
                        onClick={(e) => { e.stopPropagation(); removeStatusEffect(c.id, s.id); }}
                        className="px-1 py-0.5 rounded text-[8px] bg-mage-500/20 text-mage-400 cursor-pointer hover:bg-mage-500/40 transition-colors"
                        title={`Click to remove ${s.effect}`}
                      >
                        {s.effect}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
