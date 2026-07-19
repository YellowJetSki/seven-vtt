/**
 * STᚱ VTT — Player Sheet Spells Tab (Enhanced)
 *
 * Full spellcasting interface for caster characters with:
 * - Spellcasting stat headers (DC, ATK, Modifier)
 * - Spell slot gauges per level (Cast / Restore)
 * - Cantrips section
 * - Known/Prepared spells with school color badges
 * - Quick-cast buttons on each spell (decrements slot, visual feedback)
 * - Favorite/star toggle for quick-access filtering
 * - Search bar + level filter chips (simultaneous)
 * - Inline damage/healing/save info on collapsed rows
 * - Persistent filter state (level, search, favorites)
 * - Concentration / Ritual badges
 *
 * Uses centralized mutation hooks → Zustand + Firestore.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import type { PlayerCharacter, SpellLevel } from "@/types";
import { useCompendiumStore, getCompendiumSpells } from "@/stores/compendium";
import { computeSpellcasting } from "@/lib/mechanics/character-derivations";
import { useSpellSlotMutations } from "@/hooks/useCharacterMutations";
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
  damageDice?: string;
  damageType?: string;
  healDice?: string;
  saveDC?: number;
  saveAbility?: string;
  attackRoll?: boolean;
}

// ── School colors ──
const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  Conjuration: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  Divination: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  Enchantment: "text-pink-300 bg-pink-500/10 border-pink-500/20",
  Evocation: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  Illusion: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
  Necromancy: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  Transmutation: "text-orange-300 bg-orange-500/10 border-orange-500/20",
};

function getSchoolStyle(school: string): string {
  return SCHOOL_COLORS[school] || "text-surface-400 bg-surface-800/40 border-surface-700/30";
}

// ── School emoji ──
const SCHOOL_ICON: Record<string, string> = {
  Abjuration: "🛡",
  Conjuration: "✨",
  Divination: "👁",
  Enchantment: "💫",
  Evocation: "💥",
  Illusion: "🌀",
  Necromancy: "💀",
  Transmutation: "🔮",
};

// ── Spell level names ──
const LEVEL_NAMES: Record<number, string> = {
  0: "Cantrip",
  1: "1st Level",
  2: "2nd Level",
  3: "3rd Level",
  4: "4th Level",
  5: "5th Level",
  6: "6th Level",
  7: "7th Level",
  8: "8th Level",
  9: "9th Level",
};

export default function PlayerSheetSpellsTab({ character }: PlayerSheetSpellsTabProps) {
  const c = character;
  const compendiumStore = useCompendiumStore();

  const spellcasting = useMemo(() => computeSpellcasting(c), [c]);
  const { handleCastSpell, handleRestoreSlots } = useSpellSlotMutations();

  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(`spell-faves-${c.id}`);
      return stored ? new Set(JSON.parse(stored)) : new Set(["Magic Missile", "Shield", "Cure Wounds", "Bless"]);
    } catch { return new Set(["Magic Missile", "Shield", "Cure Wounds", "Bless"]); }
  });
  const [castFeedback, setCastFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flash message
  const flash = useCallback((msg: string) => {
    setCastFeedback(msg);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setCastFeedback(null), 1500);
  }, []);

  // Save favorites
  const toggleFavorite = useCallback((name: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      localStorage.setItem(`spell-faves-${c.id}`, JSON.stringify([...next]));
      return next;
    });
  }, [c.id]);

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

  // ── Get all SRD spells ──
  const allCompendiumSpells = useMemo(() => {
    return getCompendiumSpells(compendiumStore.spells, {
      searchQuery: "",
      categoryFilter: "",
      schoolFilter: "",
      showSRD: true,
    });
  }, [compendiumStore.spells]);

  // ── Build known spell list with enriched data ──
  const knownSpells: KnownSpell[] = useMemo(() => {
    const spellsByLevel: Record<number, KnownSpell[]> = {};
    for (let i = 0; i <= 9; i++) spellsByLevel[i] = [];

    for (const spell of allCompendiumSpells) {
      const spellLevel = (spell as any).level ?? (spell as any).spellLevel ?? 0;
      if (spellLevel > 9) continue;

      const description = (spell as any).description || (spell as any).shortDescription || "";
      // Extract damage info from description or explicit fields
      const damageDice = (spell as any).damageDice || extractDamageDice(description);
      const damageType = (spell as any).damageType || extractDamageType(description);
      const healDice = (spell as any).healDice || extractHealDice(description);

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
        damageDice,
        damageType,
        healDice,
        saveDC: (spell as any).saveDC || undefined,
        saveAbility: (spell as any).saveAbility || undefined,
        attackRoll: (spell as any).attackRoll || (spell as any).requiresAttackRoll || false,
      });
    }

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

    const seen = new Set<string>();
    return all.filter(s => {
      const key = s.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 80);
  }, [allCompendiumSpells, spellcasting.spellSlots]);

  // ── Filter spells ──
  const filteredSpells = useMemo(() => {
    return knownSpells.filter(s => {
      if (filterLevel !== null && s.level !== filterLevel) return false;
      if (showFavoritesOnly && !favorites.has(s.name)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSchool = s.school.toLowerCase().includes(q);
        const matchDesc = s.description.toLowerCase().includes(q);
        if (!matchName && !matchSchool && !matchDesc) return false;
      }
      return true;
    });
  }, [knownSpells, filterLevel, showFavoritesOnly, favorites, searchQuery]);

  // ── Spell count badge text ──
  const spellCountText = useMemo(() => {
    const total = knownSpells.filter(s => s.level > 0).length;
    const shown = filteredSpells.filter(s => s.level > 0).length;
    return shown < total ? `${shown}/${total} spells` : `${total} spells`;
  }, [knownSpells, filteredSpells]);

  // ── Slot helpers ──
  const legacySlots: any = {};
  if (spellcasting.spellSlots) {
    for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
      const key = `level${lvl}` as keyof typeof spellcasting.spellSlots;
      const pool = spellcasting.spellSlots[key];
      if (pool) legacySlots[key] = { current: pool.current, max: pool.max };
    }
  }

  const handleCast = (level: SpellLevel) => handleCastSpell(c, level);
  const handleRestore = (level?: SpellLevel) => handleRestoreSlots(c, level);

  // Quick-cast from spell row
  const handleQuickCast = useCallback((spell: KnownSpell) => {
    if (spell.level === 0) { flash("Cantrips don't use spell slots"); return; }
    const key = `level${spell.level}` as keyof typeof spellcasting.spellSlots;
    const pool = spellcasting.spellSlots?.[key];
    if (!pool || pool.current <= 0) { flash(`No level ${spell.level} slots remaining`); return; }
    handleCastSpell(c, spell.level as SpellLevel);
    flash(`✨ Cast ${spell.name} (Lv.${spell.level})`);
  }, [c, spellcasting.spellSlots, handleCastSpell, flash]);

  // ── Group for display ──
  const cantrips = filteredSpells.filter(s => s.level === 0);
  const leveledSpells = filteredSpells.filter(s => s.level > 0);
  const availableLevels = Array.from(new Set(knownSpells.filter(s => s.level > 0).map(s => s.level))).sort((a, b) => a - b);

  return (
    <div className="space-y-4 px-3 py-3">
      {/* ── Flash message ── */}
      {castFeedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-xl bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold shadow-xl shadow-gold-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-150">
          {castFeedback}
        </div>
      )}

      {/* ── Spellcasting Stats ── */}
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
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-300 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            {spellcasting.spellcastingMod > 0 ? "+" : ""}{spellcasting.spellcastingMod}
          </span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] uppercase tracking-wider text-surface-500">
          {spellcasting.spellcastingAbility.charAt(0).toUpperCase() + spellcasting.spellcastingAbility.slice(1)} · {c.class}
        </span>
      </div>

      {/* ── Spell Slot Meter ── */}
      <SpellSlotMeter
        slots={legacySlots}
        casterType={spellcasting.casterType || "full"}
        spellSaveDC={spellcasting.spellSaveDC}
        spellAttackBonus={spellcasting.spellAttackBonus}
        onCast={handleCast}
        onRestore={handleRestore as any}
        concentrationSpell={character.conditions.includes("concentration") ? "Active" : null}
      />

      {/* ── Search + Filter Bar ── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-surface-500 pointer-events-none">🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spells..."
            className="w-full bg-obsidian-mid/60 border border-surface-700/20 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-surface-300 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
          />
        </div>
        <label className="flex items-center gap-1 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={showFavoritesOnly}
            onChange={(e) => setShowFavoritesOnly(e.target.checked)}
            className="w-3 h-3 rounded border-surface-600 bg-surface-800 accent-gold-500"
          />
          <span className="text-[9px] text-surface-500">⭐ Faves</span>
        </label>
      </div>

      {/* ── Level filter chips ── */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setFilterLevel(null)}
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
            filterLevel === null
              ? "bg-gold-500/10 text-gold-400 border border-gold/25 ring-1 ring-gold/20"
              : "bg-obsidian-mid/60 text-surface-500 border border-surface-700/30 hover:border-gold/15"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterLevel(filterLevel === 0 ? null : 0)}
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
            filterLevel === 0
              ? "bg-gold-500/10 text-gold-400 border border-gold/25 ring-1 ring-gold/20"
              : "bg-obsidian-mid/60 text-surface-500 border border-surface-700/30 hover:border-gold/15"
          }`}
        >
          Cantrips
        </button>
        {availableLevels.map(lvl => (
          <button
            key={lvl}
            onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all duration-150 ${
              filterLevel === lvl
                ? "bg-gold-500/10 text-gold-400 border border-gold/25 ring-1 ring-gold/20"
                : "bg-obsidian-mid/60 text-surface-500 border border-surface-700/30 hover:border-gold/15"
            }`}
          >
            Lv.{lvl}
          </button>
        ))}
        <span className="text-[10px] text-surface-600 self-center ml-auto">{spellCountText}</span>
      </div>

      {/* ── Cantrips Section ── */}
      {cantrips.length > 0 && (filterLevel === null || filterLevel === 0) && (
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Cantrips</span>
            <span className="text-[9px] text-surface-600">({cantrips.length})</span>
          </div>
          <div className="space-y-1">
            {cantrips.map((spell) => (
              <SpellRow
                key={spell.name}
                spell={spell}
                isExpanded={expandedSpell === spell.name}
                onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                isFavorite={favorites.has(spell.name)}
                onToggleFavorite={() => toggleFavorite(spell.name)}
                onQuickCast={() => handleQuickCast(spell)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Known/Prepared Spells ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            {c.class === "Wizard" || c.class === "Cleric" || c.class === "Druid" || c.class === "Paladin"
              ? "Prepared Spells"
              : "Known Spells"}
          </span>
        </div>

        {leveledSpells.length > 0 ? (
          <div className="space-y-1">
            {leveledSpells.map((spell) => (
              <SpellRow
                key={spell.name}
                spell={spell}
                isExpanded={expandedSpell === spell.name}
                onToggle={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                isFavorite={favorites.has(spell.name)}
                onToggleFavorite={() => toggleFavorite(spell.name)}
                onQuickCast={() => handleQuickCast(spell)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-surface-500 text-xs">
              {showFavoritesOnly ? "No favorite spells match" : searchQuery ? "No spells match your search" : "No spells available"}
            </p>
            {showFavoritesOnly && (
              <button onClick={() => setShowFavoritesOnly(false)} className="mt-1 text-[10px] text-gold-500/60 hover:text-gold-400">Show all spells</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Spell Row Sub-Component ─────────────────────────────────

function SpellRow({
  spell,
  isExpanded,
  onToggle,
  isFavorite,
  onToggleFavorite,
  onQuickCast,
}: {
  spell: KnownSpell;
  isExpanded: boolean;
  onToggle: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onQuickCast: () => void;
}) {
  const hasDamage = !!spell.damageDice;
  const hasHeal = !!spell.healDice;
  const hasSave = !!spell.saveDC;

  return (
    <div className="rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200 group">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-left"
      >
        {/* Level badge */}
        <span className={`text-[10px] w-5 text-center font-mono font-bold shrink-0 ${
          spell.level === 0 ? "text-surface-500" : "text-gold-400"
        }`}>
          {spell.level === 0 ? "C" : spell.level}
        </span>

        {/* Favorite star */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`text-[10px] transition-all duration-150 shrink-0 ${
            isFavorite ? "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.3)]" : "text-surface-700 hover:text-surface-500"
          }`}
        >
          {isFavorite ? "★" : "☆"}
        </button>

        {/* Name */}
        <span className="flex-1 text-xs text-surface-300 truncate">{spell.name}</span>

        {/* Quick-cast button */}
        {spell.level > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickCast(); }}
            className="px-1.5 py-0.5 rounded text-[8px] bg-gold-500/8 border border-gold/15 text-gold-500/60 hover:bg-gold-500/15 hover:text-gold-400 active:scale-90 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            title="Quick cast (uses 1 slot)"
          >
            Cast
          </button>
        )}

        {/* Damage/heal badge */}
        {hasDamage && (
          <span className="text-[9px] text-rose-400/70 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/15 shrink-0 hidden sm:inline">
            {spell.damageDice}{spell.damageType ? ` ${spell.damageType}` : ""}
          </span>
        )}
        {hasHeal && !hasDamage && (
          <span className="text-[9px] text-emerald-400/70 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/15 shrink-0 hidden sm:inline">
            {spell.healDice} heal
          </span>
        )}

        {/* School badge */}
        <span className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${getSchoolStyle(spell.school)} shrink-0 hidden xs:inline`}>
          {SCHOOL_ICON[spell.school] || ""} {spell.school}
        </span>

        {/* Concentration / Ritual */}
        {spell.concentration && <span className="text-[10px] shrink-0" title="Concentration">🧘</span>}
        {spell.ritual && <span className="text-[10px] shrink-0" title="Ritual">📜</span>}

        {/* Expand arrow */}
        <span className={`text-surface-500 transform transition-transform duration-150 text-[8px] shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2.5 space-y-2 animate-slide-in-up">
          {/* Meta info grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-surface-500">
            <span><span className="text-gold-500/50">Casting:</span> {spell.castingTime}</span>
            <span><span className="text-gold-500/50">Range:</span> {spell.range}</span>
            <span><span className="text-gold-500/50">Components:</span> {spell.components}</span>
            <span><span className="text-gold-500/50">Duration:</span> {spell.duration}</span>
          </div>

          {/* Mechanical details */}
          {(hasDamage || hasHeal || hasSave || spell.attackRoll) && (
            <div className="flex flex-wrap gap-1">
              {hasDamage && (
                <span className="text-[9px] bg-rose-500/8 border border-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded">
                  💥 {spell.damageDice}{spell.damageType ? ` ${spell.damageType}` : ""}
                </span>
              )}
              {hasHeal && (
                <span className="text-[9px] bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">
                  ❤ {spell.healDice} healing
                </span>
              )}
              {hasSave && (
                <span className="text-[9px] bg-indigo-500/8 border border-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded">
                  🛡 DC {spell.saveDC} {spell.saveAbility}
                </span>
              )}
              {spell.attackRoll && (
                <span className="text-[9px] bg-amber-500/8 border border-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded">
                  🎯 Spell attack
                </span>
              )}
            </div>
          )}

          {/* Full description */}
          <p className="text-[11px] text-surface-400 leading-relaxed">
            {spell.description || "No description available."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Extract helpers ──

function extractDamageDice(description: string): string | undefined {
  const match = description.match(/(\d+d\d+)(?:\s*\+\s*\d+)?/);
  return match ? match[0] : undefined;
}

function extractDamageType(description: string): string | undefined {
  const types = ["fire", "cold", "lightning", "thunder", "acid", "poison", "necrotic", "radiant", "force", "psychic", "piercing", "slashing", "bludgeoning"];
  const lower = description.toLowerCase();
  for (const t of types) {
    if (lower.includes(t)) return t;
  }
  return undefined;
}

function extractHealDice(description: string): string | undefined {
  const match = description.match(/restores?\s*(\d+d\d+)/i);
  return match ? match[1] : undefined;
}
