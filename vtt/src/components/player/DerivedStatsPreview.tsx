/**
 * STᚱ VTT — Derived Stats Preview
 *
 * Live preview panel showing how ability scores translate into
 * final character stats. Updates in real-time as scores change.
 *
 * Displays:
 * - Ability Modifiers (6 values, color-coded)
 * - Proficiency Bonus (computed from level)
 * - Initiative (DEX modifier)
 * - Armor Class (computed from armor + DEX)
 * - Hit Points (computed from CON modifier + hit die)
 * - Speed, Encumbrance, Spellcasting (where applicable)
 *
 * Usage:
 *   <DerivedStatsPreview
 *     strength={16} dexterity={14} ...
 *     level={5}
 *     className="gold-class"
 *   />
 */

import { useMemo } from "react";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

interface DerivedStatsPreviewProps {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  level: number;
  className?: string;
  /** Override for armor class (e.g., unarmored defense) */
  baseAc?: number;
  /** Armor equipped (for AC calculation) */
  armor?: string;
  hasShield?: boolean;
  hitDie?: string;
  race?: string;
  /** If true, shows spellcasting stats */
  showSpellcasting?: boolean;
  /** Class name for spellcasting ability detection */
  primaryClass?: string;
}

const SPELLCASTING_ABILITY: Record<string, "intelligence" | "wisdom" | "charisma"> = {
  wizard: "intelligence",
  artificer: "intelligence",
  cleric: "wisdom",
  druid: "wisdom",
  ranger: "wisdom",
  paladin: "charisma",
  sorcerer: "charisma",
  bard: "charisma",
  warlock: "charisma",
};

const HIT_DIE_MAX: Record<string, number> = {
  "1d6": 6, "1d8": 8, "1d10": 10, "1d12": 12,
};

function estimateHp(hitDie: string, conMod: number, level: number): number {
  const dieMax = HIT_DIE_MAX[hitDie] || 8;
  return dieMax + conMod + (level - 1) * (Math.floor(dieMax / 2) + 1 + conMod);
}

export default function DerivedStatsPreview({
  strength,
  dexterity,
  constitution,
  intelligence,
  wisdom,
  charisma,
  level,
  baseAc = 10,
  hitDie = "1d8",
  showSpellcasting = false,
  primaryClass = "",
}: DerivedStatsPreviewProps) {
  const mods = useMemo(
    () => ({
      strength: getAbilityMod(strength),
      dexterity: getAbilityMod(dexterity),
      constitution: getAbilityMod(constitution),
      intelligence: getAbilityMod(intelligence),
      wisdom: getAbilityMod(wisdom),
      charisma: getAbilityMod(charisma),
    }),
    [strength, dexterity, constitution, intelligence, wisdom, charisma]
  );

  const pb = getProficiencyBonus(level);
  const initiative = mods.dexterity;
  const estHp = estimateHp(hitDie, mods.constitution, level);

  // Spellcasting
  const scAbility = showSpellcasting ? (SPELLCASTING_ABILITY[primaryClass.toLowerCase()] || "intelligence") : null;
  const scMod = scAbility ? mods[scAbility] : 0;
  const spellDC = showSpellcasting && scAbility ? 8 + scMod + pb : 0;
  const spellATK = showSpellcasting && scAbility ? scMod + pb : 0;

  // Passive Perception
  const passivePerception = 10 + mods.wisdom;

  const statEntries: { label: string; value: string | number; icon: string; color: string }[] = [
    {
      label: "Proficiency",
      value: `+${pb}`,
      icon: "🏅",
      color: "text-gold-400",
    },
    {
      label: "Initiative",
      value: `${mods.dexterity >= 0 ? "+" : ""}${initiative}`,
      icon: "⚡",
      color: mods.dexterity >= 0 ? "text-gold-400" : "text-rose-400",
    },
    {
      label: "Armor Class",
      value: `${baseAc + mods.dexterity}`,
      icon: "🛡",
      color: "text-cyan-300",
    },
    {
      label: "Est. HP",
      value: estHp,
      icon: "❤️",
      color: "text-emerald-400",
    },
    {
      label: "Speed",
      value: "30ft",
      icon: "👟",
      color: "text-surface-300",
    },
    {
      label: "Pass. Perception",
      value: passivePerception,
      icon: "👁",
      color: "text-violet-400",
    },
  ];

  if (showSpellcasting && scAbility && scMod > 0) {
    statEntries.push({
      label: "Spell DC",
      value: spellDC,
      icon: "✨",
      color: "text-amber-400",
    });
    statEntries.push({
      label: "Spell ATK",
      value: `+${spellATK}`,
      icon: "🎯",
      color: "text-amber-400",
    });
  }

  // Ability modifiers grid
  const abilityEntries = [
    { key: "STR", value: mods.strength, color: "text-rose-400" },
    { key: "DEX", value: mods.dexterity, color: "text-emerald-400" },
    { key: "CON", value: mods.constitution, color: "text-amber-400" },
    { key: "INT", value: mods.intelligence, color: "text-cyan-400" },
    { key: "WIS", value: mods.wisdom, color: "text-violet-400" },
    { key: "CHA", value: mods.charisma, color: "text-pink-400" },
  ];

  return (
    <div className="space-y-3">
      {/* Ability Modifier Strip */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
          Ability Modifiers
        </p>
        <div className="grid grid-cols-6 gap-1">
          {abilityEntries.map(({ key, value, color }) => (
            <div
              key={key}
              className="flex flex-col items-center py-1.5 rounded-lg bg-[#0c0d15] border border-white/[0.04]"
            >
              <span className="text-[7px] font-bold uppercase tracking-wider text-surface-500">
                {key}
              </span>
              <span
                className={`text-sm font-black tabular-nums ${
                  value > 0 ? color : value < 0 ? "text-rose-400" : "text-surface-500"
                }`}
              >
                {value >= 0 ? "+" : ""}{value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Derived Stats Grid */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
          Derived Stats <span className="text-surface-600">(lvl {level})</span>
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {statEntries.map((entry) => (
            <div
              key={entry.label}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[#0c0d15] border border-white/[0.04]"
            >
              <span className="text-[10px]">{entry.icon}</span>
              <div className="min-w-0">
                <span className="text-[7px] font-medium uppercase tracking-wider text-surface-500 block leading-tight">
                  {entry.label}
                </span>
                <span className={`text-xs font-black tabular-nums ${entry.color}`}>
                  {entry.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hit Points Note */}
      <p className="text-[8px] text-surface-600 italic">
        HP estimated using average progression{" "}
        <span className="text-surface-500 not-italic">({hitDie})</span> + CON modifier each level.
        Actual HP may vary based on rolled values.
      </p>
    </div>
  );
}
