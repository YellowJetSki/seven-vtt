/**
 * STᚱ VTT — Inventory Utilities
 *
 * Shared constants and pure functions for inventory management.
 * Extracted from PlayerSheetInventoryTab.tsx monolith (Sprint 8 refactor).
 */

// ── Item category detection ──

export type ItemCategory = "weapon" | "armor" | "potion" | "scroll" | "ring" | "wand" | "food" | "tool" | "other";

export function detectCategory(name: string): ItemCategory {
  const low = name.toLowerCase();
  if (["potion", "elixir", "tincture", "philter", "draught"].some((k) => low.includes(k))) return "potion";
  if (["scroll", "spell scroll", "parchment"].some((k) => low.includes(k))) return "scroll";
  if (["ring", "band", "circlet"].some((k) => low.includes(k))) return "ring";
  if (["wand", "rod", "scepter"].some((k) => low.includes(k))) return "wand";
  if (["food", "ration", "bread", "meat", "fruit", "wine", "ale"].some((k) => low.includes(k))) return "food";
  if (
    [
      "sword", "axe", "bow", "dagger", "hammer", "mace", "spear", "staff", "blade",
      "greatsword", "longsword", "rapier", "shortsword", "scimitar", "whip", "flail",
      "lance", "pike", "halberd", "glaive", "trident", "club", "quarterstaff",
      "javelin", "dart", "sling", "crossbow", "longbow", "shortbow",
    ].some((k) => low.includes(k))
  )
    return "weapon";
  if (
    ["armor", "plate", "chain", "leather", "scale", "shield", "helm", "helmet",
      "bracers", "greaves", "boots", "cloak", "robe", "gloves", "barding",
    ].some((k) => low.includes(k))
  )
    return "armor";
  if (["tool", "kit", "pick", "shovel", "crowbar", "hammer", "lantern", "rope", "lockpick", "thieves"].some((k) => low.includes(k)))
    return "tool";
  return "other";
}

export function categoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    weapon: "\u2694\uFE0F",
    armor: "\uD83D\uDEE1\uFE0F",
    potion: "\uD83E\uDDEA",
    scroll: "\uD83D\uDCDC",
    ring: "\uD83D\uDC8D",
    wand: "\uD83E\uDE84",
    food: "\uD83C\uDF5E",
    tool: "\uD83D\uDD27",
    other: "\uD83D\uDCE6",
  };
  return icons[cat] || "\uD83D\uDCE6";
}

// ── Category meta (colors, descriptions) ──

export interface CategoryMeta {
  key: ItemCategory | "all";
  label: string;
  icon: string;
  color: string;
  barColor: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  weapon: { key: "weapon", label: "Weapons", icon: "\u2694\uFE0F", color: "text-red-400", barColor: "bg-rose-500" },
  armor: { key: "armor", label: "Armor", icon: "\uD83D\uDEE1\uFE0F", color: "text-cyan-400", barColor: "bg-cyan-500" },
  potion: { key: "potion", label: "Potions", icon: "\uD83E\uDDEA", color: "text-emerald-400", barColor: "bg-emerald-500" },
  scroll: { key: "scroll", label: "Scrolls", icon: "\uD83D\uDCDC", color: "text-amber-400", barColor: "bg-amber-500" },
  ring: { key: "ring", label: "Rings", icon: "\uD83D\uDC8D", color: "text-violet-400", barColor: "bg-violet-500" },
  wand: { key: "wand", label: "Wands", icon: "\uD83E\uDE84", color: "text-pink-400", barColor: "bg-pink-500" },
  food: { key: "food", label: "Food", icon: "\uD83C\uDF5E", color: "text-orange-400", barColor: "bg-orange-500" },
  tool: { key: "tool", label: "Tools", icon: "\uD83D\uDD27", color: "text-slate-400", barColor: "bg-slate-500" },
  other: { key: "other", label: "Other", icon: "\uD83D\uDCE6", color: "text-surface-400", barColor: "bg-surface-500" },
};

export const INVENTORY_CATEGORIES: { key: "all" | ItemCategory; icon: string; label: string }[] = [
  { key: "all", icon: "\uD83D\uDCE6", label: "All" },
  { key: "weapon", icon: "\u2694\uFE0F", label: "Weapons" },
  { key: "armor", icon: "\uD83D\uDEE1\uFE0F", label: "Armor" },
  { key: "potion", icon: "\uD83E\uDDEA", label: "Potions" },
  { key: "scroll", icon: "\uD83D\uDCDC", label: "Scrolls" },
  { key: "ring", icon: "\uD83D\uDC8D", label: "Rings" },
  { key: "wand", icon: "\uD83E\uDE84", label: "Wands" },
  { key: "food", icon: "\uD83C\uDF5E", label: "Food" },
  { key: "tool", icon: "\uD83D\uDD27", label: "Tools" },
];

// ── Sort types ──

export type SortField = "name" | "weight" | "category";
export type SortDirection = "asc" | "desc";

export function sortInventory<T extends { name: string; weight?: number }>(
  items: T[],
  field: SortField,
  dir: SortDirection
): T[] {
  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    if (field === "name") cmp = a.name.localeCompare(b.name);
    else if (field === "weight") cmp = (a.weight || 0) - (b.weight || 0);
    else if (field === "category") cmp = detectCategory(a.name).localeCompare(detectCategory(b.name));
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}
