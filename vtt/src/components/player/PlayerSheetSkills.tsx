import type { PlayerCharacter } from "@/types";

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const SKILL_ABILITIES: Record<string, string> = {
  acrobatics: "dexterity", animal_handling: "wisdom", arcana: "intelligence",
  athletics: "strength", deception: "charisma", history: "intelligence",
  insight: "wisdom", intimidation: "charisma", investigation: "intelligence",
  medicine: "wisdom", nature: "intelligence", perception: "wisdom",
  performance: "charisma", persuasion: "charisma", religion: "intelligence",
  sleight_of_hand: "dexterity", stealth: "dexterity", survival: "wisdom",
};

interface PlayerSheetSkillsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetSkills({ character }: PlayerSheetSkillsProps) {
  const c = character;
  const skillNames = Object.entries(c.skills);

  if (skillNames.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-surface-500 text-xs">No skill proficiencies set</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-1">
      {skillNames.map(([skill, prof]) => {
        const abilKey = SKILL_ABILITIES[skill] as keyof typeof c;
        const abilVal = typeof c[abilKey] === "number" ? (c[abilKey] as number) : 10;
        const mod = abilityMod(abilVal);
        const profBonus = prof === "proficient" ? c.proficiencyBonus : prof === "expertise" ? c.proficiencyBonus * 2 : 0;
        const total = mod + profBonus;
        return (
          <div key={skill} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-800/20">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] w-4 text-center ${prof === "none" ? "text-surface-600" : "text-accent-400"}`}>
                {prof === "expertise" ? "⨁" : prof === "proficient" ? "●" : "○"}
              </span>
              <span className="text-xs text-surface-300 capitalize">{skill.replace(/_/g, " ")}</span>
            </div>
            <span className="text-xs font-mono font-bold tabular-nums">{modStr(total)}</span>
          </div>
        );
      })}
    </div>
  );
}
