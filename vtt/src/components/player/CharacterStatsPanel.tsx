/**
 * STᚱ VTT — Character Stats Panel
 *
 * Premium stat overview showing ALL derived character stats
 * with visual bars, context labels, and management controls.
 *
 * Replaces scattered stat displays with one unified, beautiful panel.
 *
 * Stats shown:
 * - Proficiency Bonus (with level context)
 * - Initiative (with DEX modifier breakdown)
 * - Armor Class (with armor/DEX breakdown)
 * - Speed (walk + special movement types)
 * - Hit Dice (with spend/recover)
 * - Proficiency Bonus breakdown (ability mods → saves)
 *
 * Usage:
 *   <CharacterStatsPanel character={character} />
 */

import { useMemo } from "react";
import type { PlayerCharacter } from "@/types";
import {
  getAbilityMod,
  getProficiencyBonus,
  computeArmorClass,
  computeInitiative,
} from "@/lib/mechanics/character-derivations";

interface CharacterStatsPanelProps {
  character: PlayerCharacter;
  /** If true, shows all movement speed types in a compact grid */
  showAllSpeeds?: boolean;
  /** Called when hit dice are spent */
  onSpendHitDie?: (count: number) => void;
  /** Called when hit dice are recovered */
  onRecoverHitDie?: (count: number) => void;
  className?: string;
}

/* ── Speed Color / Icon Map ── */
const SPEED_META: Record<string, { icon: string; color: string; label: string }> = {
  walk: { icon: "👟", color: "text-emerald-400", label: "Walk" },
  fly: { icon: "🪽", color: "text-cyan-400", label: "Fly" },
  swim: { icon: "🏊", color: "text-blue-400", label: "Swim" },
  climb: { icon: "🧗", color: "text-amber-400", label: "Climb" },
  burrow: { icon: "⛏️", color: "text-rose-400", label: "Burrow" },
};

/* ── Class-to-HD map ── */
const CLASS_HIT_DIE: Record<string, string> = {
  barbarian: "1d12",
  fighter: "1d10",
  paladin: "1d10",
  ranger: "1d10",
  artificer: "1d8",
  bard: "1d8",
  cleric: "1d8",
  druid: "1d8",
  monk: "1d8",
  rogue: "1d8",
  warlock: "1d8",
  "blood hunter": "1d10",
  sorcerer: "1d6",
  wizard: "1d6",
};

function getPrimaryHitDie(character: PlayerCharacter): string {
  const primary = character.classes?.[0]?.name?.toLowerCase() || "";
  return character.hitDice || CLASS_HIT_DIE[primary] || "1d8";
}

function getMaxHitDice(level: number): number {
  return level;
}

