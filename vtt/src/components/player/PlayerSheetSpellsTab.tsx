/**
 * STᚱ VTT — Player Sheet Spells Tab
 *
 * Full spellcasting interface for caster characters.
 * Shows:
 * - Spellcasting stat (DC, ATK bonus, ability)
 * - Spell slot gauges per level (Cast/Restore)
 * - Known/prepared spells list (from SRD compendium)
 * - Cantrips section
 * - Concentration indicator
 */

import { useState, useCallback, useMemo } from "react";
import type { PlayerCharacter, SpellLevel, SpellSlotsFull, CasterType } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCompendiumStore, getCompendiumSpells } from "@/stores/compendium";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import { castSpell, restoreSlots } from "@/lib/mechanics/spell-slot-engine";
import SpellSlotMeter from "./SpellSlotMeter";

interface PlayerSheetSpellsTabProps {
  character: PlayerCharacter;
}

interface KnownSpell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  ritual: boolean;
  concentration: boolean;
}

export default function PlayerSheetSpellsTab({ character }: PlayerSheetSpellsTabProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const compendiumStore = useCompendiumStore();

  const spellcasting = useMemo(() => computeSpellcasting(c), [c]);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  if (!spellcasting.isCaster || !spellcasting.spellSlots) {
    return (
      <div className="space-y-4 px-3 py-3">
        <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-6 text-center">
          <span className="text-3xl block mb-2">📖</span>
          <p className="text-sm text-surface-400">This character does not have spellcasting ability.</p>
          <p className="text-xs text-surface-600 mt-1">No spell slots available for this class.</p>
        </div>
      </div>
    );
  }

  // Get known spells from compendium by level
  const allCompendiumSpells = useMemo(() => {
    return getCompendiumSpells(compendiumStore.spells, {
      searchQuery: "",
      categoryFilter: "",
      schoolFilter: "",
      showSRD: true,
    });
  }, [compendiumStore.spells]);

  // Build known spell list — for demo, use SRD spells appropriate for class level
  // In production, this would come from the character's prepared/known spells
  const knownSpells: KnownSpell[] = useMemo(() => {
    const primaryClass = c.classes[0]?.name?.toLowerCase() || "";
    // Filter spells for this class level
    const level = c.level;

    // Get all SRD spells, group by level
    const spellsByLevel: Record<number, KnownSpell[]> = {};
    for (let i = 0; i <= 9; i++) spellsByLevel[i] = [];

    for (const spell of allCompendiumSpells) {
      const spellLevel = (spell as any).level ?? (spell as any).spellLevel ?? 0;
      if (spellLevel <= 9) {
        spellsByLevel[spellLevel].push({
          name: spell.name,
          level: spellLevel,
          school: (spell as any).school || "Unknown",
          castingTime: (spell as any).castingTime || "1 action",
          range: (spell as any).range || "Self",
          components: (spell as any).components || "V, S",
          duration: (spell as any).duration || "Instantaneous",
          description: (spell as any).description || (spell as any).shortDescription || "",
          ritual: (spell as any).ritual || false,
          concentration: (spell as any).requiresConcentration || (spell as any).concentration || false,
        });
      }
    }

    // Return all spells the character could possibly know at this level
    // For simplicity and demo purposes, show all spells up to the max slot level
    const maxSlotLevel = spellcasting.spellSlots
      ? Object.entries(spellcasting.spellSlots)
          .filter(([, v]) => (v as any).max > 0)
          .map(([k]) => parseInt(k.replace("level", ""), 10))
          .reduce((a, b) => Math.max(a, b), 0)
      : 0;

    const all: KnownSpell[] = [];
    for (let lvl = 0; lvl <= maxSlotLevel; lvl++) {
      all.push(...(spellsByLevel[lvl] || []));
    }

    // Deduplicate by name
    const seen = new Set<string>();
    return all.filter(s => {
      const key = s.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 50); // Limit to 50 for UI sanity
  }, [allCompendiumSpells, c.classes, c.level, spellcasting.spellSlots]);

  // Handle casting a spell
  const handleCast = useCallback((level: SpellLevel) => {
    if (!spellcasting.spellSlots) return;
    const result = castSpell(spellcasting.spellSlots, level);
    if (result.success && character.spellSlots) {
      // Update the stored spell slots
      const newSlots = { ...character.spellSlots };
      const key = `level${level}` as keyof typeof newSlots;
      const stored = newSlots[key];
      if (stored) {
        (newSlots as any)[key] = { ...stored, current: Math.max(0, stored.current - 1) };
        updateCharacter(c.id, { spellSlots: newSlots });
      }
    }
  }, [spellcasting.spellSlots, character.spellSlots, updateCharacter, c.id]);

  const handleRestore = useCallback((level?: SpellLevel) => {
    if (!spellcasting.spellSlots) return;
    const newSlots = level
      ? { ...spellcasting.spellSlots, [`level${level}`]: { ...spellcasting.spellSlots[`level${level}` as keyof SpellSlotsFull], current: spellcasting.spellSlots[`level${level}` as keyof SpellSlotsFull].max } }
      : restoreSlots(spellcasting.spellSlots);
    // Map back to character format
    const mappedSlots: any = {};
    for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
      const key = `level${lvl}` as keyof SpellSlotsFull;
      const pool = newSlots[key];
      if (pool) {
        mappedSlots[key] = { current: pool.current, max: pool.max };
      }
    }
    updateCharacter(c.id, { spellSlots: mappedSlots });
  }, [spellcasting.spellSlots, updateCharacter, c.id]);

  // Convert SpellSlotsFull to legacy SpellSlots format for SpellSlotMeter
  const legacySlots: any = {};
  if (spellcasting.spellSlots) {
    for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
      const key = `level${lvl}` as keyof SpellSlotsFull;
      const pool = spellcasting.spellSlots[key];
      if (pool) {
        legacySlots[key] = { current: pool.current, max: pool.max };
      }
    }
  }

  // Group known spells by level
  const spellsByLevel: Record<number, KnownSpell[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [] };
  for (const spell of knownSpells) {
    const lvl = spell.level;
    if (!spellsByLevel[lvl]) spellsByLevel[lvl] = [];
    spellsByLevel[lvl].push(spell);
  }

  const availableLevels = Object.entries(spellsByLevel)
    .filter(([, spells]) => spells.length > 0)
    .map(([level]) => parseInt(level, 10))
    .sort((a, b) => a - b);

  const filteredSpells = filterLevel !== null
    ? spellsByLevel[filterLevel] || []
    : knownSpells;

  return (
    <div className="space-y-4 px-3 py-3">
      {/* Spellcasting Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">DC</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-cyan-300 drop-shadow-[0_0_4px_rgba(6,182,212,0.1)]">
            {spellcasting.spellSaveDC}
          </span>
        </div>
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">ATK</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-300 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            +{spellcasting.spellAttackBonus}
          </span>
        </div>
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Mod</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-mage-300 drop-shadow-[0_0_4px_rgba(99,102,241,0.06)]">
            {spellcasting.spellcastingMod > 0 ? "+" : ""}{spellcasting.spellcastingMod}
          </span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] uppercase tracking-wider text-surface-500">
          {spellcasting.spellcastingAbility.charAt(0).toUpperCase() + spellcasting.spellcastingAbility.slice(1)} · {c.class}
        </span>
      </div>

      {/* Spell Slot Meter */}
      <SpellSlotMeter
        slots={legacySlots}
        casterType={spellcasting.casterType || "full"}
        spellSaveDC={spellcasting.spellSaveDC}
        spellAttackBonus={spellcasting.spellAttackBonus}
        onCast={handleCast}
        onRestore={handleRestore as any}
        concentrationSpell={character.conditions.includes("concentration") ? "Active" : null}
      />

      {/* Cantrips Section */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">
          Cantrips
        </span>
        <div className="space-y-1">
          {(spellsByLevel[0]?.slice(0, 6) || []).map((spell) => (
            <SpellRow
              key={spell.name}
              spell={spell}
              isExpanded={expandedSpell === spell.name}
              onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
            />
          ))}
          {(!spellsByLevel[0] || spellsByLevel[0].length === 0) && (
            <p className="text-xs text-surface-500 italic">No cantrips data available</p>
          )}
        </div>
      </div>

      {/* Known/Prepared Spells Section */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            {c.class === "Wizard" || c.class === "Cleric" || c.class === "Druid" || c.class === "Paladin"
              ? "Prepared Spells"
              : "Known Spells"}
          </span>
          <span className="text-xs text-surface-500">
            {knownSpells.filter(s => s.level > 0).length} spells
          </span>
        </div>

        {/* Level filter chips */}
        <div className="flex flex-wrap gap-1 mb-2">
          <button
            onClick={() => setFilterLevel(null)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
              filterLevel === null
                ? "bg-gold-500/10 text-gold-400 border border-gold/25"
                : "bg-obsidian-mid/60 text-surface-500 border border-surface-700/30 hover:border-gold/15"
            }`}
          >
            All
          </button>
          {availableLevels.filter(l => l > 0).map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
                filterLevel === lvl
                  ? "bg-gold-500/10 text-gold-400 border border-gold/25"
                  : "bg-obsidian-mid/60 text-surface-500 border border-surface-700/30 hover:border-gold/15"
              }`}
            >
              Lv.{lvl}
            </button>
          ))}
        </div>

        {/* Spell list */}
        <div className="space-y-1">
          {filteredSpells.filter(s => s.level > 0).map((spell) => (
            <SpellRow
              key={spell.name}
              spell={spell}
              isExpanded={expandedSpell === spell.name}
              onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
            />
          ))}
          {filteredSpells.filter(s => s.level > 0).length === 0 && (
            <p className="text-xs text-surface-500 italic">No spells match this filter</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Spell Row Sub-Component ─────────────────────────────────

function SpellRow({
  spell,
  isExpanded,
  onToggle,
}: {
  spell: KnownSpell;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className={`text-[10px] w-5 text-center font-mono font-bold ${
          spell.level === 0 ? "text-surface-500" : "text-gold-400"
        }`}>
          {spell.level === 0 ? "C" : spell.level}
        </span>
        <span className="flex-1 text-xs text-surface-300 truncate">{spell.name}</span>
        <span className="text-[9px] text-surface-500 hidden xs:inline">{spell.school}</span>
        {spell.concentration && (
          <span className="text-[10px]" title="Concentration">🧘</span>
        )}
        {spell.ritual && (
          <span className="text-[10px]" title="Ritual">📜</span>
        )}
        <span className={`text-surface-500 transform transition-transform duration-150 ${isExpanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2 space-y-1 animate-slide-in-up">
          <div className="grid grid-cols-2 gap-1 text-[10px] text-surface-500">
            <span><span className="text-gold-500/50">Casting:</span> {spell.castingTime}</span>
            <span><span className="text-gold-500/50">Range:</span> {spell.range}</span>
            <span><span className="text-gold-500/50">Components:</span> {spell.components}</span>
            <span><span className="text-gold-500/50">Duration:</span> {spell.duration}</span>
          </div>
          <p className="text-[11px] text-surface-400 leading-relaxed">
            {spell.description || "No description available."}
          </p>
        </div>
      )}
    </div>
  );
}
