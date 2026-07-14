import type { Campaign, PlayerCharacter, Encounter, BattleMap, JournalEntry, MapToken } from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Calculate initiative modifier from a Dexterity score */
function initModFromDex(dex: number): number {
  return Math.floor((dex - 10) / 2);
}

const NOW = Date.now();
const DAY = 86_400_000;

/* ── Player Characters ──────────────────────────────────────── */

const TORVIN: PlayerCharacter = {
  id: uid("pc"),
  name: "Torvin Ironmantle",
  playerName: "Mike",
  race: "Dwarf (Mountain)",
  class: "Paladin",
  level: 5,
  subclass: "Oath of Devotion",
  background: "Soldier",
  alignment: "Lawful Good",
  experience: 6500,
  abilityScores: { strength: 18, dexterity: 10, constitution: 16, intelligence: 8, wisdom: 12, charisma: 16 },
  savingThrows: { strength: 7, dexterity: 1, constitution: 6, intelligence: -1, wisdom: 4, charisma: 6 },
  skills: { athletics: 7, intimidation: 6, perception: 4, religion: 2, insight: 4, persuasion: 6 },
  hitPoints: { current: 44, max: 52, temporary: 0 },
  armorClass: 20,
  initiative: initModFromDex(10), // +0
  speed: 25,
  proficiencyBonus: 3,
  features: ["Divine Sense", "Lay on Hands (25 HP pool)", "Divine Smite", "Channel Divinity: Sacred Weapon", "Channel Divinity: Turn the Unholy", "Extra Attack", "Dwarven Resilience"],
  traits: ["Darkvision 60ft", "Dwarven Combat Training", "Tool Proficiency: Smith's Tools", "Stonecunning"],
  spells: [
    { level: 1, total: 4, expended: 1 },
    { level: 2, total: 3, expended: 2 },
  ],
  equipment: ["Plate Armor", "Shield", "Warhammer", "Handaxe (2)", "Holy Symbol", "Explorer's Pack", "Smith's Tools"],
  currency: { cp: 0, sp: 14, ep: 0, gp: 45, pp: 0 },
  backstory: "Torvin served as a sergeant in the Ironfall Garrison before receiving a vision from Moradin to seek the corruption spreading through Arkla.",
  notes: "Sworn to protect the innocent. Distrusts mages who dabble in necromancy.",
  portraitUrl: "",
  tokenUrl: "",
  createdAt: NOW - DAY * 30,
  updatedAt: NOW - DAY * 2,
};

const LYSANDRA: PlayerCharacter = {
  id: uid("pc"),
  name: "Lysandra Moonshadow",
  playerName: "Sarah",
  race: "Half-Elf",
  class: "Wizard",
  level: 5,
  subclass: "School of Divination",
  background: "Sage",
  alignment: "Neutral Good",
  experience: 6500,
  abilityScores: { strength: 8, dexterity: 14, constitution: 14, intelligence: 20, wisdom: 12, charisma: 12 },
  savingThrows: { strength: -1, dexterity: 3, constitution: 5, intelligence: 8, wisdom: 2, charisma: 2 },
  skills: { arcana: 11, history: 11, insight: 4, investigation: 8, perception: 4, nature: 8 },
  hitPoints: { current: 32, max: 32, temporary: 0 },
  armorClass: 12,
  initiative: initModFromDex(14), // +2
  speed: 30,
  proficiencyBonus: 3,
  features: ["Arcane Recovery", "Divination Savant", "Portent (2 rolls)", "Spellcasting", "Ritual Casting", "Fey Ancestry"],
  traits: ["Darkvision 60ft", "Skill Versatility", "Trance (4hr meditation)"],
  spells: [
    { level: 1, total: 4, expended: 1 },
    { level: 2, total: 3, expended: 0 },
    { level: 3, total: 2, expended: 0 },
  ],
  equipment: ["Spellbook", "Arcane Focus (Crystal)", "Quarterstaff", "Component Pouch", "Scholar's Pack"],
  currency: { cp: 0, sp: 28, ep: 0, gp: 50, pp: 0 },
  backstory: "Lysandra studied at the Greyspire Academy before venturing into Arkla to document the planar anomalies spreading across the realm.",
  notes: "Keeps a detailed journal. Very curious about the obelisks.",
  portraitUrl: "",
  tokenUrl: "",
  createdAt: NOW - DAY * 28,
  updatedAt: NOW - DAY * 3,
};

