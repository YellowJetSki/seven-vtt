/**
 * STᚱ VTT — Combat Entity Injector
 *
 * Pure functions that translate character equipment, prepared spells,
 * and active feats into CombatEntity[] for the Combat Tab.
 *
 * Implements the "Unified Entity" pattern:
 *   Character Data + Homebrew Schema → Combat Entities
 *
 * Every weapon, spell, and feat is resolved through the full
 * HomebrewItem/HomebrewSpell/HomebrewFeat schema, ensuring
 * homebrew content works seamlessly alongside SRD content.
 */

import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import type { EquipmentSlot } from "@/types/character-core";
import type { PlayerCharacter } from "@/types";
import type { CombatEntity, CharacterCombatData } from "@/types/unified-entities";
import { getWeaponIcon, getSpellIcon, getFeatIcon } from "@/types/unified-entities";
import { getClassByName } from "@/data/srd-classes";
import { detectSource } from "./compendium-bridge";

// ── Inject Weapons ───────────────────────────────────────────

function inferDamageType(item: HomebrewItem): string {
  if (item.damageType) return item.damageType;
  const name = item.name.toLowerCase();
  if (name.includes("fire")) return "fire";
  if (name.includes("frost") || name.includes("cold") || name.includes("ice")) return "cold";
  if (name.includes("lightning") || name.includes("thunder")) return "lightning";
  if (name.includes("acid") || name.includes("poison")) return "poison";
  if (name.includes("necrotic") || name.includes("shadow")) return "necrotic";
  if (name.includes("radiant") || name.includes("holy") || name.includes("light")) return "radiant";
  if (name.includes("psychic")) return "psychic";
  if (item.category === "weapon") {
    if (name.includes("axe") || name.includes("sword") || name.includes("blade") || name.includes("scimitar")) return "slashing";
    if (name.includes("bow") || name.includes("crossbow") || name.includes("dart") || name.includes("spear")) return "piercing";
    if (name.includes("mace") || name.includes("hammer") || name.includes("maul") || name.includes("staff") || name.includes("club")) return "bludgeoning";
  }
  return "slashing";
}

function inferWeaponProperties(item: HomebrewItem): string[] {
  const props: string[] = [];
  const name = item.name.toLowerCase();
  const desc = item.description.toLowerCase();

  if (name.includes("light") || desc.includes("light weapon")) props.push("Light");
  if (name.includes("heavy") || desc.includes("heavy")) props.push("Heavy");
  if (name.includes("finesse") || desc.includes("finesse")) props.push("Finesse");
  if (name.includes("reach") || desc.includes("reach")) props.push("Reach");
  if (name.includes("versatile") || desc.includes("versatile")) props.push("Versatile");
  if (name.includes("two-handed") || desc.includes("two-handed") || item.name.includes("greatsword") || item.name.includes("greataxe") || item.name.includes("maul") || item.name.includes("halberd") || item.name.includes("pike")) props.push("Two-Handed");
  if (name.includes("thrown") || desc.includes("thrown")) props.push("Thrown");
  if (name.includes("loading") || desc.includes("loading")) props.push("Loading");
  if (name.includes("ammunition") || desc.includes("ammunition") || item.category === "ammunition") props.push("Ammunition");
  if (name.includes("range") || desc.includes("range")) props.push("Ranged");

  // Magic bonus
  const magicMatch = item.name.match(/\+(\d+)\s/);
  if (magicMatch) {
    const bonus = parseInt(magicMatch[1], 10);
    if (bonus > 0) props.push(`+${bonus}`);
  } else if (item.attackBonus && item.attackBonus > 0) {
    props.push(`+${item.attackBonus}`);
  }

  return props;
}

function resolveWeaponDamage(item: HomebrewItem, abilityMod: number, pb: number): { dice: string; bonus: number; type: string } {
  const dice = item.damageDice || "1d6";
  const magicBonus = item.attackBonus || 0;
  const bonus = abilityMod + pb + magicBonus;
  const type = inferDamageType(item);
  return { dice, bonus, type };
}

