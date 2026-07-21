/**
 * STᚱ VTT — Companion Attack/Cast Quick-Reference Panel (Overrrides-Grade Premium)
 *
 * Cycle 25: Player-facing combat quick-reference popover for the companion
 * encounter view. Displays weapon attacks and offensive spells with
 * at-a-glance mechanical info — ATK bonus, damage expression, range,
 * properties, and AC comparison against encounter targets.
 *
 * IMPORTANT: This is an informational reference tool. It does NOT
 * roll dice, resolve attacks, or apply damage. All values shown are
 * computed from character stats and equipment data.
 *
 * Features:
 *   - Dual-tab: Weapons | Spells (with attack cantrips)
 *   - Per-attack stat cards: ATK bonus, damage expression, range, properties
 *   - Target selector: pick from active encounter combatants
 *   - AC comparison: shows the d20 roll needed to hit each target
 *   - Average damage reference: "Avg: 8d6 = 28 fire damage"
 *   - Premium glass gradient with rose accent (weapons) + violet accent (spells)
 *   - Escape key + backdrop dismiss
 *   - Staggered entrance animation
 *
 * Design: Overrrides/Ventriloc — compact glass cards, per-type color coding,
 *   gold edge lights, staggered entrance.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { PlayerCharacter, CombatEntity } from "@/types";
import { useCombatStore } from "@/stores/combatStore";
import { useCompendiumStore } from "@/stores/compendium";
import type { HomebrewItem } from "@/types";
import { computeSpellcasting, getAbilityMod } from "@/lib/mechanics/character-derivations";
import PremiumIcon from "@/components/ui/PremiumIcon";

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/** Parse a damage expression like "8d6+3 fire" into { dice, bonus, type } */
function parseDamageExpression(expr: string): { dice: string; bonus: number; type: string } {
  const parts = expr.trim().split(/\s+/);
  let dice = "1d6";
  let bonus = 0;
  let type = "slashing";

  if (parts.length >= 1) {
    dice = parts[0];
  }
  if (parts.length >= 2) {
    // Check if second part is a bonus (+3) or type
    const second = parts[1];
    if (second.startsWith("+") || second.startsWith("-")) {
      bonus = parseInt(second, 10) || 0;
      if (parts.length >= 3) type = parts.slice(2).join(" ");
    } else {
      type = parts.slice(1).join(" ");
    }
  }

  // Extract bonus from dice string (e.g. "2d6+3")
  const diceBonusMatch = dice.match(/^(\d+d\d+)\+?(\d+)?$/);
  if (diceBonusMatch && diceBonusMatch[2]) {
    bonus += parseInt(diceBonusMatch[2], 10);
    dice = diceBonusMatch[1];
  }

  return { dice, bonus, type };
}

/** Compute average damage for a dice expression */
function computeAverageDamage(dice: string, bonus: number): number {
  const match = dice.match(/^(\d+)d(\d+)$/);
  if (!match) return bonus;
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  return Math.floor(count * (sides + 1) / 2 + bonus);
}

/** Get damage type emoji */
function damageEmoji(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("fire")) return "🔥";
  if (t.includes("cold") || t.includes("ice")) return "❄️";
  if (t.includes("lightning") || t.includes("thunder")) return "⚡";
  if (t.includes("acid")) return "🧪";
  if (t.includes("poison")) return "☠️";
  if (t.includes("necrotic") || t.includes("shadow")) return "💀";
  if (t.includes("radiant") || t.includes("holy") || t.includes("light")) return "✨";
  if (t.includes("psychic")) return "🧠";
  if (t.includes("force")) return "🌀";
  if (t.includes("piercing")) return "🗡️";
  if (t.includes("slashing")) return "⚔️";
  if (t.includes("bludgeoning")) return "🔨";
  return "⚔️";
}