const KAZI: PlayerCharacter = {
  id: uid("pc"),
  name: "Kazi Swiftpaw",
  playerName: "Alex",
  race: "Tabaxi",
  class: "Rogue",
  level: 5,
  subclass: "Thief",
  background: "Criminal",
  alignment: "Chaotic Neutral",
  experience: 6500,
  abilityScores: { strength: 10, dexterity: 20, constitution: 14, intelligence: 12, wisdom: 10, charisma: 14 },
  savingThrows: { strength: 2, dexterity: 8, constitution: 2, intelligence: 4, wisdom: 0, charisma: 2 },
  skills: { acrobatics: 11, stealth: 11, sleightOfHand: 8, perception: 3, investigation: 4, deception: 8, persuasion: 5 },
  hitPoints: { current: 38, max: 38, temporary: 0 },
  armorClass: 16,
  initiative: initModFromDex(20), // +5
  speed: 40,
  proficiencyBonus: 3,
  features: ["Sneak Attack (3d6)", "Cunning Action", "Fast Hands", "Second-Story Work", "Uncanny Dodge", "Evasion"],
  traits: ["Darkvision 60ft", "Feline Agility", "Cat's Claws (1d4+dex slashing)", "Keen Smell"],
  spells: [],
  equipment: ["Studded Leather Armor", "Shortsword (2)", "Shortbow + 20 arrows", "Thieves' Tools", "Burglar's Pack"],
  currency: { cp: 50, sp: 32, ep: 1, gp: 120, pp: 0 },
  backstory: "Former member of the Shadowfang Syndicate. Kazi fled the organization after stealing a dangerous relic and now works with the party for protection.",
  notes: "Always checks for traps. Has a soft spot for street urchins.",
  portraitUrl: "",
  tokenUrl: "",
  createdAt: NOW - DAY * 25,
  updatedAt: NOW - DAY * 4,
};

const SERAPHINA: PlayerCharacter = {
  id: uid("pc"),
  name: "Seraphina Lightweaver",
  playerName: "Emma",
  race: "Aasimar (Protector)",
  class: "Cleric",
  level: 5,
  subclass: "Life Domain",
  background: "Acolyte",
  alignment: "Lawful Good",
  experience: 6500,
  abilityScores: { strength: 14, dexterity: 10, constitution: 16, intelligence: 10, wisdom: 18, charisma: 14 },
  savingThrows: { strength: 2, dexterity: 0, constitution: 3, intelligence: 0, wisdom: 7, charisma: 5 },
  skills: { medicine: 10, persuasion: 5, insight: 7, religion: 6, perception: 7, history: 3 },
  hitPoints: { current: 40, max: 45, temporary: 0 },
  armorClass: 18,
  initiative: initModFromDex(10), // +0
  speed: 30,
  proficiencyBonus: 3,
  features: ["Disciple of Life", "Channel Divinity: Preserve Life", "Blessed Healer", "Divine Domain: Life", "Warding Flare", "Healing Hands", "Radiant Soul (1min transformation)"],
  traits: ["Darkvision 60ft", "Celestial Resistance (necrotic/radiant)", "Healing Hands (5 HP/touch)", "Light Bearer"],
  spells: [
    { level: 1, total: 4, expended: 2 },
    { level: 2, total: 3, expended: 1 },
    { level: 3, total: 2, expended: 0 },
  ],
  equipment: ["Chain Mail", "Shield", "Mace", "Holy Symbol of Lathander", "Priest's Pack"],
  currency: { cp: 0, sp: 10, ep: 0, gp: 35, pp: 2 },
  backstory: "Seraphina received a divine vision from Lathander to travel to Arkla and purge the shadow corruption that has been festering in the old catacombs.",
  notes: "Devout but not preachy. Struggles with doubt about her celestial heritage.",
  portraitUrl: "",
  tokenUrl: "",
  createdAt: NOW - DAY * 22,
  updatedAt: NOW - DAY * 5,
};

/* ── Enemies & Encounters ────────────────────────────────────── */

