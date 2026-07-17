/* ── CharacterQuickStats ───────────────────────────────────────
 * Display ability scores, saving throws, and skills for a character.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";

const ABILITY_KEYS: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABBR_MAP: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

const SKILL_ENTRIES = [
  { key: "acrobatics", label: "Acrobatics", ability: "dexterity" as Ability },
  { key: "athletics", label: "Athletics", ability: "strength" as Ability },
  { key: "deception", label: "Deception", ability: "charisma" as Ability },
  { key: "history", label: "History", ability: "intelligence" as Ability },
  { key: "insight", label: "Insight", ability: "wisdom" as Ability },
  { key: "intimidation", label: "Intimidation", ability: "charisma" as Ability },
  { key: "investigation", label: "Investigation", ability: "intelligence" as Ability },
  { key: "nature", label: "Nature", ability: "intelligence" as Ability },
  { key: "perception", label: "Perception", ability: "wisdom" as Ability },
  { key: "performance", label: "Performance", ability: "charisma" as Ability },
  { key: "persuasion", label: "Persuasion", ability: "charisma" as Ability },
  { key: "religion", label: "Religion", ability: "intelligence" as Ability },
  { key: "sleightOfHand", label: "Sleight of Hand", ability: "dexterity" as Ability },
  { key: "stealth", label: "Stealth", ability: "dexterity" as Ability },
  { key: "survival", label: "Survival", ability: "wisdom" as Ability },
];

function skillBonus(skillKey: string, char: PlayerCharacter, profSkills: Set<string>, profBonus: number): number {
  const entry = SKILL_ENTRIES.find((s) => s.key === skillKey);
  if (!entry) return 0;
  const base = abilityMod(char[entry.ability]);
  return profSkills.has(skillKey) ? base + profBonus : base;
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterQuickStats({ character }: Props) {
  const profSkills = new Set<string>();
  const profs: unknown[] = character.proficiencies ?? [];
  for (const p of profs) {
    const lower = typeof p === 'string' ? p.toLowerCase().trim() : (p as { name: string }).name?.toLowerCase().trim() ?? '';
    for (const entry of SKILL_ENTRIES) {
      if (lower.includes(entry.key) || lower.includes(entry.label.toLowerCase())) profSkills.add(entry.key);
    }
  }

  const profBonus = character.proficiencyBonus ?? 2;

  return (
    <div className="space-y-4">
      {/* Ability Scores */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Ability Scores</h2>
        <div className="grid grid-cols-6 gap-2">
          {ABILITY_KEYS.map((name) => {
            const score = character[name];
            const m = abilityMod(score);
            return (
              <div key={name} className="rounded-lg bg-surface-800 py-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase text-surface-500">{ABBR_MAP[name]}</p>
                <p className="mt-0.5 text-lg font-bold text-surface-100">{score}</p>
                <p className={`text-xs font-medium ${m >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{m >= 0 ? "+" : ""}{m}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Saving Throws & Skills */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Saving Throws</h2>
          <div className="space-y-1.5">
            {ABILITY_KEYS.map((name) => {
              const abbr = ABBR_MAP[name];
              const mod = abilityMod(character[name]);
              const st = character.savingThrows?.[name];
              const isProficient = st?.proficient ?? (character.proficiencies ?? []).some((p: unknown) =>
                typeof p === 'string' ? p.toLowerCase().includes(name) : false) ?? false;
              const val = isProficient ? mod + profBonus : mod;
              return (
                <div key={name} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                  <div className="flex items-center gap-2">
                    {isProficient && <span className="h-1.5 w-1.5 rounded-full bg-rogue-500" />}
                    <span className={`text-sm ${isProficient ? "font-semibold text-surface-100" : "text-surface-400"}`}>{abbr}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${val >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{val >= 0 ? "+" : ""}{val}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Skills</h2>
          <div className="grid grid-cols-1 gap-1">
            {SKILL_ENTRIES.map((entry) => {
              const val = skillBonus(entry.key, character, profSkills, profBonus);
              return (
                <div key={entry.key} className="flex items-center justify-between rounded-md px-2.5 py-1.5 hover:bg-surface-800">
                  <div className="flex items-center gap-2">
                    {profSkills.has(entry.key) && <span className="h-1 w-1 rounded-full bg-rogue-500" />}
                    <span className={`text-xs ${profSkills.has(entry.key) ? "font-medium text-surface-200" : "text-surface-400"}`}>{entry.label}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${val >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{val >= 0 ? "+" : ""}{val}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
