/* ── CombatantActions ──────────────────────────────────────────
 * Expanded panel for a single combatant: HP controls, status toggles,
 * concentration, dead flag, and remove button.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { Combatant, StatusEffect } from "@/types/combat";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { STATUS_EFFECTS } from "@/data/statusEffects";
import { Button } from "@/components/ui/Button";

interface CombatantActionsProps {
  combatant: Combatant;
}

export function CombatantActions({ combatant }: CombatantActionsProps) {
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);
  const setTempHp = useCombatStore((s) => s.setTempHp);
  const toggleStatus = useCombatStore((s) => s.toggleStatus);
  const toggleConcentration = useCombatStore((s) => s.toggleConcentration);
  const toggleDead = useCombatStore((s) => s.toggleDead);
  const removeCombatant = useCombatStore((s) => s.removeCombatant);
  const showToast = useUiStore((s) => s.showToast);
  const [hpInput, setHpInput] = useState("");

  const handleDamage = () => {
    const val = parseInt(hpInput);
    if (!isNaN(val) && val > 0) { damageCombatant(combatant.id, val, "DM"); setHpInput(""); }
  };

  const handleHeal = () => {
    const val = parseInt(hpInput);
    if (!isNaN(val) && val > 0) { healCombatant(combatant.id, val, "DM"); setHpInput(""); }
  };

  const quickDamage = (amount: number) => damageCombatant(combatant.id, amount, "DM");
  const quickHeal = (amount: number) => healCombatant(combatant.id, amount, "DM");

  return (
    <div className="border-t border-surface-700/50 px-4 py-3 space-y-3">
      {/* HP Controls */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-500">Hit Points</p>
        <div className="flex gap-1.5 flex-wrap">
          <Button variant="danger" size="xs" onClick={() => quickDamage(1)}>-1</Button>
          <Button variant="danger" size="xs" onClick={() => quickDamage(5)}>-5</Button>
          <Button variant="danger" size="xs" onClick={() => quickDamage(10)}>-10</Button>
          <div className="flex flex-1 gap-1 min-w-[120px]">
            <input
              type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
              placeholder="HP"
              className="w-full max-w-[80px] rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-center text-xs text-surface-100 focus:border-accent-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && (e.shiftKey ? handleHeal() : handleDamage())}
            />
            <Button size="xs" onClick={handleDamage} title="Damage (Enter)">−</Button>
            <Button size="xs" variant="secondary" onClick={handleHeal} title="Heal (Shift+Enter)">+</Button>
          </div>
          <Button variant="secondary" size="xs" onClick={() => quickHeal(5)}>+5</Button>
          <Button variant="secondary" size="xs" onClick={() => quickHeal(10)}>+10</Button>
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-surface-500">Temp HP:</span>
          <input
            type="number" defaultValue={combatant.hitPoints.temporary || ""} placeholder="0"
            className="w-16 rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-center text-xs text-surface-100 focus:border-divine-500 focus:outline-none"
            onBlur={(e) => { const val = parseInt(e.target.value); setTempHp(combatant.id, isNaN(val) ? 0 : Math.max(0, val)); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = parseInt((e.target as HTMLInputElement).value);
                setTempHp(combatant.id, isNaN(val) ? 0 : Math.max(0, val));
              }
            }}
          />
          <span className="text-[11px] text-surface-500">· Max HP: {combatant.hitPoints.max}</span>
        </div>
      </div>

      {/* Status Effects */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-500">Status Effects</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(STATUS_EFFECTS).map(([key, def]) => {
            const isActive = combatant.statusEffects.some((s) => s.effect === key);
            return (
              <button
                key={key}
                onClick={() => toggleStatus(combatant.id, key as StatusEffect)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-all ${
                  isActive
                    ? "border-accent-500 bg-accent-500/15 text-accent-300"
                    : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200"
                }`}
                title={def.description}
              >
                {def.icon} {def.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles + Remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox" checked={combatant.isConcentrating}
              onChange={() => toggleConcentration(combatant.id)}
              className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-mage-500"
            />
            <span className="text-xs text-surface-300">🧘 Concentrating</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox" checked={combatant.isDead}
              onChange={() => toggleDead(combatant.id)}
              className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-warrior-500"
            />
            <span className="text-xs text-surface-300">💀 Dead</span>
          </label>
        </div>
        <button
          onClick={() => { removeCombatant(combatant.id); showToast({ message: `"${combatant.name}" removed.`, type: "info" }); }}
          className="text-[11px] text-surface-500 hover:text-warrior-400 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
