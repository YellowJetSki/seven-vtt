/**
 * ST VTT — DM Skill Check & Passive Perception Awareness Popover
 *
 * A globally accessible tool for running D&D 5.5e skill/ability checks.
 * Displays all 18 skills with DC input, auto-tracks each character's
 * proficiency and ability modifiers, and shows who passes/fails.
 *
 * Also displays passive perception, investigation, and insight for all
 * party members — the DM's quick-reference for hidden things.
 *
 * Deployed: https://arkla.vercel.app
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUIStore } from "@/stores/uiStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface PlayerCharacter {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiencyBonus: number;
  skills: Record<string, "none" | "proficient" | "expertise">;
}

function getAbilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getAbilityScoreName(key: string): string {
  const names: Record<string, string> = {
    strength: "STR", dexterity: "DEX", constitution: "CON",
    intelligence: "INT", wisdom: "WIS", charisma: "CHA",
  };
  return names[key] || key.toUpperCase().slice(0, 3);
}

function getAbilityIcon(key: string): string {
  const icons: Record<string, string> = {
    strength: "💪", dexterity: "🎯", constitution: "❤️",
    intelligence: "🧠", wisdom: "👁️", charisma: "💬",
  };
  return icons[key] || "❓";
}

const SKILLS: Array<{
  key: string;
  name: string;
  ability: string;
  description: string;
}> = [
  { key: "acrobatics", name: "Acrobatics", ability: "dexterity", description: "Stay on your feet in tricky situations" },
  { key: "animal_handling", name: "Animal Handling", ability: "wisdom", description: "Calm or train animals" },
  { key: "arcana", name: "Arcana", ability: "intelligence", description: "Recall lore about spells, magic items, eldritch symbols" },
  { key: "athletics", name: "Athletics", ability: "strength", description: "Climb, swim, jump, grapple" },
  { key: "deception", name: "Deception", ability: "charisma", description: "Lie convincingly" },
  { key: "history", name: "History", ability: "intelligence", description: "Recall historical events and legends" },
  { key: "insight", name: "Insight", ability: "wisdom", description: "Read a creature's intentions" },
  { key: "intimidation", name: "Intimidation", ability: "charisma", description: "Bend others to your will through threats" },
  { key: "investigation", name: "Investigation", ability: "intelligence", description: "Find clues and deduce conclusions" },
  { key: "medicine", name: "Medicine", ability: "wisdom", description: "Diagnose illness or stabilize the dying" },
  { key: "nature", name: "Nature", ability: "intelligence", description: "Recall lore about terrain, plants, animals" },
  { key: "perception", name: "Perception", ability: "wisdom", description: "Spot hidden creatures or objects" },
  { key: "performance", name: "Performance", ability: "charisma", description: "Delight an audience with art" },
  { key: "persuasion", name: "Persuasion", ability: "charisma", description: "Convince others to see your point of view" },
  { key: "religion", name: "Religion", ability: "intelligence", description: "Recall lore about gods, religions, cults" },
  { key: "sleight_of_hand", name: "Sleight of Hand", ability: "dexterity", description: "Pick pockets or palm objects" },
  { key: "stealth", name: "Stealth", ability: "dexterity", description: "Move silently and avoid detection" },
  { key: "survival", name: "Survival", ability: "wisdom", description: "Track creatures and navigate the wilds" },
];

function getSkillMod(
  char: PlayerCharacter,
  skillKey: string
): { total: number; abilityMod: number; profBonus: number; isProficient: boolean; isExpertise: boolean } {
  const skill = SKILLS.find((s) => s.key === skillKey);
  if (!skill) return { total: 0, abilityMod: 0, profBonus: 0, isProficient: false, isExpertise: false };

  const abilityKey = skill.ability as keyof PlayerCharacter;
  const abilityScore = (char[abilityKey] as number) || 10;
  const abilityMod = getAbilityMod(abilityScore);

  const profLevel = char.skills?.[skillKey] || "none";
  const isProficient = profLevel === "proficient" || profLevel === "expertise";
  const isExpertise = profLevel === "expertise";

  const profBonus = isProficient ? (isExpertise ? char.proficiencyBonus * 2 : char.proficiencyBonus) : 0;
  const total = abilityMod + profBonus;

  return { total, abilityMod, profBonus, isProficient, isExpertise };
}

function computePassive(
  char: PlayerCharacter,
  skillKey: string
): { passive: number; isProficient: boolean } {
  const mod = getSkillMod(char, skillKey);
  if (skillKey !== "perception" && skillKey !== "investigation" && skillKey !== "insight") {
    return { passive: 0, isProficient: false };
  }
  return { passive: 10 + mod.total, isProficient: mod.isProficient };
}

export default function DmSkillCheckPopover() {
  const showSkillCheck = useUIStore((s) => s.showSkillCheck);
  const setSkillCheck = useUIStore((s) => s.setSkillCheck);
  const characters = useCampaignStore((s) => s.characters);

  const [selectedSkill, setSelectedSkill] = useState<string>("perception");
  const [dc, setDc] = useState<number>(15);
  const [isGroupCheck, setIsGroupCheck] = useState<boolean>(false);
  const [advantageChars, setAdvantageChars] = useState<Set<string>>(new Set());
  const [disadvantageChars, setDisadvantageChars] = useState<Set<string>>(new Set());
  const [rolledValues, setRolledValues] = useState<Record<string, number | null>>({});
  const [showPassives, setShowPassives] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [animPhase, setAnimPhase] = useState<"entering" | "visible" | "exiting">("entering");

  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync visibility
  useEffect(() => {
    if (showSkillCheck) {
      setAnimPhase("entering");
      requestAnimationFrame(() => setAnimPhase("visible"));
    } else {
      setAnimPhase("exiting");
    }
  }, [showSkillCheck]);

  // Close on Escape
  useEffect(() => {
    if (!showSkillCheck) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showSkillCheck]);

  const handleClose = useCallback(() => {
    setAnimPhase("exiting");
    setTimeout(() => {
      setSkillCheck(false);
      setRolledValues({});
      setAdvantageChars(new Set());
      setDisadvantageChars(new Set());
    }, 150);
  }, [setSkillCheck]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) handleClose();
    },
    [handleClose]
  );

  // Cast characters to our interface
  const party = useMemo(() => {
    return (characters || []) as unknown as PlayerCharacter[];
  }, [characters]);

  // Filtered skills
  const filteredSkills = useMemo(() => {
    if (!searchQuery) return SKILLS;
    const q = searchQuery.toLowerCase();
    return SKILLS.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ability.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Selected skill data
  const skillData = useMemo(() => SKILLS.find((s) => s.key === selectedSkill), [selectedSkill]);

  // Categorized passive scores
  const passiveScores = useMemo(() => {
    return party.map((char) => ({
      id: char.id,
      name: char.name,
      perception: computePassive(char, "perception"),
      investigation: computePassive(char, "investigation"),
      insight: computePassive(char, "insight"),
    }));
  }, [party]);

  // Roll for a character
  const handleRoll = useCallback(
    (charId: string) => {
      if (!skillData) return;
      const char = party.find((c) => c.id === charId) as PlayerCharacter | undefined;
      if (!char) return;

      const mod = getSkillMod(char, selectedSkill);
      const hasAdvantage = advantageChars.has(charId);
      const hasDisadvantage = disadvantageChars.has(charId);

      let roll1 = Math.floor(Math.random() * 20) + 1;
      let roll2 = Math.floor(Math.random() * 20) + 1;

      let finalRoll: number;
      if (hasAdvantage) {
        finalRoll = Math.max(roll1, roll2);
      } else if (hasDisadvantage) {
        finalRoll = Math.min(roll1, roll2);
      } else {
        finalRoll = roll1;
      }

      setRolledValues((prev) => ({
        ...prev,
        [charId]: finalRoll + mod.total,
      }));
    },
    [selectedSkill, skillData, party, advantageChars, disadvantageChars]
  );

  const handleRollAll = useCallback(() => {
    party.forEach((char) => {
      if (rolledValues[char.id] === null || rolledValues[char.id] === undefined) {
        handleRoll(char.id);
      }
    });
  }, [party, rolledValues, handleRoll]);

  const handleClear = useCallback(() => {
    setRolledValues({});
    setAdvantageChars(new Set());
    setDisadvantageChars(new Set());
  }, []);

  if (!showSkillCheck && animPhase !== "entering") return null;

  const selectedAbility = skillData?.ability || "";

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        animPhase === "visible" ? "pointer-events-auto" : "pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          animPhase === "visible" ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Popover Card */}
      <div
        className={`relative w-[680px] max-w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)] ${
          animPhase === "visible"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        } transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}
      >
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <PremiumIcon name="rollInitiative" className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Skill Check</h2>
              <p className="text-[10px] text-surface-500">Call for a party-wide skill check</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all duration-150"
            aria-label="Close"
          >
            <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="p-5 space-y-4">
          {/* Skill Selector */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-[10px] uppercase tracking-wider text-surface-500 font-bold">Skill / Ability</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search skills..."
                className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1 text-[11px] text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-150"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-gold">
              {filteredSkills.map((skill) => (
                <button
                  key={skill.key}
                  onClick={() => {
                    setSelectedSkill(skill.key);
                    setRolledValues({});
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-150 active:scale-90 ${
                    selectedSkill === skill.key
                      ? "bg-gold-500/12 text-gold-300 border border-gold/20 shadow-[0_0_8px_rgba(234,179,8,0.04)]"
                      : "bg-white/[0.02] text-surface-400 border border-white/[0.04] hover:bg-white/[0.04] hover:text-surface-300"
                  }`}
                  title={skill.description}
                >
                  {getAbilityIcon(skill.ability)} {skill.name}
                </button>
              ))}
            </div>
            {/* Ability filter chips */}
            <div className="flex gap-1.5 mt-1.5">
              {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((abil) => (
                <button
                  key={abil}
                  onClick={() => {
                    const firstSkill = SKILLS.find((s) => s.ability === abil);
                    if (firstSkill) {
                      setSelectedSkill(firstSkill.key);
                      setSearchQuery("");
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-bold transition-all duration-150 active:scale-90 ${
                    selectedAbility === abil
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                      : "text-surface-500 border border-white/[0.03] hover:border-white/[0.06]"
                  }`}
                >
                  {getAbilityIcon(abil)} {getAbilityScoreName(abil)}
                </button>
              ))}
            </div>
          </div>

          {/* DC Config */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] uppercase tracking-wider text-surface-500 font-bold min-w-[50px]">
              DC: {dc}
            </label>
            <input
              type="range"
              min={5}
              max={30}
              value={dc}
              onChange={(e) => setDc(parseInt(e.target.value))}
              className="flex-1 h-1.5 rounded-full appearance-none bg-surface-800/60 cursor-pointer accent-gold-500"
            />
            <div className="flex gap-1">
              {[5, 10, 15, 20, 25, 30].map((v) => (
                <button
                  key={v}
                  onClick={() => setDc(v)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all duration-150 active:scale-90 ${
                    dc === v
                      ? "bg-gold-500/12 text-gold-400 border border-gold/20"
                      : "text-surface-500 border border-white/[0.03] hover:border-white/[0.06]"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            {/* Quick DC presets */}
            <div className="text-[8px] text-surface-600 italic">
              Very Easy: 5 · Easy: 10 · Medium: 15 · Hard: 20 · Very Hard: 25 · Nearly Impossible: 30
            </div>
          </div>

          {/* Options row */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isGroupCheck}
                onChange={(e) => setIsGroupCheck(e.target.checked)}
                className="w-3 h-3 rounded border-white/[0.1] bg-surface-800/60 text-gold-500 focus:ring-gold-500/20"
              />
              <span className="text-[10px] text-surface-400">Group Check (half must succeed)</span>
            </label>
            <button
              onClick={() => setShowPassives(!showPassives)}
              className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all duration-150 active:scale-90 ${
                showPassives
                  ? "bg-violet-500/10 text-violet-400 border border-violet-500/15"
                  : "text-surface-500 border border-white/[0.04] hover:border-white/[0.06]"
              }`}
            >
              👁 Passive Scores
            </button>
          </div>

          {/* Character Rows */}
          <div className="space-y-1">
            {party.length === 0 && (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mx-auto mb-2">
                  <PremiumIcon name="search" className="w-5 h-5 text-surface-500" />
                </div>
                <p className="text-xs text-surface-500">No characters available</p>
                <p className="text-[9px] text-surface-600">Create characters in Player Cards</p>
              </div>
            )}
            {party.map((char) => {
              const rawChar = char as unknown as PlayerCharacter;
              const mod = getSkillMod(rawChar, selectedSkill);
              const rolled = rolledValues[char.id];
              const passed = rolled !== null && rolled !== undefined ? rolled >= dc : null;
              const hasAdv = advantageChars.has(char.id);
              const hasDis = disadvantageChars.has(char.id);

              return (
                <div
                  key={char.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 ${
                    rolled !== null && rolled !== undefined
                      ? passed
                        ? "bg-emerald-500/8 border border-emerald-500/10"
                        : "bg-rose-500/8 border border-rose-500/10"
                      : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Name */}
                  <div className="w-28 shrink-0">
                    <div className="text-[11px] text-white/80 font-medium truncate">{rawChar.name}</div>
                    <div className="text-[8px] text-surface-500">
                      {rawChar.race} {rawChar.class}
                    </div>
                  </div>

                  {/* Modifier breakdown */}
                  <div className="flex-1 text-[10px] text-surface-500">
                    {mod.abilityMod >= 0 ? "+" : ""}
                    {mod.abilityMod} ({getAbilityScoreName(skillData?.ability || "")})
                    {mod.isProficient && (
                      <span className="text-gold-400 ml-1">
                        +{mod.profBonus} (prof{mod.isExpertise ? "×2" : ""})
                      </span>
                    )}
                    <span className="text-white/60 ml-1">
                      = {mod.total >= 0 ? "+" : ""}
                      {mod.total}
                    </span>
                  </div>

                  {/* Advantage / Disadvantage toggles */}
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => {
                        setAdvantageChars((prev) => {
                          const next = new Set(prev);
                          if (next.has(char.id)) next.delete(char.id);
                          else {
                            next.add(char.id);
                            setDisadvantageChars((d) => {
                              const dd = new Set(d);
                              dd.delete(char.id);
                              return dd;
                            });
                          }
                          return next;
                        });
                      }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all duration-150 active:scale-90 ${
                        hasAdv
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                          : "text-surface-600 border border-white/[0.03] hover:border-white/[0.06]"
                      }`}
                      title="Advantage"
                    >
                      ⬆
                    </button>
                    <button
                      onClick={() => {
                        setDisadvantageChars((prev) => {
                          const next = new Set(prev);
                          if (next.has(char.id)) next.delete(char.id);
                          else {
                            next.add(char.id);
                            setAdvantageChars((a) => {
                              const aa = new Set(a);
                              aa.delete(char.id);
                              return aa;
                            });
                          }
                          return next;
                        });
                      }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all duration-150 active:scale-90 ${
                        hasDis
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                          : "text-surface-600 border border-white/[0.03] hover:border-white/[0.06]"
                      }`}
                      title="Disadvantage"
                    >
                      ⬇
                    </button>
                  </div>

                  {/* Roll result or Roll button */}
                  <div className="w-16 text-center shrink-0">
                    {rolled !== null && rolled !== undefined ? (
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-sm font-bold font-mono ${
                            passed ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {rolled}
                        </span>
                        <span
                          className={`text-[8px] font-bold ${
                            passed ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {passed ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRoll(char.id)}
                        className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-gold-500/10 text-gold-400 border border-gold/15 hover:bg-gold-500/15 active:scale-90 transition-all duration-150"
                      >
                        🎲 Roll
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          {party.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleRollAll}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/12 text-gold-400 border border-gold/20 hover:bg-gold-500/18 active:scale-90 transition-all duration-150"
              >
                🎲 Roll All
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-surface-400 border border-white/[0.04] hover:bg-white/[0.03] active:scale-90 transition-all duration-150"
              >
                ✕ Clear Results
              </button>
              {isGroupCheck && (
                <span className="text-[9px] text-surface-500 italic">
                  Group check: {party.filter((c) => rolledValues[c.id] !== null && rolledValues[c.id] !== undefined && rolledValues[c.id]! >= dc).length}/{party.length} succeed
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── PASSIVE SCORES SECTION ── */}
        {showPassives && (
          <div className="border-t border-white/[0.04] px-5 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-wider text-violet-400 font-bold">👁️ Passive Scores</span>
              <span className="text-[8px] text-surface-600">Perception · Investigation · Insight</span>
            </div>
            <div className="overflow-x-auto scrollbar-gold">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-surface-600 uppercase tracking-wider">
                    <th className="text-left py-1 pr-3 font-medium">Character</th>
                    <th className="text-center px-2 py-1 font-medium">👁️ Perception</th>
                    <th className="text-center px-2 py-1 font-medium">🔍 Investigation</th>
                    <th className="text-center px-2 py-1 font-medium">💡 Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {passiveScores.map((ps) => (
                    <tr key={ps.id} className="border-t border-white/[0.03]">
                      <td className="py-1.5 pr-3 text-white/80 font-medium truncate max-w-[120px]">
                        {ps.name}
                      </td>
                      <td className="text-center px-2 py-1.5">
                        <span className={`font-mono font-bold ${ps.perception.isProficient ? "text-gold-400" : "text-surface-400"}`}>
                          {ps.perception.passive}
                        </span>
                        {ps.perception.isProficient && (
                          <span className="text-[7px] text-gold-500 ml-0.5">prof</span>
                        )}
                      </td>
                      <td className="text-center px-2 py-1.5">
                        <span className={`font-mono font-bold ${ps.investigation.isProficient ? "text-gold-400" : "text-surface-400"}`}>
                          {ps.investigation.passive}
                        </span>
                        {ps.investigation.isProficient && (
                          <span className="text-[7px] text-gold-500 ml-0.5">prof</span>
                        )}
                      </td>
                      <td className="text-center px-2 py-1.5">
                        <span className={`font-mono font-bold ${ps.insight.isProficient ? "text-gold-400" : "text-surface-400"}`}>
                          {ps.insight.passive}
                        </span>
                        {ps.insight.isProficient && (
                          <span className="text-[7px] text-gold-500 ml-0.5">prof</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[8px] text-surface-600 italic">
              Passive score = 10 + ability modifier + proficiency bonus (if proficient).<br />
              If a character's passive perception beats a hidden DC, the DM should reveal the hidden element.
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">DC Reference: Very Easy 5 · Easy 10 · Medium 15 · Hard 20 · Very Hard 25 · Nearly Impossible 30</span>
          <span className="text-[7px] text-surface-700">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
}
