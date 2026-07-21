/**
 * STᚱ VTT — Player Action Hints (Overrrides-Grade Premium)
 *
 * Cycle 44: Compact quick-action hint buttons that appear in the companion
 * encounter view during the player's turn. Players click an action type
 * to fire a flash message to the DM's HUD indicating their intended action,
 * streamlining communication during live combat.
 *
 * Action Types:
 *   ⚔ Attack — Signal an attack roll is coming
 *   🧙 Cast — Signal a spell is being cast
 *   ❤️ Heal — Signal a healing action
 *   🛡️ Dodge — Signal the Dodge action
 *   🏃 Dash — Signal the Dash action
 *   🫱 Item — Signal item use
 *
 * Design: Overrrides/Ventriloc — compact gold-glass pill buttons,
 *   staggered entrance, active state glow, color-coded per action type.
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useCallback } from "react";

interface ActionHint {
  id: string;
  label: string;
  icon: string;
  color: string;
  hoverColor: string;
  description: string;
}

const ACTION_HINTS: ActionHint[] = [
  { id: "attack", label: "Attack", icon: "⚔️", color: "border-rose-500/20 bg-rose-500/8 text-rose-300", hoverColor: "hover:bg-rose-500/15", description: "Make an attack roll" },
  { id: "cast", label: "Cast", icon: "🧙", color: "border-violet-500/20 bg-violet-500/8 text-violet-300", hoverColor: "hover:bg-violet-500/15", description: "Cast a spell" },
  { id: "heal", label: "Heal", icon: "❤️", color: "border-emerald-500/20 bg-emerald-500/8 text-emerald-300", hoverColor: "hover:bg-emerald-500/15", description: "Cast a healing spell" },
  { id: "dodge", label: "Dodge", icon: "🛡️", color: "border-sky-500/20 bg-sky-500/8 text-sky-300", hoverColor: "hover:bg-sky-500/15", description: "Take the Dodge action" },
  { id: "dash", label: "Dash", icon: "🏃", color: "border-amber-500/20 bg-amber-500/8 text-amber-300", hoverColor: "hover:bg-amber-500/15", description: "Take the Dash action" },
  { id: "item", label: "Item", icon: "🫱", color: "border-gold-500/20 bg-gold-500/8 text-gold-300", hoverColor: "hover:bg-gold-500/15", description: "Use an item" },
];

interface PlayerActionHintsProps {
  onSignalAction: (actionId: string, label: string) => void;
}

export default function PlayerActionHints({ onSignalAction }: PlayerActionHintsProps) {
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const handleHint = useCallback((hint: ActionHint) => {
    setActiveHint(hint.id);
    onSignalAction(hint.id, hint.label);
    // Auto-dismiss the active state after 2 seconds
    setTimeout(() => setActiveHint(null), 2000);
  }, [onSignalAction]);

  return (
    <div className="relative border-b border-white/[0.03] px-3 py-2">
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[7px] uppercase tracking-widest text-gold-500/40 font-semibold">
          Intended Action
        </span>
        {activeHint && (
          <span className="text-[7px] text-gold-500/60 animate-in slide-in-from-right duration-150">
            · Signaled
          </span>
        )}
      </div>

      {/* Action hint pills — 3×2 grid grid-cols-3 sm:grid-cols-6 */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {ACTION_HINTS.map((hint, idx) => (
          <button
            key={hint.id}
            onClick={() => handleHint(hint)}
            style={{ animationDelay: `${idx * 40}ms` }}
            className={`
              group relative flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5
              rounded-lg border transition-all duration-200 active:scale-[0.95]
              animate-in slide-in-from-bottom-1
              ${activeHint === hint.id
                ? `${hint.color} ring-1 ring-inset ring-white/10 scale-[1.03]`
                : `border-white/[0.04] bg-white/[0.01] text-surface-500 ${hint.color.split(' ').slice(2).join(' ')} ${hint.hoverColor}`
              }
            `}
            title={hint.description}
          >
            <span className="text-sm leading-none group-hover:scale-110 transition-transform duration-200">
              {hint.icon}
            </span>
            <span className={`text-[7px] font-bold uppercase tracking-wider transition-colors duration-200 ${
              activeHint === hint.id ? "text-inherit" : "text-surface-500 group-hover:text-surface-300"
            }`}>
              {hint.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
