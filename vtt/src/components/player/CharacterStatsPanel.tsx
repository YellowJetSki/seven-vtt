/**
 * STᚱ VTT — CharacterStatsPanel (Premium)
 *
 * Lusion/Spotify-grade unified character stats overview:
 * - 4 core stat cards with conic depth rings and directional glow
 * - Ability modifier strip with 6-column color-coded grid
 * - Speed section with movement-type icons and Hover indicator
 * - Hit dice management with progress bar + spend/recover buttons
 * - Passive senses with 3-card grid
 * - All using unified glass gradient design language
 * - Staggered entrance animation per section
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
  showAllSpeeds?: boolean;
  className?: string;
}

/* ── Speed Meta ── */
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
  const totalHd = level;

  const totalMod = abilityMods.strength + abilityMods.dexterity + abilityMods.constitution +
    abilityMods.intelligence + abilityMods.wisdom + abilityMods.charisma;

  const abilityEntries = [
    { key: "STR", value: character.strength, mod: abilityMods.strength, color: "text-rose-400", bg: "bg-rose-500/8" },
    { key: "DEX", value: character.dexterity, mod: abilityMods.dexterity, color: "text-emerald-400", bg: "bg-emerald-500/8" },
    { key: "CON", value: character.constitution, mod: abilityMods.constitution, color: "text-amber-400", bg: "bg-amber-500/8" },
    { key: "INT", value: character.intelligence, mod: abilityMods.intelligence, color: "text-cyan-400", bg: "bg-cyan-500/8" },
    { key: "WIS", value: character.wisdom, mod: abilityMods.wisdom, color: "text-violet-400", bg: "bg-violet-500/8" },
    { key: "CHA", value: character.charisma, mod: abilityMods.charisma, color: "text-pink-400", bg: "bg-pink-500/8" },
  ];

  const speedKeys = showAllSpeeds
    ? (Object.keys(character.speed) as (keyof typeof character.speed)[]).filter(k => k !== "canHover")
    : ["walk"] as (keyof typeof character.speed)[];

  const coreCards = [
    {
      icon: "🏅", label: "Proficiency", value: `+${pb}`,
      subtext: `Level ${level} · PB +${pb}`,
      valueColor: "text-gold-400", accentColor: "from-gold-500/20",
    },
    {
      icon: "⚡", label: "Initiative", value: `${initiative >= 0 ? "+" : ""}${initiative}`,
      subtext: `DEX ${abilityMods.dexterity >= 0 ? "+" : ""}${abilityMods.dexterity}`,
      valueColor: initiative >= 0 ? "text-gold-400" : "text-rose-400",
      accentColor: "from-gold-500/20",
    },
    {
      icon: "🛡", label: "Armor Class", value: `${ac}`,
      subtext: `10 + DEX (${abilityMods.dexterity})`,
      valueColor: "text-cyan-300", accentColor: "from-cyan-500/20",
    },
    {
      icon: "❤️", label: "Max HP", value: `${character.hitPoints.max}`,
      subtext: `HD ${hitDieType} · CON ${abilityMods.constitution >= 0 ? "+" : ""}${abilityMods.constitution}`,
      valueColor: "text-emerald-400", accentColor: "from-emerald-500/20",
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Core Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {coreCards.map((card, idx) => (
          <div
            key={card.label}
            className="relative group rounded-xl bg-gradient-to-b from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] p-3 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 overflow-hidden"
            style={{ animationDelay: `${idx * 60}ms`, animation: "slide-in-up 0.3s ease-out both" }}
          >
            {/* Conic depth ring */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" style={{ background: `conic-gradient(from 0deg at 50% 50%, ${card.accentColor.replace("from-", "").replace("/20", "/10")}, transparent 60%)` }} />
            {/* Directional glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" style={{ background: `radial-gradient(ellipse 100px 60px at 50% 20%, ${card.accentColor.replace("from-", "").replace("/20", "/8")}, transparent)` }} />
            {/* Edge light */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

            <div className="flex items-center gap-2 mb-1 relative z-[1]">
              <span className="text-[14px]">{card.icon}</span>
              <span className="text-[8px] uppercase tracking-widest font-black text-surface-500">
                {card.label}
              </span>
            </div>
            <span className={`text-xl font-black tabular-nums relative z-[1] ${card.valueColor}`}>
              {card.value}
            </span>
            <p className="text-[7px] text-surface-600 mt-0.5 relative z-[1]">
              {card.subtext}
            </p>
            {/* Bottom accent */}
            <div className={`absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent ${card.accentColor} to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300`} />
          </div>
        ))}
      </div>

      {/* ── Ability Modifier Strip ── */}
      <div style={{ animation: "slide-in-up 0.3s ease-out 0.15s both" }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-2">
          <span>Ability Scores</span>
          <span className="text-surface-600">·</span>
          <span className={`tabular-nums font-bold text-[9px] ${totalMod > 0 ? "text-gold-400" : "text-surface-500"}`}>
            total mod: {totalMod >= 0 ? "+" : ""}{totalMod}
          </span>
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {abilityEntries.map(({ key, value, mod, color }) => (
            <div
              key={key}
              className="flex flex-col items-center py-1.5 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-white/[0.06] transition-all hover:-translate-y-0.5"
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
      <div style={{ animation: "slide-in-up 0.3s ease-out 0.2s both" }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
          Movement Speed
        </p>
        <div className={`grid gap-1.5 ${speedKeys.length > 1 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"}`}>
          {speedKeys.map((key) => {
            const meta = SPEED_META[key] || { icon: "👟", color: "text-surface-400", label: key };
            const value = character.speed[key] as number | undefined;
            if (value === undefined) return null;
            return (
              <div
                key={key}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-white/[0.06] transition-all"
              >
                <span className="text-[13px]">{meta.icon}</span>
                <div className="min-w-0">
                  <span className="text-[8px] font-semibold uppercase tracking-wider text-surface-500 block leading-tight">
                    {meta.label}
                  </span>
                  <span className={`text-sm font-black tabular-nums ${meta.color}`}>
                    {value}ft
                  </span>
                </div>
              </div>
            );
          })}
          {character.speed.canHover && (
            <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-cyan-500/10 hover:border-cyan-500/20 transition-all">
              <span className="text-[13px]">✨</span>
              <div className="min-w-0">
                <span className="text-[8px] font-semibold uppercase tracking-wider text-surface-500 block leading-tight">
                  Hover
                </span>
                <span className="text-xs font-medium text-cyan-400">Can hover</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Hit Dice Section ── */}
      <div style={{ animation: "slide-in-up 0.3s ease-out 0.25s both" }}>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[8px] font-bold uppercase tracking-wider text-white/50">
            Hit Dice
          </p>
          <span className="text-[9px] text-surface-500 tabular-nums font-semibold">
            {totalHd}/{totalHd} available
          </span>
        </div>
        <div className="rounded-xl bg-gradient-to-b from-[#14151f]/80 to-[#0c0d15]/90 border border-white/[0.04] p-3 hover:border-white/[0.07] transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-black tabular-nums text-gold-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.1)]">
                {hitDieType}
              </span>
              <span className="text-[10px] text-surface-500">
                × {totalHd} available
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={totalHd <= 0}
                className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-gradient-to-b from-emerald-500/10 to-emerald-500/3 border border-emerald-500/15 text-emerald-400 hover:from-emerald-500/15 hover:to-emerald-500/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                − Spend
              </button>
              <button
                className="px-2 py-1 rounded-lg text-[9px] font-semibold bg-gradient-to-b from-gold-500/10 to-gold-500/3 border border-gold/15 text-gold-400 hover:from-gold-500/15 hover:to-gold-500/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
              >
                + Recover
              </button>
            </div>
          </div>
          {/* HD progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 overflow-hidden border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-amber-400 transition-all duration-500 relative"
              style={{ width: "100%" }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
            </div>
          </div>
          <p className="text-[7px] text-surface-600 mt-1">
            Long rest recovers up to {Math.max(1, Math.floor(level / 2))} Hit Dice (min 1)
          </p>
        </div>
      </div>

      {/* ── Passive Senses ── */}
      <div style={{ animation: "slide-in-up 0.3s ease-out 0.3s both" }}>
        <p className="text-[8px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
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
              className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-white/[0.06] transition-all"
            >
              <span className="text-[11px]">{sense.icon}</span>
              <div className="min-w-0">
                <span className="text-[7px] font-semibold uppercase tracking-wider text-surface-500 block leading-tight">
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
