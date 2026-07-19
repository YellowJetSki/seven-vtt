/**
 * STᚱ VTT — Initiative Combatant Row (Premium Gold)
 *
 * Orchestrator component for a single combatant in the initiative tracker.
 * Gold-accented active turn indicator, gold hover effects.
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
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={onDrop}
      onClick={() => onSelect(c.id)}
      className={`group relative rounded-lg transition-all duration-200 cursor-pointer ${
        isCurrentTurn
          ? "bg-gold-500/8 ring-1 ring-gold/25 shadow-[0_0_12px_rgba(234,179,8,0.04)]"
          : "bg-obsidian-mid/40 hover:bg-gold-500/[0.03]"
      } ${
        isSelected ? "ring-2 ring-gold/30" : ""
      } ${
        c.isDead ? "opacity-50" : ""
      } p-2 pl-3`}
    >
      {/* Current turn gold pulse dot */}
      {isCurrentTurn && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse-soft shadow-[0_0_6px_rgba(234,179,8,0.4)]" />
      )}

      <div className="flex items-center gap-2">
        <CombatantTypeIndicator type={c.type} />
        <span className="text-[10px] font-bold text-gold-400 w-5 text-right shrink-0 font-mono">{c.initiative}</span>
        <span className={`text-xs font-semibold truncate flex-1 ${
          c.isDead ? "line-through text-surface-500" : "text-surface-200"
        }`}>
          {c.name}
        </span>
        <CombatantHpBar current={c.hitPoints.current} max={c.hitPoints.max} />
        <StatusDotIndicators effects={c.statusEffects} />
      </div>

      {/* Quick inputs — gold-accented, appear on hover/select */}
      <div className={`mt-1.5 flex items-center gap-1.5 transition-all duration-200 ${
        isSelected || isCurrentTurn ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}>
        <CombatantQuickInput
          value={quickHpInput}
          onChange={setQuickHpInput}
          onApply={applyHp}
          onKeyDown={(e) => {
            if (e.key === "Enter") applyHp();
            if (e.key === "Escape") setQuickHpInput("");
          }}
        />
        <EffectQuickInput
          value={effectInput}
          onChange={setEffectInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") addEffect();
          }}
        />
        <DeathToggle isDead={c.isDead} onToggle={onToggleDead} combatantId={c.id} />
        <StatusEffectsList effects={c.statusEffects} onRemoveEffect={(effectId) => onRemoveEffect(c.id, effectId)} />
      </div>
    </div>
  );
}
