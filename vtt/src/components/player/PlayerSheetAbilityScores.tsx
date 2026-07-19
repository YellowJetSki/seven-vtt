import type { PlayerCharacter } from "@/types";

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetAbilityScoresProps {
  character: PlayerCharacter;
}

export default function PlayerSheetAbilityScores({ character }: PlayerSheetAbilityScoresProps) {
  const c = character;
  const abilities = [
    { name: "STR", key: "strength" as const, value: c.strength },
    { name: "DEX", key: "dexterity" as const, value: c.dexterity },
    { name: "CON", key: "constitution" as const, value: c.constitution },
    { name: "INT", key: "intelligence" as const, value: c.intelligence },
    { name: "WIS", key: "wisdom" as const, value: c.wisdom },
    { name: "CHA", key: "charisma" as const, value: c.charisma },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {abilities.map((a) => (
        <div key={a.key} className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">{a.name}</span>
          <span className="text-2xl font-bold tabular-nums leading-none mt-0.5">{a.value}</span>
          <span className="text-xs font-medium text-surface-400 tabular-nums">{modStr(abilityMod(a.value))}</span>
        </div>
      ))}
    </div>
  );
}