const ARKLA_ENCOUNTERS: Encounter[] = [
  {
    id: uid("enc"),
    name: "Roadside Ambush",
    description: "Bandits have been raiding the Merchant's Way. They hide among the ruins of an old watchtower.",
    enemies: [
      { enemyId: "bandit_captain", count: 1, customHp: undefined },
      { enemyId: "bandit", count: 4, customHp: undefined },
    ],
    environment: "Roadside ruins, light underbrush",
    difficulty: "medium",
    experienceReward: 1100,
    isHomebrew: false,
    createdAt: NOW - DAY * 20,
    updatedAt: NOW - DAY * 20,
  },
  {
    id: uid("enc"),
    name: "Catacombs of the Forgotten",
    description: "Undead have risen in the ancient crypts beneath the Temple of St. Cuthbert. Something deeper stirs.",
    enemies: [
      { enemyId: "wight", count: 1, customHp: undefined },
      { enemyId: "skeleton", count: 6, customHp: undefined },
      { enemyId: "zombie", count: 3, customHp: undefined },
    ],
    environment: "Dark catacombs, narrow passages, low ceilings",
    difficulty: "hard",
    experienceReward: 2800,
    isHomebrew: false,
    createdAt: NOW - DAY * 15,
    updatedAt: NOW - DAY * 12,
  },
  {
    id: uid("enc"),
    name: "The Obelisk Guardian",
    description: "A corrupted earth elemental fused with arcane machinery guards the central obelisk in the Greymire Swamp.",
    enemies: [
      { enemyId: "earth_elemental", count: 1, customHp: 142 },
      { enemyId: "mud_mephit", count: 3, customHp: undefined },
    ],
    environment: "Misty swamp, difficult terrain, half-submerged rubble",
    difficulty: "deadly",
    experienceReward: 4500,
    isHomebrew: false,
    createdAt: NOW - DAY * 8,
    updatedAt: NOW - DAY * 6,
  },
];

/* ── Battle Maps ────────────────────────────────────────────── */

function makeToken(data: Partial<MapToken> & { label: string }): MapToken {
  return {
    id: uid("tk"),
    type: "player",
    x: 0,
    y: 0,
    color: "#8b30ff",
    size: 1,
    visible: true,
    ...data,
  } as MapToken;
}

const ARKLA_MAPS: BattleMap[] = [
  {
    id: uid("map"),
    name: "Merchant's Way Crossroads",
    imageUrl: "",
    imageFit: "cover",
    gridWidth: 24,
    gridHeight: 18,
    gridSize: 50,
    gridColor: "#444",
    fogOfWar: [],
    tokens: [
      makeToken({ type: "player", label: "Torvin", x: 4, y: 9, color: "#8b30ff", size: 1 }),
      makeToken({ type: "player", label: "Lysandra", x: 3, y: 10, color: "#3b82f6", size: 1 }),
      makeToken({ type: "player", label: "Kazi", x: 5, y: 8, color: "#27ae60", size: 1 }),
      makeToken({ type: "player", label: "Seraphina", x: 4, y: 11, color: "#f39c12", size: 1 }),
      makeToken({ type: "enemy", label: "Bandit Captain", x: 18, y: 5, color: "#e74c3c", size: 1 }),
      makeToken({ type: "enemy", label: "Bandits", x: 16, y: 7, color: "#c0392b", size: 1 }),
    ],
    notes: "Broken stone walls provide half cover. The watchtower rubble is difficult terrain.",
    createdAt: NOW - DAY * 18,
    updatedAt: NOW - DAY * 18,
  },
  {
    id: uid("map"),
    name: "Catacombs \u2014 Ossuary Chamber",
    imageUrl: "",
    imageFit: "cover",
    gridWidth: 20,
    gridHeight: 16,
    gridSize: 50,
    gridColor: "#666",
    fogOfWar: [
      { id: uid("fog"), x: 0, y: 0, width: 20, height: 6, label: "Entrance Hall" },
    ],
    tokens: [],
    notes: "Sarcophagi line the walls. The central altar has a faint magical aura. Pit trap at (12,8).",
    createdAt: NOW - DAY * 12,
    updatedAt: NOW - DAY * 10,
  },
];

/* ── Journal Entries ────────────────────────────────────────── */

