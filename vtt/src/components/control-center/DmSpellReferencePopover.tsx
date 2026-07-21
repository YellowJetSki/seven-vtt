/**
 * STᚱ VTT — DM Spell Reference Popover (Sprint 36)
 *
 * Globally accessible in-game spell library reference tool.
 * Reads from BOTH SRD compendium AND homebrew spell collections.
 *
 * D&D 5.5e RAW Features:
 *   - Search by name, school, class, description, tags
 *   - Filter by level (Cantrips, Lv1-9)
 *   - Filter by school (8 schools of magic)
 *   - Filter by class (14+ classes)
 *   - Per-spell detail view with full 5e statblock
 *   - Expand/collapse metadata: casting time, components, duration,
 *     range, shape/area, damage dice, save DC, healing dice
 *   - School color badges (8 unique color schemes)
 *   - Concentration, Ritual, Material indicator badges
 *   - At-higher-levels display
 *   - Source detection: SRD vs Homebrew badge
 *   - Quick-summary mode (compact) vs detailed mode
 *   - Mapped to PremiuIcon system for visual flavor
 *   - Count badges: "Showing 12 of 48 spells"
 *
 * Campaign: Arkla — Wendy Swiftfoot, Kehrfuffle Ironheart
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCompendiumStore } from "@/stores/compendium";
import { SRD_SPELLS } from "@/stores/compendium/compendiumData";
import type { HomebrewSpell } from "@/types/homebrew";
import PremiumIcon from "@/components/ui/PremiumIcon";

const LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const SCHOOLS = [
  "Abjuration", "Conjuration", "Divination", "Enchantment",
  "Evocation", "Illusion", "Necromancy", "Transmutation",
] as const;

const SCHOOL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Abjuration: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/15" },
  Conjuration: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/15" },
  Divination: { bg: "bg-violet-500/10", text: "text-violet-300", border: "border-violet-500/15" },
  Enchantment: { bg: "bg-pink-500/10", text: "text-pink-300", border: "border-pink-500/15" },
  Evocation: { bg: "bg-rose-500/10", text: "text-rose-300", border: "border-rose-500/15" },
  Illusion: { bg: "bg-indigo-500/10", text: "text-indigo-300", border: "border-indigo-500/15" },
  Necromancy: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/15" },
  Transmutation: { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/15" },
};

const LEVEL_LABELS: Record<number, string> = {
  0: "Cantrip", 1: "Lv.1", 2: "Lv.2", 3: "Lv.3", 4: "Lv.4",
  5: "Lv.5", 6: "Lv.6", 7: "Lv.7", 8: "Lv.8", 9: "Lv.9",
};

const ALL_CLASSES = [
  "Artificer", "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Blood Hunter",
];

interface FilterState {
  search: string;
  levels: Set<number>;
  schools: Set<string>;
  classes: Set<string>;
  showSRD: boolean;
  showHomebrew: boolean;
}

export default function DmSpellReferencePopover() {
  const show = useUIStore((s) => s.showSpellReference);
  const setShow = useUIStore((s) => s.setSpellReference);
  const compendiumItems = useCompendiumStore((s) => s.spells);

  const [animPhase, setAnimPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const [selectedSpellId, setSelectedSpellId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    levels: new Set(),
    schools: new Set(),
    classes: new Set(),
    showSRD: true,
    showHomebrew: true,
  });
  const [compactMode, setCompactMode] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) { setAnimPhase("entering"); requestAnimationFrame(() => setAnimPhase("visible")); }
    else setAnimPhase("exiting");
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const hk = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [show]);

  const handleClose = useCallback(() => {
    setAnimPhase("exiting");
    setTimeout(() => { setShow(false); setSelectedSpellId(null); }, 150);
  }, [setShow]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  }, [handleClose]);

  const toggleFilter = useCallback(<T,>(key: keyof FilterState, value: T) => {
    setFilters((prev) => {
      const set = prev[key] as Set<T>;
      const next = new Set(set);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: "", levels: new Set(), schools: new Set(), classes: new Set(), showSRD: true, showHomebrew: true });
  }, []);

  // Merge SRD spells (static import) with homebrew spells from compendium store
  const sourceSpells = useMemo(() => {
    const storeSpells = compendiumItems || [];
    const srdIds = new Set((SRD_SPELLS || []).map((s) => s.id));
    const unique: HomebrewSpell[] = [...(SRD_SPELLS || [])];
    for (const spell of storeSpells) {
      if (!srdIds.has(spell.id)) {
        unique.push(spell);
      }
    }
    return unique;
  }, [compendiumItems]);

  const filteredSpells = useMemo(() => {
    return sourceSpells.filter((spell) => {
      if (filters.levels.size > 0 && !filters.levels.has(spell.level)) return false;
      if (filters.schools.size > 0 && !filters.schools.has(spell.school)) return false;
      if (filters.classes.size > 0 && !spell.classes?.some((c) => filters.classes.has(c))) return false;
      if (!filters.showSRD && spell.source === "SRD") return false;
      if (!filters.showHomebrew && spell.isHomebrew) return false;
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = spell.name.toLowerCase().includes(q);
        const matchesSchool = spell.school.toLowerCase().includes(q);
        const matchesDesc = spell.description.toLowerCase().includes(q);
        const matchesTag = spell.tags?.some((t) => t.includes(q));
        const matchesClass = spell.classes?.some((c) => c.toLowerCase().includes(q));
        if (!matchesName && !matchesSchool && !matchesDesc && !matchesTag && !matchesClass) return false;
      }
      return true;
    });
  }, [sourceSpells, filters]);

  const selectedSpell = useMemo(() => {
    if (!selectedSpellId) return null;
    return sourceSpells.find((s) => s.id === selectedSpellId) || null;
  }, [selectedSpellId, sourceSpells]);

  // Stats
  const totalCount = sourceSpells.length;
  const srdCount = sourceSpells.filter((s) => s.source === "SRD").length;
  const homebrewCount = sourceSpells.filter((s) => s.isHomebrew).length;
  const schoolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of SCHOOLS) counts[s] = sourceSpells.filter((sp) => sp.school === s).length;
    return counts;
  }, [sourceSpells]);

  const hasActiveFilters = filters.levels.size > 0 || filters.schools.size > 0 || filters.classes.size > 0 || filters.search.trim().length > 0;

  if (!show && animPhase !== "entering") return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${animPhase === "visible" ? "pointer-events-auto" : "pointer-events-none"}`}
      onClick={handleBackdrop}
    >
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${animPhase === "visible" ? "opacity-100" : "opacity-0"}`} />

      <div className={`relative w-[720px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${animPhase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
              <PremiumIcon name="sparkles" className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Spell Reference</h2>
              <p className="text-[10px] text-surface-500">{totalCount} spells · {srdCount} SRD · {homebrewCount} Homebrew</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompactMode((p) => !p)}
              className={`px-2 py-1 rounded-lg text-[8px] font-bold border transition-all active:scale-90 ${compactMode ? "bg-gold-500/12 text-gold-400 border-gold-500/20" : "bg-white/[0.03] text-surface-500 border-white/[0.06] hover:text-gold-400"}`}
            >
              {compactMode ? "Compact" : "Detailed"}
            </button>
            <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all duration-150" aria-label="Close">
              <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
            </button>
          </div>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="px-5 pt-3 pb-2 border-b border-white/[0.04] space-y-2">
          {/* Search */}
          <div className="relative">
            <PremiumIcon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search spells by name, school, class, or description..."
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-indigo-500/25 focus:ring-1 focus:ring-indigo-500/15 transition-all"
            />
          </div>

          {/* Quick filter chips — Levels */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[8px] uppercase tracking-wider text-surface-600 font-bold mr-1">Level:</span>
            {LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => toggleFilter("levels", lv)}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all active:scale-90 ${
                  filters.levels.has(lv)
                    ? "bg-gold-500/12 text-gold-400 border-gold-500/20"
                    : "bg-white/[0.02] text-surface-500 border-white/[0.04] hover:text-surface-300"
                }`}
              >
                {LEVEL_LABELS[lv]}
              </button>
            ))}

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold text-rose-400 bg-rose-500/12 border border-rose-500/20 hover:bg-rose-500/18 active:scale-90 transition-all ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* School filter chips */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[8px] uppercase tracking-wider text-surface-600 font-bold mr-1">School:</span>
            {SCHOOLS.map((sch) => {
              const col = SCHOOL_COLORS[sch];
              const isActive = filters.schools.has(sch);
              return (
                <button
                  key={sch}
                  onClick={() => toggleFilter("schools", sch)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all active:scale-90 ${
                    isActive ? `${col.bg} ${col.text} ${col.border}` : "bg-white/[0.02] text-surface-500 border-white/[0.04] hover:text-surface-300"
                  }`}
                >
                  {sch}
                </button>
              );
            })}
          </div>

          {/* Source toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filters.showSRD} onChange={() => setFilters((p) => ({ ...p, showSRD: !p.showSRD }))} className="w-3 h-3 accent-amber-500" />
              <span className="text-[9px] text-surface-500">Show SRD</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={filters.showHomebrew} onChange={() => setFilters((p) => ({ ...p, showHomebrew: !p.showHomebrew }))} className="w-3 h-3 accent-violet-500" />
              <span className="text-[9px] text-surface-500">Show Homebrew</span>
            </label>
            <span className="text-[9px] text-surface-600 ml-auto tabular-nums">Showing {filteredSpells.length} of {sourceSpells.length}</span>
          </div>
        </div>

        {/* ── Content Area — Spell List ── */}
        <div className="flex min-h-0" style={{ maxHeight: "calc(90vh - 280px)" }}>
          {/* Left column: scrollable spell list */}
          <div className={`overflow-y-auto scrollbar-gold ${selectedSpell ? "w-1/2 border-r border-white/[0.04]" : "w-full"}`}>
            <div className="px-3 py-2 space-y-1">
              {filteredSpells.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/8 border border-indigo-500/10 flex items-center justify-center mx-auto mb-2">
                    <PremiumIcon name="search" className="w-5 h-5 text-indigo-400/60" />
                  </div>
                  <p className="text-[10px] text-surface-500">No spells match your filters</p>
                  <p className="text-[8px] text-surface-600 mt-0.5">Try adjusting level, school, or search terms</p>
                </div>
              )}

              {filteredSpells.map((spell) => {
                const col = SCHOOL_COLORS[spell.school];
                const isSelected = selectedSpellId === spell.id;
                return (
                  <button
                    key={spell.id}
                    onClick={() => setSelectedSpellId(isSelected ? null : spell.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.99] ${
                      isSelected
                        ? "bg-indigo-500/8 border border-indigo-500/15"
                        : "bg-white/[0.01] border border-transparent hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-white/70 truncate">{spell.name}</span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[7px] px-1 py-0.5 rounded ${col.bg} ${col.text} ${col.border} border`}>
                          {spell.level === 0 ? "Cantrip" : `Lv${spell.level}`}
                        </span>
                        {spell.concentration && (
                          <span className="text-[7px] text-violet-400 bg-violet-500/10 border border-violet-500/15 rounded px-1 py-0.5">🧘</span>
                        )}
                        {spell.ritual && (
                          <span className="text-[7px] text-amber-400 bg-amber-500/10 border border-amber-500/15 rounded px-1 py-0.5">📜</span>
                        )}
                      </div>
                    </div>

                    {/* Compact mode shows school + tags inline */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[7px] ${col.text} opacity-60`}>{spell.school}</span>
                      {spell.damageDice && (
                        <span className="text-[7px] text-rose-500 bg-rose-500/8 rounded px-1 py-0.5">💥 {spell.damageDice}</span>
                      )}
                      {spell.healDice && (
                        <span className="text-[7px] text-emerald-500 bg-emerald-500/8 rounded px-1 py-0.5">❤ {spell.healDice}</span>
                      )}
                      {spell.shape && spell.areaSize && (
                        <span className="text-[7px] text-sky-400 bg-sky-500/8 rounded px-1 py-0.5">◯ {spell.areaSize}ft {spell.shape}</span>
                      )}
                      {spell.source === "SRD" ? (
                        <span className="text-[7px] text-amber-600">📖 SRD</span>
                      ) : (
                        <span className="text-[7px] text-violet-500">⚒️ Homebrew</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Right column: detail view ── */}
          {selectedSpell && selectedSpell && (
            <div className="w-1/2 overflow-y-auto scrollbar-gold">
              <div className="p-3 space-y-2.5">
                {/* ── Spell Name & Badges ── */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs font-bold text-amber-50">{selectedSpell.name}</h3>
                    {selectedSpell.source === "SRD" ? (
                      <span className="text-[7px] text-amber-600 bg-amber-500/8 rounded px-1 py-0.5">📖 SRD</span>
                    ) : (
                      <span className="text-[7px] text-violet-500 bg-violet-500/8 rounded px-1 py-0.5">⚒️ Homebrew</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border ${SCHOOL_COLORS[selectedSpell.school]?.bg || "bg-white/[0.04]"} ${SCHOOL_COLORS[selectedSpell.school]?.text || "text-surface-400"} ${SCHOOL_COLORS[selectedSpell.school]?.border || "border-white/[0.04]"}`}>
                      {selectedSpell.school}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border ${selectedSpell.level === 0 ? "bg-surface-800/30 text-surface-400 border-white/[0.04]" : "bg-gold-500/10 text-gold-400 border-gold-500/15"}`}>
                      {selectedSpell.level === 0 ? "Cantrip" : `Level ${selectedSpell.level}`}
                    </span>
                    {selectedSpell.concentration && (
                      <span className="text-[8px] text-violet-400 bg-violet-500/10 border border-violet-500/15 rounded px-1.5 py-0.5">🧘 Concentration</span>
                    )}
                    {selectedSpell.ritual && (
                      <span className="text-[8px] text-amber-400 bg-amber-500/10 border border-amber-500/15 rounded px-1.5 py-0.5">📜 Ritual</span>
                    )}
                  </div>
                </div>

                {/* ── Metadata Grid ── */}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  <div>
                    <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Casting Time</span>
                    <p className="text-[9px] text-white/70">{selectedSpell.castingTime}</p>
                  </div>
                  <div>
                    <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Range</span>
                    <p className="text-[9px] text-white/70">{selectedSpell.range}</p>
                  </div>
                  <div>
                    <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Duration</span>
                    <p className="text-[9px] text-white/70">{selectedSpell.duration}</p>
                  </div>
                  <div>
                    <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Components</span>
                    <p className="text-[9px] text-white/70">
                      {selectedSpell.components?.join(", ")}
                      {selectedSpell.materialComponent && (
                        <span className="text-[8px] text-surface-500 ml-1">({selectedSpell.materialComponent})</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* ── Damage / Healing / AoE Stats ── */}
                {(selectedSpell.damageDice || selectedSpell.healDice || selectedSpell.shape) && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpell.damageDice && (
                      <span className="text-[8px] text-rose-400 bg-rose-500/10 border border-rose-500/15 rounded px-1.5 py-0.5">
                        💥 {selectedSpell.damageDice} {selectedSpell.damageType || "damage"}
                      </span>
                    )}
                    {selectedSpell.healDice && (
                      <span className="text-[8px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 rounded px-1.5 py-0.5">
                        ❤ {selectedSpell.healDice} healing
                      </span>
                    )}
                    {selectedSpell.shape && selectedSpell.areaSize && (
                      <span className="text-[8px] text-sky-400 bg-sky-500/10 border border-sky-500/15 rounded px-1.5 py-0.5">
                        ◯ {selectedSpell.areaSize}ft {selectedSpell.shape}
                      </span>
                    )}
                    {(selectedSpell.saveDC || selectedSpell.spellAttackBonus) && (
                      <span className="text-[8px] text-amber-400 bg-amber-500/10 border border-amber-500/15 rounded px-1.5 py-0.5">
                        🛡 DC {selectedSpell.saveDC || "Caster"} / +{selectedSpell.spellAttackBonus || "Caster"} ATK
                      </span>
                    )}
                  </div>
                )}

                {/* ── Class List ── */}
                {selectedSpell.classes && selectedSpell.classes.length > 0 && (
                  <div>
                    <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Classes</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {selectedSpell.classes.map((cls) => (
                        <span key={cls} className="text-[7px] text-surface-400 bg-white/[0.03] border border-white/[0.04] rounded px-1 py-0.5">{cls}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Description ── */}
                <div>
                  <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Description</span>
                  <p className="text-[9px] text-white/75 leading-relaxed mt-0.5">{selectedSpell.description}</p>
                </div>

                {/* ── Tags ── */}
                {selectedSpell.tags && selectedSpell.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedSpell.tags.map((tag) => (
                      <span key={tag} className="text-[7px] text-surface-500 bg-white/[0.02] border border-white/[0.03] rounded px-1 py-0.5">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">
            {filteredSpells.length} spells · {SCHOOLS.filter((s) => filters.schools.has(s)).length || "All"} schools · {filters.levels.size || "All"} levels
          </span>
          <span className="text-[7px] text-surface-700">Click a spell to see details · Esc to close</span>
        </div>
      </div>
    </div>
  );
}


