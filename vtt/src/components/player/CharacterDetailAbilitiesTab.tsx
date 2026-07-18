/* ── CharacterDetailAbilitiesTab ────────────────────────────────
 * Abilities tab for Character Detail modal: ability scores grid,
 * full skill list with proficiency indicators, proficiencies,
 * languages.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";
import { getAbilityMod } from "@/types";
import { Badge } from "@/components/ui/Badge";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};
const ABILITY_LONG: Record<Ability, string> = {
  strength: "Strength", dexterity: "Dexterity", constitution: "Constitution",
  intelligence: "Intelligence", wisdom: "Wisdom", charisma: "Charisma",
};

const SKILL_ENTRIES: { key: string; label: string; ability: Ability }[] = [
  { key: "acrobatics", label: "Acrobatics", ability: "dexterity" },
  { key: "animalHandling", label: "Animal Handling", ability: "wisdom" },
  { key: "arcana", label: "Arcana", ability: "intelligence" },
  { key: "athletics", label: "Athletics", ability: "strength" },
  { key: "deception", label: "Deception", ability: "charisma" },
  { key: "history", label: "History", ability: "intelligence" },
  { key: "insight", label: "Insight", ability: "wisdom" },
  { key: "intimidation", label: "Intimidation", ability: "charisma" },
  { key: "investigation", label: "Investigation", ability: "intelligence" },
  { key: "medicine", label: "Medicine", ability: "wisdom" },
  { key: "nature", label: "Nature", ability: "intelligence" },
  { key: "perception", label: "Perception", ability: "wisdom" },
  { key: "performance", label: "Performance", ability: "charisma" },
  { key: "persuasion", label: "Persuasion", ability: "charisma" },
  { key: "religion", label: "Religion", ability: "intelligence" },
  { key: "sleightOfHand", label: "Sleight of Hand", ability: "dexterity" },
  { key: "stealth", label: "Stealth", ability: "dexterity" },
  { key: "survival", label: "Survival", ability: "wisdom" },
];

function fmtMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/80 p-3">
      <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  );
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterDetailAbilitiesTab({ character }: Props) {
  return (
    <div className="space-y-4">
      {/* Ability Scores */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ABILITY_ORDER.map((ability) => {
          const score = character[ability] ?? 10;
          const mod = getAbilityMod(score);
          return (
            <div key={ability} className="rounded-xl border border-surface-700 bg-surface-800/80 p-3 text-center">
              <p className="text-[9px] font-semibold text-surface-500 uppercase tracking-wider">{ABILITY_SHORT[ability]}</p>
              <p className="text-2xl font-bold text-surface-100 mt-1">{score}</p>
              <p className={`text-sm font-medium ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>{fmtMod(mod)}</p>
              <p className="text-[9px] text-surface-500 mt-1">{ABILITY_LONG[ability]}</p>
            </div>
          );
        })}
      </div>

      {/* Skills */}
      <InfoCard label="Skills">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
          {SKILL_ENTRIES.map(({ key, label, ability }) => {
            const prof = (character.skills as Record<string, string>)?.[key] ?? "none";
            const score = character[ability] ?? 10;
            const baseMod = getAbilityMod(score);
            const isProf = prof === "proficient";
            const isExpert = prof === "expertise";
            const totalMod = baseMod + (isProf ? character.proficiencyBonus : 0) + (isExpert ? character.proficiencyBonus * 2 : 0);
            const dotColor = isExpert ? "bg-accent-400" : isProf ? "bg-rogue-400" : "bg-surface-600";
            return (
              <div key={key} className={`flex items-center justify-between rounded px-2.5 py-1.5 text-xs ${isProf || isExpert ? "bg-surface-800/80" : "bg-surface-800/40"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                  <span className={`truncate ${isProf || isExpert ? "text-surface-200" : "text-surface-500"}`}>{label}</span>
                </div>
                <span className={`font-bold shrink-0 ml-2 ${isProf || isExpert ? "text-surface-200" : "text-surface-500"}`}>
                  {fmtMod(totalMod)}{isExpert && <span className="text-accent-400 text-[9px] ml-0.5">★</span>}
                </span>
              </div>
            );
          })}
        </div>
      </InfoCard>

      {/* Proficiencies */}
      {(character.proficiencies ?? []).length > 0 && (
        <InfoCard label="Proficiencies">
          <div className="flex flex-wrap gap-1 mt-1">
            {(character.proficiencies ?? []).map((p, i) => (
              <Badge key={i} size="xs" variant={p.type === "armor" ? "warrior" : p.type === "weapon" ? "rogue" : p.type === "tool" ? "mage" : "neutral"}>
                {p.name}{p.notes ? ` (${p.notes})` : ""}
              </Badge>
            ))}
          </div>
        </InfoCard>
      )}

      {/* Languages */}
      {(character.languages ?? []).length > 0 && (
        <InfoCard label="Languages">
          <div className="flex flex-wrap gap-1 mt-1">
            {(character.languages ?? []).map((l, i) => <Badge key={i} size="xs" variant="accent">{l}</Badge>)}
          </div>
        </InfoCard>
      )}
    </div>
  );
}
