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
 *
 * Spells carry homebrew flags, companion data is preserved.
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, PlayerCharacter } from "@/types";

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
  tempHp: number;
  ac: number;
  speed: number;
  initiative: string;
  alignment: string;
  backstory: string;
  journal: string;
  notes: string;
  imageUrl: string;
  img: string;
  stats: {
    STR: number;
    DEX: number;
    CON: number;
    INT: number;
    WIS: number;
    CHA: number;
  };
  currency: {
    leptons: number;
    assarions: number;
    quadrans: number;
  };
  inventory: ArklaItem[];
  features: ArklaFeature[];
  spells: ArklaSpell[];
  proficiencies: {
    skills: string;
    savingThrows: string;
    languages: string;
    armor: string;
    weapons: string;
    tools: string;
  };
  spellSlots?: Record<string, { current: number; max: number }>;
  spellAttack?: string;
  spellSave?: number;
  companion?: ArklaCompanion;
  resources?: ArklaResource[];
  traits?: {
    personality: string;
    ideal: string;
    bond: string;
    flaws: string;
  };
  hitDice: { max: number; current: number; type: string };
  age: string;
  height: string;
  weight: string;
  hair: string;
  skin: string;
  eyes: string;
  deathSaves: { successes: number; failures: number };
  conditions: string[];
  isConcentrating: boolean;
  inspiration: boolean;
  theme: string;
}

interface ArklaItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  desc: string;
  damageDice: string | null;
  damageType: string | null;
  ac: number | null;
  properties: string | null;
  range: string | null;
  imageUrl: string;
  hpRecovery?: string | null;
}

interface ArklaFeature {
  name: string;
  desc: string;
  isDefensive: boolean;
}

interface ArklaSpell {
  name: string;
  desc: string;
  level: number | string;
  range: string;
  duration: string;
  components: string;
  castTime: string;
  index?: string;
  isHomebrew?: boolean;
}

interface ArklaCompanion {
  name: string;
  species: string;
  hp: number;
  ac: number;
  speed: number;
  isDormant: boolean;
  awakeLevel: number;
  desc: string;
  attacks?: string;
  stats?: Record<string, number>;
  traits?: string;
}

interface ArklaResource {
  name: string;
  current: number;
  max: number;
  recharge: "long" | "short" | "none";
}

interface ArklaMap {
  cols: number;
  rows: number;
  gridColor: string;
  imageUrl: string;
  tokens?: Record<string, unknown>;
}

interface ArklaPreset {
  mapData: ArklaMap;
  tokens?: Record<string, unknown>;
  savedAt: string;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Convert Arkla stats object to our format */
function mapStats(s: ArklaCharacter["stats"]) {
  return {
    strength: s.STR,
    dexterity: s.DEX,
    constitution: s.CON,
    intelligence: s.INT,
    wisdom: s.WIS,
    charisma: s.CHA,
  };
}

/** Compute initiative modifier from DEX score */
function initMod(dex: number): number {
  return Math.floor((dex - 10) / 2);
}

/** Compute proficiency bonus for a given level */
function profBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

/** Parse comma-separated skill string from Arkla into our skill map */
function parseSkills(skillsStr: string): Partial<Record<string, number>> {
  const skillMap: Record<string, string> = {
    acrobatics: "acrobatics",
    "animal handling": "animalHandling",
    arcana: "arcana",
    athletics: "athletics",
    deception: "deception",
    history: "history",
    insight: "insight",
    intimidation: "intimidation",
    investigation: "investigation",
    medicine: "medicine",
    nature: "nature",
    perception: "perception",
    performance: "performance",
    persuasion: "persuasion",
    religion: "religion",
    "sleight of hand": "sleightOfHand",
    stealth: "stealth",
    survival: "survival",
  };

  const result: Record<string, number> = {};
  if (!skillsStr) return result;

  const entries = skillsStr.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  for (const entry of entries) {
    const ourKey = skillMap[entry];
    if (ourKey) {
      // Expertise grants double prof bonus
      result[ourKey] = entry.includes("(expertise)") ? 2 : 1;
    }
  }
  return result;
}

/** Parse saving throws string into our format */
function parseSaves(savesStr: string, scores: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number }): Partial<Record<string, number>> {
  const result: Partial<Record<string, number>> = {};
  if (!savesStr) return result;

  const entries = savesStr.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const abbrMap: Record<string, keyof typeof scores> = {
    STR: "strength", DEX: "dexterity", CON: "constitution",
    INT: "intelligence", WIS: "wisdom", CHA: "charisma",
  };

  for (const entry of entries) {
    const key = abbrMap[entry];
    if (key) {
      const mod = Math.floor((scores[key] - 10) / 2);
      result[key] = mod + Math.ceil(2 / 4) + 1; // prof bonus for level 2
    }
  }
  return result;
}

