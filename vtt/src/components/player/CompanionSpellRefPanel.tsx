/**
 * STᚱ VTT — Companion Spell Quick-Reference Panel (Overrrides-Grade Premium)
 *
 * Cycle 24: Player-facing spell reference popover for the companion encounter view.
 * During the player's turn, opens a compact, searchable list of prepared spells
 * and cantrips with at-a-glance mechanical info.
 *
 * Features:
 *   - Shows ALL prepared spells for the current character (from compendium)
 *   - Dedicated cantrip section (always displayed)
 *   - Level filter chips (All / Cantrips / Lv.1 / Lv.2 / etc.)
 *   - Search by name or school
 *   - Per-spell expandable detail card (school, casting time, range, components,
 *     duration, damage/healing/save/attack info, concentration, ritual, description)
 *   - School color badges matching the SRD color system
 *   - Damage/healing chip badges for quick scanning
 *   - Premium glass gradient with violet accent
 *   - Escape key + backdrop dismiss
 *   - Staggered entrance animation
 *
 * Design: Overrrides/Ventriloc — compact glass cards, school color badges,
 *   gold edge lights, staggered entrance.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { PlayerCharacter, SpellLevel } from "@/types";
import { useCompendiumStore } from "@/stores/compendium";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import type { KnownSpell } from "@/lib/spell-utils";
import { SCHOOL_COLORS, SCHOOL_ICON, getSchoolStyle } from "@/lib/spell-utils";
import PremiumIcon from "@/components/ui/PremiumIcon";

// ── Helpers ──

const LEVEL_LABELS: Record<number, string> = {
  0: "Cantrip", 1: "1st Level", 2: "2nd Level", 3: "3rd Level",
  4: "4th Level", 5: "5th Level", 6: "6th Level", 7: "7th Level",
  8: "8th Level", 9: "9th Level",
};

function getLevelLabel(level: number): string {
  return LEVEL_LABELS[level] || `Level ${level}`;
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface CompanionSpellRefPanelProps {
  character: PlayerCharacter;
  onClose: () => void;
}

export default function CompanionSpellRefPanel({ character, onClose }: CompanionSpellRefPanelProps) {
  const compendiumStore = useCompendiumStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const spellcasting = useMemo(() => computeSpellcasting(character), [character]);

  // Auto-focus search on mount
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 200);
  }, []);

  // Escape key dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Build spell list from compendium ──
  const allSpells = useMemo(() => {
    const compendiumSpells = compendiumStore.spells || [];
    const srdSpells = compendiumSpells.filter((s) => !s.isHomebrew);
    const homebrewSpells = compendiumSpells.filter((s) => s.isHomebrew);

    // Detect which spells the character might have via their class
    const className = character.class || "";
    const classLower = className.toLowerCase();

    // Gather ALL compendium spells for reference (filtered by prepared list if available)
    const knownNames = character.preparedSpells || [];

    // Map all compendium spells + add any known spells from prepared list
    const result: KnownSpell[] = [];

    // Helper: add spell if not already in result
    const addIfMissing = (spell: { name: string; level: number; school: string; description: string; castingTime?: string; range?: string; components?: string; duration?: string; ritual?: boolean; concentration?: boolean; damageDice?: string; damageType?: string; healDice?: string; saveDC?: number; saveAbility?: string; attackRoll?: boolean; tags?: string[]; }) => {
      if (!result.some((r) => r.name.toLowerCase() === spell.name.toLowerCase())) {
        result.push({
          name: spell.name,
          level: spell.level,
          school: spell.school || "Unknown",
          castingTime: spell.castingTime || "1 action",
          range: spell.range || "Self",
          components: spell.components || "V, S",
          duration: spell.duration || "Instantaneous",
          description: spell.description,
          ritual: spell.ritual || false,
          concentration: spell.concentration || false,
          damageDice: spell.damageDice,
          damageType: spell.damageType,
          healDice: spell.healDice,
          saveDC: spell.saveDC,
          saveAbility: spell.saveAbility,
          attackRoll: spell.attackRoll || false,
        });
      }
    };

    // Add known spells (prepared list → resolved from SRD/homebrew)
    for (const name of knownNames) {
      const fromSRD = srdSpells.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (fromSRD) { addIfMissing(fromSRD); continue; }
      const fromHB = homebrewSpells.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (fromHB) { addIfMissing(fromHB); continue; }
      // Fallback: create synthetic entry
      result.push({
        name,
        level: 1,
        school: "Unknown",
        castingTime: "1 action",
        range: "Self",
        components: "V, S",
        duration: "Instantaneous",
        description: "A prepared spell.",
      });
    }

    // Add cantrips from character's class
    const classCantrips = srdSpells.filter(
      (s) => s.level === 0 && s.tags?.some((t: string) => t.toLowerCase() === classLower)
    );
    for (const cantrip of classCantrips) {
      addIfMissing(cantrip);
    }

    // If empty (no prepared spells, no cantrips), show all SRD spells for the class
    if (result.length === 0) {
      for (const s of srdSpells) {
        if (s.tags?.some((t: string) => t.toLowerCase() === classLower)) {
          addIfMissing(s);
        }
      }
    }

    // Sort by level ascending, then alphabetically
    return result.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [character.class, character.preparedSpells, compendiumStore.spells]);

  // ── Filtering ──
  const filteredSpells = useMemo(() => {
    return allSpells.filter((spell) => {
      if (filterLevel !== null && spell.level !== filterLevel) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          spell.name.toLowerCase().includes(q) ||
          spell.school.toLowerCase().includes(q) ||
          spell.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allSpells, filterLevel, searchQuery]);

  // ── Available levels for filter chips ──
  const availableLevels = useMemo(() => {
    const levels = new Set(allSpells.map((s) => s.level));
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((l) => levels.has(l));
  }, [allSpells]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-md max-h-[80vh] overflow-hidden
        bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
        animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/15 to-indigo-500/10 flex items-center justify-center border border-violet/10">
              <PremiumIcon name="sparkles" className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">Spell References</h3>
            {spellcasting.isCaster && (
              <span className="text-[9px] text-surface-500 tabular-nums">
                DC {spellcasting.saveDC} · ATK +{spellcasting.attackBonus}
              </span>
            )}
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Character Identity ── */}
        <div className="flex items-center gap-1.5 px-3 mb-1">
          <span className="text-[10px] text-surface-400">{character.name}</span>
          <span className="text-[8px] text-surface-600">·</span>
          <span className="text-[9px] text-surface-500">{character.class || "Adventurer"} {character.level}</span>
          {!spellcasting.isCaster && (
            <>
              <span className="text-[8px] text-surface-600">·</span>
              <span className="text-[8px] text-surface-500 bg-surface-800/30 px-1 py-px rounded">Non-Caster</span>
            </>
          )}
          <span className="flex-1" />
          <span className="text-[9px] text-surface-500 tabular-nums">{allSpells.length} spells</span>
        </div>

        {/* ── Search + Level filter ── */}
        <div className="px-3 pb-1">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-surface-500 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
            </svg>
            <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spells..."
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg pl-7 pr-3 py-1.5
                text-[11px] text-white/80 placeholder:text-surface-500
                focus:outline-none focus:border-violet-500/25 focus:ring-1 focus:ring-violet-500/15 transition-all"
            />
          </div>

          {/* Level filter chips */}
          {availableLevels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              <button onClick={() => setFilterLevel(null)}
                className={`text-[8px] px-1.5 py-0.5 rounded-full transition-all
                  ${filterLevel === null
                    ? "bg-violet-500/12 text-violet-300 border border-violet-500/20"
                    : "bg-surface-800/30 text-surface-400 border border-white/[0.04] hover:bg-surface-800/50"}`}
              >All</button>
              {availableLevels.map((lvl) => (
                <button key={lvl} onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
                  className={`text-[8px] px-1.5 py-0.5 rounded-full transition-all
                    ${filterLevel === lvl
                      ? "bg-violet-500/12 text-violet-300 border border-violet-500/20"
                      : "bg-surface-800/30 text-surface-400 border border-white/[0.04] hover:bg-surface-800/50"}`}
                >{lvl === 0 ? "Cantrips" : `Lv.${lvl}`}</button>
              ))}
            </div>
          )}
        </div>

        {/* ── Spell list ── */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 max-h-[50vh] space-y-1 scrollbar-gold">
          {/* No spells found */}
          {filteredSpells.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-8 h-8 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mb-1.5">
                <PremiumIcon name="sparkles" className="w-4 h-4 text-surface-500" />
              </div>
              <p className="text-[11px] text-surface-400">No spells found</p>
              <p className="text-[9px] text-surface-500 mt-0.5">Try adjusting your search or filters.</p>
            </div>
          )}

          {/* Cantrips section */}
          {filterLevel === null && !searchQuery && allSpells.filter((s) => s.level === 0).length > 0 && (
            <div className="mb-1">
              <div className="text-[8px] text-surface-600 uppercase tracking-wider px-1 mb-0.5">Cantrips</div>
              {allSpells.filter((s) => s.level === 0).map((spell) => (
                <SpellCard key={spell.name} spell={spell}
                  isExpanded={expandedSpell === spell.name}
                  onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                />
              ))}
            </div>
          )}

          {/* Level-grouped spells (Lv.1+) */}
          {[1,2,3,4,5,6,7,8,9].map((lvl) => {
            const levelSpells = filteredSpells.filter((s) => s.level === lvl);
            if (levelSpells.length === 0) return null;
            return (
              <div key={lvl} className="mb-1">
                <div className="text-[8px] text-surface-600 uppercase tracking-wider px-1 mb-0.5">
                  {getLevelLabel(lvl)}
                </div>
                {levelSpells.map((spell) => (
                  <SpellCard key={spell.name} spell={spell}
                    isExpanded={expandedSpell === spell.name}
                    onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                  />
                ))}
              </div>
            );
          })}

          {/* Ungrouped (if filter or search active — show filtered results directly) */}
          {((filterLevel !== null || searchQuery) && filteredSpells.length > 0) && (
            (() => {
              // Check if we already rendered via level grouping
              const allLevels = new Set(filteredSpells.map((s) => s.level));
              const hasLvlGrouped = [1,2,3,4,5,6,7,8,9].some((l) => allLevels.has(l) && !allLevels.has(0));
              if (!hasLvlGrouped && !allLevels.has(0)) {
                return filteredSpells.map((spell) => (
                  <SpellCard key={spell.name} spell={spell}
                    isExpanded={expandedSpell === spell.name}
                    onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                  />
                ));
              }
              return null;
            })()
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-3 py-1.5 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-500">
            {/* Spell reference — quick lookup */}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-surface-500">
              Showing {filteredSpells.length} of {allSpells.length} spells
            </span>
            <button onClick={onClose}
              className="text-[9px] text-violet-400/60 hover:text-violet-400 transition-colors"
            >Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SPELL CARD SUB-COMPONENT
// ═══════════════════════════════════════════════════════

function SpellCard({
  spell, isExpanded, onToggle,
}: {
  spell: KnownSpell;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const schoolStyle = getSchoolStyle(spell.school);

  return (
    <div className="rounded-lg bg-surface-800/20 border border-white/[0.04] overflow-hidden transition-all duration-150">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Level badge */}
          <span className="text-[9px] text-surface-400 tabular-nums w-4 flex-shrink-0">
            {spell.level === 0 ? <span className="text-emerald-400">◈</span> : spell.level}
          </span>
          {/* Name */}
          <span className="text-[11px] text-white/80 truncate">{spell.name}</span>
          {/* School badge */}
          <span className={`text-[7px] px-1 py-px rounded-full ${schoolStyle} flex-shrink-0`}>
            {SCHOOL_ICON[spell.school] || "✨"} {spell.school}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          {/* Damage/healing chips */}
          {spell.damageDice && (
            <span className="text-[8px] text-rose-400 bg-rose-500/8 px-1 py-px rounded">
              💥 {spell.damageDice}
            </span>
          )}
          {spell.healDice && (
            <span className="text-[8px] text-emerald-400 bg-emerald-500/8 px-1 py-px rounded">
              ❤ {spell.healDice}
            </span>
          )}
          {/* Concentration / Ritual badges */}
          {spell.concentration && (
            <span className="text-[8px] text-violet-400" title="Concentration">🧘</span>
          )}
          {spell.ritual && (
            <span className="text-[8px] text-surface-400" title="Ritual">📜</span>
          )}
          <svg className={`w-2.5 h-2.5 text-surface-500 transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-white/[0.04] px-2 py-1.5 animate-in slide-in-from-top-1 fade-in duration-100">
          {/* Spell info grid */}
          <div className="grid grid-cols-2 gap-1 mb-1.5">
            <div className="text-[8px] text-surface-500">Casting Time</div>
            <div className="text-[9px] text-white/70 text-right">{spell.castingTime}</div>
            <div className="text-[8px] text-surface-500">Range</div>
            <div className="text-[9px] text-white/70 text-right">{spell.range}</div>
            <div className="text-[8px] text-surface-500">Components</div>
            <div className="text-[9px] text-white/70 text-right">{spell.components}</div>
            <div className="text-[8px] text-surface-500">Duration</div>
            <div className="text-[9px] text-white/70 text-right">{spell.duration}</div>
          </div>

          {/* Damage / save / attack info */}
          {(spell.damageDice || spell.healDice || spell.saveDC || spell.attackRoll) && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {spell.damageDice && spell.damageType && (
                <span className="text-[8px] bg-rose-500/8 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/10">
                  💥 {spell.damageDice} {spell.damageType}
                </span>
              )}
              {spell.damageDice && !spell.damageType && (
                <span className="text-[8px] bg-rose-500/8 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/10">
                  💥 {spell.damageDice}
                </span>
              )}
              {spell.healDice && (
                <span className="text-[8px] bg-emerald-500/8 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10">
                  ❤ {spell.healDice}
                </span>
              )}
              {spell.saveDC && (
                <span className="text-[8px] bg-indigo-500/8 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/10">
                  🛡 DC {spell.saveDC} {spell.saveAbility || "Dex"}
                </span>
              )}
              {spell.attackRoll && (
                <span className="text-[8px] bg-amber-500/8 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/10">
                  🎯 Spell Attack
                </span>
              )}
            </div>
          )}

          {/* Description */}
          <p className="text-[9px] text-surface-300 leading-relaxed whitespace-pre-wrap">
            {spell.description}
          </p>

          {/* Concentration / Ritual note */}
          {spell.concentration && (
            <div className="flex items-center gap-1 mt-1 text-[8px] text-violet-400/60">
              <span>🧘 Requires Concentration</span>
            </div>
          )}
          {spell.ritual && (
            <div className="flex items-center gap-1 mt-1 text-[8px] text-surface-400/60">
              <span>📜 Can be cast as a Ritual</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
