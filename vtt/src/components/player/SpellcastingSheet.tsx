/* ── Spellcasting Sheet ─────────────────────────────────────────
 * Full spell list for player characters. Displays prepared spells,
 * spell slots, save DC, and spell attack bonus.
 * DM can add custom spells via homebrew.
 * ──────────────────────────────────────────────────────────────── */
import { useState, useMemo } from "react";
import type { PlayerCharacter } from "@/types";
import { getTotalLevel } from "@/types";
import { abilityModifier } from "@/lib/dnd-utils";
import { useHomebrewStore } from "@/stores/homebrewStore";

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "text-blue-400",
  Conjuration: "text-amber-400",
  Divination: "text-purple-400",
  Enchantment: "text-pink-400",
  Evocation: "text-red-400",
  Illusion: "text-indigo-400",
  Necromancy: "text-green-400",
  Transmutation: "text-teal-400",
};

const CLASS_SPELL_ABILITY: Record<string, string> = {
  Wizard: "intelligence",
  Cleric: "wisdom",
  Druid: "wisdom",
  Bard: "charisma",
  Sorcerer: "charisma",
  Paladin: "charisma",
  Warlock: "charisma",
  Ranger: "wisdom",
  Artificer: "intelligence",
};

const CLASS_SPELL_LEVELS: Record<string, number> = {
  Wizard: 1, Cleric: 1, Druid: 1, Bard: 1, Sorcerer: 1,
  Warlock: 1, Artificer: 1,
  Paladin: 2, Ranger: 2,
};

interface SpellSlotInfo {
  level: number;
  total: number;
  expended: number;
}

function getSpellSlots(level: number, casterType: "full" | "half" | "third" | "warlock"): SpellSlotInfo[] {
  const effectiveLevel = casterType === "half" ? Math.ceil(level / 2)
    : casterType === "third" ? Math.ceil(level / 3)
    : level;

  const slotTable: Record<number, number[]> = {
    1: [2], 2: [3], 3: [4, 2], 4: [4, 3], 5: [4, 3, 2],
    6: [4, 3, 3], 7: [4, 3, 3, 1], 8: [4, 3, 3, 2], 9: [4, 3, 3, 3, 1],
    10: [4, 3, 3, 3, 2], 11: [4, 3, 3, 3, 2, 1], 12: [4, 3, 3, 3, 2, 1],
    13: [4, 3, 3, 3, 2, 1, 1], 14: [4, 3, 3, 3, 2, 1, 1],
    15: [4, 3, 3, 3, 2, 1, 1, 1], 16: [4, 3, 3, 3, 2, 1, 1, 1],
    17: [4, 3, 3, 3, 2, 1, 1, 1, 1], 18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
    19: [4, 3, 3, 3, 3, 2, 1, 1, 1], 20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
  };

  const raw = slotTable[effectiveLevel] ?? [];
  return raw.map((total, i) => ({
    level: i + 1,
    total,
    expended: 0,
  }));
}

interface SpellItem {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
}

