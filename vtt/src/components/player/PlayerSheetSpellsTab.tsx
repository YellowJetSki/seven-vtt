/**
 * STᚱ VTT — Player Sheet Spells Tab (Refactored Orchestrator)
 *
 * REFACTOR (Sprint 7): Monolith of 615 lines broken into 6 reusable sub-components:
 *   - SpellcastingStatsHeader → DC/ATK/Mod stat cards
 *   - SpellFilterBar → Search + faves toggle + level chips
 *   - SpellRowCard → Collapsible spell row with quick-cast
 *   - SpellRowMetaDisplay → Expanded metadata section
 *   - SpellPrepareToggle → Prepared/unprepared toggle
 *   - useSpellFavorites → localStorage-backed favorites hook
 *   - lib/spell-utils → Constants, types, extractors
 *
 * Orchestrator now only handles: state wiring, data building, filtering.
 * All rendering delegated to sub-components.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import type { PlayerCharacter, SpellLevel, SpellSlotsFull } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCompendiumStore, getCompendiumSpells } from "@/stores/compendium";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import { useSpellSlotMutations } from "@/hooks/useCharacterMutations";
import type { KnownSpell } from "@/lib/spell-utils";
import { extractDamageDice, extractDamageType, extractHealDice } from "@/lib/spell-utils";
import { useSpellFavorites } from "@/hooks/useSpellFavorites";
import SpellSlotMeter from "./SpellSlotMeter";
import SpellcastingStatsHeader from "./SpellcastingStatsHeader";
import SpellFilterBar from "./SpellFilterBar";
import SpellRowCard from "./SpellRowCard";

interface PlayerSheetSpellsTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetSpellsTab({ character }: PlayerSheetSpellsTabProps) {
  const c = character;
  const compendiumStore = useCompendiumStore();
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const spellcasting = useMemo(() => computeSpellcasting(c), [c]);
  const { handleCastSpell, handleRestoreSlots } = useSpellSlotMutations();
  const { favorites, toggleFavorite } = useSpellFavorites(c.id);

  // ── Filter state ──
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ── Flash message ──
  const [castFeedback, setCastFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((msg: string) => {
    setCastFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setCastFeedback(null), 1500);
  }, []);

  // ── Prepared spells ──
  const preparedSpells: string[] = c.preparedSpells || [];

  const handleTogglePrepare = useCallback(
    (spellName: string, prepare: boolean) => {
      const current = c.preparedSpells || [];
      const next = prepare
        ? [...current, spellName]
        : current.filter((s) => s !== spellName);
      updateCharacter(c.id, { preparedSpells: next });
    },
    [c.id, c.preparedSpells, updateCharacter]
  );

  // ── Spell data ──
  const allCompendiumSpells = useMemo(
    () =>
      getCompendiumSpells(compendiumStore.spells, {
        searchQuery: "",
        categoryFilter: "",
        schoolFilter: "",
        showSRD: true,
      }),
    [compendiumStore.spells]
  );

  const knownSpells: KnownSpell[] = useMemo(() => {
    if (!spellcasting.spellSlots) return [];

    const spellsByLevel: Record<number, KnownSpell[]> = {};
    for (let i = 0; i <= 9; i++) spellsByLevel[i] = [];

    for (const spell of allCompendiumSpells) {
      const spellLevel = (spell as any).level ?? (spell as any).spellLevel ?? 0;
      if (spellLevel > 9) continue;
      const description = (spell as any).description || (spell as any).shortDescription || "";

      spellsByLevel[spellLevel].push({
        name: spell.name,
        level: spellLevel,
        school: (spell as any).school || "Unknown",
        castingTime: (spell as any).castingTime || "1 action",
        range: (spell as any).range || "Self",
        components: (spell as any).components || "V, S",
        duration: (spell as any).duration || "Instantaneous",
        description,
        ritual: (spell as any).ritual || false,
        concentration: (spell as any).requiresConcentration || (spell as any).concentration || false,
        damageDice: (spell as any).damageDice || extractDamageDice(description),
        damageType: (spell as any).damageType || extractDamageType(description),
        healDice: (spell as any).healDice || extractHealDice(description),
        saveDC: (spell as any).saveDC ?? undefined,
        saveAbility: (spell as any).saveAbility ?? undefined,
        attackRoll: (spell as any).attackRoll || (spell as any).requiresAttackRoll || false,
      });
    }

    const maxSlotLevel = Object.entries(spellcasting.spellSlots)
      .filter(([, v]) => (v as any).max > 0)
      .map(([k]) => parseInt(k.replace("level", ""), 10))
      .reduce((a, b) => Math.max(a, b), 0);

    const all: KnownSpell[] = [];
    for (let lvl = 0; lvl <= maxSlotLevel; lvl++) {
      all.push(...(spellsByLevel[lvl] || []));
    }

    const seen = new Set<string>();
    return all
      .filter((s) => {
        const key = s.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 80);
  }, [allCompendiumSpells, spellcasting.spellSlots]);

  // ── Filter ──
  const filteredSpells = useMemo(
    () =>
      knownSpells.filter((s) => {
        if (filterLevel !== null && s.level !== filterLevel) return false;
        if (showFavoritesOnly && !favorites.has(s.name)) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (
            !s.name.toLowerCase().includes(q) &&
            !s.school.toLowerCase().includes(q) &&
            !s.description.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    [knownSpells, filterLevel, showFavoritesOnly, favorites, searchQuery]
  );

  const cantrips = useMemo(() => filteredSpells.filter((s) => s.level === 0), [filteredSpells]);
  const leveledSpells = useMemo(() => filteredSpells.filter((s) => s.level > 0), [filteredSpells]);
  const availableLevels = useMemo(
    () => [...new Set(knownSpells.filter((s) => s.level > 0).map((s) => s.level))].sort((a, b) => a - b),
    [knownSpells]
  );

  const spellCountText = useMemo(() => {
    const total = knownSpells.filter((s) => s.level > 0).length;
    const shown = filteredSpells.filter((s) => s.level > 0).length;
    return shown < total ? `${shown}/${total} spells` : `${total} spells`;
  }, [knownSpells, filteredSpells]);

  // ── Slot helpers ──
  const legacySlots: SpellSlotsFull = useMemo(() => {
    const slots = spellcasting.spellSlots || ({} as SpellSlotsFull);
    // Build a complete SpellSlotsFull (all 9 levels, zeroed if null)
    const result: SpellSlotsFull = {} as SpellSlotsFull;
    for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
      const key = `level${lvl}` as keyof SpellSlotsFull;
      result[key] = slots[key] || { level: lvl, current: 0, max: 0 };
    }
    return result;
  }, [spellcasting.spellSlots]);

  const handleCast = (level: SpellLevel) => handleCastSpell(c, level);
  const handleRestore = (level?: SpellLevel) => handleRestoreSlots(c, level);

  const handleQuickCast = useCallback(
    (spell: KnownSpell) => {
      if (spell.level === 0) {
        flash("Cantrips don't use spell slots");
        return;
      }
      const slots = spellcasting.spellSlots;
      if (!slots) {
        flash("No spell slots available");
        return;
      }
      const key = `level${spell.level}` as keyof SpellSlotsFull;
      const pool = slots[key];
      if (!pool || pool.current <= 0) {
        flash(`No level ${spell.level} slots remaining`);
        return;
      }
      handleCastSpell(c, spell.level as SpellLevel);
      flash(`✨ Cast ${spell.name} (Lv.${spell.level})`);
    },
    [c, spellcasting.spellSlots, handleCastSpell, flash]
  );

  // ── Render ──
  if (!spellcasting.isCaster || !spellcasting.spellSlots) {
    return (
      <div className="space-y-4 px-3 py-3">
        <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-8 overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
          <div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#14151f]/80 to-[#0f1019]/90 border border-gold/10 flex items-center justify-center mx-auto mb-3"
            style={{ animation: "float-arcane 3s ease-in-out infinite" }}
          >
            <span className="text-xl">📖</span>
          </div>
          <h3 className="text-xs font-bold text-gold-400 mb-1.5">No Spellcasting Ability</h3>
          <p className="text-[10px] text-surface-500 max-w-[200px] mx-auto leading-relaxed">
            This character does not have spellcasting ability for their class.
          </p>
          <div className="flex items-center gap-2 mt-4 justify-center">
            <div className="w-6 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
            <span className="text-[8px] text-gold-500/40 font-mono">✦ ᚱ ✦</span>
            <div className="w-6 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-3 py-3">
      {/* Flash message — premium toast */}
      {castFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-xl bg-gradient-to-b from-gold-500/12 to-gold-500/5 border border-gold/20 text-gold-400 text-[11px] font-semibold shadow-xl shadow-black/40 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {castFeedback}
        </div>
      )}

      {/* Spellcasting Stats */}
      <SpellcastingStatsHeader
        spellSaveDC={spellcasting.spellSaveDC}
        spellAttackBonus={spellcasting.spellAttackBonus}
        spellcastingMod={spellcasting.spellcastingMod}
        spellcastingAbility={spellcasting.spellcastingAbility}
        characterClass={c.class}
      />

      {/* Spell Slot Meter */}
      <SpellSlotMeter
        slots={legacySlots}
        casterType={spellcasting.casterType || "full"}
        spellSaveDC={spellcasting.spellSaveDC}
        spellAttackBonus={spellcasting.spellAttackBonus}
        onCast={handleCast}
        onRestore={handleRestore}
        concentrationSpell={character.conditions.includes("concentration") ? "Active" : null}
      />

      {/* Filter Bar */}
      <SpellFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showFavoritesOnly={showFavoritesOnly}
        onFavoritesToggle={setShowFavoritesOnly}
        filterLevel={filterLevel}
        onFilterLevel={setFilterLevel}
        availableLevels={availableLevels}
        spellCountText={spellCountText}
      />

      {/* Cantrips Section */}
      {cantrips.length > 0 && (filterLevel === null || filterLevel === 0) && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Cantrips</span>
            <span className="text-[9px] text-surface-600">({cantrips.length})</span>
          </div>
          <div className="space-y-1">
            {cantrips.map((spell) => (
              <SpellRowCard
                key={spell.name}
                spell={spell}
                isExpanded={expandedSpell === spell.name}
                onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                isFavorite={favorites.has(spell.name)}
                onToggleFavorite={() => toggleFavorite(spell.name)}
                onQuickCast={() => handleQuickCast(spell)}
                isPrepared={true}
                onTogglePrepare={(prep) => handleTogglePrepare(spell.name, prep)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Prepared / Known Spells */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            {["Wizard", "Cleric", "Druid", "Paladin"].includes(c.class)
              ? "Prepared Spells"
              : "Known Spells"}
          </span>
        </div>

        {leveledSpells.length > 0 ? (
          <div className="space-y-1">
            {leveledSpells.map((spell) => (
              <SpellRowCard
                key={spell.name}
                spell={spell}
                isExpanded={expandedSpell === spell.name}
                onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                isFavorite={favorites.has(spell.name)}
                onToggleFavorite={() => toggleFavorite(spell.name)}
                onQuickCast={() => handleQuickCast(spell)}
                isPrepared={preparedSpells.includes(spell.name)}
                onTogglePrepare={(prep) => handleTogglePrepare(spell.name, prep)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-surface-500 text-xs">
              {showFavoritesOnly
                ? "No favorite spells match"
                : searchQuery
                  ? "No spells match your search"
                  : "No spells available"}
            </p>
            {showFavoritesOnly && (
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="mt-1 text-[10px] text-gold-500/60 hover:text-gold-400"
              >
                Show all spells
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
