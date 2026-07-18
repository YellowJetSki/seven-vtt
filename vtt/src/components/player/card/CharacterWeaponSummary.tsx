/* ── CharacterWeaponSummary ─────────────────────────────────────
 * Compact weapon/attack display showing weapon name, attack bonus,
 * damage dice, and damage type for equipped weapons.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter, Ability } from "@/types";
import { useState } from "react";

/** D&D 5e weapon categories that indicate attack capability */
const WEAPON_SLOTS = ["main hand", "off hand", "both hands", "ranged", "weapon"];

/** Heuristic: extract weapon type from equipment slot name */
function isWeaponSlot(item: { slot: string }): boolean {
  const s = item.slot.toLowerCase();
  return WEAPON_SLOTS.some((w) => s.includes(w)) || s.includes("weapon");
}

/** Infer attack ability from weapon name heuristics */
function inferAttackAbility(name: string): Ability {
  const lower = name.toLowerCase();
  if (lower.includes("finesse") || lower.includes("rapier") || lower.includes("shortsword") || lower.includes("dagger") || lower.includes("whip") || lower.includes("longbow") || lower.includes("shortbow") || lower.includes("crossbow") || lower.includes("sling") || lower.includes("dart")) return "dexterity";
  if (lower.includes("ranged") || lower.includes("thrown")) return "dexterity";
  return "strength";
}

/** Get damage dice from weapon name heuristic */
function inferDamageDice(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("dagger")) return "1d4";
  if (lower.includes("shortsword") || lower.includes("scimitar") || lower.includes("handaxe")) return "1d6";
  if (lower.includes("longsword") || lower.includes("battleaxe") || lower.includes("warhammer") || lower.includes("rapier")) return "1d8";
  if (lower.includes("greatsword") || lower.includes("greataxe") || lower.includes("maul")) return "2d6";
  if (lower.includes("greatclub") || lower.includes("quarterstaff")) return "1d8";
  if (lower.includes("longbow") || lower.includes("shortbow")) return "1d8";
  if (lower.includes("crossbow") || lower.includes("sling")) return "1d8";
  if (lower.includes("whip")) return "1d4";
  if (lower.includes("unarmed") || lower.includes("fist") || lower.includes("punch")) return "1d1";
  return "1d6"; // fallback
}

/** Infer damage type */
function inferDamageType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("piercing") || lower.includes("bow") || lower.includes("crossbow") || lower.includes("spear") || lower.includes("javelin") || lower.includes("dagger") || lower.includes("rapier")) return "piercing";
  if (lower.includes("slashing") || lower.includes("sword") || lower.includes("axe") || lower.includes("scimitar") || lower.includes("whip")) return "slashing";
  return "bludgeoning";
}

function getMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterWeaponSummary({ character }: Props) {
  const [expanded, setExpanded] = useState(false);

  const weapons = (character.equipment ?? [])
    .filter((item) => isWeaponSlot(item) || item.slot.toLowerCase() === "carried")
    .filter((item) => {
      // Only show real weapon names
      const lower = item.item.toLowerCase();
      return !lower.includes("backpack") && !lower.includes("pouch") && !lower.includes("clothes") && !lower.includes("focus") && !lower.includes("component");
    })
    .slice(0, expanded ? undefined : 3);

  if (weapons.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500 flex items-center gap-1">
        <span>⚔ Attacks</span>
        {weapons.length > 3 && (
          <button onClick={() => setExpanded(!expanded)} className="text-[8px] text-accent-500 hover:text-accent-400">
            {expanded ? "less" : `+${character.equipment.filter((i) => isWeaponSlot(i)).length - 3} more`}
          </button>
        )}
      </p>
      {weapons.map((item, i) => {
        const ability = inferAttackAbility(item.item);
        const mod = getMod(character[ability]);
        const isProf = character.proficiencies?.some(
          (p) => p.type === "weapon" && (p.name.toLowerCase().includes(item.item.toLowerCase().split(" ")[0]) || p.name === "Simple" || p.name === "Martial")
        ) ?? true;
        const profBonus = isProf ? character.proficiencyBonus : 0;
        const attackBonus = mod + profBonus;
        const totalAtk = attackBonus >= 0 ? `+${attackBonus}` : `${attackBonus}`;
        const dmgDice = inferDamageDice(item.item);
        const dmgType = inferDamageType(item.item);
        const dmgBonus = mod;
        const totalDmg = dmgBonus >= 0 ? `${dmgDice}+${dmgBonus}` : `${dmgDice}${dmgBonus}`;

        return (
          <div key={`weapon-${i}`} className="flex items-center justify-between rounded bg-surface-800/60 px-2 py-1 text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-surface-300 truncate font-medium">{item.item}</span>
              {item.quantity > 1 && <span className="text-surface-500">×{item.quantity}</span>}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-rogue-400 font-mono font-bold">{totalAtk}</span>
              <span className="text-surface-500">·</span>
              <span className="text-warrior-400 font-mono font-bold">{totalDmg} {dmgTypeIcon(dmgType)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function dmgTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    slashing: "⚔", piercing: "🗡", bludgeoning: "🔨",
    fire: "🔥", cold: "❄️", lightning: "⚡", acid: "🧪",
    poison: "☠️", psychic: "🧠", radiant: "✨", necrotic: "💀",
    force: "💥", thunder: "🔊",
  };
  return icons[type] ?? "";
}
