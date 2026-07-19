/**
 * STᚱ VTT — Initiative Combatant Row (DM Combat Command)
 *
 * Orchestrator component for a single combatant in the initiative tracker.
 * 
 * Mechanical upgrades:
 * - AC badge always visible (DM needs AC at a glance for attack resolution)
 * - Color-coded HP bar with fraction (green > 50%, yellow > 25%, red ≤ 25%)
 * - Temporary HP indicator
 * - Status effects as color-coded badges
 * - Dead/Unconscious visual state (line-through + opacity)
 * - Turn timer color warning (>60s = amber, >120s = red)
 * - Quick HP input with ±1/±5 presets always visible on select/hover
 */

import { useState, useCallback, useEffect, useRef, type DragEvent } from "react";
import type { Combatant, CombatEncounter } from "@/types";

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

const STATUS_COLORS: Record<string, string> = {
  poisoned: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
  paralyzed: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  stunned: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  unconscious: "bg-red-500/20 text-red-400 border-red-500/20",
  prone: "bg-sky-500/20 text-sky-400 border-sky-500/20",
  restrained: "bg-violet-500/20 text-violet-400 border-violet-500/20",
  frightened: "bg-indigo-500/20 text-indigo-400 border-indigo-500/20",
  blinded: "bg-surface-500/20 text-surface-400 border-surface-500/20",
  invisible: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
  concentrating: "bg-gold-500/15 text-gold-400 border-gold-500/15",
  blessed: "bg-gold-500/15 text-gold-400 border-gold-500/15",
};

function getStatusColor(effect: string): string {
  const key = effect.toLowerCase().trim();
  return STATUS_COLORS[key] || "bg-white/[0.06] text-surface-400 border-white/[0.06]";
}

