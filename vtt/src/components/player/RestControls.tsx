/* ── RestControls ──────────────────────────────────────────────
 * Short rest, long rest, and level up buttons for the character sheet.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";
import { getClassSummary } from "@/types";

interface Props {
  character: PlayerCharacter;
  onShortRest: () => void;
  onLongRest: () => void;
  onLevelUp: () => void;
}

export function RestControls({ character, onShortRest, onLongRest, onLevelUp }: Props) {
  return (
    <div className="flex gap-2">
      <button onClick={onShortRest}
        className="flex-1 rounded-xl border border-divine-500/30 bg-divine-500/10 p-3 text-center hover:bg-divine-500/20 transition-colors">
        <span className="text-lg">🏕️</span>
        <p className="text-xs font-medium text-divine-400 mt-1">Short Rest</p>
        <p className="text-[9px] text-divine-500/70">Heal 25% HP + recharge</p>
      </button>
      <button onClick={onLongRest}
        className="flex-1 rounded-xl border border-rogue-500/30 bg-rogue-500/10 p-3 text-center hover:bg-rogue-500/20 transition-colors">
        <span className="text-lg">🛌</span>
        <p className="text-xs font-medium text-rogue-400 mt-1">Long Rest</p>
        <p className="text-[9px] text-rogue-500/70">Full heal + all resources</p>
      </button>
      <button onClick={onLevelUp}
        className="flex-1 rounded-xl border border-accent-500/30 bg-accent-500/10 p-3 text-center hover:bg-accent-500/20 transition-colors">
        <span className="text-lg">⬆️</span>
        <p className="text-xs font-medium text-accent-400 mt-1">Level Up</p>
        <p className="text-[9px] text-accent-500/70">Current: {getClassSummary(character.classes)}</p>
      </button>
    </div>
  );
}
