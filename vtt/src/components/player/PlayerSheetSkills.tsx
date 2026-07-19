/**
 * STᚱ VTT — Player Sheet Skills & Proficiencies (Enhanced)
 *
 * Interactive skills hub with:
 * - Click-to-toggle proficiency: none → proficient → expertise → none
 * - Ability group filter (All / STR / DEX / CON / INT / WIS / CHA)
 * - Search filter
 * - Ability modifier & proficiency bonus breakdown
 * - Color-coded modifier values
 */

import { useMemo, useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter, SkillProficiency } from "@/types";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function modColor(mod: number): string {
  if (mod > 0) return "text-green-400";
  if (mod < 0) return "text-red-400";
  return "text-surface-400";
}

function totalColor(total: number): string {
  if (total > 0) return "text-gold-300";
  if (total < 0) return "text-red-300";
  return "text-surface-400";
}

const SKILL_ABILITIES: Record<string, string> = {
  acrobatics: "dexterity", animal_handling: "wisdom", arcana: "intelligence",
  athletics: "strength", deception: "charisma", history: "intelligence",
  insight: "wisdom", intimidation: "charisma", investigation: "intelligence",
  medicine: "wisdom", nature: "intelligence", perception: "wisdom",
  performance: "charisma", persuasion: "charisma", religion: "intelligence",
  sleight_of_hand: "dexterity", stealth: "dexterity", survival: "wisdom",
};

