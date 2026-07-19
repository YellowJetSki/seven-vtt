import type { PlayerCharacter } from "@/types";

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetSavingThrowsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetSavingThrows({ character }: PlayerSheetSavingThrowsProps) {
  const c = character;

  return (
    <div>
      <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Saving Throws</span>
      <div className="space-y-1">
        {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((s) => {
          const save = c.savingThrows[s];
          const mod = abilityMod(c[s as keyof typeof c] as number);
          const total = mod + (save?.proficient ? c.proficiencyBonus : 0) + (save?.bonus || 0);
          return (
            <div key={s} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] ${save?.proficient ? "text-gold-400" : "text-surface-600"}`}>
                  {save?.proficient ? "●" : "○"}
                </span>
                <span className="text-xs text-surface-300 capitalize">{s}</span>
              </div>
              <span className="text-xs font-mono font-bold tabular-nums text-gold-300">{modStr(total)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