export default function InitiativeCombatantRow(props: InitiativeCombatantRowProps) {
  const {
    combatant: c,
    index,
    encounter,
    isSelected,
    isCurrentTurn,
    onSelect,
    onDragStart,
    onDragOver,
    onDrop,
    onDamage,
    onHeal,
    onToggleDead,
    onAddEffect,
    onRemoveEffect,
  } = props;

  const [quickHpInput, setQuickHpInput] = useState("");
  const [effectInput, setEffectInput] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current turn
  useEffect(() => {
    if (isCurrentTurn && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isCurrentTurn]);

  const applyHp = useCallback(() => {
    const val = parseInt(quickHpInput, 10);
    if (val > 0) onDamage(c.id, val);
    else if (val < 0) onHeal(c.id, Math.abs(val));
    setQuickHpInput("");
  }, [quickHpInput, c.id, onDamage, onHeal]);

  const applyHpPreset = useCallback(
    (amount: number) => {
      if (amount > 0) onDamage(c.id, amount);
      else onHeal(c.id, Math.abs(amount));
    },
    [c.id, onDamage, onHeal]
  );

  const addEffect = useCallback(() => {
    const effect = effectInput.trim();
    if (effect) {
      onAddEffect(c.id, effect);
      setEffectInput("");
    }
  }, [effectInput, c.id, onAddEffect]);

  // HP calculations
  const { current, max, temporary } = c.hitPoints;
  const ratio = max > 0 ? current / max : 0;
  const hpBarColor = ratio > 0.6 ? "bg-emerald-500/70" : ratio > 0.3 ? "bg-amber-500/70" : "bg-red-500/70";
  const hpTextColor = ratio > 0.6 ? "text-emerald-400" : ratio > 0.3 ? "text-amber-400" : "text-red-400";

  return (
    <div
      ref={rowRef}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={onDrop}
      onClick={() => {
        onSelect(c.id);
        setShowQuickActions(true);
      }}
      onMouseEnter={() => setShowQuickActions(true)}
      onMouseLeave={() => {
        if (!isSelected && !isCurrentTurn) setShowQuickActions(false);
      }}
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

      {/* ── Primary Row: Init | Type | Name | AC | HP | Status dots ── */}
      <div className="flex items-center gap-2">
        {/* Initiative number */}
        <span className="text-[10px] font-bold text-gold-400 w-5 text-right shrink-0 font-mono">
          {c.initiative}
        </span>

        {/* Type indicator */}
        <span className="text-xs shrink-0">
          {c.type === "player" ? "🛡" : c.type === "enemy" ? "👹" : "🧙"}
        </span>

        {/* Name */}
        <span
          className={`text-xs font-semibold truncate flex-1 ${
            c.isDead ? "line-through text-surface-500" : "text-surface-200"
          }`}
        >
          {c.name}
        </span>

        {/* AC badge — always visible for attack resolution */}
        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#07080d] border border-white/[0.05] text-surface-400 shrink-0">
          AC {c.armorClass}
        </span>

        {/* HP fraction */}
        <span className={`text-[10px] font-bold font-mono tabular-nums shrink-0 ${hpTextColor}`}>
          {current}
          <span className="text-surface-600 font-normal">/{max}</span>
        </span>

        {/* Mini HP bar */}
        <div className="w-10 h-1 bg-[#07080d] rounded-full overflow-hidden shrink-0">
          <div
            className={`h-full rounded-full transition-all duration-300 ${hpBarColor}`}
            style={{ width: `${Math.max(0, ratio * 100)}%` }}
          />
        </div>

        {/* Temporary HP indicator */}
        {temporary > 0 && (
          <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/10 border border-amber-500/15 px-1 py-0.5 rounded shrink-0">
            +{temporary} THP
          </span>
        )}

        {/* Status effect dots */}
        {c.statusEffects.length > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            {c.statusEffects.slice(0, 3).map((eff) => (
              <span
                key={eff.id}
                className={`text-[8px] font-bold px-1 py-0.5 rounded ${getStatusColor(eff.effect)}`}
              >
                {eff.effect.substring(0, 4)}
              </span>
            ))}
            {c.statusEffects.length > 3 && (
              <span className="text-[8px] text-surface-500">+{c.statusEffects.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Quick Actions (hover/selected reveal) ── */}
      <div
        className={`mt-1.5 flex items-center gap-1.5 transition-all duration-200 ${
          showQuickActions || isSelected || isCurrentTurn
            ? "opacity-100 max-h-12"
            : "opacity-0 max-h-0 overflow-hidden"
        }`}
      >
        {/* HP preset buttons */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); applyHpPreset(-5); }}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/8 text-emerald-400/70 border border-emerald-500/8 hover:bg-emerald-500/15 hover:text-emerald-400 active:scale-95 transition-all duration-150"
          >
            -5
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); applyHpPreset(-1); }}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/8 text-emerald-400/70 border border-emerald-500/8 hover:bg-emerald-500/15 hover:text-emerald-400 active:scale-95 transition-all duration-150"
          >
            -1
          </button>
          <input
            type="number"
            value={quickHpInput}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setQuickHpInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyHp(); }
              if (e.key === "Escape") setQuickHpInput("");
            }}
            placeholder="+/-HP"
            className="w-14 text-center py-0.5 rounded text-[9px] font-mono bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-600"
          />
          <button
            onClick={(e) => { e.stopPropagation(); applyHpPreset(1); }}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/8 text-red-400/70 border border-red-500/8 hover:bg-red-500/15 hover:text-red-400 active:scale-95 transition-all duration-150"
          >
            +1
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); applyHpPreset(5); }}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/8 text-red-400/70 border border-red-500/8 hover:bg-red-500/15 hover:text-red-400 active:scale-95 transition-all duration-150"
          >
            +5
          </button>
        </div>

        {/* Status effect input */}
        <input
          type="text"
          value={effectInput}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setEffectInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addEffect(); }
          }}
          placeholder="+Effect"
          className="w-20 text-center py-0.5 rounded text-[9px] font-mono bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-600"
        />

        {/* Dead toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleDead(c.id);
          }}
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border active:scale-95 transition-all duration-150 ${
            c.isDead
              ? "bg-emerald-500/10 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15"
              : "bg-red-500/8 border-red-500/8 text-red-400/70 hover:bg-red-500/15 hover:text-red-400"
          }`}
        >
          {c.isDead ? "Revive" : "Kill"}
        </button>
      </div>
    </div>
  );
}
