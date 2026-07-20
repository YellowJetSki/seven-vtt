/**
 * STᚱ VTT — CombatResourceDeriver
 *
 * Pure functions for deriving combat resources and weapon attacks
 * from character data. Extracted from PlayerSheetCombatTab.tsx monolith
 * (Sprint 9 refactor).
 */

import type { PlayerCharacter, ClassResource } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";

// ── Weapon attack building ──

export interface AttackEntry {
  name: string;
  atk: string;
  damage: string;
  notes?: string;
  isRanged?: boolean;
  isMelee?: boolean;
  range?: string;
  properties?: string[];
}

export function buildWeaponAttacks(c: PlayerCharacter, derived: ReturnType<typeof computeAllDerivations>): AttackEntry[] {
  const attacks: AttackEntry[] = [];
  const dexMod = derived.abilityMods.dexterity;
  const strMod = derived.abilityMods.strength;
  const pb = derived.proficiencyBonus;

  for (const equip of c.equipment) {
    const itemLower = equip.item.toLowerCase();
    const notesLower = (equip.notes || "").toLowerCase();
    const isMelee = !!(notesLower.includes("melee") ||
      notesLower.includes("finesse") ||
      notesLower.includes("versatile") ||
      equip.slot === "mainhand" || equip.slot === "offhand");
    const isRanged = !!(notesLower.includes("range") ||
      equip.slot === "ranged" || equip.slot === "ammunition");
    const isFinesse = notesLower.includes("finesse");
    const isThrown = notesLower.includes("thrown");
    const isWeapon = isMelee || isRanged;

    if (!isWeapon) continue;

    const abilityMod = isRanged && !isThrown ? dexMod : isFinesse ? Math.max(strMod, dexMod) : strMod;
    const magicMatch = equip.item.match(/\+(\d+)/);
    const magicBonus = magicMatch ? parseInt(magicMatch[1], 10) : 0;
    const dmgTypes = ["slashing", "piercing", "bludgeoning", "fire", "cold", "acid",
      "lightning", "radiant", "necrotic", "poison", "force", "psychic", "thunder"];
    const dmgType = dmgTypes.find((t) => notesLower.includes(t)) || "slashing";
    const rangeMatch = notesLower.match(/range\s*(\d+)\/(\d+)/i) ||
      itemLower.match(/range\s*(\d+)\/(\d+)/i);
    const rangeStr = rangeMatch ? `${rangeMatch[1]}/${rangeMatch[2]} ft` : isRanged ? "\u2014" : undefined;
    const atkBonus = abilityMod + pb + magicBonus;
    const dmgBonus = abilityMod + magicBonus;
    const dice = equip.notes?.match(/(\d+d\d+)/)?.[1] || "1d8";
    const damageStr = `${dice}${dmgBonus >= 0 ? "+" : ""}${dmgBonus} ${dmgType}`;

    const props: string[] = [];
    if (notesLower.includes("finesse")) props.push("Finesse");
    if (notesLower.includes("light")) props.push("Light");
    if (notesLower.includes("heavy")) props.push("Heavy");
    if (notesLower.includes("reach")) props.push("Reach");
    if (notesLower.includes("versatile")) props.push("Versatile");
    if (notesLower.includes("two-handed")) props.push("Two-Handed");
    if (notesLower.includes("thrown")) props.push("Thrown");
    if (isRanged && !isThrown) props.push("Ammunition");
    if (magicBonus > 0) props.push(`+${magicBonus} Magic`);

    attacks.push({
      name: equip.item,
      atk: `${atkBonus >= 0 ? "+" : ""}${atkBonus}`,
      damage: damageStr,
      isMelee,
      isRanged,
      range: rangeStr,
      properties: props.length > 0 ? props : undefined,
      notes: (equip.notes || "")
        .replace(/range\s*\d+\/\d+/i, "")
        .replace(/\+?\d+\s*(to\s*)?\s*(attack|damage)/gi, "")
        .trim(),
    });
  }

  return attacks;
}

// ── Class resource derivation ──

export function deriveClassResources(features: PlayerCharacter["features"], existingResources?: ClassResource[]): ClassResource[] {
  const derived: ClassResource[] = [];
  const featStrings = features.map((f) => (typeof f === "string" ? f : f.name).toLowerCase());

  const RESOURCE_MAP: Array<{ keyword: string; name: string; defaultMax: number; recharge: "short_rest" | "long_rest" }> = [
    { keyword: "rage", name: "Rage", defaultMax: 2, recharge: "long_rest" },
    { keyword: "channel divinity", name: "Channel Divinity", defaultMax: 1, recharge: "short_rest" },
    { keyword: "action surge", name: "Action Surge", defaultMax: 1, recharge: "short_rest" },
    { keyword: "second wind", name: "Second Wind", defaultMax: 1, recharge: "short_rest" },
    { keyword: "wild shape", name: "Wild Shape", defaultMax: 2, recharge: "short_rest" },
    { keyword: "ki point", name: "Ki Points", defaultMax: 4, recharge: "short_rest" },
    { keyword: "ki", name: "Ki Points", defaultMax: 4, recharge: "short_rest" }, // Fallback
    { keyword: "bardic inspiration", name: "Bardic Inspiration", defaultMax: 3, recharge: "long_rest" },
    { keyword: "sorcery point", name: "Sorcery Points", defaultMax: 2, recharge: "long_rest" },
  ];

  for (const res of RESOURCE_MAP) {
    if (featStrings.some((f) => f.includes(res.keyword))) {
      const existing = existingResources?.find((r) => r.name === res.name);
      derived.push({
        name: res.name,
        current: existing?.current ?? res.defaultMax,
        max: existing?.max ?? res.defaultMax,
        recharge: res.recharge,
      });
    }
  }

  return derived;
}

// ── Combat status computation ──

export interface CombatStatusInfo {
  label: string;
  color: string;
  bg: string;
  icon: string;
}

export function computeCombatStatus(hpRatio: number, isAtZero: boolean, isDead: boolean, isBloodied: boolean): CombatStatusInfo {
  if (isDead) return { label: "Dead", color: "text-red-400", bg: "bg-red-500/15 border-red-500/25", icon: "\u2715" };
  if (isAtZero) return { label: "Unconscious", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: "\uD83D\uDCA4" };
  if (isBloodied) return { label: "Bloodied", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: "\u2694\uFE0F" };
  return { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "\uD83D\uDEE1\uFE0F" };
}