export function SpellcastingSheet({ character }: { character: PlayerCharacter }) {
  const homebrewSpells = useHomebrewStore((s) => s.spells);
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);

  // Determine spellcasting ability and available spells
  const primaryClass = character.classes?.[0]?.name ?? character.class ?? "Unknown";
  const spellAbility = CLASS_SPELL_ABILITY[primaryClass] ?? "intelligence";
  const abilityScore = character.abilities?.[spellAbility as keyof typeof character.abilities] ?? 10;
  const mod = abilityModifier(abilityScore);
  const spellSaveDC = 8 + mod + Math.min(6, Math.ceil(getTotalLevel(character.classes ?? [{ name: primaryClass, level: character.level }]) / 4) + 1);
  const spellAttack = mod + Math.min(6, Math.ceil(getTotalLevel(character.classes ?? [{ name: primaryClass, level: character.level }]) / 4) + 1);
  const minSpellLevel = CLASS_SPELL_LEVELS[primaryClass] ?? 1;
  const totalLevel = getTotalLevel(character.classes ?? [{ name: primaryClass, level: character.level }]);

  // Determine caster type
  const casterType: "full" | "half" | "third" | "warlock" =
    primaryClass === "Paladin" || primaryClass === "Ranger" ? "half"
    : primaryClass === "Warlock" ? "warlock"
    : "full";

  const slots = useMemo(() => getSpellSlots(totalLevel, casterType), [totalLevel, casterType]);

  // Build spell list from character's known/prepared spells + homebrew
  const knownSpells: SpellItem[] = useMemo(() => {
    const charSpells: SpellItem[] = (character.spellcasting?.spells ?? []).map((s) => ({
      name: typeof s === "string" ? s : s.name,
      level: s.level ?? 0,
      school: s.school ?? "Unknown",
      castingTime: s.castingTime ?? "1 action",
      range: s.range ?? "Self",
      components: s.components ?? "V, S",
      duration: s.duration ?? "Instantaneous",
      description: s.description ?? "",
      prepared: s.prepared ?? true,
    })) ?? [];

    // Also include homebrew spells that are relevant
    const hbSpells: SpellItem[] = homebrewSpells.map((s) => ({
      name: s.name,
      level: s.level,
      school: s.school,
      castingTime: s.castingTime ?? "1 action",
      range: s.range ?? "Self",
      components: (s.components ?? []).join(", "),
      duration: s.duration ?? "Instantaneous",
      description: s.description ?? "",
      prepared: true,
    }));

    return [...charSpells, ...hbSpells];
  }, [character, homebrewSpells]);

  const filteredSpells = useMemo(() => {
    if (filterLevel === null) return knownSpells;
    return knownSpells.filter((s) => s.level === filterLevel);
  }, [knownSpells, filterLevel]);

  const hasSpellcasting = totalLevel >= minSpellLevel;

  if (!hasSpellcasting) return null;

  return (
    <div className="space-y-4">
      {/* Spellcasting Header */}
      <div className="rounded-xl border border-mage-500/30 bg-mage-500/10 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-mage-300">✨ Spellcasting</h3>
          <span className="text-[10px] text-surface-400">{primaryClass}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-surface-500">Spell Save DC</p>
            <p className="text-lg font-bold text-surface-100">{spellSaveDC}</p>
          </div>
          <div>
            <p className="text-[10px] text-surface-500">Spell Attack</p>
            <p className="text-lg font-bold text-surface-100">+{spellAttack}</p>
          </div>
          <div>
            <p className="text-[10px] text-surface-500">Ability</p>
            <p className="text-lg font-bold text-surface-100 capitalize">{spellAbility.slice(0, 3)}</p>
          </div>
        </div>
      </div>

      {/* Spell Slots */}
      <div>
        <h4 className="text-xs font-semibold text-surface-400 mb-2">Spell Slots</h4>
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <div
              key={slot.level}
              className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-center"
            >
              <p className="text-[10px] text-surface-500">Lv.{slot.level}</p>
              <p className="text-sm font-bold text-surface-200">
                {slot.total - slot.expended}/{slot.total}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Spell List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-surface-400">
            Spells ({filteredSpells.length})
          </h4>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterLevel(null)}
              className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                filterLevel === null ? "bg-accent-500/20 text-accent-300" : "text-surface-500 hover:text-surface-300"
              }`}
            >
              All
            </button>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
              knownSpells.some((s) => s.level === lvl) && (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`rounded px-2 py-0.5 text-[10px] transition-colors ${
                    filterLevel === lvl ? "bg-accent-500/20 text-accent-300" : "text-surface-500 hover:text-surface-300"
                  }`}
                >
                  Lv.{lvl}
                </button>
              )
            ))}
          </div>
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {filteredSpells.length === 0 ? (
            <p className="py-4 text-center text-xs text-surface-500">
              No spells match this filter.
            </p>
          ) : (
            filteredSpells.map((spell) => (
              <div
                key={spell.name}
                className="rounded-lg border border-surface-700 bg-surface-800 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedSpell(expandedSpell === spell.name ? null : spell.name)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-surface-700/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-200 truncate">{spell.name}</p>
                    <p className={`text-[10px] ${SCHOOL_COLORS[spell.school] ?? "text-surface-400"}`}>
                      {spell.level === 0 ? "Cantrip" : `Lv.${spell.level}`} · {spell.school}
                    </p>
                  </div>
                  <span className="text-surface-500 text-xs ml-2">
                    {expandedSpell === spell.name ? "▲" : "▼"}
                  </span>
                </button>

                {expandedSpell === spell.name && (
                  <div className="border-t border-surface-700 px-3 py-2 space-y-1">
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-surface-400">
                      <span>Casting: {spell.castingTime}</span>
                      <span>Range: {spell.range}</span>
                      <span>Components: {spell.components}</span>
                      <span>Duration: {spell.duration}</span>
                    </div>
                    {spell.description && (
                      <p className="text-[11px] text-surface-300 mt-1 leading-relaxed">
                        {spell.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
