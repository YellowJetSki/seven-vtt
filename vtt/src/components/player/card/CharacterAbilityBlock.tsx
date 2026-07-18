/* ── CharacterAbilityBlock ─────────────────────────────────────
 * Compact ability score grid with mods, saving throw proficiency
 * indicators, and key skill proficiencies at a glance.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABBREV: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function getMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmtMod(m: number): string {
  return m >= 0 ? `+${m}` : `${m}`;
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterAbilityBlock({ character }: Props) {
  return (
    <div className="grid grid-cols-6 gap-px rounded-lg overflow-hidden border border-surface-700/50 bg-surface-800">
      {ABILITY_ORDER.map((ability) => {
        const score = character[ability] ?? 10;
        const mod = getMod(score);
        const saveProf = character.savingThrows?.[ability]?.proficient ?? false;
        return (
          <div key={ability} className="bg-surface-850 py-1 text-center relative">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500">{ABBREV[ability]}</p>
            <p className="text-sm font-bold text-surface-100 leading-tight">{score}</p>
            <p className={`text-[10px] font-mono font-bold leading-tight ${mod >= 0 ? "text-rogue-400" : "text-warrior-400"}`}>
              {fmtMod(mod)}
            </p>
            {saveProf && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-mage-500 ring-1 ring-surface-850" title="Proficient saving throw" />
            )}
          </div>
        );
      })}
    </div>
  );
}
