/**
 * STᚱ VTT — Initiative Combatant Row
 *
 * Orchestrator component for a single combatant in the initiative tracker.
 * Composed of sub-components for type indicator, HP bar, inputs, and status effects.
 */

import { useState, type DragEvent } from "react";
import type { Combatant, CombatEncounter } from "@/types";
import CombatantTypeIndicator from "./CombatantTypeIndicator";
import CombatantHpBar from "./CombatantHpBar";
import CombatantQuickInput from "./CombatantQuickInput";
import EffectQuickInput from "./EffectQuickInput";
import DeathToggle from "./DeathToggle";
import StatusDotIndicators from "./StatusDotIndicators";
import StatusEffectsList from "./StatusEffectsList";

interface InitiativeCombatantRowProps {
  combatant: Combatant;
  index: number;
  encounter: CombatEncounter;
  isSelected: boolean;
  isCurrentTurn: boolean;
  onSelect: (id: string) => void;
  onDragStart: (idx: number) => void;
  onDragOver: (e: DragEvent, idx: number) => void;
  onDrop: () => void;
  onDamage: (id: string, amount: number) => void;
  onHeal: (id: string, amount: number) => void;
  onToggleDead: (id: string) => void;
  onAddEffect: (id: string, effect: string) => void;
  onRemoveEffect: (id: string, effectId: string) => void;
}

export default function InitiativeCombatantRow(props: InitiativeCombatantRowProps) {
  const { combatant: c, index, encounter, isSelected, isCurrentTurn, onSelect, onDragStart, onDragOver, onDrop, onDamage, onHeal, onToggleDead, onAddEffect, onRemoveEffect } = props;
  const [quickHpInput, setQuickHpInput] = useState("");
  const [effectInput, setEffectInput] = useState("");

  const applyHp = () => {
    const val = parseInt(quickHpInput, 10);
    if (val > 0) onDamage(c.id, val);
    else if (val < 0) onHeal(c.id, Math.abs(val));
    setQuickHpInput("");
  };

  const addEffect = () => {
    const effect = effectInput.trim();
    if (effect) { onAddEffect(c.id, effect); setEffectInput(""); }
  };

  return (
    <div draggable onDragStart={() => onDragStart(index)} onDragOver={(e) => onDragOver(e, index)} onDrop={onDrop} onClick={() => onSelect(c.id)}
      className={`group relative rounded-lg transition-all duration-150 cursor-pointer ${isCurrentTurn ? "bg-accent-600/15 ring-1 ring-accent-500/30" : "bg-surface-800/30 hover:bg-surface-700/40"} ${isSelected ? "ring-2 ring-accent-400/40" : ""} ${c.isDead ? "opacity-50" : ""} p-2 pl-3`}>
      {isCurrentTurn && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse-soft" />}
      <div className="flex items-center gap-2">
        <CombatantTypeIndicator type={c.type} />
        <span className="text-[10px] font-bold text-accent-400 w-5 text-right shrink-0 font-mono">{c.initiative}</span>
        <span className={`text-xs font-semibold truncate flex-1 ${c.isDead ? "line-through text-surface-500" : "text-surface-200"}`}>{c.name}</span>
        <CombatantHpBar current={c.hitPoints.current} max={c.hitPoints.max} />
        <StatusDotIndicators effects={c.statusEffects} />
      </div>
      <div className={`mt-1.5 flex items-center gap-1.5 transition-all duration-200 ${isSelected || isCurrentTurn ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <CombatantQuickInput value={quickHpInput} onChange={setQuickHpInput} onApply={applyHp} onKeyDown={(e) => { if (e.key === "Enter") applyHp(); if (e.key === "Escape") setQuickHpInput(""); }} />
        <EffectQuickInput value={effectInput} onChange={setEffectInput} onKeyDown={(e) => { if (e.key === "Enter") addEffect(); }} />
        <DeathToggle isDead={c.isDead} onToggle={onToggleDead} combatantId={c.id} />
        <StatusEffectsList effects={c.statusEffects} onRemoveEffect={(effectId) => onRemoveEffect(c.id, effectId)} />
      </div>
    </div>
  );
}
