/* ── PlayerImportModal ─────────────────────────────────────────
 * Modal for importing player characters into the initiative order.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";
import type { CombatEncounter } from "@/types/combat";
import { Button } from "@/components/ui/Button";

interface PlayerImportModalProps {
  characters: PlayerCharacter[];
  activeEncounter: CombatEncounter;
  onImport: (pcId: string) => void;
  onClose: () => void;
}

export function PlayerImportModal({ characters, activeEncounter, onImport, onClose }: PlayerImportModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-surface-100 mb-2">Import Player Characters</h3>
        <p className="text-sm text-surface-400 mb-4">
          Add all campaign player characters to the initiative order.
        </p>
        <div className="space-y-2 mb-4">
          {characters.map((pc) => {
            const exists = activeEncounter.combatants.some(
              (c) => c.name.toLowerCase() === pc.name.toLowerCase(),
            );
            return (
              <div key={pc.id} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-surface-200">{pc.name}</p>
                  <p className="text-xs text-surface-500">{pc.class} · Lvl {pc.level}</p>
                </div>
                {exists ? (
                  <span className="text-xs text-surface-500">✓ Added</span>
                ) : (
                  <button
                    onClick={() => onImport(pc.id)}
                    className="rounded bg-accent-600 px-3 py-1 text-xs font-medium text-white hover:bg-accent-500 transition-colors"
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
