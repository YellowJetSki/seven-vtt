import type { PlayerCharacter } from "@/types";

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetCombatStatsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetCombatStats({ character }: PlayerSheetCombatStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
        <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">AC</span>
        <span className="text-2xl font-bold tabular-nums mt-0.5">{character.armorClass}</span>
      </div>
      <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
        <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">Init</span>
        <span className="text-2xl font-bold tabular-nums mt-0.5">{modStr(character.initiative)}</span>
      </div>
      <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
        <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">Speed</span>
        <span className="text-2xl font-bold tabular-nums mt-0.5">{character.speed.walk}</span>
      </div>
    </div>
  );
}
