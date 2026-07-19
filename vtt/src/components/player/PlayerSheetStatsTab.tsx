import { useCampaignStore } from "@/stores/campaignStore";
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

function skillAbility(name: string): string {
  return SKILL_ABILITIES[name] || "wisdom";
}

interface PlayerSheetStatsTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetStatsTab({ character }: PlayerSheetStatsTabProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const toggleInspiration = () => {
    updateCharacter(c.id, { inspiration: !c.inspiration });
  };

  const abilities = [
    { name: "STR", key: "strength", value: c.strength },
    { name: "DEX", key: "dexterity", value: c.dexterity },
    { name: "CON", key: "constitution", value: c.constitution },
    { name: "INT", key: "intelligence", value: c.intelligence },
    { name: "WIS", key: "wisdom", value: c.wisdom },
    { name: "CHA", key: "charisma", value: c.charisma },
  ] as const;

  const renderAbilities = () => (
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

  const renderSkills = () => {
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
          const abilKey = skillAbility(skill) as keyof typeof c;
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
  };

  return (
    <div className="space-y-4 px-3 py-3">
      <button
        onClick={toggleInspiration}
        className={`w-full py-2 rounded-xl text-center text-xs font-semibold border active:scale-[0.98] transition-all ${
          c.inspiration
            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
            : "bg-surface-800/30 border-surface-700/20 text-surface-500"
        }`}
      >
        {c.inspiration ? "✦ Inspiration (Active)" : "✦ No Inspiration"}
      </button>

      <div className="rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Experience Points</span>
          <span className="text-xs font-mono font-bold text-surface-200 tabular-nums">{c.experiencePoints.toLocaleString()} XP</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-surface-500">Level {c.level} · Next level: {(c.level * 1000).toLocaleString()} XP needed</span>
          <span className="text-[10px] text-surface-500">
            {c.level < 20 ? "▲ " + ((c.level * 1000) - c.experiencePoints).toLocaleString() + " to go" : "✦ MAX"}
          </span>
        </div>
        <div className="h-1.5 bg-surface-700/60 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-accent-500 rounded-full transition-all duration-300"
            style={{ width: `${c.level < 20 ? Math.min(100, (c.experiencePoints / (c.level * 1000)) * 100) : 100}%` }}
          />
        </div>
      </div>

      {renderAbilities()}

      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">Saving Throws</span>
        <div className="space-y-1">
          {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((s) => {
            const save = c.savingThrows[s];
            const mod = abilityMod(c[s as keyof typeof c] as number);
            const total = mod + (save?.proficient ? c.proficiencyBonus : 0) + (save?.bonus || 0);
            return (
              <div key={s} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-800/20">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] ${save?.proficient ? "text-accent-400" : "text-surface-600"}`}>
                    {save?.proficient ? "●" : "○"}
                  </span>
                  <span className="text-xs text-surface-300 capitalize">{s}</span>
                </div>
                <span className="text-xs font-mono font-bold tabular-nums">{modStr(total)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">Skills</span>
        {renderSkills()}
      </div>
    </div>
  );
}
