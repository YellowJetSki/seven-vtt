/**
 * STᚱ VTT — Homebrew Race & Class Manager
 *
 * A form/sheet for DMs to create custom races with full 5e data:
 * - Ability score bonuses (any ability, any amount)
 * - Base speed + special speeds (fly/swim/climb/burrow)
 * - Size selection
 * - Darkvision range
 * - Racial traits (free text, multiple)
 * - Skill/weapon/armor/tool proficiencies
 * - Languages
 * - Subraces with their own bonuses and traits
 *
 * Supports both creating new homebrew and editing existing ones.
 */

import { useState, useCallback } from "react";
import type { RaceDefinition, AbilityBonus, RaceProficiency, SubraceDefinition } from "@/types/race-class";
import { SRD_RACES } from "@/data/srd-races";

interface HomebrewRaceFormProps {
  onSave: (race: RaceDefinition) => void;
  onCancel: () => void;
  initialRace?: RaceDefinition;
}

const ABILITIES: { key: AbilityBonus["ability"]; label: string; icon: string }[] = [
  { key: "strength", label: "STR", icon: "💪" },
  { key: "dexterity", label: "DEX", icon: "🎯" },
  { key: "constitution", label: "CON", icon: "❤️" },
  { key: "intelligence", label: "INT", icon: "🧠" },
  { key: "wisdom", label: "WIS", icon: "👁️" },
  { key: "charisma", label: "CHA", icon: "💬" },
];

const SIZES = ["Tiny", "Small", "Medium", "Large"] as const;
const PROF_TYPES = ["skill", "weapon", "armor", "tool", "save", "language"] as const;
const ALL_SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
  "History", "Insight", "Intimidation", "Investigation", "Medicine",
  "Nature", "Perception", "Performance", "Persuasion", "Religion",
  "Sleight of Hand", "Stealth", "Survival",
];

function makeDefaultRace(): RaceDefinition {
  const id = `homebrew-race-${Date.now()}`;
  return {
    id,
    name: "",
    source: "homebrew",
    size: "Medium",
    baseSpeed: 30,
    abilityBonuses: [],
    isHomebrew: true,
    traits: [""],
    proficiencies: [],
    darkvision: 0,
    languages: [],
    icon: "✦",
    description: "",
    tags: ["homebrew"],
  };
}

function formatBonus(bonus: AbilityBonus[]): string {
  return bonus.map(b => `${b.ability[0].toUpperCase() + b.ability.slice(1)} ${b.bonus >= 0 ? "+" : ""}${b.bonus}`).join(", ") || "None";
}

