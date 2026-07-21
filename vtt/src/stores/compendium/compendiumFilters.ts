/**
 * STᚱ VTT — Compendium Search & Filter Helpers
 *
 * Pure functions that filter SRD + homebrew entries by search query,
 * category, school, or SRD toggle. All are deterministic and testable.
 */
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import { SRD_ITEMS, SRD_SPELLS, SRD_FEATS } from "./compendiumData";

export interface CompendiumFilterState {
  searchQuery: string;
  categoryFilter: string | null;
  schoolFilter: string | null;
  showSRD: boolean;
}

export function rarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common: "text-surface-400",
    uncommon: "text-emerald-400",
    rare: "text-amber-400",
    very_rare: "text-gold-400",
    legendary: "text-rose-400",
    artifact: "text-violet-400",
  };
  return map[rarity] ?? "text-surface-400";
}

export function getCompendiumItems(
  userItems: HomebrewItem[],
  filters: CompendiumFilterState
): HomebrewItem[] {
  // When showSRD is true, SRD_ITEMS are prepended statically, so we must
  // exclude any SRD items that may already exist in the persisted userItems
  // to prevent duplicate key errors in React rendering.
  const items = filters.showSRD
    ? [...SRD_ITEMS, ...userItems.filter((i) => !i.id.startsWith("srd_"))]
    : [...userItems];
  const q = filters.searchQuery.toLowerCase().trim();

  const filtered = q
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.tags.some((t) => t.includes(q))
      )
    : items;

  if (filters.categoryFilter) {
    return filtered.filter((i) => i.category === filters.categoryFilter);
  }
  return filtered;
}

export function getCompendiumSpells(
  userSpells: HomebrewSpell[],
  filters: CompendiumFilterState
): HomebrewSpell[] {
  // Exclude SRD-prefixed spells from userSpells when showSRD is true
  // to prevent duplicate IDs during React reconciliation.
  const spells = filters.showSRD
    ? [...SRD_SPELLS, ...userSpells.filter((s) => !s.id.startsWith("srd_"))]
    : [...userSpells];
  const q = filters.searchQuery.toLowerCase().trim();

  const filtered = q
    ? spells.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.school.toLowerCase().includes(q)
      )
    : spells;

  if (filters.schoolFilter) {
    return filtered.filter((s) => s.school === filters.schoolFilter);
  }
  return filtered;
}

export function getCompendiumFeats(
  userFeats: HomebrewFeat[],
  filters: CompendiumFilterState
): HomebrewFeat[] {
  // Exclude SRD-prefixed feats from userFeats when showSRD is true
  // to prevent duplicate IDs during React reconciliation.
  const feats = filters.showSRD
    ? [...SRD_FEATS, ...userFeats.filter((f) => !f.id.startsWith("srd_"))]
    : [...userFeats];
  const q = filters.searchQuery.toLowerCase().trim();

  if (q) {
    return feats.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some((t) => t.includes(q))
    );
  }
  return feats;
}