interface PlayerSheetSkillsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetSkills({ character }: PlayerSheetSkillsProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const pb = useMemo(() => getProficiencyBonus(c.level), [c.level]);

  // ── Local filter state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");

  // ── Skill data ──
  const skillNames = useMemo(() => Object.entries(c.skills), [c.skills]);

  const grouped = useMemo(() => {
    const groups: Record<string, { skill: string; skillKey: string; prof: SkillProficiency; mod: number; pbBonus: number; total: number }[]> = {};
    for (const [skill, prof] of skillNames) {
      const abilKey = SKILL_ABILITIES[skill] as keyof typeof c;
      const abilVal = typeof c[abilKey] === "number" ? (c[abilKey] as number) : 10;
      const mod = getAbilityMod(abilVal);
      const pbBonus = prof === "proficient" ? pb : prof === "expertise" ? pb * 2 : 0;
      const total = mod + pbBonus;
      const abil = SKILL_ABILITIES[skill] || "unknown";
      if (!groups[abil]) groups[abil] = [];
      groups[abil].push({
        skill: skill.replace(/_/g, " "),
        skillKey: skill,
        prof: prof as SkillProficiency,
        mod,
        pbBonus,
        total,
      });
    }
    return groups;
  }, [skillNames, c, pb]);

  // ── Flattened + filtered list ──
  const filteredSkills = useMemo(() => {
    const all: { skill: string; skillKey: string; prof: SkillProficiency; mod: number; pbBonus: number; total: number; ability: string }[] = [];
    for (const [abil, skills] of Object.entries(grouped)) {
      for (const s of skills) {
        all.push({ ...s, ability: abil });
      }
    }
    return all.filter((s) => {
      if (abilityFilter !== "all" && s.ability !== abilityFilter) return false;
      if (searchQuery && !s.skill.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [grouped, abilityFilter, searchQuery]);

  // ── Toggle proficiency ──
  const handleToggleProf = useCallback(
    (skillKey: string) => {
      const current = c.skills[skillKey] as SkillProficiency | undefined;
      const next: SkillProficiency =
        current === "none" || !current ? "proficient" :
        current === "proficient" ? "expertise" : "none";
      updateCharacter(c.id, {
        skills: { ...c.skills, [skillKey]: next },
      });
    },
    [c, updateCharacter]
  );

  // ── Ability order + display ──
  const abilityOrder = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
  const abilityLabels: Record<string, { short: string; icon: string }> = {
    strength: { short: "STR", icon: "💪" },
    dexterity: { short: "DEX", icon: "🎯" },
    constitution: { short: "CON", icon: "❤️" },
    intelligence: { short: "INT", icon: "🧠" },
    wisdom: { short: "WIS", icon: "👁️" },
    charisma: { short: "CHA", icon: "💬" },
  };

  // ── Counts ──
  const totalCount = skillNames.length;
  const proficientCount = skillNames.filter(([, v]) => v === "proficient").length;
  const expertiseCount = skillNames.filter(([, v]) => v === "expertise").length;

  if (skillNames.length === 0) {
    return (
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-4 text-center text-surface-500 text-xs">
        No skill proficiencies set for this character.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search + filter bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500 text-[10px]">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-7 pr-2 py-1.5 text-[10px] bg-obsidian-mid/40 border border-surface-700/30 rounded-lg text-surface-200 placeholder:text-surface-600 focus:outline-none focus:border-gold/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-surface-500">
          <span className="font-mono tabular-nums">{proficientCount + expertiseCount}</span>
          <span className="text-surface-600">/</span>
          <span className="font-mono tabular-nums">{totalCount}</span>
        </div>
      </div>

      {/* Ability filter chips */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setAbilityFilter("all")}
          className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all duration-200 ${
            abilityFilter === "all"
              ? "bg-gold-500/10 text-gold-400 border border-gold/20"
              : "text-surface-500 border border-surface-700/30 hover:border-surface-600/40"
          }`}
        >All</button>
        {abilityOrder.map((abil) => {
          const hasSkills = grouped[abil] && grouped[abil].length > 0;
          if (!hasSkills) return null;
          return (
            <button
              key={abil}
              onClick={() => setAbilityFilter(abil)}
              className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all duration-200 capitalize ${
                abilityFilter === abil
                  ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                  : "text-surface-500 border border-surface-700/30 hover:border-surface-600/40"
              }`}
            >
              {abilityLabels[abil]?.icon} {abil.slice(0, 3).toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Filtered skill list */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-surface-500 text-[10px]">No skills match your filter</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {filteredSkills.map(({ skill, skillKey, prof, mod, pbBonus, total }) => (
            <div
              key={skillKey}
              className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200 group cursor-pointer"
              onClick={() => handleToggleProf(skillKey)}
            >
              {/* Left: Proficiency dot + name */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleProf(skillKey); }}
                  className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold transition-all duration-200 ${
                    prof === "expertise"
                      ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-400"
                      : prof === "proficient"
                      ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
                      : "bg-transparent border border-surface-600/20 text-surface-600 group-hover:border-gold/30"
                  }`}
                  title={prof === "expertise" ? "Expertise (click to remove)" : prof === "proficient" ? "Proficient (click for expertise)" : "Not proficient (click to add)"}
                >
                  {prof === "expertise" ? "⨁" : prof === "proficient" ? "●" : ""}
                </button>
                <span className="text-xs text-surface-300 capitalize truncate">{skill}</span>
              </div>

              {/* Right: Breakdown + Total */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Breakdown */}
                <div className="hidden sm:flex items-center gap-1 text-[8px] font-mono tabular-nums">
                  <span className={modColor(mod)}>{modStr(mod)}</span>
                  {pbBonus > 0 && (
                    <>
                      <span className="text-surface-600">+</span>
                      <span className="text-gold-500/70">PB({pbBonus > pb ? "×2" : "+"+pb})</span>
                    </>
                  )}
                  {pbBonus > 0 && <span className="text-surface-600">=</span>}
                </div>
                {/* Total */}
                <span className={`text-xs font-mono font-bold tabular-nums ${totalColor(total)} w-7 text-right`}>
                  {modStr(total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 text-[8px] text-surface-600 pt-1 border-t border-surface-700/10">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full border border-surface-600/20" /> None
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-500/20 border border-gold-500/40" /> Proficient
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/20 border border-cyan-500/40" /> Expertise
        </span>
      </div>
    </div>
  );
}
