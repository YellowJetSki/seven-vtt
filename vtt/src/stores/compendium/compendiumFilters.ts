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
  let items = filters.showSRD ? [...SRD_ITEMS, ...userItems] : [...userItems];
  const q = filters.searchQuery.toLowerCase().trim();

  if (q) {
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.includes(q))
    );
  }
  if (filters.categoryFilter) {
    items = items.filter((i) => i.category === filters.categoryFilter);
  }
  return items;
}

export function getCompendiumSpells(
  userSpells: HomebrewSpell[],
  filters: CompendiumFilterState
): HomebrewSpell[] {
  let spells = filters.showSRD ? [...SRD_SPELLS, ...userSpells] : [...userSpells];
  const q = filters.searchQuery.toLowerCase().trim();

  if (q) {
    spells = spells.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.school.toLowerCase().includes(q)
    );
  }
  if (filters.schoolFilter) {
    spells = spells.filter((s) => s.school === filters.schoolFilter);
  }
  return spells;
}

export function getCompendiumFeats(
  userFeats: HomebrewFeat[],
  filters: CompendiumFilterState
): HomebrewFeat[] {
  let feats = filters.showSRD ? [...SRD_FEATS, ...userFeats] : [...userFeats];
  const q = filters.searchQuery.toLowerCase().trim();

  if (q) {
    feats = feats.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.tags.some((t) => t.includes(q))
    );
  }
  return feats;
}
