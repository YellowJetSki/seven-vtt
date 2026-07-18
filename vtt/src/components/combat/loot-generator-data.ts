/* ── Loot Generator Static Data ─────────────────────────────────
 * Loot tables and shared types for the D&D 5e loot generator.
 * Extracted from LootGenerator.tsx to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

export type LootType = "coin" | "art" | "magic" | "mundane";

export interface LootEntry {
  id: string;
  name: string;
  type: LootType;
  quantity: number;
  value: number;
  description?: string;
  rarity?: string;
  assignedTo?: string;
}

/** Generate a unique ID for a loot entry */
export function lootUid(prefix = "loot"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const MUNDANE_LOOT = [
  { name: "Healer's Kit", value: 5, description: "10 uses, stabilizes dying" },
  { name: "Crowbar", value: 2, description: "Advantage on STR checks to pry open" },
  { name: "Hooded Lantern", value: 5, description: "30/60 ft light, can be shuttered" },
  { name: "Silk Rope (50ft)", value: 10, description: "16 STR check to break" },
  { name: "Magnifying Glass", value: 100, description: "Advantage on investigation" },
  { name: "Caltrops (bag)", value: 1, description: "5 ft square, 1 dmg, half speed" },
  { name: "Manacles", value: 2, description: "DC 20 STR check to break" },
  { name: "Signal Whistle", value: 0.5, description: "Audible up to 1 mile" },
  { name: "Sealing Wax", value: 0.5, description: "Red wax for letters" },
  { name: "Writing Ink (vial)", value: 10, description: "8 hours of writing" },
  { name: "Fine Clothes", value: 15, description: "Silk doublet with embroidery" },
];

export const ART_OBJECTS = [
  { name: "Silver Chalice", value: 25, description: "Engraved with elven vines" },
  { name: "Gold Ring", value: 50, description: "Set with a small garnet" },
  { name: "Jade Figurine", value: 75, description: "A frog in meditation pose" },
  { name: "Silk Tapestry", value: 100, description: "Depicts a forgotten battle" },
  { name: "Platinum Necklace", value: 200, description: "With sapphire pendant" },
  { name: "Ivory Chess Set", value: 250, description: "Intricately carved" },
  { name: "Crystal Decanter", value: 500, description: "Filled with ancient elven wine" },
  { name: "Enchanted Painting", value: 750, description: "The painting's subject winks" },
  { name: "Gilded Statue", value: 1000, description: "12-inch statue of a forgotten deity" },
];

export const MAGIC_ITEMS = [
  { name: "Potion of Healing", value: 50, rarity: "common", description: "2d4+2" },
  { name: "Spell Scroll (1st)", value: 75, rarity: "common", description: "One first-level spell" },
  { name: "Bag of Holding", value: 500, rarity: "uncommon", description: "500 lb, 64 cubic ft" },
  { name: "Cloak of Protection", value: 750, rarity: "uncommon", description: "+1 AC and saves" },
  { name: "Boots of Elvenkind", value: 500, rarity: "uncommon", description: "Silent movement" },
  { name: "Goggles of Night", value: 500, rarity: "uncommon", description: "Darkvision 60ft" },
  { name: "Wand of Magic Missiles", value: 1000, rarity: "uncommon", description: "7 charges" },
  { name: "Bracers of Archery", value: 1500, rarity: "uncommon", description: "+2 damage bows" },
  { name: "Sword of Vengeance", value: 2000, rarity: "rare", description: "Cursed curseling sword" },
  { name: "Ring of Protection", value: 3000, rarity: "rare", description: "+1 AC and saves" },
  { name: "Staff of Healing", value: 5000, rarity: "rare", description: "10 charges, various heals" },
  { name: "Flame Tongue (Longsword)", value: 8000, rarity: "rare", description: "2d6 fire on hit" },
  { name: "Portable Hole", value: 5000, rarity: "rare", description: "6 ft diameter, 10 ft deep" },
  { name: "Winged Boots", value: 4000, rarity: "rare", description: "4 hours flight per day" },
  { name: "Amulet of Health", value: 6000, rarity: "rare", description: "CON = 19" },
];
