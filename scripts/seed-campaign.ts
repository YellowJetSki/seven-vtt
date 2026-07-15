/* ── Seed Arkla Campaign to Firestore ──────────────────────────
 * Usage: npx tsx scripts/seed-campaign.ts
 * This script uses the Firebase Admin SDK to upload the full
 * Arkla campaign data directly to Firestore.
 *
 * NOTE: The Admin SDK bypasses security rules entirely, which is
 * exactly what we need for initial seeding.
 * ─────────────────────────────────────────────────────────────── */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Load service account ──────────────────────────────────────
const SA_PATH = resolve(process.cwd(), 'service-account.json');
if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json not found at project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf-8'));

// ── Initialize Admin SDK ──────────────────────────────────────
const admin = await import('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

const NOW = Date.now();
const DAY = 86400000;
let uidCounter = 0;
function uid(prefix: string): string {
  return `${prefix}_${uidCounter++}_seed${NOW}`;
}

/* ═══════════════════════════════════════════════════════════════
   PLAYER CHARACTERS
   ═══════════════════════════════════════════════════════════════ */

const wendy = {
  id: uid('pc'),
  name: 'Wendy Warmwind',
  alias: 'Wendy',
  playerName: 'Gina',
  race: 'Rock Gnome',
  class: 'Monk',
  level: 2,
  subclass: 'Way of the Kolari',
  background: 'Hermit',
  alignment: 'Neutral Good',
  experience: 600,
  abilityScores: { strength: 10, dexterity: 17, constitution: 16, intelligence: 15, wisdom: 16, charisma: 11 },
  savingThrows: { strength: 2, dexterity: 5 },
  skills: {
    acrobatics: 5, insight: 5, stealth: 5, sleightOfHand: 5, perception: 3,
    athletics: 0, arcana: 2, history: 2, investigation: 2, nature: 2, religion: 2,
    animalHandling: 3, intimidation: 0, performance: 0, persuasion: 0, medicine: 3, survival: 3, deception: 0,
  },
  hitPoints: { current: 19, max: 19, temporary: 0 },
  armorClass: 15,
  initiative: 3,
  speed: 35,
  proficiencyBonus: 2,
  features: [
    'Darkvision (60ft)', 'Gnome Cunning (Adv. INT/WIS/CHA saves vs magic)',
    "Artificer's Lore", 'Tinker (clockwork devices)',
    'Unarmored Defense (AC 10 + DEX + WIS)', 'Martial Arts (d4, DEX for attack/damage)',
    'Flurry of Blows (1 kol point, 2 unarmed strikes)',
    'Patient Defense (1 kol point, Dodge as bonus)',
    'Step of the Wind (1 kol point, Disengage/Dash)', 'Kolari Training (Kol points: 5)',
  ],
  traits: [
    'Quiet and blends into the background',
    'Guilt-ridden over Foarn raid failure',
    'Searches for Master Duku',
    'Tinkers with clockwork gadgets in free time',
  ],
  spells: [{ level: 0, total: 0, expended: 0 }, { level: 1, total: 0, expended: 0 }],
  equipment: [
    'Bag of Caltrops', "Tinker's Tools", 'Worn Overalls & Gnome cap', 'Quarterstaff (1d6/1d8 versatile)',
    'Gear-shaped ninja stars (10, 1d4 finesse thrown)', "Thieves' Tools", 'Disguise Kit',
    "Explorer's Pack", 'Flute', 'Faded photo of family', 'Sketch of restaurant by the sea',
    "Loof's Loaf", "Invitation to Tudul's Party", 'Scimitar', 'Strange Coin (reptilian eye)',
  ],
  currency: { cp: 52, sp: 23, gp: 9, ep: 0, pp: 0 },
  backstory: 'Wendy trained as a Kolari monk in Foarn under the mysterious Master Duku. After he vanished and a Brevar raid devastated the town, she fled to find him — her only clue a sketch of a restaurant by the sea.',
  notes: 'Dream of reptile eye named Clarion. Recognized in Bacilia for lizard belt. Met Monk Hayne who trained Duku.',
  portraitUrl: '/wendy.png',
  tokenUrl: '/wendy_bm.png',
  companion: {
    name: 'Little Mouse', species: 'Ordinary Mouse', hp: 1, ac: 10, speed: 45,
    isDormant: false, awakeLevel: 1,
    desc: 'The Ultimate Scout and Infiltrator. Nobody pays attention to a tiny mouse.',
  },
  resources: [{ name: 'Kol Points', current: 5, max: 5, recharge: 'short' }],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

const kehrfuffle = {
  id: uid('pc'),
  name: 'Kehrfuffle Songroot',
  alias: 'Kehrfuffle',
  playerName: 'James',
  race: 'Wood Elf',
  class: 'Bard',
  level: 2,
  subclass: 'College of Lore',
  background: 'Entertainer',
  alignment: 'Neutral Good',
  experience: 600,
  abilityScores: { strength: 10, dexterity: 17, constitution: 14, intelligence: 10, wisdom: 16, charisma: 17 },
  savingThrows: { dexterity: 5, charisma: 5 },
  skills: {
    acrobatics: 5, deception: 5, insight: 5, perception: 5, performance: 5, persuasion: 5,
    stealth: 3, sleightOfHand: 3, athletics: 0, arcana: 0, history: 0, investigation: 0,
    nature: 3, religion: 0, animalHandling: 3, intimidation: 0, medicine: 3, survival: 3,
  },
  hitPoints: { current: 17, max: 17, temporary: 0 },
  armorClass: 13,
  initiative: 3,
  speed: 35,
  proficiencyBonus: 2,
  features: [
    'Darkvision (60ft)', 'Keen Senses (Perception prof.)', 'Fey Ancestry (Adv. vs charm, immune sleep)',
    'Elf Weapon Training', 'Fleet of Foot (35ft)', 'Mask of the Wild', 'Trance',
    'Spellcasting (Bard)', 'Bardic Inspiration (d6, 3/long rest)', 'By Popular Demand',
    'Jack of All Trades (half prof. on all checks)', 'Song of Rest (d6)',
  ],
  traits: [
    'Driven by grief — wife Caroline taken by mysterious stranger',
    'Charismatic performer, secretly obsessed with revenge',
    'Accordionist seeking fame and the Stranger',
  ],
  spells: [{ level: 0, total: 4, expended: 0 }, { level: 1, total: 3, expended: 0 }],
  equipment: [
    'Leather Armor', 'Sickle (druidic runes)', 'The Cursed Accordion (pulses with life)',
    "Entertainer's Pack", "Locket with Caroline's picture", 'Loof Loaf', 'Viking Lullaby',
    'Dagger', "Palch's Pocket Watch (mysterious song)",
  ],
  currency: { cp: 50, sp: 54, gp: 35, ep: 0, pp: 0 },
  backstory: 'A Wood Elf accordionist who traded his wife Caroline to a mysterious stranger for musical talent. A druidic encounter in the Weeping Grove gave him a magical sickle and a bear cub. He now hunts the stranger across Arkla.',
  notes: 'The Stranger (called Khaven) has been active in Bacilia. Met Palch the mouse musician. Puty execution in 2 days.',
  portraitUrl: '/kehrfuffle.png',
  tokenUrl: '/kehrfuffle_bm.png',
  companion: {
    name: 'Tiny Bear', species: 'Unknown (Druidic)', hp: 20, ac: 13, speed: 30,
    isDormant: false, awakeLevel: 2,
    desc: 'Bear cub from the Weeping Grove collapse. Primal Bond: Kehrfuffle adds PB to its checks and saves.',
    attacks: 'Maul: 1d6+2 slashing + PB. Entangling Growl: STR save vs spell DC or restrained.',
    stats: { strength: 14, dexterity: 12, constitution: 14, intelligence: 8, wisdom: 8, charisma: 10 },
    traits: 'Primal Bond',
  },
  resources: [{ name: 'Bardic Inspiration', current: 3, max: 3, recharge: 'long' }],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

const strider = {
  id: uid('pc'),
  name: "Edmund 'Strider' Tudul",
  alias: 'Strider',
  playerName: 'David',
  race: 'Variant Human',
  class: 'Ranger',
  level: 2,
  subclass: 'Hunter',
  background: 'Noble (Disowned)',
  alignment: 'Neutral',
  experience: 600,
  abilityScores: { strength: 16, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 9, charisma: 12 },
  savingThrows: { strength: 5, dexterity: 5 },
  skills: {
    deception: 5, perception: 3, stealth: 5, insight: 3, persuasion: 3, history: 2,
    acrobatics: 3, athletics: 3, sleightOfHand: 3, arcana: 0, investigation: 0, nature: -1,
    religion: -1, animalHandling: -1, intimidation: 1, performance: 1, medicine: -1, survival: -1,
  },
  hitPoints: { current: 20, max: 20, temporary: 0 },
  armorClass: 13,
  initiative: 3,
  speed: 30,
  proficiencyBonus: 2,
  features: [
    'Sharpshooter (-5 attack, +10 damage, ignore cover)',
    'Fighting Style: Defense (+1 AC in armor)',
    'Favored Foe (1d4 extra, 2/long rest, concentration)',
    'False Identity (Strider alias, documents, disguises)',
    'Deception Expertise',
  ],
  traits: [
    'Rejects noble Tudul family heritage',
    'Witnessed his father murder his sister Ruth',
    'Seeks to make his own name as a legendary Ranger',
    'Spoiled prince learning to rough it',
  ],
  spells: [{ level: 0, total: 0, expended: 0 }, { level: 1, total: 2, expended: 0 }],
  equipment: [
    'Longbow (1d8 piercing, 150/600ft)', 'Longsword (1d8/1d10 versatile)', 'Arrows (20)',
    'Quiver', 'Leather Armor', 'Hooded Cloak', 'Fine Clothes (Tudul, hidden)',
    "Explorer's Pack", 'Disguise Kit', 'Forgery Kit', 'Tudul Signet Ring (hidden)',
    'Wilderness Survival Book', 'Loof Loaf', 'Map of Chauzy', 'Game Shop Tickets (3)',
  ],
  currency: { cp: 0, sp: 50, gp: 25, ep: 0, pp: 0 },
  backstory: 'Fled royal life after witnessing his father murder his sister Ruth. Now goes by Strider, forging his own legend as the greatest Ranger Arkla has ever seen.',
  notes: 'Met Pavel of the Old Royal Order. Tasked with rescuing Puty. Haven (brother) works with Emperor.',
  portraitUrl: '/strider.png',
  tokenUrl: '/strider_bm.png',
  resources: [
    { name: 'Arrows', current: 17, max: 20, recharge: 'none' },
    { name: 'Favored Foe', current: 2, max: 2, recharge: 'long' },
  ],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

const toern = {
  id: uid('pc'),
  name: 'Toern Treetap',
  alias: 'Toern',
  playerName: 'Alex',
  race: 'Salt Gnome',
  class: 'Artificer',
  level: 2,
  subclass: 'Artillerist',
  background: 'Sailor',
  alignment: 'Neutral Good',
  experience: 600,
  abilityScores: { strength: 8, dexterity: 14, constitution: 15, intelligence: 17, wisdom: 10, charisma: 12 },
  savingThrows: { constitution: 4, intelligence: 5 },
  skills: {
    investigation: 5, perception: 2, athletics: 1, acrobatics: 2, stealth: 2, sleightOfHand: 2,
    arcana: 3, history: 3, nature: 3, religion: 0, animalHandling: 0, insight: 0,
    intimidation: 1, performance: 1, persuasion: 1, medicine: 0, survival: 0, deception: 1,
  },
  hitPoints: { current: 17, max: 17, temporary: 0 },
  armorClass: 17,
  initiative: 2,
  speed: 25,
  proficiencyBonus: 2,
  features: [
    'Darkvision (60ft)', 'Gnome Cunning (Adv. INT/WIS/CHA saves vs magic)',
    'Saltwater Heritage (Swim 25ft, Cold resist)',
    'Magical Tinkering', 'Spellcasting (Artificer, INT-based)',
    'Infuse Item (4 known, 2 active): Enhanced Defense (+1 AC), Repeating Shot (+1 atk/dmg, auto-ammo)',
  ],
  traits: [
    'Loves explosives and gadgets',
    'Haunted by accident that dissolved his wizard family',
    'Searching for brother Tulin (may still be alive)',
    'Betrayed by first mate Bolan, left for dead',
  ],
  spells: [{ level: 0, total: 2, expended: 0 }, { level: 1, total: 2, expended: 0 }],
  equipment: [
    '3 Glass Jars of Goop (his family)', 'Lizard Pin (found at brother disappearance site)',
    'Scale Mail (AC 14)', 'Shield (+2 AC, Enhanced Defense infusion → total 17)',
    '2 Daggers (1d4 finesse thrown)', "Tinker's Tools", "Alchemist's Supplies",
    "Dungeoneer's Pack", 'Letter from Jewl (Hisma script)', 'Game Shop Tickets',
  ],
  currency: { cp: 0, sp: 0, gp: 10, ep: 0, pp: 0 },
  backstory: 'Salt Gnome artificer from the Treetap wizard family. A bomb demonstration dissolved his family into goo. Only his brother Tulin\'s remains were missing, replaced by a lizard pin. Former ship captain, betrayed by first mate Bolan. Held in Poll Cave by Jewl pirates.',
  notes: 'Brother may be alive and evil. The 6 Monk schoolings exist. Infused shield for +1 AC = 17 total.',
  portraitUrl: '/toern.png',
  tokenUrl: '/toern_bm.png',
  resources: [],
  createdAt: NOW - 30 * DAY,
  updatedAt: NOW,
};

/* ═══════════════════════════════════════════════════════════════
   ENCOUNTERS, MAPS, JOURNAL
   ═══════════════════════════════════════════════════════════════ */

const encounters = [
  {
    id: uid('enc'), name: "Poll Cave — Screwbeard's Ambush",
    description: 'The party descends into Poll Cave, a damp sea-cave with bioluminescent salt crystals and glowing tidepools. Screwbeard and his goblin crew guard the Jewl pirates cache.',
    enemies: [
      { enemyId: uid('enemy'), count: 1, customHp: 10 },
      { enemyId: uid('enemy'), count: 4, customHp: 7 },
      { enemyId: uid('enemy'), count: 1, customHp: 15 },
    ],
    environment: 'Coastal Cave — slippery saltstone, glowing tidepools, echoing acoustics',
    difficulty: 'medium', experienceReward: 450, isHomebrew: false,
    createdAt: NOW - 7 * DAY, updatedAt: NOW,
  },
  {
    id: uid('enc'), name: 'Bacilia Docks — Goblin Patrol',
    description: 'While investigating the Bacilia docks at night, the party is discovered by a Jewl pirate goblin patrol.',
    enemies: [
      { enemyId: uid('enemy'), count: 3, customHp: 7 },
      { enemyId: uid('enemy'), count: 1, customHp: 12 },
    ],
    environment: 'Urban Docks — crates, water hazards, dim lantern light',
    difficulty: 'easy', experienceReward: 200, isHomebrew: false,
    createdAt: NOW - 5 * DAY, updatedAt: NOW,
  },
];

const battleMaps = [
  {
    id: uid('map'), name: "Poll Cave — Screwbeard's Camp",
    imageUrl: '/screwbeard_cave_enc.png', imageFit: 'cover',
    gridWidth: 47, gridHeight: 26, gridSize: 40, gridColor: 'rgba(255,255,255,0.35)',
    fogOfWar: [], tokens: [], notes: 'Slippery terrain near water (DEX save or prone). Glowing tidepools shed dim light in 5ft radius.',
    createdAt: NOW - 7 * DAY, updatedAt: NOW,
  },
];

const journal = [
  {
    id: uid('journal'), title: 'Session 1: The Poll Cave Rescue',
    content: `# Session 1 — The Rescue of Toern Treetap\n\n## Summary\nThe party, gathered by Pavel in Bacilia's Loft district, accepted a mission to rescue Lord Puty from execution. Their first lead pointed them to Poll Cave, where the Jewl pirates held a captive — Toern Treetap.\n\n## Key Events\n- Wendy scouted ahead with her mouse companion\n- Screwbeard's goblins spotted Kehrfuffle's silhouette against bioluminescent crystals\n- Strider took out two goblins with sharpshooter longbow shots\n- Wendy dashed across slippery saltstone, unleashing Flurry of Blows on Screwbeard\n- Kehrfuffle used Faerie Fire to outline remaining enemies in violet light\n- Toern, freed from his cage, used Catapult to hurl a goblin into a tidepool\n\n## NPCs\n- **Screwbeard**: Dim-witted Dwarf pirate captain. Captured alive.\n- **Pavel**: One-armed Crown soldier of the Old Royal Order.\n- **Jewl Pirates**: Shadowy organization controlling Bacilia.\n\n## XP: 450 (150/character)\n\n## Loot\n- 50 gp from Screwbeard's stash\n- Sealed letter addressed to "J" (passed to Pavel)\n- Screwbeard's rusty boarding axe`,
    tags: ['session', 'poll-cave', 'combat', 'xp-awarded'],
    type: 'session', sessionNumber: 1,
    createdAt: NOW - 7 * DAY, updatedAt: NOW,
  },
  {
    id: uid('journal'), title: 'Session 2: Shadows of the Crown',
    content: `# Session 2 — The Bacilia Docks Investigation\n\n## Summary\nAfter returning from Poll Cave, the party rested at the Rusty Hook. Pavel debriefed — Puty's execution is in 2 days. The party investigates Counselor Quesel's operation.\n\n## Key Events\n- **The Rusty Hook**: Armand shared rumors of Quesel's midnight meetings near the Shellhouse\n- **Docks Investigation**:\n  - Strider used Disguise Kit to pose as a dock worker\n  - Kehrfuffle performed at a tavern, gathering gossip about Quesel's doves flying north\n  - Wendy picked the Shellhouse lock, finding a logbook with strange coordinates\n  - Toern identified alchemical ink traces — magical correspondence\n\n## Clues\n- Quesel sends weekly reports north (likely to Haven Tudul)\n- Coordinates point to an uncharted island west of Arkla\n- A letter mentions "the weapon the Mayor of Chauzy guards"`,
    tags: ['session', 'bacilia', 'investigation', 'lore'],
    type: 'session', sessionNumber: 2,
    createdAt: NOW - 3 * DAY, updatedAt: NOW,
  },
];

/* ═══════════════════════════════════════════════════════════════
   CAMPAIGN DOCUMENT
   ═══════════════════════════════════════════════════════════════ */

const campaignDoc = {
  data: {
    id: 'arkla',
    name: 'The Arkla Chronicles',
    description: 'A campaign set in the world of Arkla — a land of ancient magic, political intrigue, and buried secrets. The party investigates the mysterious lizard emblem, the Jewl pirates influence over the Crown, and the disappearance of loved ones tied to a shadowy figure known only as "the Stranger."',
    dmName: 'MikeJello',
    playerCharacters: [wendy, kehrfuffle, strider, toern],
    encounters,
    battleMaps,
    journal,
    settings: {
      homebrewRules: [
        'Currency: 50 leptons = 1 quadrans, 5 quadrans = 1 assarion',
        'Kol Points (Monk): Enriched ki — enhanced mobility options',
        'Arkla Companions: Primal Bond adds PB to companion checks/saves',
        'Song of Rest: Works on any short rest',
      ],
      experienceSystem: 'xp',
      currencyName: 'Assarions (Gold)',
      privateDmNotes: [
        'MAJOR PLOT POINTS:',
        '1. The Lizard Emblem — connects Wendys belt, Toerns pin, the strange coin. Represents the Lacerta, an ancient reptilian order.',
        '2. The Stranger (Khaven) — trades in "charm." Took Caroline (Kehrfuffle). Connected to Lacerta.',
        '3. Haven Tudul (Striders brother) — involved in Ruths death. Now works closely with the Emperor.',
        '4. The Bomb — was Toerns accident sabotage? Tulin may still be alive.',
        '5. The Weapon — Mayor Byron Tudul of Chauzy guards something the pirates want.',
        '',
        'TENSION CLOCK:',
        '- Putys Execution: 2 days from Session 2',
        '- Quesels reports to Haven: weekly, next in 5 days',
        '',
        'LOOSE THREADS:',
        '- What is the song in Palchs pocket watch?',
        '- Who is Clarion (the reptile eye in dreams)?',
        '- Why did Monk Wando abandon Foarn during the raid?',
        '- What is on the uncharted island west of Arkla?',
      ].join('\n'),
    },
    createdAt: NOW - 30 * DAY,
    updatedAt: NOW,
  },
  updatedAt: NOW,
  updatedBy: 'dm',
};

/* ═══════════════════════════════════════════════════════════════
   MAIN — Write to Firestore
   ═══════════════════════════════════════════════════════════════ */

async function main() {
  console.log('🌱 Seeding Arkla campaign to Firestore...\n');

  // 1. Write campaign document
  await db.collection('campaigns').doc('arkla').set(campaignDoc, { merge: true });
  console.log('✅ campaigns/arkla — written');

  // 2. Write empty homebrew library
  await db.collection('homebrew').doc('arkla').set({
    data: { items: [], spells: [], feats: [] },
    updatedAt: NOW,
    updatedBy: 'dm',
  }, { merge: true });
  console.log('✅ homebrew/arkla — written');

  // 3. Write initial live session
  await db.collection('liveSessions').doc('arkla').set({
    data: {
      activeEncounter: null,
      combatLog: [],
      liveSession: {
        activeEncounterId: null,
        phase: 'exploration',
        currentScene: 'Bacilia — The Rusty Hook Tavern',
        currentMapUrl: null,
        dmAnnouncement: null,
        sessionStartedAt: null,
        lastShortRestAt: null,
        lastLongRestAt: null,
        conditions: { weather: 'clear', lighting: 'bright', terrain: 'normal' },
      },
    },
    updatedAt: NOW,
    updatedBy: 'dm',
  }, { merge: true });
  console.log('✅ liveSessions/arkla — written');

  console.log('\n✨ Seed complete!');
  console.log(`   Characters: ${campaignDoc.data.playerCharacters.length}`);
  console.log(`   Encounters: ${campaignDoc.data.encounters.length}`);
  console.log(`   Battle Maps: ${campaignDoc.data.battleMaps.length}`);
  console.log(`   Journal entries: ${campaignDoc.data.journal.length}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
