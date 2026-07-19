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
      <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
        <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">AC</span>
        <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-200 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">{character.armorClass}</span>
      </div>
      <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
        <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Init</span>
        <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-200 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">{modStr(character.initiative)}</span>
      </div>
      <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
        <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Speed</span>
        <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-200 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">{character.speed.walk}</span>
      </div>
    </div>
  );
}
