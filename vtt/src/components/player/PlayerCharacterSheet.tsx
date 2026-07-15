/* ── Player Character Sheet ────────────────────────────────────
 * Full character sheet view for players showing stats, abilities,
 * equipment, currency, features, and backstory.
 *
 * Uses the flat PlayerCharacter type with direct ability score fields.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import type { PlayerCharacter, Ability } from "@/types";

const ABILITY_KEYS: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABBR_MAP: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

interface SkillEntry {
  key: string;
  label: string;
  ability: Ability;
}

const SKILL_ENTRIES: SkillEntry[] = [
  { key: "acrobatics", label: "Acrobatics", ability: "dexterity" },
  { key: "athletics", label: "Athletics", ability: "strength" },
  { key: "deception", label: "Deception", ability: "charisma" },
  { key: "history", label: "History", ability: "intelligence" },
  { key: "insight", label: "Insight", ability: "wisdom" },
  { key: "intimidation", label: "Intimidation", ability: "charisma" },
  { key: "investigation", label: "Investigation", ability: "intelligence" },
  { key: "nature", label: "Nature", ability: "intelligence" },
  { key: "perception", label: "Perception", ability: "wisdom" },
  { key: "performance", label: "Performance", ability: "charisma" },
  { key: "persuasion", label: "Persuasion", ability: "charisma" },
  { key: "religion", label: "Religion", ability: "intelligence" },
  { key: "sleightOfHand", label: "Sleight of Hand", ability: "dexterity" },
  { key: "stealth", label: "Stealth", ability: "dexterity" },
  { key: "survival", label: "Survival", ability: "wisdom" },
];

/* ── Helper ─────────────────────────────────────────────────── */

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function skillBonus(skillKey: string, char: PlayerCharacter, profSkills: Set<string>, profBonus: number): number {
  const entry = SKILL_ENTRIES.find((s) => s.key === skillKey);
  if (!entry) return 0;
  const base = abilityMod(char[entry.ability]);
  if (profSkills.has(skillKey)) return base + profBonus;
  return base;
}

/* ── Props ──────────────────────────────────────────────────── */

interface PlayerCharacterSheetProps {
  character: PlayerCharacter;
}

export function PlayerCharacterSheet({ character }: PlayerCharacterSheetProps) {
  const hpPercent = useMemo(() => {
    if (character.hitPoints.max <= 0) return 0;
    return Math.max(0, Math.min(100, (character.hitPoints.current / character.hitPoints.max) * 100));
  }, [character.hitPoints.current, character.hitPoints.max]);

  // Parse proficiency list
  const profSkills = useMemo(() => {
    const set = new Set<string>();
    for (const p of character.proficiencies ?? []) {
      const lower = p.toLowerCase().trim();
      for (const entry of SKILL_ENTRIES) {
        if (lower.includes(entry.key) || lower.includes(entry.label.toLowerCase())) {
          set.add(entry.key);
        }
      }
    }
    return set;
  }, [character.proficiencies]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header Card */}
      <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-rogue-500/60 via-accent-500/60 to-warrior-500/60" />
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-800 ring-1 ring-surface-700 md:h-24 md:w-24">
              <span className="text-3xl md:text-4xl">
                {character.race.includes("Dragon") ? "🐉" : character.race.includes("Elf") ? "🧝" : character.race.includes("Dwarf") ? "⛰️" : character.race.includes("Halfl") ? "🏠" : character.race.includes("Gnome") ? "🪄" : character.race.includes("Orc") ? "💪" : character.race.includes("Tief") ? "🔮" : "🧙"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-surface-100 md:text-3xl">{character.name}</h1>
              <p className="mt-0.5 text-sm text-surface-400">
                {character.race} - {character.class} - Level {character.level}
              </p>
              <p className="mt-0.5 text-xs text-surface-500">
                {character.alignment ?? "Unaligned"} - {character.background ?? "No Background"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-surface-500">
            Played by <span className="text-surface-400">{character.playerName}</span>
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="HP" value={`${character.hitPoints.current}/${character.hitPoints.max}`} color="warrior" />
        <StatPill label="AC" value={String(character.armorClass)} color="mage" />
        <StatPill label="Initiative" value={`+${character.initiative}`} color="rogue" />
      </div>

      {/* HP Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-surface-400 mb-1">
          <span>Hit Points</span>
          <span>
            {character.hitPoints.current} / {character.hitPoints.max}
            {character.hitPoints.temporary > 0 && " (+" + character.hitPoints.temporary + " temp)"}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-surface-800">
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${hpPercent}%`,
            background: hpPercent > 50 ? "var(--color-rogue-500)" : hpPercent > 25 ? "var(--color-divine-500)" : "var(--color-warrior-500)",
          }} />
        </div>
      </div>

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
              const isProficient = character.proficiencies?.some((p) => p.toLowerCase().includes(name)) ?? false;
              const val = isProficient ? mod + (character.proficiencyBonus ?? 2) : mod;
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
              const val = skillBonus(entry.key, character, profSkills, character.proficiencyBonus ?? 2);
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

      {/* Features */}
      {character.features.length > 0 && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Features and Traits</h2>
          <div className="flex flex-wrap gap-2">
            {character.features.map((feat) => (
              <span key={feat} className="rounded-full bg-accent-500/10 px-3 py-1 text-xs text-accent-400 ring-1 ring-accent-500/20">{feat}</span>
            ))}
          </div>
        </section>
      )}

      {/* Equipment */}
      {character.equipment.length > 0 && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Equipment</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {character.equipment.map((item, i) => (
              <div key={"eq-" + i} className="rounded-lg bg-surface-800 px-3 py-2 text-xs text-surface-300">
                {item.item}{item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Currency */}
      <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-surface-400">Currency</h2>
        <div className="grid grid-cols-5 gap-2 text-center">
          <CurrencyCell label="PP" value={character.platinum ?? 0} color="gold" />
          <CurrencyCell label="GP (Assarion)" value={character.gold ?? 0} color="gold" />
          <CurrencyCell label="EP" value={character.electrum ?? 0} color="surface" />
          <CurrencyCell label="SP (Quadrans)" value={character.silver ?? 0} color="surface" />
          <CurrencyCell label="CP (Lepton)" value={character.copper ?? 0} color="surface" />
        </div>
        <p className="mt-2 text-center text-[9px] text-surface-500">50 Leptons = 1 Quadrans | 5 Quadrans = 1 Assarion</p>
      </section>

      {/* Backstory */}
      {character.backstory && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">Backstory</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">{character.backstory}</p>
        </section>
      )}

      {/* Character Notes */}
      {character.characterNotes && (
        <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-surface-400">Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-surface-300">{character.characterNotes}</p>
        </section>
      )}
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    warrior: "border-warrior-500/30 bg-warrior-500/10 text-warrior-400",
    mage: "border-mage-500/30 bg-mage-500/10 text-mage-400",
    rogue: "border-rogue-500/30 bg-rogue-500/10 text-rogue-400",
    divine: "border-divine-500/30 bg-divine-500/10 text-divine-400",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color] ?? "border-surface-700 bg-surface-800 text-surface-300"}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  );
}

function CurrencyCell({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gold: "text-amber-300",
    surface: "text-surface-300",
  };
  return (
    <div className="rounded-lg bg-surface-800 py-2">
      <p className={`text-xs font-bold ${colorMap[color] ?? "text-surface-300"}`}>{value}</p>
      <p className="text-[9px] text-surface-500">{label}</p>
    </div>
  );
}
