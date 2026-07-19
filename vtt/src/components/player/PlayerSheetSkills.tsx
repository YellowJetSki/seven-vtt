/**
 * STᚱ VTT — Player Sheet Skills (Premium Data Visualization)
 *
 * Premium interactive skills hub optimized for rapid reference.
 * Features:
 * - **Ability-synced colors**: Each ability group has distinct visual identity
 * - **Click-to-toggle proficiency**: none → proficient → expertise → none
 * - **Ability group filter** (All / STR / DEX / CON / INT / WIS / CHA) + search
 * - **Compact breakdown**: ability mod + PB contribution per skill
 * - **Total badge**: color-coded by positive/negative/neutral
 * - **Proficiency counts**: expert/proficient/total summary
 * - **Adaptive sorting**: skills grouped by ability with headers
 * - **Hover elevation**: row lifts with gold edge border on hover
 *
 * Zero purple tokens. Color system: gold-amber, emerald, rose, cyan, violet, pink.
 */

import { useMemo, useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter, SkillProficiency } from "@/types";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

// ── Helpers ──
function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function modColor(mod: number): string {
  if (mod > 0) return "text-gold-400";
  if (mod < 0) return "text-rose-400";
  return "text-surface-400";
}

function totalColor(total: number): string {
  if (total >= 5) return "text-gold-300";
  if (total >= 2) return "text-gold-400";
  if (total > 0) return "text-emerald-400";
  if (total < 0) return "text-rose-400";
  return "text-surface-400";
}

