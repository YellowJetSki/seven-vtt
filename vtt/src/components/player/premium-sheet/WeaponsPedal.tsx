/* ══════════════════════════════════════════════════════════════
   Weapon Attacks — Pedal-Sheet Style
   Displays equipped weapons with ATK bonus, damage dice,
   damage type icon, and properties badges.
   ══════════════════════════════════════════════════════════════ */
import type { PlayerCharacter } from "@/types";
import { mod, pb } from "./index";

interface Props {
  character: PlayerCharacter;
}

interface WeaponAttack {
  name: string;
  dice: string;
  type: string;
  atkBonus: number;
  dmgBonus: number;
  ability: string;
  range: string;
  properties: string[];
  versatile: string | null;
}

const DMG_ICONS: Record<string, string> = {
  slashing: "⚔️", piercing: "🏹", bludgeoning: "🔨", fire: "🔥", cold: "❄️",
  lightning: "⚡", acid: "🧪", poison: "☠️", necrotic: "💀", radiant: "✨",
  force: "💥", psychic: "🧠",
};

/** Maps equipment to weapon attacks using a simple weapon database */
function computeAttacks(character: PlayerCharacter): WeaponAttack[] {
  const str = character.strength;
  const dex = character.dexterity;
  const p = pb(character.level);
  const equipment = [
    ...(character.equipment || []),
    ...(character.inventory || []).filter((i: any) => i.isEquipped).map((i: any) => ({ item: i.name, notes: i.description })),
  ];

  const WEAPON_DB: Record<string, { dice: string; type: string; props: string[]; versatile?: string }> = {
    longsword: { dice: "1d8", type: "slashing", props: ["versatile"], versatile: "1d10" },
    shortsword: { dice: "1d6", type: "piercing", props: ["finesse", "light"] },
    rapier: { dice: "1d8", type: "piercing", props: ["finesse"] },
    dagger: { dice: "1d4", type: "piercing", props: ["finesse", "light", "thrown"] },
    handaxe: { dice: "1d6", type: "slashing", props: ["light", "thrown"] },
    battleaxe: { dice: "1d8", type: "slashing", props: ["versatile"], versatile: "1d10" },
    greataxe: { dice: "1d12", type: "slashing", props: ["heavy", "two-handed"] },
    greatsword: { dice: "2d6", type: "slashing", props: ["heavy", "two-handed"] },
    mace: { dice: "1d6", type: "bludgeoning", props: [] },
    warhammer: { dice: "1d8", type: "bludgeoning", props: ["versatile"], versatile: "1d10" },
    quarterstaff: { dice: "1d6", type: "bludgeoning", props: ["versatile"], versatile: "1d8" },
    longbow: { dice: "1d8", type: "piercing", props: ["heavy", "two-handed", "ranged"] },
    shortbow: { dice: "1d6", type: "piercing", props: ["two-handed", "ranged"] },
    crossbow: { dice: "1d8", type: "piercing", props: ["two-handed", "ranged", "loading"] },
    whip: { dice: "1d4", type: "slashing", props: ["finesse", "reach"] },
    spear: { dice: "1d6", type: "piercing", props: ["versatile", "thrown"], versatile: "1d8" },
    javelin: { dice: "1d6", type: "piercing", props: ["thrown"] },
  };

  const seen = new Set<string>();
  const result: WeaponAttack[] = [];

  for (const eq of equipment) {
    const lower = eq.item.toLowerCase().trim();
    for (const [key, data] of Object.entries(WEAPON_DB)) {
      if (lower.includes(key) && !seen.has(key)) {
        seen.add(key);
        const ranged = data.props.includes("ranged") || data.props.includes("thrown");
        const finesse = data.props.includes("finesse");
        const useDex = (ranged || finesse) && dex > str;
        const abilMod = useDex ? mod(dex) : mod(str);
        result.push({
          name: eq.item.split("(")[0].trim(),
          dice: data.dice,
          type: data.type,
          atkBonus: abilMod + p,
          dmgBonus: abilMod,
          ability: useDex ? "Dex" : "Str",
          range: ranged ? "Ranged" : "Melee",
          properties: data.props,
          versatile: data.versatile ? `${data.versatile}` : null,
        });
      }
    }
  }

  return result;
}

export function WeaponsPedal({ character }: Props) {
  const weapons = computeAttacks(character);

  if (weapons.length === 0) return null;

  return (
    <div className="pedal-card bg-surface-900 p-3">
      <span className="pedal-label flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h9m-9 0V6m4.5 0l3-3m0 0l3 3m-3-3v12" />
        </svg>
        Weapon Attacks
        <span className="text-surface-500 font-normal">({weapons.length})</span>
      </span>
      <div className="space-y-2">
        {weapons.map((w, i) => (
          <div key={i} className="bg-surface-950 border-2 border-surface-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-surface-100">{w.name}</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-surface-800 text-surface-500 font-bold uppercase tracking-wider">{w.range}</span>
              </div>
              <span className="text-lg">{DMG_ICONS[w.type] || "⚔️"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-lg bg-rogue-600/20 border border-rogue-600/30 px-2 py-0.5 font-bold text-rogue-400 text-[10px]">
                ATK +{w.atkBonus}
              </span>
              <span className="font-bold text-surface-200">{w.dice}</span>
              <span className="text-surface-500 text-[10px]">+{w.dmgBonus} ({w.ability})</span>
              {w.versatile && (
                <span className="text-surface-500 text-[9px]">(Versatile: {w.versatile})</span>
              )}
            </div>
            {w.properties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {w.properties.map((prop) => (
                  <span key={prop} className="rounded bg-surface-800 px-1.5 py-0.5 text-[7px] font-bold text-surface-500 uppercase tracking-wider">
                    {prop}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
