/**
 * STᚱ VTT — Asset Catalog
 *
 * Central registry of all built-in visual assets organized by type.
 * Each asset has: id, label, category, type suffix, and SVG icon path.
 *
 * The DM can browse and select these assets from:
 * - PlayerCreateModal → portrait picker
 * - MapCreatorModal → map thumbnail picker
 * - TokenInspector → token icon picker
 * - ItemForm → item image picker
 *
 * Categories map to the suffix convention:
 * _portrait → Player character portraits
 * _token    → Battle-map token icons
 * _map      → Battle-map thumbnails
 * _item     → Item/spell icons
 */

// ─── Portraits: Player Character Face Avatars ───

export interface AssetEntry {
  id: string;
  label: string;
  category: AssetCategory;
  type: "portrait" | "token" | "map" | "item";
  /** SVG string — inline for zero-latency rendering */
  svg: string;
  /** Dominant color for placeholder bg */
  color: string;
  /** Suggested usage */
  tags: string[];
}

export type AssetCategory = "portrait" | "token" | "map" | "item";

function svgWrap(content: string, viewBox = "0 0 64 64"): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${content}</svg>`;
}

function circle(cx: number, cy: number, r: number, fill: string, stroke?: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="1.5"` : ""}/>`;
}

function path(d: string, fill: string, opacity = "1"): string {
  return `<path d="${d}" fill="${fill}" fill-opacity="${opacity}"/>`;
}

function rect(x: number, y: number, w: number, h: number, rx: number, fill: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
}

export const PORTRAIT_ASSETS: AssetEntry[] = [
  {
    id: "port-warrior-01",
    label: "Human Warrior",
    category: "portrait",
    type: "portrait",
    color: "#d97706",
    tags: ["human", "warrior", "male", "frontline"],
    svg: svgWrap(
      circle(32, 20, 14, "#1a1c2e") +
      circle(32, 20, 13, "#2a2d44") +
      circle(32, 18, 8, "#d4a574") +
      circle(29, 16, 1.5, "#1a1c2e") +
      circle(35, 16, 1.5, "#1a1c2e") +
      path("M28 26 Q32 30 36 26", "#8b5cf6") +
      path("M18 18 Q12 12 8 18", "#d97706") +
      path("M46 18 Q52 12 56 18", "#d97706")
    ),
  },
  {
    id: "port-elf-01",
    label: "Elven Ranger",
    category: "portrait",
    type: "portrait",
    color: "#059669",
    tags: ["elf", "ranger", "female", "ranged"],
    svg: svgWrap(
      circle(32, 20, 14, "#1a1c2e") +
      circle(32, 20, 13, "#2a2d44") +
      circle(32, 18, 8, "#d4a574") +
      circle(29, 16, 1.5, "#1a1c2e") +
      circle(35, 16, 1.5, "#1a1c2e") +
      path("M28 26 Q32 30 36 26", "#059669") +
      path("M12 28 Q8 24 10 18", "#059669") +
      path("M24 34 Q32 38 40 34", "#1a1c2e") +
      path("M14 14 L16 6 L18 14", "#059669") +
      path("M46 14 L48 6 L50 14", "#059669")
    ),
  },
  {
    id: "port-mage-01",
    label: "Human Wizard",
    category: "portrait",
    type: "portrait",
    color: "#7c3aed",
    tags: ["human", "wizard", "male", "arcane"],
    svg: svgWrap(
      circle(32, 20, 14, "#1a1c2e") +
      circle(32, 20, 13, "#2a2d44") +
      circle(32, 18, 8, "#d4a574") +
      circle(29, 16, 1.5, "#1a1c2e") +
      circle(35, 16, 1.5, "#1a1c2e") +
      path("M28 26 Q32 30 36 26", "#7c3aed") +
      path("M32 6 L34 2 L30 2 Z", "#7c3aed") +
      path("M12 22 Q8 18 10 14", "#7c3aed") +
      path("M52 22 Q56 18 54 14", "#7c3aed") +
      rect(18, 32, 28, 10, 2, "#1a1c2e")
    ),
  },
  {
    id: "port-rogue-01",
    label: "Halfling Rogue",
    category: "portrait",
    type: "portrait",
    color: "#dc2626",
    tags: ["halfling", "rogue", "female", "stealth"],
    svg: svgWrap(
      circle(32, 22, 12, "#1a1c2e") +
      circle(32, 22, 11, "#2a2d44") +
      circle(32, 20, 7, "#d4a574") +
      circle(29, 18, 1.2, "#1a1c2e") +
      circle(35, 18, 1.2, "#1a1c2e") +
      path("M29 26 Q32 29 35 26", "#dc2626") +
      path("M20 12 L16 4 L22 10", "#dc2626") +
      path("M24 32 Q32 36 40 32", "#1a1c2e")
    ),
  },
  {
    id: "port-dwarf-01",
    label: "Dwarf Cleric",
    category: "portrait",
    type: "portrait",
    color: "#2563eb",
    tags: ["dwarf", "cleric", "male", "healer"],
    svg: svgWrap(
      circle(32, 20, 14, "#1a1c2e") +
      circle(32, 20, 13, "#2a2d44") +
      circle(32, 18, 8, "#d4a574") +
      circle(29, 16, 1.5, "#1a1c2e") +
      circle(35, 16, 1.5, "#1a1c2e") +
      path("M28 26 Q32 30 36 26", "#2563eb") +
      path("M28 8 L32 4 L36 8", "#2563eb") +
      path("M32 4 L32 14", "#2563eb") +
      rect(16, 32, 32, 6, 2, "#1a1c2e") +
      path("M24 34 L32 38 L40 34", "#2563eb")
    ),
  },
  {
    id: "port-bard-01",
    label: "Half-Elf Bard",
    category: "portrait",
    type: "portrait",
    color: "#ec4899",
    tags: ["half-elf", "bard", "female", "support"],
    svg: svgWrap(
      circle(32, 20, 14, "#1a1c2e") +
      circle(32, 20, 13, "#2a2d44") +
      circle(32, 18, 8, "#d4a574") +
      circle(29, 16, 1.5, "#1a1c2e") +
      circle(35, 16, 1.5, "#1a1c2e") +
      path("M28 26 Q32 30 36 26", "#ec4899") +
      path("M14 18 Q10 14 12 10", "#ec4899") +
      path("M50 18 Q54 14 52 10", "#ec4899") +
      path("M22 34 Q32 40 42 34", "#1a1c2e") +
      path("M16 12 L18 8 L20 12", "#ec4899")
    ),
  },
];

// ─── Tokens: Battle-Map Token Icons ───

export const TOKEN_ASSETS: AssetEntry[] = [
  {
    id: "token-melee-01",
    label: "Sword & Shield",
    category: "token",
    type: "token",
    color: "#dc2626",
    tags: ["melee", "warrior", "frontline"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#dc2626") +
      path("M32 12 L32 36", "#d4a574") +
      path("M20 24 L44 24", "#d4a574") +
      path("M26 18 Q32 12 38 18", "#d4a574") +
      circle(32, 32, 8, "#dc2626")
    ),
  },
  {
    id: "token-ranged-01",
    label: "Bow",
    category: "token",
    type: "token",
    color: "#059669",
    tags: ["ranged", "archer", "ranger"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#059669") +
      path("M16 18 Q32 10 48 18 Q32 30 16 18", "#d4a574") +
      path("M48 18 L52 14", "#d4a574") +
      circle(32, 32, 8, "#059669")
    ),
  },
  {
    id: "token-mage-01",
    label: "Arcane Star",
    category: "token",
    type: "token",
    color: "#7c3aed",
    tags: ["caster", "wizard", "arcane"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#7c3aed") +
      path("M32 12 L34 28 L50 30 L34 32 L32 48 L30 32 L14 30 L30 28 Z", "#7c3aed") +
      circle(32, 32, 6, "#1a1c2e")
    ),
  },
  {
    id: "token-healer-01",
    label: "Holy Cross",
    category: "token",
    type: "token",
    color: "#2563eb",
    tags: ["healer", "cleric", "support"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#2563eb") +
      path("M22 16 L22 30 L8 30 L8 36 L22 36 L22 50 L28 50 L28 36 L42 36 L42 30 L28 30 L28 16 Z", "#2563eb") +
      circle(32, 32, 6, "#1a1c2e")
    ),
  },
  {
    id: "token-skull-01",
    label: "Skull (Undead)",
    category: "token",
    type: "token",
    color: "#a1a1aa",
    tags: ["undead", "enemy", "skull"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#a1a1aa") +
      circle(32, 28, 10, "#a1a1aa") +
      circle(28, 26, 2, "#1a1c2e") +
      circle(36, 26, 2, "#1a1c2e") +
      path("M28 34 Q32 38 36 34", "#1a1c2e") +
      rect(30, 30, 4, 5, 1, "#1a1c2e") +
      circle(32, 32, 6, "#a1a1aa")
    ),
  },
  {
    id: "token-beast-01",
    label: "Wolf (Beast)",
    category: "token",
    type: "token",
    color: "#d97706",
    tags: ["beast", "wolf", "animal"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#d97706") +
      path("M18 22 L14 12 L22 20", "#d97706") +
      path("M46 22 L50 12 L42 20", "#d97706") +
      circle(32, 28, 8, "#d97706") +
      circle(28, 26, 1.5, "#1a1c2e") +
      circle(36, 26, 1.5, "#1a1c2e") +
      path("M28 34 Q32 37 36 34", "#1a1c2e") +
      circle(32, 32, 5, "#1a1c2e")
    ),
  },
  {
    id: "token-dragon-01",
    label: "Dragon",
    category: "token",
    type: "token",
    color: "#dc2626",
    tags: ["dragon", "epic", "boss"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#dc2626") +
      path("M16 24 L10 16 L22 22", "#dc2626") +
      path("M48 24 L54 16 L42 22", "#dc2626") +
      path("M20 30 Q32 14 44 30", "#dc2626") +
      path("M28 36 L32 48 L36 36", "#dc2626") +
      circle(30, 26, 2, "#facc15") +
      circle(34, 26, 2, "#facc15") +
      circle(32, 32, 5, "#1a1c2e")
    ),
  },
  {
    id: "token-goblin-01",
    label: "Goblin",
    category: "token",
    type: "token",
    color: "#65a30d",
    tags: ["goblin", "humanoid", "small"],
    svg: svgWrap(
      circle(32, 32, 28, "#1a1c2e", "#65a30d") +
      circle(32, 26, 10, "#65a30d") +
      circle(28, 24, 2, "#1a1c2e") +
      circle(36, 24, 2, "#1a1c2e") +
      path("M28 32 Q32 36 36 32", "#1a1c2e") +
      path("M14 30 L10 24 L18 30", "#65a30d") +
      path("M50 30 L54 24 L46 30", "#65a30d") +
      circle(32, 32, 5, "#1a1c2e")
    ),
  },
];

// ─── Maps: Battle-Map Thumbnails ───

export const MAP_ASSETS: AssetEntry[] = [
  {
    id: "map-dungeon-01",
    label: "Dungeon Corridor",
    category: "map",
    type: "map",
    color: "#1e293b",
    tags: ["dungeon", "underground", "corridor"],
    svg: svgWrap(
      rect(4, 4, 56, 56, 4, "#0f172a") +
      rect(12, 4, 40, 56, 2, "#1e293b") +
      rect(12, 4, 40, 56, 2, "#334155") +
      rect(20, 4, 24, 56, 2, "#1e293b") +
      rect(20, 4, 24, 56, 2, "#475569") +
      rect(28, 4, 8, 56, 2, "#1e293b"),
      "0 0 64 64"
    ),
  },
  {
    id: "map-forest-01",
    label: "Forest Clearing",
    category: "map",
    type: "map",
    color: "#065f46",
    tags: ["forest", "outdoor", "clearing"],
    svg: svgWrap(
      rect(4, 4, 56, 56, 4, "#064e3b") +
      circle(16, 12, 8, "#065f46") +
      circle(50, 14, 10, "#065f46") +
      circle(10, 36, 6, "#065f46") +
      circle(54, 40, 8, "#065f46") +
      circle(32, 32, 16, "#047857") +
      circle(32, 32, 10, "#059669") +
      circle(32, 32, 4, "#a3e635"),
      "0 0 64 64"
    ),
  },
  {
    id: "map-tavern-01",
    label: "Tavern Interior",
    category: "map",
    type: "map",
    color: "#78350f",
    tags: ["tavern", "interior", "building"],
    svg: svgWrap(
      rect(4, 4, 56, 56, 4, "#451a03") +
      rect(8, 8, 48, 48, 2, "#78350f") +
      rect(14, 14, 36, 36, 2, "#92400e") +
      circle(32, 22, 4, "#fbbf24") +
      rect(16, 34, 8, 8, 2, "#b45309") +
      rect(40, 34, 8, 8, 2, "#b45309") +
      rect(30, 38, 4, 10, 1, "#b45309"),
      "0 0 64 64"
    ),
  },
  {
    id: "map-cave-01",
    label: "Cave Entrance",
    category: "map",
    type: "map",
    color: "#1c1917",
    tags: ["cave", "underground", "entrance"],
    svg: svgWrap(
      rect(4, 4, 56, 56, 4, "#0c0a09") +
      path("M12 60 Q20 20 32 12 Q44 20 52 60", "#292524") +
      path("M16 60 Q24 28 32 20 Q40 28 48 60", "#44403c") +
      path("M20 60 Q28 36 32 28 Q36 36 44 60", "#1c1917"),
      "0 0 64 64"
    ),
  },
  {
    id: "map-castle-01",
    label: "Castle Courtyard",
    category: "map",
    type: "map",
    color: "#334155",
    tags: ["castle", "courtyard", "stone"],
    svg: svgWrap(
      rect(4, 4, 56, 56, 4, "#0f172a") +
      rect(4, 4, 56, 12, 2, "#334155") +
      rect(4, 48, 56, 12, 2, "#334155") +
      rect(4, 4, 12, 56, 2, "#334155") +
      rect(48, 4, 12, 56, 2, "#334155") +
      rect(16, 16, 32, 32, 2, "#475569"),
      "0 0 64 64"
    ),
  },
];

// ─── Items: Equipment & Magic Item Icons ───

export const ITEM_ASSETS: AssetEntry[] = [
  {
    id: "item-sword-01",
    label: "Longsword",
    category: "item",
    type: "item",
    color: "#94a3b8",
    tags: ["weapon", "melee", "sword"],
    svg: svgWrap(
      rect(29, 4, 6, 40, 2, "#94a3b8") +
      rect(27, 44, 10, 4, 2, "#78350f") +
      rect(24, 48, 16, 4, 2, "#78350f") +
      rect(31, 48, 2, 8, 1, "#94a3b8") +
      circle(32, 8, 3, "#fbbf24"),
      "0 0 64 64"
    ),
  },
  {
    id: "item-shield-01",
    label: "Shield",
    category: "item",
    type: "item",
    color: "#2563eb",
    tags: ["armor", "shield", "defense"],
    svg: svgWrap(
      path("M32 6 Q16 14 14 32 Q16 50 32 58 Q48 50 50 32 Q48 14 32 6", "#2563eb") +
      path("M32 10 Q20 18 18 32 Q20 46 32 54 Q44 46 46 32 Q44 18 32 10", "#3b82f6") +
      path("M28 24 L36 24 L40 32 L32 40 L24 32 Z", "#93c5fd"),
      "0 0 64 64"
    ),
  },
  {
    id: "item-potion-01",
    label: "Health Potion",
    category: "item",
    type: "item",
    color: "#dc2626",
    tags: ["potion", "healing", "consumable"],
    svg: svgWrap(
      rect(26, 8, 12, 6, 2, "#dc2626") +
      rect(24, 14, 16, 38, 4, "#dc2626") +
      rect(26, 14, 12, 36, 3, "#ef4444") +
      rect(30, 18, 4, 4, 1, "#fca5a5") +
      rect(28, 28, 8, 2, 1, "#fca5a5") +
      rect(28, 34, 8, 2, 1, "#fca5a5"),
      "0 0 64 64"
    ),
  },
  {
    id: "item-ring-01",
    label: "Ring of Protection",
    category: "item",
    type: "item",
    color: "#fbbf24",
    tags: ["ring", "magic", "defense"],
    svg: svgWrap(
      circle(32, 32, 20, "none", "#fbbf24") +
      circle(32, 32, 16, "none", "#fbbf24") +
      circle(32, 32, 6, "#fbbf24") +
      circle(32, 32, 4, "#1a1c2e"),
      "0 0 64 64"
    ),
  },
  {
    id: "item-wand-01",
    label: "Arcane Wand",
    category: "item",
    type: "item",
    color: "#7c3aed",
    tags: ["wand", "magic", "arcane"],
    svg: svgWrap(
      rect(30, 10, 4, 40, 2, "#78350f") +
      rect(28, 10, 8, 6, 3, "#7c3aed") +
      circle(32, 8, 4, "#7c3aed") +
      circle(32, 8, 2, "#c4b5fd") +
      path("M26 50 L22 58 L42 58 L38 50", "#78350f"),
      "0 0 64 64"
    ),
  },
  {
    id: "item-scroll-01",
    label: "Spell Scroll",
    category: "item",
    type: "item",
    color: "#d97706",
    tags: ["scroll", "magic", "consumable"],
    svg: svgWrap(
      rect(22, 8, 20, 48, 4, "#d97706") +
      rect(24, 10, 16, 44, 3, "#fbbf24") +
      rect(26, 16, 12, 2, 1, "#92400e") +
      rect(26, 22, 12, 2, 1, "#92400e") +
      rect(26, 28, 8, 2, 1, "#92400e"),
      "0 0 64 64"
    ),
  },
  {
    id: "item-helm-01",
    label: "Helm of Brilliance",
    category: "item",
    type: "item",
    color: "#06b6d4",
    tags: ["armor", "helm", "magic"],
    svg: svgWrap(
      path("M20 42 Q20 16 32 10 Q44 16 44 42 Q38 46 32 48 Q26 46 20 42", "#06b6d4") +
      path("M22 38 Q22 20 32 14 Q42 20 42 38", "#22d3ee") +
      rect(28, 48, 8, 6, 2, "#06b6d4") +
      circle(32, 18, 3, "#fbbf24"),
      "0 0 64 64"
    ),
  },
  {
    id: "item-boots-01",
    label: "Boots of Speed",
    category: "item",
    type: "item",
    color: "#65a30d",
    tags: ["boots", "magic", "movement"],
    svg: svgWrap(
      path("M18 30 L18 52 Q20 54 24 54 L40 54 Q44 54 46 52 L46 30 Q46 24 40 22 L24 22 Q18 24 18 30", "#65a30d") +
      rect(22, 22, 20, 4, 2, "#4d7c0f") +
      path("M28 30 L30 44 L34 44 L36 30", "#4d7c0f") +
      path("M22 34 L24 46 L26 46 L24 34", "#4d7c0f") +
      path("M38 34 L40 46 L42 46 L42 34", "#4d7c0f"),
      "0 0 64 64"
    ),
  },
];

// ─── Master Asset Registry ───

export const ALL_ASSETS: AssetEntry[] = [
  ...PORTRAIT_ASSETS,
  ...TOKEN_ASSETS,
  ...MAP_ASSETS,
  ...ITEM_ASSETS,
];

export function getAssetsByCategory(category: AssetCategory): AssetEntry[] {
  return ALL_ASSETS.filter((a) => a.category === category);
}

export function getAssetById(id: string): AssetEntry | undefined {
  return ALL_ASSETS.find((a) => a.id === id);
}