// ── Ability meta tokens ──
const ABILITY_META: Record<string, { short: string; icon: string; gradient: string; border: string }> = {
  strength: { short: "STR", icon: "💪", gradient: "from-rose-500/8 to-transparent", border: "border-rose-500/20" },
  dexterity: { short: "DEX", icon: "🎯", gradient: "from-emerald-500/8 to-transparent", border: "border-emerald-500/20" },
  constitution: { short: "CON", icon: "❤️", gradient: "from-amber-500/8 to-transparent", border: "border-amber-500/20" },
  intelligence: { short: "INT", icon: "🧠", gradient: "from-cyan-500/8 to-transparent", border: "border-cyan-500/20" },
  wisdom: { short: "WIS", icon: "👁️", gradient: "from-violet-500/8 to-transparent", border: "border-violet-500/20" },
  charisma: { short: "CHA", icon: "💬", gradient: "from-pink-500/8 to-transparent", border: "border-pink-500/20" },
};

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

  const [searchQuery, setSearchQuery] = useState("");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");
  const [groupByAbility, setGroupByAbility] = useState(true);

  const skillNames = useMemo(() => Object.entries(c.skills), [c.skills]);

  // ── Build skill data ──
  const skillData = useMemo(() => {
    return skillNames.map(([skill, prof]) => {
      const abilKey = SKILL_ABILITIES[skill] as keyof typeof c;
      const abilVal = typeof c[abilKey] === "number" ? (c[abilKey] as number) : 10;
      const mod = getAbilityMod(abilVal);
      const pbBonus = prof === "proficient" ? pb : prof === "expertise" ? pb * 2 : 0;
      const total = mod + pbBonus;
      return {
        skill: skill.replace(/_/g, " "),
        skillKey: skill,
        prof: prof as SkillProficiency,
        ability: SKILL_ABILITIES[skill] || "unknown",
        mod,
        pbBonus,
        total,
      };
    }).filter((s) => {
      if (abilityFilter !== "all" && s.ability !== abilityFilter) return false;
      if (searchQuery && !s.skill.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [skillNames, c, pb, abilityFilter, searchQuery]);

  // ── Group by ability ──
  const groupedSkills = useMemo(() => {
    if (!groupByAbility) return null;
    const groups: Record<string, typeof skillData> = {};
    const order = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
    for (const abil of order) {
      const items = skillData.filter((s) => s.ability === abil);
      if (items.length > 0) groups[abil] = items;
    }
    return groups;
  }, [skillData, groupByAbility]);

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

  // ── Counts ──
  const proficientCount = skillNames.filter(([, v]) => v === "proficient").length;
  const expertiseCount = skillNames.filter(([, v]) => v === "expertise").length;
  const totalCount = skillNames.length;

  if (skillNames.length === 0) {
    return (
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-4 text-center text-surface-500 text-xs">
        No skill proficiencies set for this character.
      </div>
    );
  }

  // ── Render a single skill row ──
  const SkillRow = ({ skill, skillKey, prof, mod, pbBonus, total }: typeof skillData[0]) => (
    <div
      key={skillKey}
      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/15 hover:bg-obsidian-mid/60 transition-all duration-200 group cursor-pointer"
      onClick={() => handleToggleProf(skillKey)}
    >
      {/* Left: Proficiency dot + skill name */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleProf(skillKey); }}
          className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold transition-all duration-200 border ${
            prof === "expertise"
              ? "bg-gold-500/25 border-gold-500/50 text-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.15)]"
              : prof === "proficient"
              ? "bg-gold-500/20 border-gold-500/40 text-gold-400"
              : "bg-transparent border-surface-600/20 text-surface-600 group-hover:border-gold/30"
          }`}
          title={
            prof === "expertise" ? "Expertise (click to remove)" :
            prof === "proficient" ? "Proficient (click for expertise)" :
            "Not proficient (click to add)"
          }
        >
          {prof === "expertise" ? "⨁" : prof === "proficient" ? "●" : ""}
        </button>
        <span className="text-xs text-surface-300 capitalize truncate">{skill}</span>
        {/* Ability hint (compact) */}
        <span className="hidden sm:inline text-[7px] uppercase text-surface-600 font-mono">
          {ABILITY_META[(SKILL_ABILITIES[skillKey] || "")]?.short}
        </span>
      </div>

      {/* Right: Breakdown + Total */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1 text-[8px] font-mono tabular-nums">
          <span className={modColor(mod)}>{modStr(mod)}</span>
          {pbBonus > 0 && (
            <>
              <span className="text-surface-600">+</span>
              <span className="text-gold-500/70">
                {pbBonus > pb ? "×2" : `PB`}
              </span>
            </>
          )}
          {pbBonus > 0 && <span className="text-surface-600">=</span>}
        </div>
        <span className={`text-xs font-mono font-bold tabular-nums ${totalColor(total)} w-7 text-right`}>
          {modStr(total)}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* ── Search + filter bar ── */}
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
        <div className="flex items-center gap-1.5 text-[9px] text-surface-500 font-mono tabular-nums">
          {expertiseCount > 0 && (
            <span className="text-gold-400 font-semibold">{expertiseCount}✧</span>
          )}
          <span className="font-semibold text-surface-300">{proficientCount}</span>
          <span className="text-surface-600">/</span>
          <span>{totalCount}</span>
        </div>
      </div>

      {/* ── Ability filter chips ── */}
      <div className="flex gap-1 flex-wrap items-center">
        <button
          onClick={() => setAbilityFilter("all")}
          className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all duration-200 ${
            abilityFilter === "all"
              ? "bg-gold-500/10 text-gold-400 border border-gold/20"
              : "text-surface-500 border border-surface-700/30 hover:border-surface-600/40"
          }`}
        >
          All
        </button>
        {Object.entries(ABILITY_META).map(([abil, meta]) => {
          const hasSkills = skillData.some((s) => s.ability === abil);
          if (!hasSkills && abilityFilter !== abil) return null;
          const isActive = abilityFilter === abil;
          return (
            <button
              key={abil}
              onClick={() => setAbilityFilter(isActive ? "all" : abil)}
              className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all duration-200 capitalize border ${
                isActive
                  ? `bg-gold-500/10 text-gold-400 ${meta.border}`
                  : "text-surface-500 border-surface-700/30 hover:border-surface-600/40"
              }`}
            >
              {meta.icon}{" "}{meta.short}
            </button>
          );
        })}

        {/* Group toggle */}
        <button
          onClick={() => setGroupByAbility(!groupByAbility)}
          className={`ml-auto px-2 py-1 rounded-lg text-[8px] uppercase tracking-wider transition-all duration-200 border ${
            groupByAbility
              ? "text-gold-400/60 border-gold/10 bg-gold-500/5"
              : "text-surface-600 border-surface-700/30"
          }`}
          title="Toggle ability grouping"
        >
          {groupByAbility ? "Grouped" : "Flat"}
        </button>
      </div>

      {/* ── Skills list ── */}
      {skillData.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-surface-500 text-[10px]">No skills match your filter</p>
        </div>
      ) : groupedSkills ? (
        /* Grouped by ability */
        <div className="space-y-2">
          {Object.entries(groupedSkills).map(([abil, skills]) => {
            const meta = ABILITY_META[abil] || { icon: "✦", short: abil.slice(0, 3).toUpperCase(), gradient: "", border: "" };
            return (
              <div key={abil} className="space-y-0.5">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gradient-to-r ${meta.gradient || "from-gold-500/5 to-transparent"} border-l-2 ${meta.border || "border-l-gold-500/20"}`}>
                  <span className="text-[9px]">{meta.icon}</span>
                  <span className="text-[8px] uppercase tracking-widest font-bold text-surface-500">{meta.short}</span>
                  <span className="text-[7px] text-surface-600">· {skills.length}</span>
                </div>
                <div className="space-y-0.5">
                  {skills.map(SkillRow)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat list */
        <div className="space-y-0.5">
          {skillData.map(SkillRow)}
        </div>
      )}

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 text-[8px] text-surface-600 pt-1 border-t border-surface-700/10">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full border border-surface-600/20" /> None
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-500/20 border border-gold-500/40" /> Proficient (+{pb})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-500/30 border border-gold-500/50 shadow-[0_0_4px_rgba(234,179,8,0.15)]" /> Expertise (+{pb * 2})
        </span>
      </div>
    </div>
  );
}