function injectWeapon(item: HomebrewItem, data: CharacterCombatData, slot: string): CombatEntity {
  const name = item.name;
  const isMelee = !name.toLowerCase().includes("bow") && !name.toLowerCase().includes("crossbow") &&
    !name.toLowerCase().includes("sling") && !name.toLowerCase().includes("dart") &&
    !name.toLowerCase().includes("range") && !item.description.toLowerCase().includes("range");
  const isRanged = !isMelee;

  const strMod = data.abilityMods.strength || 0;
  const dexMod = data.abilityMods.dexterity || 0;
  const isFinesse = name.toLowerCase().includes("finesse") || item.description.toLowerCase().includes("finesse");
  const isThrown = name.toLowerCase().includes("thrown") || item.description.toLowerCase().includes("thrown");

  const attackMod = (isRanged && !isThrown) ? dexMod : isFinesse ? Math.max(strMod, dexMod) : strMod;

  const { dice, bonus: dmgBonus, type } = resolveWeaponDamage(item, attackMod, data.proficiencyBonus);
  const atkTotal = attackMod + data.proficiencyBonus + (item.attackBonus || 0);
  const atkStr = `${atkTotal >= 0 ? "+" : ""}${atkTotal}`;

  const props = inferWeaponProperties(item);
  const rangeStr = props.includes("Ranged") ? "60/120 ft" : props.includes("Thrown") ? "20/60 ft" : undefined;

  return {
    id: `weapon-${item.id || name.toLowerCase().replace(/\s+/g, "-")}`,
    name,
    entityType: "weapon",
    sourceId: item.id,
    isActive: true,
    attackBonus: atkStr,
    damageExpression: `${dice}${dmgBonus >= 0 ? "+" : ""}${dmgBonus} ${type}`,
    isMelee: isMelee || isThrown,
    isRanged: isRanged && !isThrown,
    range: rangeStr,
    properties: props.length > 0 ? props : undefined,
    icon: getWeaponIcon(name),
    colorClass: "text-rose-400",
    tags: ["weapon", item.category],
    sourceType: detectSource(item),
  };
}

// ── Inject Spells ────────────────────────────────────────────

