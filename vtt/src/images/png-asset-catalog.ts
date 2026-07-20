#!/usr/bin/env node
// Generated file — Asset Catalog with PNG references
// DO NOT EDIT MANUALLY — edit scripts/generate-asset-catalog.mjs instead

// Asset file paths are relative to the public/ directory
// They are accessible at runtime via /images/{category}/{filename}

export interface AssetEntry {
  id: string;
  label: string;
  category: "portrait" | "token" | "map" | "item";
  /** Path to the PNG file in the public directory, or null for SVG-only assets */
  imageUrl: string | null;
  /** Dominant color for placeholder bg */
  color: string;
  /** Suggested usage tags */
  tags: string[];
}

// ─── PNG Asset References (from /public/images/) ───
// These are available at runtime as static assets served by Vite.

const PNG_ASSETS: AssetEntry[] = [
  // ── Items ──
  { id: "pitem-accordion-01", label: "Accordion", category: "item", imageUrl: "/images/items/accordion_item.png", color: "#78350f", tags: ["item", "instrument", "trade good"] },
  { id: "pitem-chauzy-map-01", label: "Chauzy's Map", category: "item", imageUrl: "/images/items/chauzy_map_item.png", color: "#1e293b", tags: ["item", "map", "quest"] },
  { id: "pitem-duku-belt-01", label: "Duku's Belt", category: "item", imageUrl: "/images/items/duku_belt_item.png", color: "#78350f", tags: ["item", "belt", "armor"] },
  { id: "pitem-tudul-ring-01", label: "Tudul's Ring", category: "item", imageUrl: "/images/items/tudul_ring_item.png", color: "#fbbf24", tags: ["item", "ring", "magic"] },
  { id: "pitem-t-pin-01", label: "T-Pin", category: "item", imageUrl: "/images/items/t_pin_item.png", color: "#94a3b8", tags: ["item", "pin", "tool"] },
  { id: "pitem-wendy-belt-01", label: "Wendy's Belt", category: "item", imageUrl: "/images/items/wendy_belt_item.png", color: "#78350f", tags: ["item", "belt", "armor"] },
  { id: "pitem-wendy-parents-01", label: "Wendy's Parents", category: "item", imageUrl: "/images/items/wendy_parents_item.png", color: "#047857", tags: ["item", "photo", "quest"] },
  { id: "pitem-wendy-resto-01", label: "Wendy's Restorative", category: "item", imageUrl: "/images/items/wendy_resto_item.png", color: "#059669", tags: ["item", "potion", "consumable"] },

  // ── Portraits ──
  { id: "pport-kehrfuffle-01", label: "Kehrfuffle", category: "portrait", imageUrl: "/images/portraits/kehrfuffle_portrait.png", color: "#7c3aed", tags: ["portrait", "character", "kehrfuffle"] },
  { id: "pport-strider-01", label: "Strider", category: "portrait", imageUrl: "/images/portraits/strider_portrait.png", color: "#059669", tags: ["portrait", "character", "strider"] },
  { id: "pport-toern-01", label: "Toern", category: "portrait", imageUrl: "/images/portraits/toern_portrait.png", color: "#d97706", tags: ["portrait", "character", "toern"] },
  { id: "pport-wendy-01", label: "Wendy", category: "portrait", imageUrl: "/images/portraits/wendy_portrait.png", color: "#dc2626", tags: ["portrait", "character", "wendy"] },

  // ── Tokens (Battle Map Icons) ──
  { id: "ptoken-bengo-01", label: "Bengo", category: "token", imageUrl: "/images/tokens/bengo_bm.png", color: "#65a30d", tags: ["token", "npc", "bengo"] },
  { id: "ptoken-geepo-01", label: "Geepo", category: "token", imageUrl: "/images/tokens/geepo_bm.png", color: "#2563eb", tags: ["token", "npc", "geepo"] },
  { id: "ptoken-hansel-01", label: "Hansel", category: "token", imageUrl: "/images/tokens/hansel_bm.png", color: "#d97706", tags: ["token", "npc", "hansel"] },
  { id: "ptoken-heago-01", label: "Heago", category: "token", imageUrl: "/images/tokens/heago_bm.png", color: "#7c3aed", tags: ["token", "npc", "heago"] },
  { id: "ptoken-jewl-01", label: "Jewl", category: "token", imageUrl: "/images/tokens/jewl_bm.png", color: "#ec4899", tags: ["token", "npc", "jewl"] },
  { id: "ptoken-kehrfuffle-01", label: "Kehrfuffle", category: "token", imageUrl: "/images/tokens/kehrfuffle_bm.png", color: "#7c3aed", tags: ["token", "npc", "kehrfuffle"] },
  { id: "ptoken-kort-01", label: "Kort", category: "token", imageUrl: "/images/tokens/kort_bm.png", color: "#dc2626", tags: ["token", "npc", "kort"] },
  { id: "ptoken-leeta-01", label: "Leeta", category: "token", imageUrl: "/images/tokens/leeta_bm.png", color: "#fbbf24", tags: ["token", "npc", "leeta"] },
  { id: "ptoken-pavel-01", label: "Pavel", category: "token", imageUrl: "/images/tokens/pavel_bm.png", color: "#2563eb", tags: ["token", "npc", "pavel"] },
  { id: "ptoken-scant-01", label: "Scant", category: "token", imageUrl: "/images/tokens/scant_bm.png", color: "#65a30d", tags: ["token", "npc", "scant"] },
  { id: "ptoken-scorpio-01", label: "Scorpio", category: "token", imageUrl: "/images/tokens/scorpio_bm.png", color: "#dc2626", tags: ["token", "creature", "scorpio"] },
  { id: "ptoken-screwbeard-01", label: "Screwbeard", category: "token", imageUrl: "/images/tokens/screwbeard_bm.png", color: "#d97706", tags: ["token", "npc", "screwbeard"] },
  { id: "ptoken-strider-01", label: "Strider", category: "token", imageUrl: "/images/tokens/strider_bm.png", color: "#059669", tags: ["token", "npc", "strider"] },
  { id: "ptoken-toern-01", label: "Toern", category: "token", imageUrl: "/images/tokens/toern_bm.png", color: "#d97706", tags: ["token", "npc", "toern"] },
  { id: "ptoken-wendy-01", label: "Wendy", category: "token", imageUrl: "/images/tokens/wendy_bm.png", color: "#dc2626", tags: ["token", "npc", "wendy"] },

  // ── Maps (Battle Map Thumbnails) ──
  { id: "pmap-boathouse-01", label: "Boathouse", category: "map", imageUrl: "/images/maps/boathouse_enc.png", color: "#1e293b", tags: ["map", "boathouse", "encounter"] },
  { id: "pmap-prison-01", label: "Prison", category: "map", imageUrl: "/images/maps/prison_enc.png", color: "#334155", tags: ["map", "prison", "encounter"] },
  { id: "pmap-scorpion-01", label: "Scorpion Desert", category: "map", imageUrl: "/images/maps/scorpion_enc.png", color: "#78350f", tags: ["map", "desert", "encounter"] },
  { id: "pmap-screwbeard-cave-01", label: "Screwbeard's Cave", category: "map", imageUrl: "/images/maps/screwbeard_cave_enc.png", color: "#1c1917", tags: ["map", "cave", "encounter"] },
  { id: "pmap-tutorial-forest-01", label: "Tutorial Forest", category: "map", imageUrl: "/images/maps/tutorial_forest_enc.png", color: "#065f46", tags: ["map", "forest", "tutorial"] },
];

// ─── Indexed Maps ───

export const PNG_ASSETS_BY_CATEGORY: Record<string, AssetEntry[]> = {};
for (const asset of PNG_ASSETS) {
  if (!PNG_ASSETS_BY_CATEGORY[asset.category]) {
    PNG_ASSETS_BY_CATEGORY[asset.category] = [];
  }
  PNG_ASSETS_BY_CATEGORY[asset.category].push(asset);
}

export function getPngAssets(category: "portrait" | "token" | "map" | "item"): AssetEntry[] {
  return PNG_ASSETS_BY_CATEGORY[category] ?? [];
}

export function getPngAssetById(id: string): AssetEntry | undefined {
  return PNG_ASSETS.find((a) => a.id === id);
}

export function getPngAssetByName(name: string): AssetEntry | undefined {
  return PNG_ASSETS.find(
    (a) => a.label.toLowerCase() === name.toLowerCase()
  );
}
