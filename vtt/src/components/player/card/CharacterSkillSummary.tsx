/* ── CharacterSkillSummary ─────────────────────────────────────
 * Compact saving throw & skill proficiency display with dot
 * indicators, total bonuses, and expertise markers.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability, SkillProficiency } from "@/types";

const SAVES_LIST: { key: Ability; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

const SKILL_DISPLAY: { key: string; label: string; ability: Ability }[] = [
  { key: "acrobatics", label: "Acro", ability: "dexterity" },
  { key: "animalHandling", label: "Animal", ability: "wisdom" },
  { key: "arcana", label: "Arcana", ability: "intelligence" },
  { key: "athletics", label: "Athl", ability: "strength" },
  { key: "deception", label: "Decep", ability: "charisma" },
  { key: "history", label: "Hist", ability: "intelligence" },
  { key: "insight", label: "Insight", ability: "wisdom" },
  { key: "intimidation", label: "Intim", ability: "charisma" },
  { key: "investigation", label: "Invest", ability: "intelligence" },
  { key: "medicine", label: "Med", ability: "wisdom" },
  { key: "nature", label: "Nature", ability: "intelligence" },
  { key: "perception", label: "Percep", ability: "wisdom" },
  { key: "performance", label: "Perform", ability: "charisma" },
  { key: "persuasion", label: "Persu", ability: "charisma" },
  { key: "religion", label: "Relig", ability: "intelligence" },
  { key: "sleightOfHand", label: "Sleight", ability: "dexterity" },
  { key: "stealth", label: "Stealth", ability: "dexterity" },
  { key: "survival", label: "Surv", ability: "wisdom" },
];

function getMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmtMod(m: number): string {
  return m >= 0 ? `+${m}` : `${m}`;
}

function calcSkillBonus(character: PlayerCharacter, skillKey: string, baseMod: number): number {
  const prof = (character.skills as Record<string, SkillProficiency>)?.[skillKey] ?? "none";
  const pb = character.proficiencyBonus;
  if (prof === "expertise") return baseMod + pb * 2;
  if (prof === "proficient") return baseMod + pb;
  return baseMod;
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterSkillSummary({ character }: Props) {
  const profSkills = Object.entries(character.skills ?? {}).filter(
    ([, v]) => v === "proficient" || v === "expertise"
  );
  const hasExpertise = profSkills.some(([, v]) => v === "expertise");

  return (
    <div className="space-y-1.5">
      {/* ── Saving Throws ── */}
      <div className="flex flex-wrap gap-1">
        <span className="text-[8px] font-semibold uppercase tracking-wider text-surface-500 self-center mr-0.5">Saves</span>
        {SAVES_LIST.map(({ key, label }) => {
          const isProf = character.savingThrows?.[key]?.proficient ?? false;
          const mod = getMod(character[key]);
          const total = mod + (isProf ? character.proficiencyBonus : 0);
          return (
            <span key={key} className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-mono font-bold ${
              isProf ? "bg-mage-500/15 text-mage-400" : "bg-surface-800 text-surface-500"
            }`}>
              {isProf && <span className="h-1 w-1 rounded-full bg-mage-400" />}
              {label} {fmtMod(total)}
            </span>
          );
        })}
      </div>

      {/* ── Proficient Skills ── */}
      {profSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-surface-500 self-center mr-0.5">Skills</span>
          {profSkills.slice(0, 6).map(([key]) => {
            const entry = SKILL_DISPLAY.find((s) => s.key === key);
            if (!entry) return null;
            const baseMod = getMod(character[entry.ability]);
            const total = calcSkillBonus(character, key, baseMod);
            const isExp = (character.skills as Record<string, SkillProficiency>)[key] === "expertise";
            return (
              <span key={key} className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-mono font-bold ${
                isExp ? "bg-accent-500/15 text-accent-400" : "bg-rogue-500/10 text-rogue-400"
              }`}>
                {isExp ? "★" : "●"}
                {entry.label} {fmtMod(total)}
              </span>
            );
          })}
          {profSkills.length > 6 && (
            <span className="text-[9px] text-surface-500 self-center">+{profSkills.length - 6}</span>
          )}
          {hasExpertise && (
            <span className="text-[8px] text-accent-500 self-center ml-auto">★ Expertise</span>
          )}
        </div>
      )}
    </div>
  );
}
