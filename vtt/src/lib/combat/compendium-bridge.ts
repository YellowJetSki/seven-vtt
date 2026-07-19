/**
 * STᚱ VTT — Compendium Entity Bridge
 *
 * Pure utility functions for bridging homebrew and SRD entities
 * with character equipment, prepared spells, and active feats.
 *
 * Provides fuzzy matching, normalization, and source tracking
 * so the Combat Entity Injector can resolve ANY entity regardless
 * of whether it came from the SRD, HomebrewManager, or character creation.
 *
 * Usage:
 *   import { resolveWeapon, resolveSpell, resolveFeat } from "@/lib/combat/compendium-bridge";
 *   const weapon = resolveWeapon(itemName, itemCatalog); // HomebrewItem | null
 *   const { entity, source } = resolveWeaponWithSource(itemName, itemCatalog);
 */

import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";

// ── Source Type ──────────────────────────────────────────────

export type EntitySource = "srd" | "homebrew" | "character" | "synthetic";

export interface ResolvedEntity<T> {
  entity: T | null;
  source: EntitySource;
  confidence: "exact" | "fuzzy" | "none";
}

// ── Normalization ────────────────────────────────────────────

/** Normalize a string for comparison: lowercase, trim, remove special chars */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Check if two names match (exact after normalization) */
export function isExactMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

/** Check if one name is contained within another */
export function isFuzzyMatch(needle: string, haystack: string): boolean {
  const n = normalizeName(needle);
  const h = normalizeName(haystack);
  if (n.length < 3) return n === h;
  return h.includes(n) || n.includes(h);
}

// ── Source Detection ─────────────────────────────────────────

/** Determine if an entity is SRD or homebrew based on its id, source field, or isHomebrew flag */
export function detectSource(entity: { id?: string; source?: string; isHomebrew?: boolean }): EntitySource {
  if (entity.isHomebrew) return "homebrew";
  if (entity.source === "SRD") return "srd";
  if (entity.source === "character") return "character";
  if (entity.source === "synthetic") return "synthetic";
  if (entity.id?.startsWith("srd_")) return "srd";
  if (entity.id?.startsWith("equip-") || entity.id?.startsWith("synth-")) return "synthetic";
  return "homebrew";
}

// ── Weapon Resolution ────────────────────────────────────────

export function resolveWeapon(
  name: string,
  catalog: HomebrewItem[],
  category?: string
): ResolvedEntity<HomebrewItem> {
  const normalized = normalizeName(name);

  // 1. Exact match by name
  let match = catalog.find((i) => isExactMatch(i.name, name));
  if (match) return { entity: match, source: detectSource(match), confidence: "exact" };

  // 2. Fuzzy match
  match = catalog.find((i) => isFuzzyMatch(name, i.name));
  if (match) return { entity: match, source: detectSource(match), confidence: "fuzzy" };

  // 3. If category is weapon, try matching on the item name within description
  match = catalog.find((i) =>
    i.description &&
    isFuzzyMatch(name, i.description) &&
    (category === "weapon" || i.category === "weapon")
  );
  if (match) return { entity: match, source: detectSource(match), confidence: "fuzzy" };

  // 4. Try finding by name pieces (e.g. "Longsword +1" matches "Longsword")
  const words = normalized.split(" ").filter((w) => w.length > 2);
  for (const word of words) {
    match = catalog.find((i) => normalizeName(i.name).includes(word));
    if (match) return { entity: match, source: detectSource(match), confidence: "fuzzy" };
  }

  return { entity: null, source: "synthetic", confidence: "none" };
}

/** Resolve a weapon and also return a synthetic fallback if nothing found */
export function resolveWeaponWithFallback(
  name: string,
  catalog: HomebrewItem[],
  slot: string
): { entity: HomebrewItem; source: EntitySource } {
  const result = resolveWeapon(name, catalog);
  if (result.entity) return { entity: result.entity, source: result.source };

  // Create synthetic entry for unrecognized weapons
  const isMelee = !name.toLowerCase().includes("bow") &&
    !name.toLowerCase().includes("crossbow") &&
    !name.toLowerCase().includes("sling") &&
    !name.toLowerCase().includes("dart");

  return {
    entity: {
      id: `synth-${normalizeName(name).replace(/\s+/g, "-")}`,
      name,
      category: "weapon",
      rarity: "common",
      description: "",
      requiresAttunement: false,
      weight: 2,
      value: 0,
      isCursed: false,
      visibleToPlayers: true,
      tags: ["weapon"],
      source: "synthetic",
      isHomebrew: false,
      createdAt: 0,
      updatedAt: 0,
      damageDice: "1d6",
      damageType: isMelee ? "slashing" : "piercing",
    },
    source: "synthetic",
  };
}

// ── Spell Resolution ─────────────────────────────────────────

export function resolveSpell(
  name: string,
  catalog: HomebrewSpell[]
): ResolvedEntity<HomebrewSpell> {
  const normalized = normalizeName(name);

  // 1. Exact match
  let match = catalog.find((s) => isExactMatch(s.name, name));
  if (match) return { entity: match, source: detectSource(match), confidence: "exact" };

  // 2. Fuzzy match
  match = catalog.find((s) => isFuzzyMatch(name, s.name));
  if (match) return { entity: match, source: detectSource(match), confidence: "fuzzy" };

  // 3. Partial word match
  const words = normalized.split(" ").filter((w) => w.length > 2);
  for (const word of words) {
    match = catalog.find((s) => normalizeName(s.name).includes(word));
    if (match) return { entity: match, source: detectSource(match), confidence: "fuzzy" };
  }

  return { entity: null, source: "synthetic", confidence: "none" };
}

// ── Feat Resolution ──────────────────────────────────────────

export function resolveFeat(
  name: string,
  catalog: HomebrewFeat[]
): ResolvedEntity<HomebrewFeat> {
  const normalized = normalizeName(name);

  // 1. Exact match by id
  let match = catalog.find((f) => f.id && isExactMatch(f.id, name));
  if (match) return { entity: match, source: detectSource(match), confidence: "exact" };

  // 2. Exact match by name
  match = catalog.find((f) => isExactMatch(f.name, name));
  if (match) return { entity: match, source: detectSource(match), confidence: "exact" };

  // 3. Fuzzy match
  match = catalog.find((f) => isFuzzyMatch(name, f.name));
  if (match) return { entity: match, source: detectSource(match), confidence: "fuzzy" };

  return { entity: null, source: "synthetic", confidence: "none" };
}

// ── Source Badge Helper ──────────────────────────────────────

export interface SourceBadge {
  label: string;
  icon: string;
  className: string;
}

export function getSourceBadge(source: EntitySource): SourceBadge {
  switch (source) {
    case "srd":
      return { label: "SRD", icon: "📖", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" };
    case "homebrew":
      return { label: "Homebrew", icon: "⚒️", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    case "character":
      return { label: "Character", icon: "👤", className: "bg-violet-500/10 text-violet-400 border-violet-500/20" };
    case "synthetic":
      return { label: "Inferred", icon: "🔮", className: "bg-surface-600/20 text-surface-400 border-surface-600/20" };
  }
}