function injectSpell(spell: HomebrewSpell, data: CharacterCombatData): CombatEntity {
  const isCantrip = spell.level === 0;
  const hasAttack = !!spell.spellAttackBonus || (!!spell.damageDice && !spell.saveDC);
  const hasSave = !!spell.saveDC || (!!spell.damageDice && !hasAttack);
  const atkBonus = spell.spellAttackBonus ?? data.spellAttackBonus ?? 0;
  const saveDC = spell.saveDC ?? data.spellSaveDC ?? 10;
  const atkStr = `${atkBonus >= 0 ? "+" : ""}${atkBonus}`;

  return {
    id: `spell-${spell.id || spell.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: spell.name,
    entityType: "spell",
    sourceId: spell.id,
    isActive: true,
    spellLevel: spell.level,
    spellSchool: spell.school,
    requiresConcentration: spell.concentration,
    hasSave,
    saveDC: hasSave ? saveDC : undefined,
    saveAbility: spell.description.toLowerCase().includes("dex") ? "Dexterity" :
      spell.description.toLowerCase().includes("con") ? "Constitution" :
      spell.description.toLowerCase().includes("wis") ? "Wisdom" :
      spell.description.toLowerCase().includes("str") ? "Strength" :
      spell.description.toLowerCase().includes("cha") ? "Charisma" :
      spell.description.toLowerCase().includes("int") ? "Intelligence" : undefined,
    attackBonus: hasAttack ? atkStr : undefined,
    damageExpression: spell.damageDice ? `${spell.damageDice}${spell.damageType ? ` ${spell.damageType}` : ""}` :
      spell.healDice ? `${spell.healDice} healing` : undefined,
    range: spell.range,
    icon: getSpellIcon(spell.school),
    colorClass: hasAttack ? "text-amber-400" : hasSave ? "text-indigo-400" : "text-cyan-400",
    tags: ["spell", spell.school.toLowerCase(), `level-${spell.level}`],
    sourceType: detectSource(spell),
  };
}

// ── Inject Feats ─────────────────────────────────────────────

function injectFeat(feat: HomebrewFeat): CombatEntity {
  const requiresActivation = feat.description.toLowerCase().includes("bonus action") ||
    feat.description.toLowerCase().includes("action") ||
    feat.description.toLowerCase().includes("reaction");

  // Infer attack-related feats
  const hasAttackBonus = feat.name.toLowerCase().includes("sharpshooter") ||
    feat.name.toLowerCase().includes("great weapon master") ||
    feat.name.toLowerCase().includes("dual wielder");

  return {
    id: `feat-${feat.id || feat.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: feat.name,
    entityType: "feat",
    sourceId: feat.id,
    isActive: true,
    effectDescription: feat.benefits?.join(", ") || feat.description,
    requiresActivation,
    icon: getFeatIcon(feat.name),
    colorClass: hasAttackBonus ? "text-gold-400" : "text-violet-400",
    tags: ["feat", ...feat.tags],
    sourceType: detectSource(feat),
  };
}

// ── Main Injector ────────────────────────────────────────────

export interface InjectorInput {
  character: PlayerCharacter;
  derived: {
    proficiencyBonus: number;
    abilityMods: Record<string, number>;
    spellSaveDC: number;
    spellAttackBonus: number;
    spellcastingAbility: string | null;
  };
  /** SRD/homebrew items to resolve against */
  itemCatalog: HomebrewItem[];
  /** SRD/homebrew spells to resolve against */
  spellCatalog: HomebrewSpell[];
  /** SRD/homebrew feats to resolve against */
  featCatalog: HomebrewFeat[];
}

export interface InjectorOutput {
  weapons: CombatEntity[];
  spells: CombatEntity[];
  feats: CombatEntity[];
  all: CombatEntity[];
}

/**
 * Builds CombatEntity[] from a character's equipped items,
 * prepared spells, and active feats — resolving each against
 * the full SRD/homebrew catalog.
 *
 * Homebrew items/spells/feats use the EXACT same resolution
 * logic as official content.
 */
export function injectCombatEntities(input: InjectorInput): InjectorOutput {
  const { character, derived, itemCatalog, spellCatalog, featCatalog } = input;

  // Build ability mods map for weapon resolution
  const data: CharacterCombatData = {
    proficiencyBonus: derived.proficiencyBonus,
    abilityMods: derived.abilityMods,
    equippedWeapons: [],
    preparedSpells: [],
    activeFeats: [],
    spellcastingAbility: derived.spellcastingAbility || undefined,
    spellAttackBonus: derived.spellAttackBonus,
    spellSaveDC: derived.spellSaveDC,
  };

  // ── Resolve weapons from equipment ──
  const weaponIds = new Set<string>();
  for (const equip of character.equipment || []) {
    // Try to find a matching item in the catalog by name
    const match = itemCatalog.find(i =>
      i.name.toLowerCase() === equip.item.toLowerCase() ||
      equip.item.toLowerCase().includes(i.name.toLowerCase()) ||
      i.name.toLowerCase().includes(equip.item.toLowerCase())
    );

    if (match && match.category === "weapon") {
      data.equippedWeapons.push({ item: match, slot: equip.slot, isEquipped: true });
      weaponIds.add(match.id || match.name);
    } else if (equip.notes?.toLowerCase().includes("weapon") || !match) {
      // If no catalog match but it looks like a weapon, create a synthetic HomebrewItem
      const synthItem: HomebrewItem = {
        id: `equip-${equip.item.toLowerCase().replace(/\s+/g, "-")}`,
        name: equip.item,
        category: "weapon",
        rarity: "common",
        description: equip.notes || "",
        requiresAttunement: false,
        weight: equip.weight || 1,
        value: 0,
        isCursed: false,
        visibleToPlayers: true,
        tags: ["weapon"],
        source: "character",
        isHomebrew: false,
        createdAt: 0,
        updatedAt: 0,
        damageDice: "1d6",
        damageType: "slashing",
      };
      data.equippedWeapons.push({ item: synthItem, slot: equip.slot, isEquipped: true });
    }
  }

  // ── Resolve spells from character's spell list (optional field) ──
  const preparedSpellNames = (character as any).preparedSpells || [];
  if (Array.isArray(preparedSpellNames)) {
    for (const spellName of preparedSpellNames) {
      const match = spellCatalog.find(s =>
        s.name.toLowerCase() === String(spellName).toLowerCase()
      );
      if (match) {
        data.preparedSpells.push({ spell: match, isPrepared: true });
      }
    }
  }

  // ── Resolve feats ──
  // Read the character's activeFeats refs (typed ActiveFeatRef[])
  const characterFeatRefs: Array<{ featId: string; featName: string; isActive: boolean }> =
    (character as any).activeFeats || [];
  // Also check character.features (legacy string/feature names)
  const characterFeatureNames = (character.features || []).map((f: any) =>
    typeof f === "string" ? f : f.name
  );

  // Only inject feats that are marked isActive=true
  for (const ref of characterFeatRefs) {
    if (!ref.isActive) continue;
    const match = featCatalog.find(f =>
      f.id === ref.featId || f.name.toLowerCase() === ref.featName.toLowerCase()
    );
    if (match && !data.activeFeats.find(f => f.feat.id === match.id)) {
      data.activeFeats.push({ feat: match, isActive: true });
    }
  }

  // Also try to resolve from legacy features list (no toggle, always active)
  for (const featName of characterFeatureNames) {
    const match = featCatalog.find(f =>
      f.name.toLowerCase() === featName.toLowerCase()
    );
    if (match && !data.activeFeats.find(f => f.feat.id === match.id)) {
      data.activeFeats.push({ feat: match, isActive: true });
    }
  }

  // ── Generate entities ──
  const weapons = data.equippedWeapons.map(e => injectWeapon(e.item, data, e.slot));
  const spells = data.preparedSpells.map(s => injectSpell(s.spell, data));
  const feats = data.activeFeats.map(f => injectFeat(f.feat));

  return {
    weapons,
    spells,
    feats,
    all: [...weapons, ...spells, ...feats],
  };
}