const ARKLA_JOURNAL: JournalEntry[] = [
  {
    id: uid("jrn"),
    title: "Session 1: The Road to Arkla",
    content: "The party met at the Drunken Dwarf Inn. A merchant hired them to investigate strange lights in the old Greymire Swamp. They encountered a group of kobolds who spoke of a 'glowing stone' that appeared after the last thunderstorm.\n\n**Key NPCs Introduced:**\n- Elara Mosswood (merchant, contact)\n- Garrick Stonewell (innkeeper, friendly)\n- Kobold informant 'Squeaks' (potential ally)\n\n**Loot:** 50gp each, Potion of Healing (2), mysterious obsidian shard",
    tags: ["session", "arkla", "introduction"],
    type: "session",
    sessionNumber: 1,
    createdAt: NOW - DAY * 14,
    updatedAt: NOW - DAY * 14,
  },
  {
    id: uid("jrn"),
    title: "The Obelisks of Arkla \u2014 Lore Notes",
    content: "Research at the Greyspire Academy archives reveals:\n- Seven obelisks were erected during the Age of Arcanum\n- They function as a containment matrix for a 'planar rift' beneath the city\n- Three are active, two are dormant, two are DARK (corrupted)\n- The dark obelisks pulse with necrotic energy\n- If all seven are corrupted, the rift will open permanently\n\n*Source: Archmage Theron's journals, 347 AR*",
    tags: ["lore", "obelisks", "world-building", "arcanum"],
    type: "lore",
    createdAt: NOW - DAY * 10,
    updatedAt: NOW - DAY * 8,
  },
  {
    id: uid("jrn"),
    title: "The Shadowfang Syndicate",
    content: "Kazi's former organization. They operate out of the Dock Ward. Known operations: smuggling, theft, information brokering. \n\nKey members:\n- 'The Silvertongue' (leader, male half-elf, charismatic)\n- Marrow (enforcer, female dragonborn, ruthless)\n- Fingers (quartermaster, male gnome, paranoid)\n\nThey're looking for Kazi. The relic he stole is a 'Key of Rift-Sealing' \u2014 one of three needed to close the main rift permanently.",
    tags: ["lore", "faction", "shadowfang", "kazi"],
    type: "lore",
    createdAt: NOW - DAY * 6,
    updatedAt: NOW - DAY * 5,
  },
  {
    id: uid("jrn"),
    title: "Quest: Find the Second Key",
    content: "The first Key of Rift-Sealing is secured. The second is rumored to be in the possession of the 'Crimson Covenant' \u2014 a cult of necromancers operating in the old catacombs.\n\n**Objectives:**\n1. Locate the catacomb entrance (beneath the Temple of St. Cuthbert)\n2. Recover the key from the Covenant's leader\n3. Purify the dark obelisk in the catacombs\n\n**Reward:** 200gp each, one rare magic item, faction reputation with the Greyspire Academy",
    tags: ["quest", "main", "key", "catacombs"],
    type: "quest",
    createdAt: NOW - DAY * 4,
    updatedAt: NOW - DAY * 2,
  },
  {
    id: uid("jrn"),
    title: "Session 2: Swamp Secrets",
    content: "The party ventured into the Greymire Swamp. Encountered:\n- Swamp gas hallucinations (saw shadow figures)\n- A wounded treant who spoke of the 'Blight' corrupting the land\n- Mud mephits guarding the obelisk approach\n\n**Combat:** Defeated 3 mud mephits and the corrupted earth elemental. The obelisk was purified using the first Key.\n\n**Loot:** Elemental core (valuable), pure spring water (holy), treant's blessing (advantage on nature checks in Greymire)\n\n**Next Steps:** Head to the Temple of St. Cuthbert for the catacomb expedition.",
    tags: ["session", "combat", "swamp", "obelisk", "loot"],
    type: "session",
    sessionNumber: 2,
    createdAt: NOW - DAY * 1,
    updatedAt: NOW,
  },
];

/* ── Campaign Assembly ───────────────────────────────────────── */

export function createDemoCampaign(): Campaign {
  return {
    id: uid("camp"),
    name: "The Obelisks of Arkla",
    description: "A dark corruption spreads through the realm of Arkla. Seven ancient obelisks \u2014 once guardians of a planar seal \u2014 are being tainted by an unknown force. The party must track down each obelisk, recover the Keys of Rift-Sealing, and prevent the permanent opening of a rift to the Shadowfell.",
    dmName: "Dungeon Master",
    playerCharacters: [TORVIN, LYSANDRA, KAZI, SERAPHINA],
    encounters: ARKLA_ENCOUNTERS,
    battleMaps: ARKLA_MAPS,
    journal: ARKLA_JOURNAL,
    settings: {
      homebrewRules: [],
      experienceSystem: "milestone",
      currencyName: "Gold Pieces",
      privateDmNotes: "The BBEG is the Silvertongue \u2014 he's a warlock of the Shadowfell using the obelisks to open a permanent rift. The third key is hidden in the Greyspire Academy's restricted vault.",
    },
    createdAt: NOW - DAY * 30,
    updatedAt: NOW,
  };
}

/* ── Demo Quick-Select Names ────────────────────────────────── */

export const DEMO_PLAYER_FIRST_NAMES: string[] = [
  "Torvin",
  "Lysandra",
  "Kazi",
  "Seraphina",
];
