import { useMemo } from "react";
import type { PlayerCharacter } from "@/types";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

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
  const pb = useMemo(() => getProficiencyBonus(c.level), [c.level]);
  const skillNames = Object.entries(c.skills);

  // Group by ability for better organization
  const grouped = useMemo(() => {
    const groups: Record<string, { skill: string; prof: string; total: number }[]> = {};
    for (const [skill, prof] of skillNames) {
      const abilKey = SKILL_ABILITIES[skill] as keyof typeof c;
      const abilVal = typeof c[abilKey] === "number" ? (c[abilKey] as number) : 10;
      const mod = getAbilityMod(abilVal);
      const profBonus = prof === "proficient" ? pb : prof === "expertise" ? pb * 2 : 0;
      const total = mod + profBonus;
      const abil = SKILL_ABILITIES[skill] || "unknown";
      if (!groups[abil]) groups[abil] = [];
      groups[abil].push({ skill: skill.replace(/_/g, " "), prof, total });
    }
    return groups;
  }, [skillNames, c, pb]);

  // Custom sort for ability groups
  const abilityOrder = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

  if (skillNames.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-surface-500 text-xs">No skill proficiencies set</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {abilityOrder.map((abil) => {
        const skills = grouped[abil];
        if (!skills || skills.length === 0) return null;
        return (
          <div key={abil}>
            <span className="text-[8px] uppercase tracking-widest text-gold-500/40 block mb-0.5 px-1">
              {abil.charAt(0).toUpperCase() + abil.slice(1)}
            </span>
            <div className="space-y-0.5">
              {skills.map(({ skill, prof, total }) => (
                <div key={skill} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] w-4 text-center ${prof === "none" ? "text-surface-600" : prof === "expertise" ? "text-cyan-400" : "text-gold-400"}`}>
                      {prof === "expertise" ? "⨁" : prof === "proficient" ? "●" : "○"}
                    </span>
                    <span className="text-xs text-surface-300 capitalize">{skill}</span>
                  </div>
                  <span className="text-xs font-mono font-bold tabular-nums text-gold-300">{modStr(total)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
