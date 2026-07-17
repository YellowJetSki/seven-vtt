/* ── CharacterHpEditor ─────────────────────────────────────────
 * Modal for editing a character's HP and temporary HP.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { PlayerCharacter } from "@/types";
import { Button } from "@/components/ui/Button";

interface Props {
  character: PlayerCharacter;
  onSave: (current: number, temporary: number) => void;
  onClose: () => void;
}

export function CharacterHpEditor({ character, onSave, onClose }: Props) {
  const [hpInput, setHpInput] = useState(String(character.hitPoints.current));
  const [tempHpInput, setTempHpInput] = useState(String(character.hitPoints.temporary || 0));

  const handleSave = () => {
    const val = parseInt(hpInput, 10);
    const temp = parseInt(tempHpInput, 10);
    if (isNaN(val)) return;
    onSave(Math.max(0, Math.min(val, character.hitPoints.max)), isNaN(temp) ? 0 : Math.max(0, temp));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-surface-100 mb-4">Update Hit Points</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-surface-400">Current HP (max: {character.hitPoints.max})</label>
            <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
              min={0} max={character.hitPoints.max}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 mt-1 focus:border-accent-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-surface-400">Temporary HP</label>
            <input type="number" value={tempHpInput} onChange={(e) => setTempHpInput(e.target.value)}
              min={0}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 mt-1 focus:border-accent-500 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save HP</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