/** Convert Arkla currency to our format:
 *  Leptons → CP, Quadrans → SP, Assarions → GP
 *  50 leptons = 1 quadrans, 5 quadrans = 1 assarion
 */
function mapCurrency(arkla: { leptons: number; quadrans: number; assarions: number }) {
  return {
    cp: arkla.leptons ?? 0,
    sp: arkla.quadrans ?? 0,
    ep: 0,
    gp: arkla.assarions ?? 0,
    pp: 0,
  };
}

/** Convert Arkla spell slots to our format */
function mapSpellSlots(slots: ArklaCharacter["spellSlots"]): { level: number; total: number; expended: number }[] {
  if (!slots) return [];
  return Object.entries(slots).map(([level, data]) => ({
    level: parseInt(level),
    total: data.max,
    expended: data.max - data.current,
  }));
}

/** Clean up equipment names to be human-readable strings */
function mapEquipment(inventory: ArklaItem[]): string[] {
  const items: string[] = [];
  const processed = new Set<string>();

  for (const item of inventory) {
    if (item.name === "Arrow") continue; // ammo tracked separately
    const name = item.quantity > 1 ? `${item.name} (${item.quantity})` : item.name;
    if (!processed.has(name)) {
      items.push(name);
      processed.add(name);
    }
  }
  return items;
}

/** Convert features array to strings */
function mapFeatures(features: ArklaFeature[]): string[] {
  return features.map((f) => f.name);
}

/** Map Arkla races to our internal format */
function mapRace(species: string): string {
  const map: Record<string, string> = {
    "rock gnome": "Rock Gnome",
    "wood elf": "Wood Elf",
    "variant human": "Human (Variant)",
    "salt gnome": "Salt Gnome",
  };
  return map[species.toLowerCase()] ?? species;
}

export function importArklaJson(json: string): Campaign {
  const data: ArklaExport = JSON.parse(json);
  const chars = data.characters ?? {};

  const playerCharacters: PlayerCharacter[] = Object.values(chars).map((c) => {
    const scores = mapStats(c.stats);
    const level = c.level || 2;
    const prof = profBonus(level);
    const dex = scores.dexterity;

    // Determine subclass from features or class name
    const classLower = c.class?.toLowerCase() ?? "";
    let subclass = "";
    if (classLower === "monk") subclass = "";
    else if (classLower === "bard") subclass = "";
    else if (classLower === "ranger") subclass = "";
    else if (classLower === "artificer") subclass = "";

    return {
      id: uid("pc"),
      name: c.name,
      playerName: c.name.split(" ")[0], // first name as player name
      race: mapRace(c.species ?? ""),
      class: c.class ?? "Adventurer",
      level,
      subclass: subclass || undefined,
      background: "",
      alignment: c.alignment || "Unaligned",
      experience: c.exp || 0,

      abilityScores: scores,
      savingThrows: parseSaves(c.proficiencies?.savingThrows ?? "", scores),
      skills: parseSkills(c.proficiencies?.skills ?? ""),

      hitPoints: {
        current: c.hp ?? c.maxHp ?? 10,
        max: c.maxHp ?? c.hp ?? 10,
        temporary: c.tempHp ?? 0,
      },
      armorClass: c.ac ?? 10,
      initiative: initMod(dex),
      speed: c.speed ?? 30,
      proficiencyBonus: prof,

      features: mapFeatures(c.features ?? []),
      traits: [],
      spells: mapSpellSlots(c.spellSlots),
      equipment: mapEquipment(c.inventory ?? []),
      currency: mapCurrency(c.currency ?? { leptons: 0, quadrans: 0, assarions: 0 }),

      backstory: c.backstory || undefined,
      notes: c.notes || undefined,
      portraitUrl: c.imageUrl || undefined,
      tokenUrl: c.img || undefined,

      companion: c.companion || undefined,
      resources: c.resources || undefined,

      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  return {
    id: uid("camp"),
    name: "The Obelisks of Arkla",
    description:
      "A dark corruption spreads through the realm of Arkla. Seven ancient obelisks — once guardians of a planar seal — are being tainted by an unknown force. The party must track down each obelisk, recover the Keys of Rift-Sealing, and prevent the permanent opening of a rift to the Shadowfell.",
    dmName: "Dungeon Master",
    playerCharacters,
    encounters: [],
    battleMaps: [],
    journal: [],
    settings: {
      homebrewRules: [
        "Custom currency: 50 Leptons = 1 Quadrans, 5 Quadrans = 1 Assarion",
        "Homebrew race: Salt Gnome (swim speed, cold resistance)",
        "Homebrew spells: Caroline's Laughter, Earth Tremor (Bard variants)",
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
