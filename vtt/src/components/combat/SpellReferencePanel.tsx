/* ── Spell Reference Panel ─────────────────────────────────────
 * Floating panel for DM quick-lookup of D&D 5e spells.
 * Collapsible into a small tab on the right edge of the screen.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import { useHomebrewStore } from "@/stores/homebrewStore";
import type { HomebrewSpell, SpellSchool, SpellClass } from "@/types/homebrew";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/* ── SRD Spell Compendium (abridged, commonly-used spells) ── */
const SRD_SPELLS: HomebrewSpell[] = [
  { id: "srd_acid_splash", name: "Acid Splash", level: 0, school: "conjuration", castingTime: "action", ritual: false, components: ["V", "S"], concentration: false, duration: "instantaneous", range: "60 feet", area: "5-foot-radius sphere", classes: ["sorcerer", "wizard"], description: "Two creatures within range must succeed on a DEX save or take 1d6 acid damage. Damage increases at 5th, 11th, and 17th level.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_bless", name: "Bless", level: 1, school: "enchantment", castingTime: "action", ritual: false, components: ["V", "S", "M"], materialComponent: "A sprinkling of holy water", concentration: true, duration: "concentration, up to 1 minute", range: "30 feet", classes: ["cleric", "paladin"], description: "Up to three creatures of your choice add 1d4 to attack rolls and saving throws for the duration.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_bane", name: "Bane", level: 1, school: "enchantment", castingTime: "action", ritual: false, components: ["V", "S", "M"], materialComponent: "A drop of blood", concentration: true, duration: "concentration, up to 1 minute", range: "30 feet", classes: ["bard", "cleric"], description: "Up to three creatures subtract 1d4 from attack rolls and saving throws for the duration.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_burning_hands", name: "Burning Hands", level: 1, school: "evocation", castingTime: "action", ritual: false, components: ["V", "S"], concentration: false, duration: "instantaneous", range: "self (15-foot cone)", classes: ["sorcerer", "wizard"], description: "Each creature in a 15-foot cone must succeed on a DEX save or take 3d6 fire damage.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_cure_wounds", name: "Cure Wounds", level: 1, school: "evocation", castingTime: "action", ritual: false, components: ["V", "S"], concentration: false, duration: "instantaneous", range: "touch", classes: ["bard", "cleric", "druid", "paladin", "ranger"], description: "One creature regains 1d8 + spellcasting modifier hit points.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_fireball", name: "Fireball", level: 3, school: "evocation", castingTime: "action", ritual: false, components: ["V", "S", "M"], materialComponent: "A tiny ball of bat guano and sulfur", concentration: false, duration: "instantaneous", range: "150 feet", area: "20-foot-radius sphere", classes: ["sorcerer", "wizard"], description: "Each creature in a 20-foot-radius sphere must succeed on a DEX save or take 8d6 fire damage.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_guidance", name: "Guidance", level: 0, school: "divination", castingTime: "action", ritual: false, components: ["V", "S"], concentration: true, duration: "concentration, up to 1 minute", range: "touch", classes: ["cleric", "druid"], description: "One creature adds 1d4 to one ability check of its choice before the spell ends.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_healing_word", name: "Healing Word", level: 1, school: "evocation", castingTime: "bonus action", ritual: false, components: ["V"], concentration: false, duration: "instantaneous", range: "60 feet", classes: ["bard", "cleric", "druid"], description: "One creature regains 1d4 + spellcasting modifier hit points.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_hold_person", name: "Hold Person", level: 2, school: "enchantment", castingTime: "action", ritual: false, components: ["V", "S", "M"], materialComponent: "A small, straight piece of iron", concentration: true, duration: "concentration, up to 1 minute", range: "60 feet", classes: ["bard", "cleric", "sorcerer", "warlock", "wizard"], description: "Choose a humanoid within range. It must succeed on a WIS save or be paralyzed for the duration. At the end of each turn, it repeats the save.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_mage_hand", name: "Mage Hand", level: 0, school: "conjuration", castingTime: "action", ritual: false, components: ["V", "S"], concentration: false, duration: "1 minute", range: "30 feet", classes: ["bard", "sorcerer", "warlock", "wizard"], description: "A spectral, floating hand appears that can manipulate objects, open unlocked doors, and stow items. It can't attack or activate magic items.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_misty_step", name: "Misty Step", level: 2, school: "conjuration", castingTime: "bonus action", ritual: false, components: ["V"], concentration: false, duration: "instantaneous", range: "self", classes: ["sorcerer", "warlock", "wizard"], description: "Briefly surrounded by silver mist, you teleport up to 30 feet to an unoccupied space you can see.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_shield", name: "Shield", level: 1, school: "abjuration", castingTime: "reaction", ritual: false, components: ["V", "S"], concentration: false, duration: "1 round", range: "self", classes: ["sorcerer", "wizard"], description: "An invisible barrier of magical force appears and protects you. Until your next turn, you gain +5 AC, and you take no damage from magic missile.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_sleep", name: "Sleep", level: 1, school: "enchantment", castingTime: "action", ritual: false, components: ["V", "S", "M"], materialComponent: "A pinch of fine sand, rose petals, or a cricket", concentration: false, duration: "1 minute", range: "90 feet", area: "20-foot-radius sphere", classes: ["bard", "sorcerer", "warlock", "wizard"], description: "Roll 5d8. Creatures in the area are affected in ascending order of current HP until the total is reached. Unaffected creatures are immune.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_spiritual_weapon", name: "Spiritual Weapon", level: 2, school: "evocation", castingTime: "bonus action", ritual: false, components: ["V", "S"], concentration: false, duration: "1 minute", range: "60 feet", classes: ["cleric"], description: "A floating weapon appears and attacks a creature you can see within range. Make a melee spell attack. On hit, it deals 1d8 + spellcasting modifier force damage.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
  { id: "srd_thorn_whip", name: "Thorn Whip", level: 0, school: "transmutation", castingTime: "action", ritual: false, components: ["V", "S", "M"], materialComponent: "The stem of a plant with thorns", concentration: false, duration: "instantaneous", range: "30 feet", classes: ["druid"], description: "Make a melee spell attack. On hit, the creature takes 1d6 piercing damage and is pulled 10 feet toward you.", isHomebrew: false, source: "SRD", tags: [], createdAt: Date.now(), updatedAt: Date.now() },
];

/* ── Component ───────────────────────────────────────────────── */

export function SpellReferencePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [schoolFilter, setSchoolFilter] = useState<SpellSchool | null>(null);
  const [classFilter, _setClassFilter] = useState<SpellClass | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<HomebrewSpell | null>(null);
  const [showHomebrew, setShowHomebrew] = useState(false);

  const homebrewSpells = useHomebrewStore((s) => s.spells);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const allSpells = useMemo(() => {
    const srd = showHomebrew ? [] : [...SRD_SPELLS];
    const hb = showHomebrew ? homebrewSpells : [];
    return [...srd, ...hb].sort((a, b) => a.name.localeCompare(b.name));
  }, [homebrewSpells, showHomebrew]);

  const filteredSpells = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allSpells.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.school.toLowerCase().includes(q)) return false;
      if (levelFilter !== null && s.level !== levelFilter) return false;
      if (schoolFilter && s.school !== schoolFilter) return false;
      if (classFilter && !s.classes.includes(classFilter)) return false;
      return true;
    });
  }, [allSpells, searchQuery, levelFilter, schoolFilter, classFilter]);

  const toggleOpen = useCallback(() => setIsOpen((o) => !o), []);

  const spellLevels = Array.from({ length: 10 }, (_, i) => i);

  const schoolColors: Record<SpellSchool, string> = {
    abjuration: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    conjuration: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    divination: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    enchantment: "text-pink-400 border-pink-500/30 bg-pink-500/10",
    evocation: "text-red-400 border-red-500/30 bg-red-500/10",
    illusion: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    necromancy: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    transmutation: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  };

  /* ── Floating Panel ── */
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={toggleOpen}
        className="fixed right-0 top-1/3 z-40 flex items-center gap-2 rounded-l-lg border border-r-0 border-surface-700 bg-surface-850 px-3 py-3 text-xs font-medium text-surface-300 shadow-lg transition-colors hover:bg-surface-800 hover:text-accent-300"
        title="Spell Reference"
      >
        <span className="text-base">📖</span>
        <span className={isMobile ? "hidden" : "block"}>{isOpen ? "Close" : "Spells"}</span>
      </button>

      {/* Overlay (mobile) */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={toggleOpen} />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-surface-700 bg-surface-850 shadow-2xl transition-all duration-300 ${
          isOpen ? "w-full sm:w-[420px] md:w-[480px] translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
          <h3 className="text-sm font-semibold text-surface-100">📖 Spell Reference</h3>
          <button
            onClick={toggleOpen}
            className="flex h-7 w-7 items-center justify-center rounded-md text-surface-400 hover:bg-surface-700 hover:text-surface-200"
          >
            ✕
          </button>
        </div>

        {/* Search + Filters */}
        <div className="border-b border-surface-700 p-3 space-y-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spells..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            autoFocus
          />

          {/* Level filter */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setLevelFilter(null)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                levelFilter === null ? "bg-accent-500/15 text-accent-300" : "text-surface-500 hover:text-surface-300"
              }`}
            >
              All
            </button>
            {spellLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(levelFilter === lvl ? null : lvl)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                  levelFilter === lvl ? "bg-accent-500/15 text-accent-300" : "text-surface-500 hover:text-surface-300"
                }`}
              >
                {lvl === 0 ? "Cantrip" : `${lvl}`}
              </button>
            ))}
          </div>

          {/* School + Homebrew toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {(["abjuration", "conjuration", "evocation", "enchantment", "illusion", "necromancy", "transmutation", "divination"] as SpellSchool[]).map((school) => (
                <button
                  key={school}
                  onClick={() => setSchoolFilter(schoolFilter === school ? null : school)}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize transition-colors ${
                    schoolFilter === school ? schoolColors[school] : "text-surface-500 border border-surface-700 bg-surface-800"
                  }`}
                >
                  {school.slice(0, 4)}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-1.5 text-[11px] text-surface-400 cursor-pointer shrink-0 ml-2">
              <input
                type="checkbox"
                checked={showHomebrew}
                onChange={(e) => setShowHomebrew(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-surface-600 bg-surface-800 accent-mage-500"
              />
              Homebrew
            </label>
          </div>
        </div>

        {/* Spell List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredSpells.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-surface-500">
              <span className="text-3xl mb-2">🔍</span>
              <p className="text-sm">No spells match your search.</p>
            </div>
          ) : (
            filteredSpells.map((spell) => (
              <button
                key={spell.id}
                onClick={() => setSelectedSpell(spell)}
                className="w-full text-left rounded-lg border border-surface-700 bg-surface-800 p-3 transition-colors hover:border-accent-500/30 hover:bg-surface-700"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-surface-200">{spell.name}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${schoolColors[spell.school]}`}>
                    {spell.school.slice(0, 4).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-surface-400">
                    {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}
                  </span>
                  <span className="text-surface-600">·</span>
                  <span className="text-xs text-surface-400 capitalize">{spell.school}</span>
                  {spell.ritual && (
                    <>
                      <span className="text-surface-600">·</span>
                      <span className="text-[10px] text-divine-400">Ritual</span>
                    </>
                  )}
                  {spell.concentration && (
                    <>
                      <span className="text-surface-600">·</span>
                      <span className="text-[10px] text-mage-400">Conc</span>
                    </>
                  )}
                  {!spell.isHomebrew ? null : (
                    <>
                      <span className="text-surface-600">·</span>
                      <span className="text-[10px] text-accent-400">Homebrew</span>
                    </>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail Panel (inline) */}
        {selectedSpell && (
          <div className="border-t border-surface-700 p-4 space-y-3 max-h-64 overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-surface-100">{selectedSpell.name}</h4>
                <p className="text-xs text-surface-400">
                  {selectedSpell.level === 0 ? "Cantrip" : `Level ${selectedSpell.level}`} · {selectedSpell.school.charAt(0).toUpperCase() + selectedSpell.school.slice(1)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSpell(null)}
                className="text-surface-500 hover:text-surface-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded bg-surface-800 px-2 py-1">
                <span className="text-surface-500">Casting Time</span>
                <p className="text-surface-200 font-medium">{selectedSpell.castingTime}</p>
              </div>
              <div className="rounded bg-surface-800 px-2 py-1">
                <span className="text-surface-500">Range</span>
                <p className="text-surface-200 font-medium">{selectedSpell.range}</p>
              </div>
              <div className="rounded bg-surface-800 px-2 py-1">
                <span className="text-surface-500">Duration</span>
                <p className="text-surface-200 font-medium">{selectedSpell.duration}</p>
              </div>
              <div className="rounded bg-surface-800 px-2 py-1">
                <span className="text-surface-500">Components</span>
                <p className="text-surface-200 font-medium">
                  {selectedSpell.components.join(", ")}
                  {selectedSpell.materialComponent && ` (${selectedSpell.materialComponent})`}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-surface-300 leading-relaxed">{selectedSpell.description}</p>
              {selectedSpell.atHigherLevels && (
                <p className="mt-2 text-xs text-accent-400 italic">{selectedSpell.atHigherLevels}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {selectedSpell.classes.map((cls) => (
                <span key={cls} className="rounded-full bg-surface-800 px-2 py-0.5 text-[10px] text-surface-400 capitalize">
                  {cls}
                </span>
              ))}
              {selectedSpell.tags.length > 0 && selectedSpell.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] text-accent-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-surface-700 px-4 py-2 text-center">
          <p className="text-[10px] text-surface-500">
            {allSpells.length} spells · {showHomebrew ? "Homebrew" : "SRD"} view
          </p>
        </div>
      </div>
    </>
  );
}
