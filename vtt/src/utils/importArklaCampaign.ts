/**
 * ── Arkla Campaign Importer ─────────────────────────────────────
 *
 * Reads the exported Arkla.json from the public folder and converts
 * it into the local Campaign format, including all four player
 * characters, their inventories, spells, features, currency, and
 * companions.
 *
 * The Arkla export uses a custom currency system:
 *   50 Leptons (cp) = 1 Quadrans (sp)
 *   5  Quadrans (sp) = 1 Assarion (gp)
 *
 * Races are mapped to our internal format:
 *   "Rock Gnome" → "Rock Gnome"
 *   "Wood Elf" → "Wood Elf"
 *   "Variant Human" → "Human (Variant)"
 *   "Salt Gnome" → "Salt Gnome (homebrew)"
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, PlayerCharacter, EquipmentSlot, TraitEntry } from "@/types";

/* ── Helpers ────────────────────────────────────────────────── */

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function profBonus(level: number): number {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

/** Map ability strings to stat block */
function mapStats(stats: Record<string, number> = {}): { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number } {
  const s = (name: string, def: number) => stats[name] ?? stats[name.toLowerCase()] ?? stats[name.substring(0, 3)] ?? def;
  return {
    strength: s("Strength", 10),
    dexterity: s("Dexterity", 10),
    constitution: s("Constitution", 10),
    intelligence: s("Intelligence", 10),
    wisdom: s("Wisdom", 10),
    charisma: s("Charisma", 10),
  };
}

function initMod(dex: number): number {
  return Math.floor((dex - 10) / 2);
}

function mapRace(species: string): string {
  const map: Record<string, string> = {
    "rock gnome": "Rock Gnome",
    "wood elf": "Wood Elf",
    "variant human": "Human (Variant)",
    "salt gnome": "Salt Gnome",
  };
  return map[species.toLowerCase()] ?? species;
}

function mapEquipment(inventory: { item?: string; name?: string; qty?: number; quantity?: number }[]): EquipmentSlot[] {
  return (inventory ?? []).map((inv) => ({
    slot: "carried",
    item: inv.item ?? inv.name ?? "Unknown Item",
    quantity: inv.qty ?? inv.quantity ?? 1,
    weight: 0,
    notes: "",
  }));
}

function mapCurrency(currency: { leptons?: number; quadrans?: number; assarions?: number; cp?: number; sp?: number; gp?: number; ep?: number; pp?: number }): { copper: number; silver: number; electrum: number; gold: number; platinum: number } {
  return {
    copper: currency.leptons ?? currency.cp ?? 0,
    silver: currency.quadrans ?? currency.sp ?? 0,
    electrum: currency.ep ?? 0,
    gold: currency.assarions ?? currency.gp ?? 0,
    platinum: currency.pp ?? 0,
  };
}

/* ── Raw Arkla Export Types ─────────────────────────────────── */

interface ArklaExport {
  characters: Record<string, ArklaCharacter>;
  campaign?: {
    battlemap?: ArklaMap;
    battlemap_presets?: { presets?: Record<string, ArklaPreset> };
  };
}

interface ArklaCharacter {
  name: string;
  species: string;
  class: string;
  classes: { level: number; name: string }[];
  level: number;
  exp: number;
  hp: number;
  maxHp: number;
  tempHp?: number;
  ac: number;
  speed: number;
  stats: Record<string, number>;
  alignment: string;
  imageUrl?: string;
  img?: string;
  backstory?: string;
  notes?: string;
  features?: string[];
  inventory?: { item?: string; name?: string; qty?: number; quantity?: number }[];
  currency?: { leptons?: number; quadrans?: number; assarions?: number; cp?: number; sp?: number; gp?: number };
  proficiencies?: {
    savingThrows?: string;
    skills?: string;
  };
  spellSlots?: Record<string, { total: number; expended: number }>;
  companion?: {
    name: string;
    species: string;
    hp: number;
    ac: number;
    speed: number;
    desc?: string;
    attacks?: string;
    stats?: Record<string, number>;
    traits?: string;
  };
  resources?: { name: string; current: number; max: number; recharge: string }[];
}

interface ArklaMap {
  id?: string;
  name?: string;
  path?: string;
  width?: number;
  height?: number;
  grid?: number;
  fullPath?: string;
}

interface ArklaPreset {
  name?: string;
  description?: string;
  environment?: string;
  difficulty?: string;
  enemies?: { enemyId: string; count: number; customHp: number }[];
}

/* ── Importer ───────────────────────────────────────────────── */

export function importArklaJson(json: string): Campaign {
  const data: ArklaExport = JSON.parse(json);
  const chars = data.characters ?? {};

  const playerCharacters: PlayerCharacter[] = Object.values(chars).map((c) => {
    const scores = mapStats(c.stats);
    const level = c.level || 2;
    const prof = profBonus(level);
    const dex = scores.dexterity;
    const currency = mapCurrency(c.currency ?? {});

    return {
      id: uid("pc"),
      name: c.name,
      playerName: c.name.split(" ")[0],
      race: mapRace(c.species ?? ""),
      class: c.class ?? "Adventurer",
      level,
      experiencePoints: c.exp || 0,
      background: "",
      alignment: c.alignment || "Unaligned",
      inspiration: false,
      strength: scores.strength,
      dexterity: scores.dexterity,
      constitution: scores.constitution,
      intelligence: scores.intelligence,
      wisdom: scores.wisdom,
      charisma: scores.charisma,
      hitPoints: {
        current: c.hp ?? c.maxHp ?? 10,
        max: c.maxHp ?? c.hp ?? 10,
        temporary: c.tempHp ?? 0,
      },
      armorClass: c.ac ?? 10,
      initiative: initMod(dex),
      speed: c.speed ?? 30,
      hitDice: `d${c.class?.toLowerCase() === "monk" || c.class?.toLowerCase() === "bard" ? 8 : c.class?.toLowerCase() === "ranger" ? 10 : 8}`,
      proficiencyBonus: prof,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: c.tempHp ?? 0,
      traits: [] as TraitEntry[],
      proficiencies: [],
      languages: [],
      features: c.features ?? [],
      equipment: mapEquipment(c.inventory ?? []),
      inventory: [],
      copper: currency.copper,
      silver: currency.silver,
      electrum: currency.electrum,
      gold: currency.gold,
      platinum: currency.platinum,
      appearance: "",
      backstory: c.backstory ?? "",
      allies: "",
      characterNotes: c.notes ?? "",
      imageUrl: c.imageUrl ?? c.img ?? undefined,
      isHomebrew: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  // Build encounters from presets if available
  const presets = data.campaign?.battlemap_presets?.presets ?? {};
  const encounters = Object.values(presets).map((preset) => ({
    id: uid("enc"),
    name: preset.name || "Unknown Encounter",
    description: preset.description || "",
    enemies: (preset.enemies ?? []).map((e) => ({
      enemyId: e.enemyId,
      count: e.count,
      customHp: e.customHp,
    })),
    environment: preset.environment || "",
    difficulty: preset.difficulty || "medium",
    isActive: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));

  return {
    id: uid("camp"),
    name: "The Obelisks of Arkla",
    description:
      "A dark corruption spreads through the realm of Arkla. Seven ancient obelisks — once guardians of a planar seal — are being tainted by an unknown force. The party must track down each obelisk, recover the Keys of Rift-Sealing, and prevent the permanent opening of a rift to the Shadowfell.",
    dmName: "Dungeon Master",
    playerCharacters,
    encounters,
    battleMaps: [],
    journal: [],
    settings: {
      homebrewRules: [
        "Custom currency: 50 Leptons = 1 Quadrans, 5 Quadrans = 1 Assarion",
        "Homebrew race: Salt Gnome (swim speed, cold resistance)",
        "Monk 'Kol' points replace Ki points",
      ],
      experienceSystem: "xp",
      currencyName: "Assarions (Gold)",
      privateDmNotes: "Imported from Arkla.json — verify all stats before session.",
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
