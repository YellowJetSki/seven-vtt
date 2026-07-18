/* ── CharacterDetailCombatTab ──────────────────────────────────
 * Combat tab content for Character Detail modal: HP, AC, init,
 * hit dice, death saves, speed, saves, conditions, weapons,
 * spellcasting, resources.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";
import { getAbilityMod } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { CharacterWeaponSummary } from "./card/CharacterWeaponSummary";
import { CharacterSpellSummary } from "./card/CharacterSpellSummary";
import { CharacterResourcesSummary } from "./card/CharacterResourcesSummary";

const ABILITY_ORDER: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_SHORT: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function InfoCard({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/80 p-3">
      <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">{label}</p>
      {value && <p className="mt-1 text-sm font-semibold text-surface-100">{value}</p>}
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}

function SpeedTag({ label, value }: { label: string; value: string }) {
  return <span className="rounded-full bg-surface-800 px-2.5 py-0.5 text-[10px] font-medium text-surface-300 ring-1 ring-surface-700">{label} {value}</span>;
}

function fmtMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterDetailCombatTab({ character }: Props) {
  const initDisplay = character.initiative !== undefined && character.initiative !== null && character.initiative !== "--" && character.initiative !== ""
    ? `+${character.initiative}` : "—";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard label="Hit Points" value={`${character.hitPoints.current} / ${character.hitPoints.max}`} />
        <InfoCard label="Armor Class" value={String(character.armorClass)} />
        <InfoCard label="Initiative" value={initDisplay} />
        <InfoCard label="Hit Dice" value={character.hitDice || "—"} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-surface-700 bg-surface-800/80 p-3">
          <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Death Save Successes</p>
          <div className="mt-1.5 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-5 w-5 rounded-full border-2 ${i < (character.deathSaves?.successes ?? 0) ? "bg-rogue-500 border-rogue-500" : "border-surface-600"}`} />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-surface-700 bg-surface-800/80 p-3">
          <p className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">Death Save Failures</p>
          <div className="mt-1.5 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-5 w-5 rounded-full border-2 ${i < (character.deathSaves?.failures ?? 0) ? "bg-warrior-500 border-warrior-500" : "border-surface-600"}`} />
            ))}
          </div>
        </div>
      </div>

      <InfoCard label="Speed">
        <div className="flex flex-wrap gap-2 mt-1">
          {character.speed?.walk !== undefined && <SpeedTag label="Walk" value={`${character.speed.walk}ft`} />}
          {character.speed?.fly !== undefined && <SpeedTag label="Fly" value={`${character.speed.fly}ft`} />}
          {character.speed?.swim !== undefined && <SpeedTag label="Swim" value={`${character.speed.swim}ft`} />}
          {character.speed?.climb !== undefined && <SpeedTag label="Climb" value={`${character.speed.climb}ft`} />}
          {character.speed?.burrow !== undefined && <SpeedTag label="Burrow" value={`${character.speed.burrow}ft`} />}
          {character.speed?.canHover && <SpeedTag label="Hover" value="Yes" />}
        </div>
      </InfoCard>

      <InfoCard label="Saving Throws">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
          {ABILITY_ORDER.map((ability) => {
            const save = character.savingThrows?.[ability];
            const score = character[ability] ?? 10;
            const baseMod = getAbilityMod(score);
            const totalMod = baseMod + (save?.bonus ?? 0);
            return (
              <div key={ability} className={`flex items-center justify-between rounded px-2 py-1 text-xs ${save?.proficient ? "bg-mage-500/10 text-mage-300" : "bg-surface-800 text-surface-400"}`}>
                <span className="font-medium">{ABILITY_SHORT[ability]}</span>
                <span className={`font-bold ${save?.proficient ? "text-mage-300" : "text-surface-400"}`}>
                  {fmtMod(totalMod)}{save?.proficient ? "★" : ""}
                </span>
              </div>
            );
          })}
        </div>
      </InfoCard>

      {(character.conditions ?? []).length > 0 && (
        <InfoCard label="Active Conditions">
          <div className="flex flex-wrap gap-1 mt-1">
            {(character.conditions ?? []).map((c, i) => <Badge key={i} variant="warning" size="xs">{c}</Badge>)}
          </div>
        </InfoCard>
      )}

      <CharacterWeaponSummary character={character} />
      <CharacterSpellSummary character={character} />
      <CharacterResourcesSummary character={character} />
    </div>
  );
}
