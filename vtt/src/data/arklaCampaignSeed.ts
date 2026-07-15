/* ── Arkla Campaign Seed Data ──────────────────────────────────
 *
 * Full-fidelity recreation of the Arkla campaign's player characters
 * based on the backup export (arkla_backup_2026-06-30.json).
 *
 * This generates a complete Campaign object with:
 *   • 4 player characters (Wendy, Kehrfuffle, Strider, Toern)
 *   • 1 pre-built encounter (Poll Cave: Screwbeard + goblins)
 *   • 2 journal entries (session lore)
 *   • Campaign settings (Arkla-specific currency)
 *
 * Use: import { createArklaCampaign } and pass to campaignStore.setCampaign()
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, PlayerCharacter, Encounter, JournalEntry, BattleMap } from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const NOW = Date.now();
const DAY = 86_400_000;

/* ── Wendy Warmwind — Rock Gnome Monk (2) ───────────────────── */

const wendy: PlayerCharacter = {
  id: uid("pc"),
  name: "Wendy Warmwind",
  alias: "Wendy",
  playerName: "Player",
  race: "Rock Gnome",
  class: "Monk",
  level: 2,
  background: "Hermit",
  alignment: "Neutral Good",
  experience: 600,
  abilityScores: {
    strength: 10,
    dexterity: 17,
    constitution: 16,
    intelligence: 15,
    wisdom: 16,
    charisma: 11,
  },
  savingThrows: {
    strength: 2,
    dexterity: 5,
  },
  skills: {
    acrobatics: 5,
    insight: 5,
    stealth: 5,
    sleightOfHand: 5,
    perception: 3,
  },
  hitPoints: { current: 19, max: 19, temporary: 0 },
  armorClass: 15, // 10 + DEX(3) + WIS(3) - unarmored defense
  initiative: 3,
  speed: 35,
  proficiencyBonus: 2,
  features: [
    "Darkvision (60ft)",
    "Gnome Cunning (Adv. INT/WIS/CHA saves vs magic)",
    "Artificer's Lore",
    "Tinker (clockwork devices)",
    "Unarmored Defense (AC 10 + DEX + WIS)",
    "Martial Arts (d4, DEX for attack/damage)",
    "Flurry of Blows (1 kol point, 2 unarmed strikes)",
    "Patient Defense (1 kol point, Dodge as bonus)",
    "Step of the Wind (1 kol point, Disengage/Dash)",
    "Kolari Training (Kol points = 5)",
  ],
  traits: [
    "Quiet and blends into the background",
    "Guilt-ridden over Foarn raid failure",
    "Searches for Master Duku",
    "Tinkers with clockwork gadgets in free time",
  ],
  spells: [],
  equipment: [
    "Bag of Caltrops",
    "Tinker's Tools",
    "Worn Overalls & Gnome cap",
    "Quarterstaff (1d6/1d8 versatile)",
    "Gear-shaped ninja stars (Shuriken, 10, 1d4 finesse thrown)",
    "Thieves' Tools",
    "Disguise Kit",
    "Explorer's Pack",
    "Flute",
    "Faded photo of family",
    "Sketch of restaurant by the sea",
    "Loof's Loaf",
    "Invitation to Tudul's Party",
    "Scimitar (stolen from Bengo the goblin)",
    "Strange Coin (reptilian eye)",
  ],
  currency: { cp: 52, sp: 23, gp: 9, ep: 0, pp: 0 },
  backstory:
    "Wendy trained as a Kolari monk in Foarn under the mysterious Master Duku, who vanished leaving only a lizard-monogrammed belt. After a disastrous Brevar raid that killed many pupils (including her cousin Quill), Wendy fled Foarn seeking the restaurant from a sketch she stole — her only clue to Duku's whereabouts.",
  notes:
    "Had a dream of a reptile eye named Clarion. Was recognized in Bacilia for the lizard belt. Met Monk Hayne who trained Duku. Duku was in Bacilia a week ago, set out on a ship.",
  portraitUrl: "/wendy.png",
  tokenUrl: "/wendy_bm.png",
  companion: {
    name: "Little Mouse",
    species: "Ordinary Mouse",
    hp: 1,
    ac: 10,
    speed: 45,
    isDormant: false,
    awakeLevel: 1,
    desc: "The Ultimate Scout and Infiltrator. Nobody pays attention to a tiny mouse.",
    attacks: "",
    stats: { strength: 2, dexterity: 15, constitution: 9, intelligence: 2, wisdom: 10, charisma: 4 },
    traits: "",
  },
  resources: [
    { name: "Kol Points", current: 5, max: 5, recharge: "short" },
  ],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

/* ── Kehrfuffle Songroot — Wood Elf Bard (2) ────────────────── */

const kehrfuffle: PlayerCharacter = {
  id: uid("pc"),
  name: "Kehrfuffle Songroot",
  alias: "Kehrfuffle",
  playerName: "Player",
  race: "Wood Elf",
  class: "Bard",
  level: 2,
  background: "Entertainer",
  alignment: "Neutral Good",
  experience: 600,
  abilityScores: {
    strength: 10,
    dexterity: 17,
    constitution: 14,
    intelligence: 10,
    wisdom: 16,
    charisma: 17,
  },
  savingThrows: {
    dexterity: 5,
    charisma: 5,
  },
  skills: {
    acrobatics: 5,
    deception: 5,
    insight: 5,
    perception: 5,
    performance: 5,
    persuasion: 5,
  },
  hitPoints: { current: 17, max: 17, temporary: 0 },
  armorClass: 13, // Leather (11) + DEX(3)
  initiative: 3,
  speed: 35,
  proficiencyBonus: 2,
  features: [
    "Darkvision (60ft)",
    "Keen Senses (Perception proficiency)",
    "Fey Ancestry (Adv. vs charm, immune to sleep)",
    "Elf Weapon Training (longsword, shortsword, shortbow, longbow)",
    "Fleet of Foot (35ft speed)",
    "Mask of the Wild (hide in light obscurement)",
    "Trance (4hr meditation = 8hr rest)",
    "Spellcasting (Bard)",
    "Bardic Inspiration (d6, 3/long rest)",
    "By Popular Demand (free lodging when performing)",
    "Jack of All Trades (half prof on all ability checks)",
    "Song of Rest (d6 extra healing on short rest)",
  ],
  traits: [
    "Driven by grief — his wife Caroline was taken by a mysterious stranger",
    "Charismatic performer with a dark obsession",
    "Accordionist seeking fame and revenge",
    "Caroline's accordion is both his instrument and his curse",
  ],
  spells: [
    { level: 0, total: 4, expended: 0 },
    { level: 1, total: 3, expended: 0 },
  ],
  equipment: [
    "Leather Armor",
    "Sickle (mysterious, druidic runes)",
    "The Cursed Accordion (Caroline's accordion — pulses with life)",
    "Entertainer's Pack",
    "Locket with Caroline's picture",
    "Loof Loaf",
    "Viking Lullaby (sheet music — foreign text)",
    "Dagger",
    "Palch's Pocket Watch (plays a mysterious song)",
  ],
  currency: { cp: 50, sp: 54, gp: 35, ep: 0, pp: 0 },
  backstory:
    "A Wood Elf accordionist who traded his wife Caroline to a mysterious stranger in exchange for 'undeniable musical talent'. The stranger disappeared and Kehrfuffle has hunted him ever since. A druidic encounter in the Weeping Grove gave him a magical sickle and a bear cub companion. He now seeks allies and power to find the stranger and bring Caroline back.",
  notes:
    "The stranger (called 'Khaven' by some) has been active in Bacilia. Met Palch the mouse musician who gave him a magical pocket watch. Pavel knows of his situation. Puty's execution is in 2 days. Needs to learn the watch's song.",
  portraitUrl: "/kehrfuffle.png",
  tokenUrl: "/kehrfuffle_bm.png",
  companion: {
    name: "Tiny Bear",
    species: "Unknown (Druidic)",
    hp: 20,
    ac: 13,
    speed: 30,
    isDormant: false,
    awakeLevel: 2,
    desc: "A small bear cub that appeared after the Weeping Grove collapse. Primal Bond: Kehrfuffle adds proficiency bonus to the cub's checks and saves.",
    attacks:
      "Maul: claws and teeth (1d6+2 slashing + PB). Entangling Growl (1/short rest): STR save vs spell DC or restrained by spectral vines.",
    stats: { strength: 14, dexterity: 12, constitution: 14, intelligence: 8, wisdom: 8, charisma: 10 },
    traits: "Primal Bond: Add PB to ability checks and saving throws.",
  },
  resources: [
    { name: "Bardic Inspiration", current: 3, max: 3, recharge: "long" },
  ],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

/* ── Edmund 'Strider' Tudul — Variant Human Ranger (2) ───────── */

const strider: PlayerCharacter = {
  id: uid("pc"),
  name: "Edmund 'Strider' Tudul",
  alias: "Strider",
  playerName: "Player",
  race: "Variant Human",
  class: "Ranger",
  level: 2,
  background: "Noble (Disowned)",
  alignment: "Neutral",
  experience: 600,
  abilityScores: {
    strength: 16,
    dexterity: 16,
    constitution: 14,
    intelligence: 10,
    wisdom: 9,
    charisma: 12,
  },
  savingThrows: {
    strength: 5,
    dexterity: 5,
  },
  skills: {
    deception: 5, // Expertise
    perception: 3,
    stealth: 5,
    insight: 3,
    persuasion: 3,
    history: 2,
  },
  hitPoints: { current: 20, max: 20, temporary: 0 },
  armorClass: 13, // Leather (11) + DEX(3)
  initiative: 3,
  speed: 30,
  proficiencyBonus: 2,
  features: [
    "Sharpshooter (-5 attack, +10 damage, ignore cover)",
    "Fighting Style: Defense (+1 AC in armor)",
    "Favored Foe (1d4 extra damage, 2/long rest, concentration)",
    "False Identity (Strider alias — documents, disguises)",
    "Deception Expertise",
  ],
  traits: [
    "Rejects his noble Tudul family heritage",
    "Witnessed his father murder his sister Ruth",
    "Seeks to make his own name as a legendary Ranger",
    "Spoiled prince learning to rough it",
  ],
  spells: [
    { level: 0, total: 0, expended: 0 },
    { level: 1, total: 2, expended: 0 },
  ],
  equipment: [
    "Longbow (1d8 piercing, 150/600ft)",
    "Longsword (1d8/1d10 versatile)",
    "20 Arrows",
    "Quiver",
    "Leather Armor",
    "Hooded Cloak",
    "Fine Clothes (Tudul royal wear, hidden)",
    "Explorer's Pack",
    "Disguise Kit",
    "Forgery Kit",
    "Tudul Family Signet Ring (hidden)",
    "Wilderness Survival Book",
    "Loof Loaf",
    "Map of Chauzy",
    "Basilia Game Shop Tickets (3)",
    "Horse: Hazel (tamed)",
  ],
  currency: { cp: 0, sp: 50, gp: 25, ep: 0, pp: 0 },
  backstory:
    "Born Prince Edmund Tudul, eldest son of Lord Henry Tudul. After witnessing his father murder his sister Ruth and toss her body to the sea, Edmund fled to Chauzy where his uncle Byron Tudul (the Mayor) hides his identity. He now goes by 'Strider', rejecting his royal past and seeking to forge his own legend as the greatest Ranger Arkla has ever seen.",
  notes:
    "Met Pavel — a connection of the Old Royal Order. Pavel knows Strider is a Tudul and does a cool handshake. Tasked with rescuing Lord Puty from execution. The Jewl pirates have influence over Counselor Quesel. Two leads: Puty and the Mayor's cane. Met two rock gnome detectives looking for the killer of a Chauzy merchant.",
  portraitUrl: "/strider.png",
  tokenUrl: "/strider_bm.png",
  companion: undefined,
  resources: [
    { name: "Arrows", current: 17, max: 20, recharge: "none" },
    { name: "Favored Foe", current: 2, max: 2, recharge: "long" },
  ],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

/* ── Toern Treetap — Salt Gnome Artificer (2) ───────────────── */

const toern: PlayerCharacter = {
  id: uid("pc"),
  name: "Toern Treetap",
  alias: "Toern",
  playerName: "Player",
  race: "Salt Gnome",
  class: "Artificer",
  level: 2,
  background: "Sailor",
  alignment: "Neutral Good",
  experience: 600,
  abilityScores: {
    strength: 8,
    dexterity: 14,
    constitution: 15,
    intelligence: 17,
    wisdom: 10,
    charisma: 12,
  },
  savingThrows: {
    constitution: 4,
    intelligence: 5,
  },
  skills: {
    investigation: 5,
    perception: 2,
    athletics: 1,
  },
  hitPoints: { current: 17, max: 17, temporary: 0 },
  armorClass: 12, // No armor base
  initiative: 2,
  speed: 25,
  proficiencyBonus: 2,
  features: [
    "Darkvision (60ft)",
    "Gnome Cunning (Adv. INT/WIS/CHA saves vs magic)",
    "Saltwater Heritage (Swim 25ft, Cold resistance)",
    "Magical Tinkering (spark of magic in objects)",
    "Spellcasting (Artificer, INT-based)",
    "Infuse Item (4 known, 2 active)",
    "Enhanced Defense (+1 AC armor/shield)",
    "Repeating Shot (+1 attack/damage, auto-ammo)",
    "Alchemy Jug (replicate magic item)",
    "Homunculus Servant (tiny mechanical familiar)",
  ],
  traits: [
    "Loves explosives and gadgets",
    "Haunted by the accident that 'killed' his wizard family",
    "Searching for his brother Tulin (who may still be alive)",
    "Former captain, betrayed by his first mate Bolan",
  ],
  spells: [
    { level: 0, total: 2, expended: 0 },
    { level: 1, total: 2, expended: 0 },
  ],
  equipment: [
    "3 Glass Jars of Goop (his family)",
    "Lizard Pin (found where brother disappeared)",
    "Scale Mail (AC 14)",
    "Shield (+2 AC, infused with Enhanced Defense → total AC 17)",
    "2 Daggers (1d4 finesse thrown)",
    "Tinker's Tools",
    "Alchemist's Supplies",
    "Dungeoneer's Pack",
    "Letter from Jewl (written in Hisma)",
    "Basilia Game Shop Tickets",
  ],
  currency: { cp: 0, sp: 0, gp: 10, ep: 0, pp: 0 },
  backstory:
    "A Salt Gnome artificer from the prestigious Treetap wizard family of Dagend. After a bomb demonstration went horribly wrong, dissolving his family into magical goo, Toern discovered his brother Tulin's goo was missing — replaced by a mysterious lizard pin. He became a sea captain searching for answers, but his first mate Bolan mutinied. Toern was rescued by Captain Screwbeard of the Jewl pirates and is now held in Poll Cave.",
  notes:
    "They know I'm looking for my brother. My brother may be evil. The 6 Monk schoolings: Kolari (strength), Humoolian (magic/mind). Pavel wants us to rescue Puty. Cast Infuse Item on my shield for +1 AC = 17 total.",
  portraitUrl: "/toern.png",
  tokenUrl: "/toern_bm.png",
  companion: undefined,
  resources: [],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

/* ── Encounters ─────────────────────────────────────────────── */

const pollCaveEncounter: Encounter = {
  id: uid("enc"),
  name: "Poll Cave — Screwbeard's Ambush",
  description:
    "The party descends into Poll Cave, a damp sea-cave with bioluminescent salt crystals and glowing tidepools. Screwbeard and his goblin crew have set up camp here, guarding the entrance to the Jewl pirates' cache. The cave floor is slippery near the water's edge, and the echoing acoustics make stealth difficult.",
  enemies: [
    { enemyId: uid("enemy"), count: 1, customHp: 10 }, // Screwbeard
    { enemyId: uid("enemy"), count: 4, customHp: 7 }, // Goblins x4
    { enemyId: uid("enemy"), count: 1, customHp: 15 }, // Goblin Boss
  ],
  environment: "Coastal Cave — slippery saltstone, glowing tidepools, echoing acoustics",
  difficulty: "medium",
  experienceReward: 450,
  isHomebrew: false,
  createdAt: NOW - 7 * DAY,
  updatedAt: NOW,
};

const goblinPatrolEncounter: Encounter = {
  id: uid("enc"),
  name: "Bacilia Docks — Goblin Patrol",
  description:
    "While the party investigates the Bacilia docks at night, a patrol of Jewl pirate goblins discovers them. The patrol is led by a scarred goblin bosun who blows a whistle to alert nearby guards if given the chance.",
  enemies: [
    { enemyId: uid("enemy"), count: 3, customHp: 7 }, // Goblins
    { enemyId: uid("enemy"), count: 1, customHp: 12 }, // Goblin Bosun
  ],
  environment: "Urban Docks — crates for cover, water hazards, dim lantern light",
  difficulty: "easy",
  experienceReward: 200,
  isHomebrew: false,
  createdAt: NOW - 5 * DAY,
  updatedAt: NOW,
};

/* ── Battle Maps ────────────────────────────────────────────── */

const pollCaveMap: BattleMap = {
  id: uid("map"),
  name: "Poll Cave — Screwbeard's Camp",
  imageUrl: "/screwbeard_cave_enc.png",
  imageFit: "cover",
  gridWidth: 47,
  gridHeight: 26,
  gridSize: 40,
  gridColor: "rgba(255,255,255,0.35)",
  fogOfWar: [],
  tokens: [],
  notes: "Slippery terrain near the water (DEX save or prone). Glowing tidepools shed dim light in a 5ft radius.",
  createdAt: NOW - 7 * DAY,
  updatedAt: NOW,
};

/* ── Journal Entries ─────────────────────────────────────────── */

const sessionOneJournal: JournalEntry = {
  id: uid("journal"),
  title: "Session 1: The Poll Cave Rescue",
  content: `# Session 1 — The Rescue of Toern Treetap

## Summary
The party, having been gathered by Pavel in Bacilia's Loft district, accepted a mission to rescue Lord Puty from execution. Their first lead pointed them to Poll Cave, where the Jewl pirates were holding a captive — Toern Treetap, a Salt Gnome artificer.

## Key Events
- **Arrival at Poll Cave**: The party approached cautiously. Wendy scouted ahead using her mouse companion, discovering the cave's layout.
- **The Ambush**: Screwbeard's goblins spotted Kehrfuffle's silhouette against the bioluminescent crystals and raised the alarm.
- **Combat**: 
  - Strider took out two goblins with sharpshooter longbow shots from the cave entrance.
  - Wendy dashed across the slippery saltstone, unleashing Flurry of Blows on Screwbeard.
  - Kehrfuffle used Faerie Fire to outline the remaining goblins in violet light.
  - Toern, freed from his cage, used Catapult to hurl a goblin into a tidepool.
- **Interrogation**: Screwbeard, defeated, revealed that the Jewl pirates are working with someone inside the Crown — and that Lord Puty is being held in Counselor Quesel's mansion vault, not the public prison.

## NPCs Introduced
- **Screwbeard**: Dim-witted Dwarf pirate captain. Captured alive.
- **Pavel**: One-armed Crown soldier, connected to the Old Royal Order.
- **The Jewl Pirates**: Shadowy organization controlling Bacilia's underworld.

## XP
- Awarded 450 XP (150 per character). Level up pending.

## Loot
- 50 gp from Screwbeard's stash
- A sealed letter addressed to "J" (passed to Pavel)
- Screwbeard's rusty boarding axe

## DM Notes
The players are beginning to unravel the conspiracy. They suspect the Crown is compromised but don't yet know the extent of the Jewl pirates' influence. The mystery of the lizard emblem (seen on Wendy's belt, Toern's pin, the strange coin) remains unsolved.`,
  tags: ["session", "poll-cave", "combat", "xp-awarded"],
  type: "session",
  sessionNumber: 1,
  createdAt: NOW - 7 * DAY,
  updatedAt: NOW,
};

const sessionTwoJournal: JournalEntry = {
  id: uid("journal"),
  title: "Session 2: The Bacilia Docks Investigation",
  content: `# Session 2 — Shadows of the Crown

## Summary
After returning from Poll Cave, the party rested at the Rusty Hook tavern. Pavel debriefed them on Lord Puty's situation — the execution is in 2 days. The party decided to investigate the Bacilia docks for information about Counselor Quesel's comings and goings.

## Key Events
- **The Rusty Hook**: Armand, the tavern keeper, shared rumors that Quesel has been meeting with a cloaked figure at midnight near the Shellhouse (Puty's impounded ship).
- **Docks Investigation**: 
  - Strider used his Disguise Kit to pose as a dock worker.
  - Kehrfuffle performed at a nearby tavern to gather gossip, learning that Quesel's doves fly north every evening.
  - Wendy picked the lock on the Shellhouse's captain's quarters, finding a logbook with strange coordinates.
  - Toern examined the logbook — the ink has traces of alchemical properties, suggesting magical correspondence.
- **The Goblin Patrol**: A group of Jewl goblins nearly discovered the party, but Kehrfuffle's performance and Strider's quick talking defused the situation.

## Clues Gathered
- Quesel is sending weekly reports north (likely to Haven Tudul or the Crown).
- The coordinates in Puty's logbook point to an uncharted island west of Arkla.
- A letter from "J" to Screwbeard mentions "the weapon the Mayor of Chauzy guards."

## Next Session
- Infiltrate Quesel's mansion to find Puty before the execution.
- Investigate the Mayor of Chauzy's hidden weapon.
- Follow the coordinates west?`,
  tags: ["session", "bacilia", "investigation", "lore"],
  type: "session",
  sessionNumber: 2,
  createdAt: NOW - 3 * DAY,
  updatedAt: NOW,
};

/* ── Campaign Assembly ───────────────────────────────────────── */

export function createArklaCampaign(): Campaign {
  return {
    id: "arkla",
    name: "The Arkla Chronicles",
    description:
      "A campaign set in the world of Arkla — a land of ancient magic, political intrigue, and buried secrets. The party investigates the mysterious lizard emblem, the Jewl pirates' influence over the Crown, and the disappearance of loved ones tied to a shadowy figure known only as 'the Stranger'.",
    dmName: "MikeJello",
    playerCharacters: [wendy, kehrfuffle, strider, toern],
    encounters: [pollCaveEncounter, goblinPatrolEncounter],
    battleMaps: [pollCaveMap],
    journal: [sessionOneJournal, sessionTwoJournal],
    settings: {
      homebrewRules: [
        "Currency: 50 leptons = 1 quadrans, 5 quadrans = 1 assarion",
        "Kol Points (Monk): Enriched ki — can be spent for enhanced mobility options",
        "Arkla Companions: Primal Bond adds PB to companion checks/saves",
        "Song of Rest: Works on any short rest, not just when performing",
      ],
      experienceSystem: "xp",
      currencyName: "Assarions (Gold)",
      privateDmNotes:
        "MAJOR PLOT POINTS:\n" +
        "1. The Lizard Emblem — connects Wendy's belt, Toern's pin, the strange coin. Represents the Lacerta, an ancient reptilian order that predates the Crown.\n" +
        "2. The Stranger (Khaven) — a being who trades in 'charm'. Took Caroline (Kehrfuffle's wife). Might be connected to the Lacerta.\n" +
        "3. Haven Tudul (Strider's brother) — involved in Ruth's death. Now works closely with the Emperor.\n" +
        "4. The Bomb — Was Toern's accident sabotage? Tulin's disappearance suggests he may still be alive.\n" +
        "5. The Weapon — The Mayor of Chauzy (Byron Tudul) guards something the pirates want.\n\n" +
        "TENSION CLOCK:\n" +
        "- Puty's Execution: 2 days from Session 2\n" +
        "- Quesel's reports to Haven: weekly, next in 5 days\n" +
        "- The Stranger's next appearance: unknown\n\n" +
        "LOOSE THREADS:\n" +
        "- What is the song in Palch's pocket watch?\n" +
        "- Who is Clarion (the reptile eye in dreams)?\n" +
        "- Why did Monk Wando abandon Foarn during the raid?\n" +
        "- What's on the uncharted island west of Arkla?",
    },
    createdAt: NOW - 30 * DAY,
    updatedAt: NOW,
  };
}
