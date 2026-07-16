/* ── Enemy Database ──────────────────────────────────────────────
 * Central, shared enemy database combining curated SRD enemies
 * (with occult/demons filtered out) with homebrew enemies stored
 * in the campaign store. All enemy lookups go through this module.
 *
 * Filtering criteria: no Fiend type, no "demon" or "devil" in name,
 * no "occult" in tags/type. The DM can add these via homebrew if desired.
 * ──────────────────────────────────────────────────────────────── */
import { useCampaignStore } from "@/stores/campaignStore";

/* ── Enemy Template (universal shape) ──────────────────────── */
export interface EnemyTemplate {
  id: string;
  name: string;
  cr: number;
  ac: number;
  hp: number;
  type: string;
  subType?: string;
  source: string;        // "SRD" | "Homebrew"
  img?: string;
}

/* ── SRD Enemy Catalog — occult/demons filtered out ─────────── */
const SRD_ENEMIES: EnemyTemplate[] = [
  // ── Humanoids ──
  { id: "bandit", name: "Bandit", cr: 0.125, ac: 12, hp: 11, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "bandit_captain", name: "Bandit Captain", cr: 2, ac: 15, hp: 65, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "cultist", name: "Cultist", cr: 0.125, ac: 12, hp: 9, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "cult_fanatic", name: "Cult Fanatic", cr: 2, ac: 13, hp: 33, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "guard", name: "Guard", cr: 0.125, ac: 16, hp: 11, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "knight", name: "Knight", cr: 3, ac: 18, hp: 52, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "scout", name: "Scout", cr: 0.5, ac: 13, hp: 16, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "spy", name: "Spy", cr: 1, ac: 12, hp: 27, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "thug", name: "Thug", cr: 0.5, ac: 11, hp: 32, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "veteran", name: "Veteran", cr: 3, ac: 17, hp: 58, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "assassin", name: "Assassin", cr: 8, ac: 15, hp: 78, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "gladiator", name: "Gladiator", cr: 5, ac: 16, hp: 112, type: "Humanoid", subType: "any race", source: "SRD" },
  { id: "tribal_warrior", name: "Tribal Warrior", cr: 0.125, ac: 12, hp: 11, type: "Humanoid", subType: "any race", source: "SRD" },

  // ── Goblinoids ──
  { id: "goblin", name: "Goblin", cr: 0.25, ac: 15, hp: 7, type: "Humanoid", subType: "goblinoid", source: "SRD" },
  { id: "hobgoblin", name: "Hobgoblin", cr: 0.5, ac: 18, hp: 11, type: "Humanoid", subType: "goblinoid", source: "SRD" },
  { id: "bugbear", name: "Bugbear", cr: 1, ac: 16, hp: 27, type: "Humanoid", subType: "goblinoid", source: "SRD" },
  { id: "goblin_boss", name: "Goblin Boss", cr: 1, ac: 17, hp: 21, type: "Humanoid", subType: "goblinoid", source: "SRD" },

  // ── Undead (no demons/fiends) ──
  { id: "skeleton", name: "Skeleton", cr: 0.25, ac: 13, hp: 13, type: "Undead", source: "SRD" },
  { id: "zombie", name: "Zombie", cr: 0.25, ac: 8, hp: 22, type: "Undead", source: "SRD" },
  { id: "ghoul", name: "Ghoul", cr: 1, ac: 12, hp: 22, type: "Undead", source: "SRD" },
  { id: "wight", name: "Wight", cr: 3, ac: 14, hp: 45, type: "Undead", source: "SRD" },
  { id: "specter", name: "Specter", cr: 1, ac: 12, hp: 22, type: "Undead", source: "SRD" },
  { id: "will-o-wisp", name: "Will-o'-Wisp", cr: 2, ac: 19, hp: 22, type: "Undead", source: "SRD" },
  { id: "banshee", name: "Banshee", cr: 4, ac: 12, hp: 58, type: "Undead", source: "SRD" },
  { id: "vampire_spawn", name: "Vampire Spawn", cr: 5, ac: 15, hp: 82, type: "Undead", source: "SRD" },
  { id: "mummy", name: "Mummy", cr: 3, ac: 11, hp: 58, type: "Undead", source: "SRD" },
  { id: "mummy_lord", name: "Mummy Lord", cr: 15, ac: 17, hp: 97, type: "Undead", source: "SRD" },
  { id: "ghost", name: "Ghost", cr: 4, ac: 11, hp: 45, type: "Undead", source: "SRD" },
  { id: "lich", name: "Lich", cr: 21, ac: 17, hp: 135, type: "Undead", source: "SRD" },

  // ── Beasts ──
  { id: "wolf", name: "Wolf", cr: 0.25, ac: 13, hp: 11, type: "Beast", source: "SRD" },
  { id: "dire_wolf", name: "Dire Wolf", cr: 1, ac: 14, hp: 37, type: "Beast", source: "SRD" },
  { id: "giant_spider", name: "Giant Spider", cr: 1, ac: 14, hp: 26, type: "Beast", source: "SRD" },
  { id: "giant_rat", name: "Giant Rat", cr: 0.125, ac: 12, hp: 7, type: "Beast", source: "SRD" },
  { id: "giant_badger", name: "Giant Badger", cr: 0.25, ac: 10, hp: 13, type: "Beast", source: "SRD" },
  { id: "giant_boar", name: "Giant Boar", cr: 2, ac: 12, hp: 42, type: "Beast", source: "SRD" },
  { id: "giant_eagle", name: "Giant Eagle", cr: 1, ac: 13, hp: 26, type: "Beast", source: "SRD" },
  { id: "lion", name: "Lion", cr: 1, ac: 12, hp: 26, type: "Beast", source: "SRD" },
  { id: "tiger", name: "Tiger", cr: 1, ac: 12, hp: 30, type: "Beast", source: "SRD" },
  { id: "bear_black", name: "Black Bear", cr: 0.5, ac: 11, hp: 19, type: "Beast", source: "SRD" },
  { id: "bear_brown", name: "Brown Bear", cr: 1, ac: 11, hp: 34, type: "Beast", source: "SRD" },
  { id: "giant_constrictor", name: "Giant Constrictor Snake", cr: 2, ac: 12, hp: 60, type: "Beast", source: "SRD" },
  { id: "giant_scorpion", name: "Giant Scorpion", cr: 3, ac: 15, hp: 52, type: "Beast", source: "SRD" },
  { id: "giant_vulture", name: "Giant Vulture", cr: 1, ac: 10, hp: 22, type: "Beast", source: "SRD" },
  { id: "swarm_of_rats", name: "Swarm of Rats", cr: 0.25, ac: 10, hp: 24, type: "Beast", source: "SRD" },
  { id: "swarm_of_ravens", name: "Swarm of Ravens", cr: 0.25, ac: 12, hp: 24, type: "Beast", source: "SRD" },

  // ── Elementals (no demons) ──
  { id: "earth_elemental", name: "Earth Elemental", cr: 5, ac: 17, hp: 126, type: "Elemental", source: "SRD" },
  { id: "air_elemental", name: "Air Elemental", cr: 5, ac: 15, hp: 90, type: "Elemental", source: "SRD" },
  { id: "fire_elemental", name: "Fire Elemental", cr: 5, ac: 13, hp: 102, type: "Elemental", source: "SRD" },
  { id: "water_elemental", name: "Water Elemental", cr: 5, ac: 14, hp: 114, type: "Elemental", source: "SRD" },
  { id: "mud_mephit", name: "Mud Mephit", cr: 0.25, ac: 11, hp: 27, type: "Elemental", source: "SRD" },
  { id: "smoke_mephit", name: "Smoke Mephit", cr: 0.25, ac: 12, hp: 22, type: "Elemental", source: "SRD" },
  { id: "ice_mephit", name: "Ice Mephit", cr: 0.5, ac: 11, hp: 21, type: "Elemental", source: "SRD" },
  { id: "magma_mephit", name: "Magma Mephit", cr: 0.5, ac: 11, hp: 22, type: "Elemental", source: "SRD" },
  { id: "invisible_stalker", name: "Invisible Stalker", cr: 6, ac: 14, hp: 104, type: "Elemental", source: "SRD" },
  { id: "galeb_duhr", name: "Galeb Duhr", cr: 6, ac: 16, hp: 85, type: "Elemental", source: "SRD" },
  { id: "dao", name: "Dao", cr: 11, ac: 18, hp: 187, type: "Elemental", source: "SRD" },
  { id: "marid", name: "Marid", cr: 11, ac: 17, hp: 229, type: "Elemental", source: "SRD" },

  // ── Monstrosities ──
  { id: "displacer_beast", name: "Displacer Beast", cr: 3, ac: 13, hp: 85, type: "Monstrosity", source: "SRD" },
  { id: "manticore", name: "Manticore", cr: 3, ac: 14, hp: 68, type: "Monstrosity", source: "SRD" },
  { id: "owlbear", name: "Owlbear", cr: 3, ac: 13, hp: 59, type: "Monstrosity", source: "SRD" },
  { id: "gorgon", name: "Gorgon", cr: 5, ac: 19, hp: 114, type: "Monstrosity", source: "SRD" },
  { id: "chimera", name: "Chimera", cr: 6, ac: 14, hp: 114, type: "Monstrosity", source: "SRD" },
  { id: "basilisk", name: "Basilisk", cr: 3, ac: 12, hp: 52, type: "Monstrosity", source: "SRD" },
  { id: "griffon", name: "Griffon", cr: 2, ac: 12, hp: 59, type: "Monstrosity", source: "SRD" },
  { id: "hippogriff", name: "Hippogriff", cr: 1, ac: 11, hp: 19, type: "Monstrosity", source: "SRD" },
  { id: "cockatrice", name: "Cockatrice", cr: 0.5, ac: 11, hp: 27, type: "Monstrosity", source: "SRD" },
  { id: "kraken", name: "Kraken", cr: 23, ac: 18, hp: 472, type: "Monstrosity", source: "SRD" },
  { id: "roc", name: "Roc", cr: 11, ac: 15, hp: 248, type: "Monstrosity", source: "SRD" },
  { id: "hydra", name: "Hydra", cr: 8, ac: 15, hp: 172, type: "Monstrosity", source: "SRD" },
  { id: "minotaur", name: "Minotaur", cr: 3, ac: 14, hp: 76, type: "Monstrosity", source: "SRD" },
  { id: "harpy", name: "Harpy", cr: 1, ac: 11, hp: 38, type: "Monstrosity", source: "SRD" },
  { id: "medusa", name: "Medusa", cr: 6, ac: 15, hp: 136, type: "Monstrosity", source: "SRD" },

  // ── Dragons ──
  { id: "young_red_dragon", name: "Young Red Dragon", cr: 10, ac: 18, hp: 178, type: "Dragon", source: "SRD" },
  { id: "young_green_dragon", name: "Young Green Dragon", cr: 8, ac: 18, hp: 136, type: "Dragon", source: "SRD" },
  { id: "young_blue_dragon", name: "Young Blue Dragon", cr: 9, ac: 18, hp: 152, type: "Dragon", source: "SRD" },
  { id: "young_black_dragon", name: "Young Black Dragon", cr: 7, ac: 18, hp: 127, type: "Dragon", source: "SRD" },
  { id: "young_white_dragon", name: "Young White Dragon", cr: 6, ac: 17, hp: 133, type: "Dragon", source: "SRD" },
  { id: "adult_red_dragon", name: "Adult Red Dragon", cr: 17, ac: 22, hp: 256, type: "Dragon", source: "SRD" },
  { id: "adult_green_dragon", name: "Adult Green Dragon", cr: 15, ac: 19, hp: 207, type: "Dragon", source: "SRD" },
  { id: "ancient_red_dragon", name: "Ancient Red Dragon", cr: 24, ac: 22, hp: 546, type: "Dragon", source: "SRD" },
  { id: "dragon_wyrmling_red", name: "Red Dragon Wyrmling", cr: 4, ac: 17, hp: 75, type: "Dragon", source: "SRD" },
  { id: "dragon_wyrmling_green", name: "Green Dragon Wyrmling", cr: 2, ac: 17, hp: 38, type: "Dragon", source: "SRD" },
  { id: "wyvern", name: "Wyvern", cr: 6, ac: 13, hp: 110, type: "Dragon", source: "SRD" },
  { id: "pseudodragon", name: "Pseudodragon", cr: 0.25, ac: 13, hp: 7, type: "Dragon", source: "SRD" },

  // ── Giants ──
  { id: "hill_giant", name: "Hill Giant", cr: 5, ac: 13, hp: 105, type: "Giant", source: "SRD" },
  { id: "stone_giant", name: "Stone Giant", cr: 7, ac: 17, hp: 126, type: "Giant", source: "SRD" },
  { id: "frost_giant", name: "Frost Giant", cr: 8, ac: 15, hp: 138, type: "Giant", source: "SRD" },
  { id: "fire_giant", name: "Fire Giant", cr: 9, ac: 18, hp: 162, type: "Giant", source: "SRD" },
  { id: "cloud_giant", name: "Cloud Giant", cr: 9, ac: 14, hp: 200, type: "Giant", source: "SRD" },
  { id: "storm_giant", name: "Storm Giant", cr: 13, ac: 16, hp: 230, type: "Giant", source: "SRD" },
  { id: "ettin", name: "Ettin", cr: 4, ac: 12, hp: 85, type: "Giant", source: "SRD" },
  { id: "ogre", name: "Ogre", cr: 2, ac: 11, hp: 59, type: "Giant", source: "SRD" },
  { id: "troll", name: "Troll", cr: 5, ac: 15, hp: 84, type: "Giant", source: "SRD" },

  // ── Constructs ──
  { id: "animated_armor", name: "Animated Armor", cr: 1, ac: 18, hp: 33, type: "Construct", source: "SRD" },
  { id: "flying_sword", name: "Flying Sword", cr: 0.25, ac: 17, hp: 17, type: "Construct", source: "SRD" },
  { id: "rug_of_smothering", name: "Rug of Smothering", cr: 2, ac: 12, hp: 33, type: "Construct", source: "SRD" },
  { id: "stone_golem", name: "Stone Golem", cr: 10, ac: 17, hp: 178, type: "Construct", source: "SRD" },
  { id: "iron_golem", name: "Iron Golem", cr: 16, ac: 20, hp: 210, type: "Construct", source: "SRD" },
  { id: "clay_golem", name: "Clay Golem", cr: 9, ac: 14, hp: 133, type: "Construct", source: "SRD" },
  { id: "flesh_golem", name: "Flesh Golem", cr: 5, ac: 9, hp: 93, type: "Construct", source: "SRD" },
  { id: "shield_guardian", name: "Shield Guardian", cr: 7, ac: 17, hp: 142, type: "Construct", source: "SRD" },
  { id: "helmed_horror", name: "Helmed Horror", cr: 4, ac: 20, hp: 60, type: "Construct", source: "SRD" },

  // ── Plants ──
  { id: "treant", name: "Treant", cr: 9, ac: 16, hp: 138, type: "Plant", source: "SRD" },
  { id: "shambling_mound", name: "Shambling Mound", cr: 5, ac: 15, hp: 136, type: "Plant", source: "SRD" },
  { id: "twig_blight", name: "Twig Blight", cr: 0.125, ac: 13, hp: 4, type: "Plant", source: "SRD" },
  { id: "needle_blight", name: "Needle Blight", cr: 0.25, ac: 12, hp: 11, type: "Plant", source: "SRD" },
  { id: "vine_blight", name: "Vine Blight", cr: 0.5, ac: 12, hp: 26, type: "Plant", source: "SRD" },
  { id: "gas_spore", name: "Gas Spore", cr: 0.5, ac: 5, hp: 1, type: "Plant", source: "SRD" },
  { id: "violet_fungus", name: "Violet Fungus", cr: 0.25, ac: 5, hp: 18, type: "Plant", source: "SRD" },

  // ── Fey ──
  { id: "dryad", name: "Dryad", cr: 1, ac: 11, hp: 22, type: "Fey", source: "SRD" },
  { id: "satyr", name: "Satyr", cr: 0.5, ac: 14, hp: 31, type: "Fey", source: "SRD" },
  { id: "sprite", name: "Sprite", cr: 0.25, ac: 15, hp: 2, type: "Fey", source: "SRD" },
  { id: "pixie", name: "Pixie", cr: 0.25, ac: 15, hp: 1, type: "Fey", source: "SRD" },
  { id: "blink_dog", name: "Blink Dog", cr: 0.25, ac: 13, hp: 22, type: "Fey", source: "SRD" },
  { id: "hag_green", name: "Green Hag", cr: 3, ac: 17, hp: 82, type: "Fey", source: "SRD" },
  { id: "hag_night", name: "Night Hag", cr: 5, ac: 17, hp: 112, type: "Fey", source: "SRD" },
  { id: "hag_sea", name: "Sea Hag", cr: 2, ac: 14, hp: 52, type: "Fey", source: "SRD" },
];

