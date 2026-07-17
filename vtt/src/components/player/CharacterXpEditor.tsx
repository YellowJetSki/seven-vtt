/* ── CharacterXpEditor ─────────────────────────────────────────
 * Modal for editing a character's experience points.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  currentXp: number;
  onSave: (xp: number) => void;
  onClose: () => void;
}

export function CharacterXpEditor({ currentXp, onSave, onClose }: Props) {
  const [xpInput, setXpInput] = useState(String(currentXp));

  const handleSave = () => {
    const val = parseInt(xpInput, 10);
    if (isNaN(val)) return;
    onSave(Math.max(0, val));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-surface-100 mb-4">Update Experience Points</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-surface-400">Current XP</label>
            <input type="number" value={xpInput} onChange={(e) => setXpInput(e.target.value)} min={0}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 mt-1 focus:border-accent-500 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save XP</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
