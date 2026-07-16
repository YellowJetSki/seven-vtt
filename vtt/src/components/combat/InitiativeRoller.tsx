/* ── Initiative Roller — D&D 5e DEX-Based Initiative ------------
 * Allows the DM to assign initiative to combatants manually
 * or calculate from Dexterity modifier. This is NOT a dice roller;
 * it computes initiative = DEX mod + miscBonus and lets the DM
 * input a final value manually.
 * ---------------------------------------------------------------- */

import { useState } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { abilityModifier, formatModifier } from "@/lib/dnd-utils";
import { Button } from "@/components/ui/Button";

export function InitiativeRoller() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const setCombatantInitiative = useCombatStore((s) => s.setCombatantInitiative);
  const showToast = useUiStore((s) => s.showToast);
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);

  const [isOpen, setIsOpen] = useState(false);

  if (!activeEncounter) return null;

  const allCombatants = activeEncounter.combatants;

  const handleAssignAll = () => {
    let updated = 0;
    for (const c of allCombatants) {
      // For player characters, calculate from DEX only (no random roll)
      // The player rolls their physical die and the DM inputs the total
      const pc = characters.find(
        (pc) => pc.name.toLowerCase() === c.name.toLowerCase()
      );
      if (pc) {
        const dexMod = abilityModifier(pc.dexterity);
        // Set base initiative (DEX mod) — DM manually adds physical die roll
        setCombatantInitiative(c.id, dexMod);
        updated++;
      }
    }
    if (updated > 0) {
      showToast({ message: `Base initiative (DEX mod) assigned for ${updated} PC(s). Players roll physical dice for final value.`, type: "success" });
    } else {
      showToast({ message: "No player characters found in combat to assign initiative.", type: "warning" });
    }
  };

  const handleClearAll = () => {
    for (const c of allCombatants) {
      setCombatantInitiative(c.id, 0);
    }
    showToast({ message: "Cleared all initiative values.", type: "info" });
  };

  const handleSortByInitiative = () => {
    // Re-order combatants by sorting their initiative values in descending order
    const sorted = [...allCombatants].sort((a, b) => b.initiative - a.initiative);
    sorted.forEach((c, idx) => {
      setCombatantInitiative(c.id, sorted.length - idx);
    });
    showToast({ message: "Combatants sorted by initiative (highest first).", type: "success" });
  };

  return (
    <div>
      <Button size="xs" variant="ghost" onClick={() => setIsOpen(!isOpen)}>
        🎲 Init Tools {isOpen ? "▲" : "▼"}
      </Button>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-surface-700 bg-surface-850 p-3 space-y-2 animate-slide-up">
          <p className="text-[11px] text-surface-400 font-medium uppercase tracking-wider mb-2">
            Initiative Management
          </p>

          {/* Manual assignment per combatant */}
          <div className="max-h-40 overflow-y-auto space-y-1">
            {allCombatants.map((c) => {
              const pc = characters.find(
                (pc) => pc.name.toLowerCase() === c.name.toLowerCase()
              );
              const dexMod = pc ? abilityModifier(pc.dexterity) : null;
              return (
                <div key={c.id} className="flex items-center gap-2 rounded bg-surface-800 px-2 py-1.5">
                  <span className="flex-1 text-xs text-surface-300 truncate">{c.name}</span>
                  {dexMod !== null && (
                    <span className="text-[10px] text-surface-500">DEX {formatModifier(dexMod)}</span>
                  )}
                  <input
                    type="number"
                    value={c.initiative}
                    onChange={(e) => setCombatantInitiative(c.id, parseInt(e.target.value) || 0)}
                    className="w-16 rounded border border-surface-700 bg-surface-900 px-2 py-0.5 text-center text-xs text-surface-100 focus:border-accent-500 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="xs" variant="ghost" onClick={handleAssignAll}>
              🎲 Assign from DEX
            </Button>
            <Button size="xs" variant="ghost" onClick={handleSortByInitiative}>
              🔽 Sort
            </Button>
            <Button size="xs" variant="ghost" onClick={handleClearAll}>
              🗑️ Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