export default function HomebrewRaceForm({
  onSave,
  onCancel,
  initialRace,
}: HomebrewRaceFormProps) {
  const [race, setRace] = useState<RaceDefinition>(() => initialRace || makeDefaultRace());
  const [activeTab, setActiveTab] = useState<"main" | "traits" | "subraces">("main");
  const [previewRace, setPreviewRace] = useState<RaceDefinition | null>(null);

  const updateRace = useCallback(<K extends keyof RaceDefinition>(key: K, value: RaceDefinition[K]) => {
    setRace(prev => ({ ...prev, [key]: value }));
  }, []);

  const addBonus = useCallback(() => {
    updateRace("abilityBonuses", [...race.abilityBonuses, { ability: "strength", bonus: 1 }]);
  }, [race.abilityBonuses, updateRace]);

  const updateBonus = useCallback((index: number, bonus: AbilityBonus) => {
    const next = [...race.abilityBonuses];
    next[index] = bonus;
    updateRace("abilityBonuses", next);
  }, [race.abilityBonuses, updateRace]);

  const removeBonus = useCallback((index: number) => {
    updateRace("abilityBonuses", race.abilityBonuses.filter((_, i) => i !== index));
  }, [race.abilityBonuses, updateRace]);

  const addTrait = useCallback(() => {
    updateRace("traits", [...race.traits, ""]);
  }, [race.traits, updateRace]);

  const updateTrait = useCallback((index: number, value: string) => {
    const next = [...race.traits];
    next[index] = value;
    updateRace("traits", next);
  }, [race.traits, updateRace]);

  const removeTrait = useCallback((index: number) => {
    updateRace("traits", race.traits.filter((_, i) => i !== index));
  }, [race.traits, updateRace]);

  const addProficiency = useCallback(() => {
    updateRace("proficiencies", [
      ...race.proficiencies,
      { type: "skill", name: ALL_SKILLS[0] },
    ]);
  }, [race.proficiencies, updateRace]);

  const updateProficiency = useCallback((index: number, prof: RaceProficiency) => {
    const next = [...race.proficiencies];
    next[index] = prof;
    updateRace("proficiencies", next);
  }, [race.proficiencies, updateRace]);

  const removeProficiency = useCallback((index: number) => {
    updateRace("proficiencies", race.proficiencies.filter((_, i) => i !== index));
  }, [race.proficiencies, updateRace]);

  const addLanguage = useCallback((lang: string) => {
    if (!race.languages.includes(lang) && lang.trim()) {
      updateRace("languages", [...race.languages, lang.trim()]);
    }
  }, [race.languages, updateRace]);

  const removeLanguage = useCallback((index: number) => {
    updateRace("languages", race.languages.filter((_, i) => i !== index));
  }, [race.languages, updateRace]);

  const canSave = race.name.trim().length > 0 && race.baseSpeed >= 10;

  return (
    <div className="space-y-4">
      {/* ── Tab Navigation ── */}
      <div className="flex items-center gap-1 bg-[#0c0d15] rounded-xl p-1">
        {[
          { key: "main", label: "Main", icon: "📋" },
          { key: "traits", label: "Traits & Profs", icon: "⚡" },
          { key: "subraces", label: "Subraces", icon: "🔀" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
              activeTab === tab.key
                ? "bg-gold-500/15 text-gold-400 border border-gold/20 shadow-sm"
                : "text-surface-500 hover:text-surface-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── MAIN TAB ── */}
      {activeTab === "main" && (
        <div className="space-y-3">
          {/* Name & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500 block mb-1">
                Race Name *
              </label>
              <input
                value={race.name}
                onChange={(e) => updateRace("name", e.target.value)}
                placeholder="e.g. Frost Giant-kin"
                className="w-full px-3 py-2 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-sm text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-gold/30 transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500 block mb-1">
                Size
              </label>
              <select
                value={race.size}
                onChange={(e) => updateRace("size", e.target.value as RaceDefinition["size"])}
                className="w-full px-3 py-2 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-sm text-surface-200 focus:outline-none focus:border-gold/30 transition-all"
              >
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Speed */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500 block mb-1">
                Walk Speed *
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={race.baseSpeed}
                  onChange={(e) => updateRace("baseSpeed", Math.max(5, parseInt(e.target.value) || 30))}
                  className="w-full px-3 py-2 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-sm text-surface-200 focus:outline-none focus:border-gold/30 transition-all"
                />
                <span className="text-[10px] text-surface-500">ft</span>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500 block mb-1">
                Darkvision
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={race.darkvision}
                  onChange={(e) => updateRace("darkvision", Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-sm text-surface-200 focus:outline-none focus:border-gold/30 transition-all"
                />
                <span className="text-[10px] text-surface-500">ft</span>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500 block mb-1">
                Icon
              </label>
              <input
                value={race.icon}
                onChange={(e) => updateRace("icon", e.target.value)}
                placeholder="✦"
                maxLength={2}
                className="w-full px-3 py-2 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-sm text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/30 transition-all text-center text-lg"
              />
            </div>
          </div>

          {/* Ability Bonuses */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500">
                Ability Score Bonuses
              </label>
              <button
                onClick={addBonus}
                className="text-[9px] px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold/15 hover:bg-gold-500/15 transition-all"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1">
              {race.abilityBonuses.length === 0 && (
                <p className="text-[10px] text-surface-600 italic">No bonuses. Click "+ Add" to add ability score increases.</p>
              )}
              {race.abilityBonuses.map((bonus, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={bonus.ability}
                    onChange={(e) => updateBonus(i, { ...bonus, ability: e.target.value as AbilityBonus["ability"] })}
                    className="flex-1 px-2 py-1.5 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-[10px] text-surface-200 focus:outline-none focus:border-gold/30 transition-all"
                  >
                    {ABILITIES.map((a) => (
                      <option key={a.key} value={a.key}>{a.icon} {a.label}</option>
                    ))}
                  </select>
                  <select
                    value={bonus.bonus}
                    onChange={(e) => updateBonus(i, { ...bonus, bonus: parseInt(e.target.value) })}
                    className="w-16 px-2 py-1.5 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-[10px] text-surface-200 focus:outline-none focus:border-gold/30 transition-all"
                  >
                    {[-2, -1, 1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>{v >= 0 ? "+" : ""}{v}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeBonus(i)}
                    className="px-2 py-1.5 rounded-lg text-[10px] text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500 block mb-1">
              Description
            </label>
            <textarea
              value={race.description}
              onChange={(e) => updateRace("description", e.target.value)}
              placeholder="Describe the race's appearance, culture, and place in the world..."
              rows={3}
              className="w-full px-3 py-2 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-xs text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/30 transition-all resize-none"
            />
          </div>

          {/* Languages */}
          <div>
            <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500 block mb-1">
              Languages
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {race.languages.map((lang, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold-500/8 border border-gold/10 text-[10px] text-gold-400"
                >
                  {lang}
                  <button onClick={() => removeLanguage(i)} className="text-gold-500/50 hover:text-gold-400 ml-0.5">✕</button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              {["Common", "Elvish", "Dwarvish", "Draconic", "Celestial", "Infernal", "Custom..."].slice(0, 4).map((lang) => (
                <button
                  key={lang}
                  onClick={() => addLanguage(lang === "Custom..." ? prompt("Enter language name:") || "" : lang)}
                  className="px-2 py-1 rounded text-[9px] bg-[#0c0d15] border border-white/[0.06] text-surface-400 hover:text-surface-200 hover:border-gold/15 transition-all"
                >
                  + {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#0c0d15] border border-white/[0.04] rounded-xl p-3">
            <p className="text-[8px] uppercase tracking-widest font-black text-surface-500 mb-2">
              Preview
            </p>
            <div className="text-[11px] text-surface-300 leading-relaxed">
              <span className="text-gold-400">{race.icon}</span>{" "}
              <span className="font-bold text-surface-200">{race.name || "Unnamed Race"}</span>
              <span className="text-surface-500"> · {race.size} · {race.baseSpeed}ft · Darkvision {race.darkvision}ft</span>
              {race.abilityBonuses.length > 0 && (
                <><br/><span className="text-surface-500">ASI: </span>{formatBonus(race.abilityBonuses)}</>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TRAITS TAB ── */}
      {activeTab === "traits" && (
        <div className="space-y-3">
          {/* Racial Traits */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500">
                Racial Traits
              </label>
              <button
                onClick={addTrait}
                className="text-[9px] px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold/15 hover:bg-gold-500/15 transition-all"
              >
                + Add Trait
              </button>
            </div>
            <div className="space-y-1">
              {race.traits.map((trait, i) => (
                <div key={i} className="flex items-start gap-2">
                  <textarea
                    value={trait}
                    onChange={(e) => updateTrait(i, e.target.value)}
                    placeholder="Describe the trait's mechanics..."
                    rows={2}
                    className="flex-1 px-3 py-1.5 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-[10px] text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/30 transition-all resize-none"
                  />
                  {race.traits.length > 1 && (
                    <button onClick={() => removeTrait(i)} className="px-2 py-1.5 text-[10px] text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Proficiencies */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[9px] uppercase tracking-wider font-bold text-surface-500">
                Proficiencies
              </label>
              <button
                onClick={addProficiency}
                className="text-[9px] px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold/15 hover:bg-gold-500/15 transition-all"
              >
                + Add
              </button>
            </div>
            <div className="space-y-1">
              {race.proficiencies.length === 0 && (
                <p className="text-[10px] text-surface-600 italic">No racial proficiencies.</p>
              )}
              {race.proficiencies.map((prof, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={prof.type}
                    onChange={(e) => updateProficiency(i, { ...prof, type: e.target.value as RaceProficiency["type"] })}
                    className="w-20 px-2 py-1.5 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-[10px] text-surface-200 focus:outline-none focus:border-gold/30 transition-all"
                  >
                    {PROF_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    value={prof.name}
                    onChange={(e) => updateProficiency(i, { ...prof, name: e.target.value })}
                    placeholder={prof.type === "skill" ? "Choose skill..." : "Enter name..."}
                    className="flex-1 px-2 py-1.5 bg-[#0c0d15] border border-white/[0.06] rounded-lg text-[10px] text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/30 transition-all"
                  />
                  {prof.type === "skill" && prof.name === "Choose 2" && (
                    <span className="text-[8px] text-gold-400/60">(choose any)</span>
                  )}
                  <button onClick={() => removeProficiency(i)} className="px-2 py-1.5 text-[10px] text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBRACES TAB ── */}
      {activeTab === "subraces" && (
        <div className="space-y-3">
          <p className="text-[10px] text-surface-500">Subraces modify the base race with additional ability bonuses, traits, and descriptions.</p>
          {(!race.subraces || race.subraces.length === 0) && (
            <p className="text-[10px] text-surface-600 italic">No subraces defined. This race has no subrace options.</p>
          )}
          {race.subraces?.map((sub, si) => (
            <div key={si} className="bg-[#0c0d15] border border-white/[0.06] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <input
                  value={sub.name}
                  onChange={(e) => {
                    const next = [...(race.subraces || [])];
                    next[si] = { ...next[si], name: e.target.value };
                    updateRace("subraces", next);
                  }}
                  placeholder="Subrace name"
                  className="text-xs font-semibold text-surface-200 bg-transparent border-b border-white/[0.06] px-1 py-0.5 focus:outline-none focus:border-gold/30 transition-all"
                />
                <button
                  onClick={() => updateRace("subraces", race.subraces!.filter((_, i) => i !== si))}
                  className="px-2 py-1 text-[10px] text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                  Remove
                </button>
              </div>
              <p className="text-[9px] text-surface-500">{sub.description}</p>
              {sub.abilityBonuses.length > 0 && (
                <p className="text-[10px] text-surface-400">
                  Bonus: {sub.abilityBonuses.map(b => `${b.ability} ${b.bonus >= 0 ? "+" : ""}${b.bonus}`).join(", ")}
                </p>
              )}
            </div>
          ))}
          <button
            onClick={() => {
              const newSub: SubraceDefinition = {
                name: "New Subrace",
                abilityBonuses: [],
                traits: ["Subrace trait description"],
                description: "A subrace variant.",
              };
              updateRace("subraces", [...(race.subraces || []), newSub]);
            }}
            className="w-full py-2 rounded-lg text-[10px] font-semibold bg-gold-500/8 border border-gold/15 border-dashed text-gold-400 hover:bg-gold-500/12 transition-all"
          >
            + Add Subrace
          </button>
        </div>
      )}

      {/* ── ACTION BUTTONS ── */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.04]">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] transition-all"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            // Clean up empty traits
            const cleaned: RaceDefinition = {
              ...race,
              traits: race.traits.filter(t => t.trim().length > 0),
            };
            onSave(cleaned);
          }}
          disabled={!canSave}
          className="px-4 py-2 rounded-lg text-[10px] font-semibold bg-gold-500/15 text-gold-400 border border-gold/20 hover:bg-gold-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {initialRace ? "Save Changes" : "Create Race"}
        </button>
      </div>
    </div>
  );
}

export { formatBonus };
export type { HomebrewRaceFormProps };