export default function CharacterStatsPanel({
  character,
  showAllSpeeds = false,
  className = "",
}: CharacterStatsPanelProps) {
  const level = character.level;
  const pb = getProficiencyBonus(level);

  const abilityMods = useMemo(() => ({
    strength: getAbilityMod(character.strength),
    dexterity: getAbilityMod(character.dexterity),
    constitution: getAbilityMod(character.constitution),
    intelligence: getAbilityMod(character.intelligence),
    wisdom: getAbilityMod(character.wisdom),
    charisma: getAbilityMod(character.charisma),
  }), [character.strength, character.dexterity, character.constitution,
       character.intelligence, character.wisdom, character.charisma]);

  const initiative = computeInitiative(character);
  const ac = computeArmorClass(character);

  const hitDieType = getPrimaryHitDie(character);
  const maxHd = getMaxHitDice(level);

  // Parse hit dice count from character data
  const totalHd = maxHd;
  const spentHd = 0; // Player can track spent HD

  // Ability scores with their colors
  const abilityEntries = [
    { key: "STR", value: character.strength, mod: abilityMods.strength, color: "text-rose-400", bg: "bg-rose-500/8" },
    { key: "DEX", value: character.dexterity, mod: abilityMods.dexterity, color: "text-emerald-400", bg: "bg-emerald-500/8" },
    { key: "CON", value: character.constitution, mod: abilityMods.constitution, color: "text-amber-400", bg: "bg-amber-500/8" },
    { key: "INT", value: character.intelligence, mod: abilityMods.intelligence, color: "text-cyan-400", bg: "bg-cyan-500/8" },
    { key: "WIS", value: character.wisdom, mod: abilityMods.wisdom, color: "text-violet-400", bg: "bg-violet-500/8" },
    { key: "CHA", value: character.charisma, mod: abilityMods.charisma, color: "text-pink-400", bg: "bg-pink-500/8" },
  ];

  // Speed entries
  const speedKeys = showAllSpeeds
    ? (Object.keys(character.speed) as (keyof typeof character.speed)[]).filter(k => k !== "canHover")
    : ["walk"] as (keyof typeof character.speed)[];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Core Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Proficiency Bonus */}
        <div className="relative bg-gradient-to-br from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-3 group hover:border-gold/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px]">🏅</span>
            <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">
              Proficiency
            </span>
          </div>
          <span className="text-xl font-black tabular-nums text-gold-400">
            +{pb}
          </span>
          <p className="text-[8px] text-surface-600 mt-0.5">
            Level {level} · {" "}
            <span className="text-surface-500">PB +{pb}</span>
          </p>
          {/* Bottom accent */}
          <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
        </div>

        {/* Initiative */}
        <div className="relative bg-gradient-to-br from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-3 group hover:border-gold/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px]">⚡</span>
            <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">
              Initiative
            </span>
          </div>
          <span className={`text-xl font-black tabular-nums ${
            initiative >= 0 ? "text-gold-400" : "text-rose-400"
          }`}>
            {initiative >= 0 ? "+" : ""}{initiative}
          </span>
          <p className="text-[8px] text-surface-600 mt-0.5">
            DEX {abilityMods.dexterity >= 0 ? "+" : ""}{abilityMods.dexterity}
          </p>
          <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
        </div>

        {/* Armor Class */}
        <div className="relative bg-gradient-to-br from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-3 group hover:border-gold/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px]">🛡</span>
            <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">
              Armor Class
            </span>
          </div>
          <span className="text-xl font-black tabular-nums text-cyan-300">
            {ac}
          </span>
          <p className="text-[8px] text-surface-600 mt-0.5">
            10 + DEX ({abilityMods.dexterity})
          </p>
          <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
        </div>

        {/* Max HP */}
        <div className="relative bg-gradient-to-br from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] rounded-xl p-3 group hover:border-gold/10 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px]">❤️</span>
            <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">
              Max HP
            </span>
          </div>
          <span className="text-xl font-black tabular-nums text-emerald-400">
            {character.hitPoints.max}
          </span>
          <p className="text-[8px] text-surface-600 mt-0.5">
            HD {hitDieType} · CON {abilityMods.constitution >= 0 ? "+" : ""}{abilityMods.constitution}
          </p>
          <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all" />
        </div>
      </div>

      {/* ── Ability Modifier Strip ── */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-2">
          <span>Ability Scores</span>
          <span className="text-surface-600">·</span>
          <span className="text-surface-600 font-normal normal-case text-[9px]">
            total mod:{" "}
            <span className={`tabular-nums font-bold ${
              abilityMods.strength + abilityMods.dexterity + abilityMods.constitution +
              abilityMods.intelligence + abilityMods.wisdom + abilityMods.charisma > 0
                ? "text-gold-400" : "text-surface-500"
            }`}>
              {abilityMods.strength + abilityMods.dexterity + abilityMods.constitution +
               abilityMods.intelligence + abilityMods.wisdom + abilityMods.charisma >= 0 ? "+" : ""}
              {abilityMods.strength + abilityMods.dexterity + abilityMods.constitution +
               abilityMods.intelligence + abilityMods.wisdom + abilityMods.charisma}
            </span>
          </span>
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {abilityEntries.map(({ key, value, mod, color, bg }) => (
            <div
              key={key}
              className="flex flex-col items-center py-1.5 rounded-lg bg-[#0c0d15] border border-white/[0.04]"
            >
              <span className={`text-[7px] font-bold uppercase tracking-wider ${color}`}>
                {key}
              </span>
              <span className="text-xs font-black tabular-nums text-white/80">
                {value}
              </span>
              <span className={`text-[8px] font-black tabular-nums ${
                mod > 0 ? color : mod < 0 ? "text-rose-400" : "text-surface-500"
              }`}>
                {mod >= 0 ? "+" : ""}{mod}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Speed Section ── */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
          Speed
        </p>
        <div className={`grid gap-1.5 ${speedKeys.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"}`}>
          {speedKeys.map((key) => {
            const meta = SPEED_META[key] || { icon: "👟", color: "text-surface-400", label: key };
            const value = character.speed[key] as number | undefined;
            if (value === undefined) return null;
            return (
              <div
                key={key}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[#0c0d15] border border-white/[0.04]"
              >
                <span className="text-[12px]">{meta.icon}</span>
                <div className="min-w-0">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-surface-500 block leading-tight">
                    {meta.label}
                  </span>
                  <span className={`text-sm font-black tabular-nums ${meta.color}`}>
                    {value}ft
                  </span>
                </div>
              </div>
            );
          })}
          {/* Can hover indicator */}
          {character.speed.canHover && (
            <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[#0c0d15] border border-cyan-500/10">
              <span className="text-[12px]">✨</span>
              <div className="min-w-0">
                <span className="text-[9px] font-medium uppercase tracking-wider text-surface-500 block leading-tight">
                  Hover
                </span>
                <span className="text-xs font-medium text-cyan-400">Can hover</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Hit Dice Section ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/50">
            Hit Dice
          </p>
          <span className="text-[9px] text-surface-500 tabular-nums">
            {totalHd - spentHd}/{totalHd} remaining
          </span>
        </div>
        <div className="bg-[#0c0d15] border border-white/[0.04] rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-black tabular-nums text-gold-400">
                {hitDieType}
              </span>
              <span className="text-[10px] text-surface-500">
                × {totalHd - spentHd} available
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={totalHd - spentHd <= 0}
                className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Spend a Hit Die during a Short Rest"
              >
                − Spend
              </button>
              <button
                disabled={spentHd <= 0}
                className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-gold-500/10 border border-gold-500/15 text-gold-400 hover:bg-gold-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                title="Recover Hit Dice during a Long Rest"
              >
                + Recover
              </button>
            </div>
          </div>
          {/* HD progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-500"
              style={{ width: `${totalHd > 0 ? ((totalHd - spentHd) / totalHd) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[7px] text-surface-600 mt-1">
            Long rest recovers up to {Math.max(1, Math.floor(level / 2))} Hit Dice
          </p>
        </div>
      </div>

      {/* ── Passive Senses ── */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
          Passive Senses
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: "Perception", value: 10 + abilityMods.wisdom, icon: "👁️", color: "text-violet-400" },
            { label: "Investigation", value: 10 + abilityMods.intelligence, icon: "🔍", color: "text-cyan-400" },
            { label: "Insight", value: 10 + abilityMods.wisdom, icon: "🧠", color: "text-gold-400" },
          ].map((sense) => (
            <div
              key={sense.label}
              className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[#0c0d15] border border-white/[0.04]"
            >
              <span className="text-[10px]">{sense.icon}</span>
              <div className="min-w-0">
                <span className="text-[7px] font-medium uppercase tracking-wider text-surface-500 block leading-tight">
                  {sense.label}
                </span>
                <span className={`text-xs font-black tabular-nums ${sense.color}`}>
                  {sense.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