/* ── XP by CR ──────────────────────────────────────────────── */
export const XP_BY_CR: Record<number, number> = {
  0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
  1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
  6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
  11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
  16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
  21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000,
  26: 90000, 27: 105000, 28: 120000, 29: 135000, 30: 155000,
};

/* ── Core Lookup Functions ──────────────────────────────────── */

/** Get ALL available enemies (SRD + homebrew from campaign store). */
export function getAllEnemies(): EnemyTemplate[] {
  const state = useCampaignStore.getState();
  const homebrewEnemies: EnemyTemplate[] = (state.enemies ?? []).map((e) => ({
    id: e.id ?? `hb_${e.name?.toLowerCase().replace(/\s+/g, "_")}`,
    name: e.name,
    cr: e.challengeRating ?? 1,
    ac: e.armorClass ?? 10,
    hp: e.hitPoints?.max ?? e.hitPoints?.current ?? 10,
    type: e.type ?? "Custom",
    source: "Homebrew" as const,
  }));
  return [...SRD_ENEMIES, ...homebrewEnemies];
}

/** Get enemy by ID (checks SRD first, then homebrew). */
export function getEnemyById(id: string): EnemyTemplate | undefined {
  // Try SRD
  const srd = SRD_ENEMIES.find((e) => e.id === id);
  if (srd) return srd;

  // Try homebrew from campaign store
  const state = useCampaignStore.getState();
  const hb = (state.enemies ?? []).find((e) => e.id === id);
  if (hb) {
    return {
      id: hb.id,
      name: hb.name,
      cr: hb.challengeRating ?? 1,
      ac: hb.armorClass ?? 10,
      hp: hb.hitPoints?.max ?? hb.hitPoints?.current ?? 10,
      type: hb.type ?? "Custom",
      source: "Homebrew" as const,
    };
  }
  return undefined;
}

/** Search enemies by query (name, type, subtype). Merges SRD + homebrew. */
export function searchEnemies(query: string): EnemyTemplate[] {
  const all = getAllEnemies();
  if (!query.trim()) return all;
  const q = query.toLowerCase();
  return all.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      e.subType?.toLowerCase().includes(q),
  );
}

/** Get enemy image path, or return default based on type. */
export function getEnemyImg(enemy: EnemyTemplate): string {
  if (enemy.img) return enemy.img;
  // Default icons by type — SVG tokens in public/images/tokens/
  const iconMap: Record<string, string> = {
    Humanoid: "/images/tokens/Goblin.svg",
    Undead: "/images/tokens/Skeleton.svg",
    Beast: "/images/tokens/Wolf.svg",
    Dragon: "/images/tokens/Dragon.svg",
    Elemental: "/images/tokens/Elemental.svg",
    Giant: "/images/tokens/Giant.svg",
    Monstrosity: "/images/tokens/Monster.svg",
    Construct: "/images/tokens/Golem.svg",
    Plant: "/images/tokens/Plant.svg",
    Fey: "/images/tokens/Fey.svg",
  };
  return iconMap[enemy.type] ?? "/images/tokens/Hero.svg";
}