/** Determine if an item is a valid combat weapon */
function isWeapon(item: { name: string; category?: string; damageDice?: string }): boolean {
  if (item.damageDice) return true;
  const cat = (item.category || "").toLowerCase();
  if (cat === "weapon" || cat === "weapons") return true;
  const name = item.name.toLowerCase();
  return [
    "sword", "axe", "blade", "hammer", "mace", "staff", "bow", "crossbow",
    "dagger", "spear", "halberd", "glaive", "rapier", "scimitar", "longbow",
    "shortbow", "sling", "dart", "javelin", "trident", "whip", "flail",
    "morningstar", "warhammer", "battleaxe", "greatsword", "greataxe",
    "maul", "pike", "lance", "club", "quarterstaff",
  ].some((w) => name.includes(w));
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface CompanionAttackRefPanelProps {
  character: PlayerCharacter;
  onClose: () => void;
}

export default function CompanionAttackRefPanel({ character, onClose }: CompanionAttackRefPanelProps) {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const compendium = useCompendiumStore();
  const [activeTab, setActiveTab] = useState<"weapons" | "spells">("weapons");
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const spellcasting = useMemo(() => computeSpellcasting(character), [character]);
  const pb = getAbilityMod(character.proficiencyBonus || Math.ceil(1 + character.level / 4));

  // Escape + auto-focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    setTimeout(() => searchRef.current?.focus(), 200);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const strMod = getAbilityMod(character.strength || 10);
  const dexMod = getAbilityMod(character.dexterity || 10);

  // ── Build weapon list from equipment ──
  const weapons = useMemo(() => {
    const results: Array<{
      name: string;
      attackBonus: string;
      damageExpression: string;
      damageDice: string;
      damageType: string;
      avgDamage: number;
      isMelee: boolean;
      isRanged: boolean;
      range: string | null;
      properties: string[];
    }> = [];

    // Check equipment slots + inventory for weapons
    const allItems = [
      ...(character.equipment || []).map((e) => ({ name: e.item, source: "equipment" as const })),
      ...(character.inventory || []).map((i) => ({ name: i.name, source: "inventory" as const })),
    ];

    // Deduplicate by name
    const seen = new Set<string>();
    for (const item of allItems) {
      if (seen.has(item.name.toLowerCase())) continue;
      seen.add(item.name.toLowerCase());

      // Resolve against SRD compendium items
      const srdItem = (compendium.items || []).find(
        (s) => s.name.toLowerCase() === item.name.toLowerCase() && isWeapon(s)
      ) as HomebrewItem | undefined;

      if (!srdItem && !isWeapon({ name: item.name })) continue;

      const name = item.name;
      const isRangedName = ["bow", "crossbow", "sling", "dart", "javelin", "thrown"].some(
        (w) => name.toLowerCase().includes(w)
      ) && !name.toLowerCase().includes("handaxe") && !name.toLowerCase().includes("throwing");

      // Compute ATK bonus
      const isFinesse = ["rapier", "scimitar", "shortsword", "whip"].some(
        (w) => name.toLowerCase().includes(w)
      );
      const atkMod = isRangedName ? dexMod : isFinesse ? Math.max(strMod, dexMod) : strMod;

      const damageDice = srdItem?.damageDice || "1d6";
      const damageType = srdItem?.damageType || "slashing";
      const magicBonus = srdItem?.attackBonus || 0;
      const atkTotal = atkMod + pb + magicBonus;
      const dmgBonus = atkMod + magicBonus;

      const damageExpression = `${damageDice}${dmgBonus >= 0 ? "+" : ""}${dmgBonus} ${damageType}`;
      const parsed = parseDamageExpression(damageExpression);
      const avgDmg = computeAverageDamage(parsed.dice, parsed.bonus);

      // Detect properties
      const props: string[] = [];
      if (srdItem?.weaponProperties) props.push(...srdItem.weaponProperties);
      if (isRangedName) props.push("Ranged");
      if (isFinesse && !props.includes("Finesse")) props.push("Finesse");

      // Determine range
      let range: string | null = null;
      if (isRangedName) {
        range = "60/120 ft";
        if (name.toLowerCase().includes("longbow")) range = "150/600 ft";
        else if (name.toLowerCase().includes("shortbow")) range = "80/320 ft";
        else if (name.toLowerCase().includes("crossbow")) range = "80/320 ft";
        else if (name.toLowerCase().includes("sling")) range = "30/120 ft";
        else if (name.toLowerCase().includes("javelin") || name.toLowerCase().includes("spear")) range = "20/60 ft";
        else if (name.toLowerCase().includes("dart")) range = "20/60 ft";
      }

      results.push({
        name,
        attackBonus: `${atkTotal >= 0 ? "+" : ""}${atkTotal}`,
        damageExpression,
        damageDice,
        damageType,
        avgDamage: avgDmg,
        isMelee: !isRangedName,
        isRanged: isRangedName,
        range,
        properties: props,
      });
    }

    return results;
  }, [character.equipment, character.inventory, compendium.items, strMod, dexMod, pb]);

  // ── Build offensive spell list ──
  const offensiveSpells = useMemo(() => {
    if (!spellcasting.isCaster) return [];

    const results: Array<{
      name: string;
      level: number;
      school: string;
      attackBonus: string;
      damageExpression: string | null;
      damageDice: string | null;
      damageType: string | null;
      avgDamage: number | null;
      saveDC: number | null;
      saveAbility: string | null;
    }> = [];

    const knownNames = character.preparedSpells || [];
    const compendiumSpells = compendium.spells || [];

    for (const name of knownNames) {
      const spell = compendiumSpells.find((s) => s.name.toLowerCase() === name.toLowerCase());
      if (!spell) continue;

      // Only show offensive spells (has damage, save DC, or attack roll)
      const hasOffense = spell.damageDice || spell.saveDC || spell.spellAttackBonus || spell.healDice;
      if (!hasOffense) continue;

      const damDice = spell.damageDice || null;
      const damType = spell.damageType || null;
      const healDice = spell.healDice || null;

      // Compute expression
      let expr: string | null = null;
      let avg: number | null = null;

      if (damDice) {
        const atkBonus = (spell as HomebrewItem).attackBonus || 0;
        const mod = spell.spellAttackBonus || spellcasting.attackBonus || 0;
        expr = `${damDice}${mod >= 0 ? "+" : ""}${mod} ${damType || "damage"}`;
      } else if (healDice) {
        const mod = (spell as HomebrewItem).attackBonus || 0;
        expr = `${healDice}${mod >= 0 ? "+" : ""}${mod} healing`;
      }

      if (damDice) {
        const parsed = parseDamageExpression(`${damDice} 0`);
        avg = computeAverageDamage(parsed.dice, parsed.bonus);
      }

      results.push({
        name: spell.name,
        level: spell.level,
        school: spell.school || "Unknown",
        attackBonus: spell.spellAttackBonus
          ? `+${spell.spellAttackBonus}`
          : `+${spellcasting.attackBonus || 0}`,
        damageExpression: expr,
        damageDice: damDice,
        damageType: damType,
        avgDamage: avg,
        saveDC: spell.saveDC || spellcasting.saveDC || null,
        saveAbility: spell.saveAbility || null,
      });
    }

    // Add cantrips for the character's class
    const classLower = (character.class || "").toLowerCase();
    const cantrips = compendiumSpells.filter(
      (s) => s.level === 0 && s.tags?.some((t: string) => t.toLowerCase() === classLower)
    );
    for (const c of cantrips) {
      if (results.some((r) => r.name.toLowerCase() === c.name.toLowerCase())) continue;
      const damDice = c.damageDice || null;
      results.push({
        name: c.name,
        level: 0,
        school: c.school || "Unknown",
        attackBonus: `+${spellcasting.attackBonus || 0}`,
        damageExpression: damDice ? `${damDice} ${c.damageType || "damage"}` : null,
        damageDice: damDice,
        damageType: c.damageType || null,
        avgDamage: damDice ? computeAverageDamage(damDice, 0) : null,
        saveDC: c.saveDC || spellcasting.saveDC || null,
        saveAbility: c.saveAbility || null,
      });
    }

    return results;
  }, [character.preparedSpells, character.class, compendium.spells, spellcasting]);

  // ── Encounter targets ──
  const encounterTargets = useMemo(() => {
    if (!activeEncounter) return [];
    return activeEncounter.combatants.filter((c) => c.hitPoints.max > 0);
  }, [activeEncounter]);

  const selectedTarget = useMemo(() => {
    if (!selectedTargetId || !activeEncounter) return null;
    return activeEncounter.combatants.find((c) => c.id === selectedTargetId) || null;
  }, [selectedTargetId, activeEncounter]);

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
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-rose-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500/15 to-amber-500/10 flex items-center justify-center border border-rose/10">
              <PremiumIcon name="attack" className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">Attack & Cast</h3>
            <span className="text-[9px] text-surface-500 tabular-nums">
              Ref · {character.name}
            </span>
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

        {/* ── Tab bar ── */}
        <div className="flex mx-3 mb-1 bg-surface-800/20 rounded-lg border border-white/[0.04] p-0.5">
          <button onClick={() => setActiveTab("weapons")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded-md transition-all
              ${activeTab === "weapons"
                ? "bg-rose-500/12 text-rose-300 shadow-sm"
                : "text-surface-400 hover:text-surface-300"}`}
          >
            <PremiumIcon name="sword" className="w-3 h-3" />
            Weapons
            {weapons.length > 0 && (
              <span className="text-[8px] tabular-nums text-surface-500">({weapons.length})</span>
            )}
          </button>
          <button onClick={() => setActiveTab("spells")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-medium rounded-md transition-all
              ${activeTab === "spells"
                ? "bg-violet-500/12 text-violet-300 shadow-sm"
                : "text-surface-400 hover:text-surface-300"}`}
          >
            <PremiumIcon name="sparkles" className="w-3 h-3" />
            Spells
            {offensiveSpells.length > 0 && (
              <span className="text-[8px] tabular-nums text-surface-500">({offensiveSpells.length})</span>
            )}
          </button>
        </div>

        {/* ── Target selector ── */}
        {encounterTargets.length > 0 && (
          <div className="px-3 pb-1">
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setSelectedTargetId(null)}
                className={`text-[8px] px-1.5 py-0.5 rounded-full transition-all
                  ${!selectedTargetId
                    ? "bg-gold-500/12 text-gold-300 border border-gold-500/20"
                    : "bg-surface-800/30 text-surface-400 border border-white/[0.04] hover:bg-surface-800/50"}`}
              >All Targets</button>
              {encounterTargets.map((t) => (
                <button key={t.id} onClick={() => setSelectedTargetId(t.id === selectedTargetId ? null : t.id)}
                  className={`text-[8px] px-1.5 py-0.5 rounded-full truncate max-w-[80px] transition-all
                    ${selectedTargetId === t.id
                      ? "bg-rose-500/12 text-rose-300 border border-rose-500/20"
                      : "bg-surface-800/30 text-surface-400 border border-white/[0.04] hover:bg-surface-800/50"}`}
                >{t.name} (AC {t.armorClass})</button>
              ))}
            </div>
          </div>
        )}

        {/* ── Content area ── */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 max-h-[50vh] space-y-1 scrollbar-gold">
          {activeTab === "weapons" && (
            <>
              {weapons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-8 h-8 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mb-1.5">
                    <PremiumIcon name="sword" className="w-4 h-4 text-surface-500" />
                  </div>
                  <p className="text-[11px] text-surface-400">No weapons equipped</p>
                  <p className="text-[9px] text-surface-500 mt-0.5">Equip weapons in the Items tab.</p>
                </div>
              ) : (
                weapons.map((wpn, i) => (
                  <WeaponCard
                    key={wpn.name + i}
                    weapon={wpn}
                    target={selectedTarget}
                    style={{ animationDelay: `${i * 40}ms` }}
                  />
                ))
              )}
            </>
          )}

          {activeTab === "spells" && (
            <>
              {offensiveSpells.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-8 h-8 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mb-1.5">
                    <PremiumIcon name="sparkles" className="w-4 h-4 text-surface-500" />
                  </div>
                  <p className="text-[11px] text-surface-400">No offensive spells available</p>
                  <p className="text-[9px] text-surface-500 mt-0.5">Prepare attack spells in the Spells tab.</p>
                </div>
              ) : (
                <>
                  {/* Cantrips section */}
                  {offensiveSpells.filter((s) => s.level === 0).length > 0 && (
                    <div className="mb-1">
                      <div className="text-[8px] text-surface-600 uppercase tracking-wider px-1 mb-0.5">
                        Cantrips · At Will
                      </div>
                      {offensiveSpells.filter((s) => s.level === 0).map((spell, i) => (
                        <OffensiveSpellCard
                          key={spell.name + i}
                          spell={spell}
                          target={selectedTarget}
                          spellcasting={spellcasting}
                          style={{ animationDelay: `${i * 40}ms` }}
                        />
                      ))}
                    </div>
                  )}
                  {/* Level 1+ spells */}
                  {[1,2,3,4,5,6,7,8,9].map((lvl) => {
                    const lvlSpells = offensiveSpells.filter((s) => s.level === lvl);
                    if (lvlSpells.length === 0) return null;
                    return (
                      <div key={lvl} className="mb-1">
                        <div className="text-[8px] text-surface-600 uppercase tracking-wider px-1 mb-0.5">
                          Level {lvl}
                        </div>
                        {lvlSpells.map((spell, i) => (
                          <OffensiveSpellCard
                            key={spell.name + i}
                            spell={spell}
                            target={selectedTarget}
                            spellcasting={spellcasting}
                            style={{ animationDelay: `${i * 40}ms` }}
                          />
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-3 py-1.5 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-500">
            Reference only · No dice rolling
          </span>
          <span className="text-[8px] text-surface-500">
            {activeTab === "weapons"
              ? `${weapons.length} weapons`
              : `${offensiveSpells.length} spells`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// WEAPON CARD SUB-COMPONENT
// ═══════════════════════════════════════════════════════

interface WeaponRef {
  name: string;
  attackBonus: string;
  damageExpression: string;
  damageDice: string;
  damageType: string;
  avgDamage: number;
  isMelee: boolean;
  isRanged: boolean;
  range: string | null;
  properties: string[];
}

function WeaponCard({
  weapon, target, style,
}: {
  weapon: WeaponRef;
  target: { armorClass: number } | null;
  style?: React.CSSProperties;
}) {
  const atkNum = parseInt(weapon.attackBonus, 10) || 0;
  const neededRoll = target ? Math.max(2, target.armorClass - atkNum) : null;

  return (
    <div className="rounded-lg bg-surface-800/20 border border-white/[0.04] p-2
      animate-in slide-in-from-bottom-1 fade-in duration-200"
      style={style}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-[10px] text-rose-400 font-medium truncate">
            {weapon.name}
          </span>
          {weapon.isMelee && !weapon.isRanged && (
            <span className="text-[7px] text-surface-500 bg-surface-800/40 px-1 py-px rounded">Melee</span>
          )}
          {weapon.isRanged && (
            <span className="text-[7px] text-amber-400 bg-amber-500/8 px-1 py-px rounded">Ranged</span>
          )}
        </div>
        <span className="text-[11px] font-mono tabular-nums text-gold-400 shrink-0 ml-1">
          {weapon.attackBonus}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[9px]">
        {/* Damage expression */}
        <span className="text-rose-300 flex items-center gap-0.5">
          {damageEmoji(weapon.damageType)}
          <span>{weapon.damageExpression}</span>
        </span>
        {/* Average */}
        <span className="text-surface-500">· Avg {weapon.avgDamage}</span>
      </div>

      {/* Range + Properties */}
      <div className="flex items-center gap-1.5 mt-1">
        {weapon.range && (
          <span className="text-[7px] text-surface-500 bg-surface-800/40 px-1 py-px rounded">{weapon.range}</span>
        )}
        {weapon.properties.slice(0, 3).map((prop) => (
          <span key={prop} className="text-[7px] text-surface-500 bg-surface-800/40 px-1 py-px rounded">{prop}</span>
        ))}
        {weapon.properties.length > 3 && (
          <span className="text-[7px] text-surface-500">+{weapon.properties.length - 3}</span>
        )}
      </div>

      {/* AC comparison */}
      {target && neededRoll !== null && (
        <div className={`mt-1.5 flex items-center gap-1 text-[8px] ${
          neededRoll <= 2 ? "text-emerald-400" : neededRoll <= 10 ? "text-gold-400" : neededRoll <= 15 ? "text-amber-400" : "text-rose-400"
        }`}>
          <span>🎯 vs {target.armorClass} AC</span>
          <span>· Hit on a d20</span>
          <span className="font-mono tabular-nums font-bold">{neededRoll}+</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// OFFENSIVE SPELL CARD SUB-COMPONENT
// ═══════════════════════════════════════════════════════

function OffensiveSpellCard({
  spell, target, spellcasting, style,
}: {
  spell: {
    name: string;
    level: number;
    school: string;
    attackBonus: string;
    damageExpression: string | null;
    damageDice: string | null;
    damageType: string | null;
    avgDamage: number | null;
    saveDC: number | null;
    saveAbility: string | null;
  };
  target: { armorClass: number } | null;
  spellcasting: { saveDC: number; attackBonus: number };
  style?: React.CSSProperties;
}) {
  const isCantrip = spell.level === 0;
  const hasAttack = !spell.saveDC;
  const hasSave = !!spell.saveDC;
  const atkNum = parseInt(spell.attackBonus, 10) || 0;

  return (
    <div className="rounded-lg bg-surface-800/20 border border-white/[0.04] p-2
      animate-in slide-in-from-bottom-1 fade-in duration-200"
      style={style}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`text-[10px] font-medium ${isCantrip ? "text-emerald-300" : "text-violet-300"} truncate`}>
            {spell.name}
          </span>
          {isCantrip ? (
            <span className="text-[7px] text-emerald-500 bg-emerald-500/8 px-1 py-px rounded">Cantrip</span>
          ) : (
            <span className="text-[7px] text-surface-500 bg-surface-800/40 px-1 py-px rounded">Lv.{spell.level}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {hasAttack && (
            <span className="text-[10px] font-mono tabular-nums text-gold-400">{spell.attackBonus}</span>
          )}
          {hasSave && (
            <span className="text-[9px] font-mono tabular-nums text-indigo-400">DC {spell.saveDC}</span>
          )}
        </div>
      </div>

      {/* Damage/Effect */}
      {spell.damageExpression && (
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-rose-300 flex items-center gap-0.5">
            {spell.damageType ? damageEmoji(spell.damageType) : "💥"}
            <span>{spell.damageExpression}</span>
          </span>
          {spell.avgDamage !== null && (
            <span className="text-surface-500">· Avg {spell.avgDamage}</span>
          )}
        </div>
      )}

      {/* Save vs AC info */}
      <div className="flex items-center gap-2 mt-1">
        {hasSave && target && spell.saveDC && (
          <span className={`text-[8px] ${
            target.armorClass < spell.saveDC ? "text-gold-400" : "text-amber-400"
          }`}>
            🛡 Save DC {spell.saveDC} {spell.saveAbility || "Dex"}
          </span>
        )}
        {hasAttack && target && (
          (() => {
            const needed = Math.max(2, target.armorClass - atkNum);
            return (
              <span className={`text-[8px] ${
                needed <= 5 ? "text-emerald-400" : needed <= 10 ? "text-gold-400" : "text-amber-400"
              }`}>
                🎯 Hit on d20 {needed}+
              </span>
            );
          })()
        )}
      </div>

      {/* School */}
      <div className="mt-1">
        <span className="text-[7px] text-surface-500 bg-surface-800/40 px-1 py-px rounded">
          {spell.school}
        </span>
      </div>
    </div>
  );
}
