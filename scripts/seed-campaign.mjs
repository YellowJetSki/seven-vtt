/* ── Seed Campaign to Firestore ────────────────────────────────
 * Usage: node scripts/seed-campaign.mjs
 * Requires the service-account.json file at project root.
 * This script pushes the Arkla seed data directly into production
 * Firestore using the Firebase Admin SDK.
 * ─────────────────────────────────────────────────────────────── */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Check for service account ─────────────────────────────────
const SA_PATH = resolve(ROOT, 'service-account.json');
if (!existsSync(SA_PATH)) {
  console.error('❌ service-account.json not found at project root.');
  console.error('   Place it there and try again.');
  process.exit(1);
}

// ── Dynamic import of firebase-admin ──────────────────────────
let admin;
try {
  admin = await import('firebase-admin');
} catch {
  console.error('❌ firebase-admin not installed. Run: npm install firebase-admin');
  process.exit(1);
}

// ── Initialize Admin SDK ──────────────────────────────────────
const serviceAccount = JSON.parse(readFileSync(SA_PATH, 'utf-8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

// ── Helper — generate deterministic-ish IDs ───────────────────
function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const NOW = Date.now();
const DAY = 86400000;

// ── Player Characters ─────────────────────────────────────────

function createWendy() {
  return {
    id: uid('pc'),
    name: 'Wendy Warmwind',
    alias: 'Wendy',
    playerName: 'Player',
    race: 'Rock Gnome',
    class: 'Monk',
    level: 2,
    background: 'Hermit',
    alignment: 'Neutral Good',
    experience: 600,
    abilityScores: { strength: 10, dexterity: 17, constitution: 16, intelligence: 15, wisdom: 16, charisma: 11 },
    savingThrows: { strength: 2, dexterity: 5 },
    skills: { acrobatics: 5, insight: 5, stealth: 5, sleightOfHand: 5, perception: 3 },
    hitPoints: { current: 19, max: 19, temporary: 0 },
    armorClass: 15,
    initiative: 3,
    speed: 35,
    proficiencyBonus: 2,
    features: [
      'Darkvision (60ft)',
      'Gnome Cunning',
      'Artificer\'s Lore',
      'Tinker',
      'Unarmored Defense (AC 10 + DEX + WIS)',
      'Martial Arts (d4)',
      'Flurry of Blows',
      'Patient Defense',
      'Step of the Wind',
      'Kolari Training',
    ],
    traits: ['Quiet and blends in', 'Guilt-ridden over Foarn raid', 'Searches for Master Duku', 'Tinkers with gadgets'],
    spells: [],
    equipment: [
      'Bag of Caltrops', 'Tinker\'s Tools', 'Quarterstaff', 'Gear-shaped ninja stars (10)',
      'Thieves\' Tools', 'Disguise Kit', 'Explorer\'s Pack', 'Flute',
      'Faded photo', 'Sketch of restaurant', 'Loof\'s Loaf', 'Scimitar', 'Strange Coin',
    ],
    currency: { cp: 52, sp: 23, gp: 9, ep: 0, pp: 0 },
    backstory: 'Wendy trained as a Kolari monk under Master Duku who vanished. After a Brevar raid devastated Foarn, she fled seeking him.',
    notes: 'Dreams of a reptile eye named Clarion. Met Monk Hayne who trained Duku.',
    portraitUrl: '/wendy.png',
    tokenUrl: '/wendy_bm.png',
    companion: {
      name: 'Little Mouse', species: 'Ordinary Mouse', hp: 1, ac: 10, speed: 45,
      isDormant: false, awakeLevel: 1,
      desc: 'The Ultimate Scout and Infiltrator.',
    },
    resources: [{ name: 'Kol Points', current: 5, max: 5, recharge: 'short' }],
    createdAt: NOW - 30 * DAY,
    updatedAt: NOW,
  };
}

function createKehrfuffle() {
  return {
    id: uid('pc'),
    name: 'Kehrfuffle Songroot',
    alias: 'Kehrfuffle',
    playerName: 'Player',
    race: 'Wood Elf',
    class: 'Bard',
    level: 2,
    background: 'Entertainer',
    alignment: 'Neutral Good',
    experience: 600,
    abilityScores: { strength: 10, dexterity: 17, constitution: 14, intelligence: 10, wisdom: 16, charisma: 17 },
    savingThrows: { dexterity: 5, charisma: 5 },
    skills: { acrobatics: 5, deception: 5, insight: 5, perception: 5, performance: 5, persuasion: 5 },
    hitPoints: { current: 17, max: 17, temporary: 0 },
    armorClass: 13,
    initiative: 3,
    speed: 35,
    proficiencyBonus: 2,
    features: [
      'Darkvision', 'Keen Senses', 'Fey Ancestry', 'Fleet of Foot', 'Mask of the Wild', 'Trance',
      'Spellcasting (Bard)', 'Bardic Inspiration (d6)', 'By Popular Demand', 'Jack of All Trades', 'Song of Rest (d6)',
    ],
    traits: ['Driven by grief for Caroline', 'Charismatic performer', 'Accordionist seeking revenge'],
    spells: [
      { level: 0, total: 4, expended: 0 },
      { level: 1, total: 3, expended: 0 },
    ],
    equipment: [
      'Leather Armor', 'Sickle', 'The Cursed Accordion', 'Entertainer\'s Pack',
      'Locket with Caroline\'s picture', 'Loof Loaf', 'Viking Lullaby', 'Dagger', 'Palch\'s Pocket Watch',
    ],
    currency: { cp: 50, sp: 54, gp: 35, ep: 0, pp: 0 },
    backstory: 'Traded his wife Caroline to the mysterious Stranger for musical talent. Now hunts him across Arkla.',
    notes: 'The Stranger (Khaven) was active in Bacilia. Met Palch the mouse musician. Puty\'s execution in 2 days.',
    portraitUrl: '/kehrfuffle.png',
    tokenUrl: '/kehrfuffle_bm.png',
    companion: {
      name: 'Tiny Bear', species: 'Unknown', hp: 20, ac: 13, speed: 30,
      isDormant: false, awakeLevel: 2,
      desc: 'A small bear cub from the Weeping Grove. Primal Bond: Kehrfuffle adds PB to its checks.',
      attacks: 'Maul: 1d6+2 slashing + PB. Entangling Growl: STR save vs spell DC or restrained.',
      stats: { strength: 14, dexterity: 12, constitution: 14, intelligence: 8, wisdom: 8, charisma: 10 },
      traits: 'Primal Bond',
    },
    resources: [{ name: 'Bardic Inspiration', current: 3, max: 3, recharge: 'long' }],
    createdAt: NOW - 30 * DAY,
    updatedAt: NOW,
  };
}

function createStrider() {
  return {
    id: uid('pc'),
    name: "Edmund 'Strider' Tudul",
    alias: 'Strider',
    playerName: 'Player',
    race: 'Variant Human',
    class: 'Ranger',
    level: 2,
    background: 'Noble (Disowned)',
    alignment: 'Neutral',
    experience: 600,
    abilityScores: { strength: 16, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 9, charisma: 12 },
    savingThrows: { strength: 5, dexterity: 5 },
    skills: { deception: 5, perception: 3, stealth: 5, insight: 3, persuasion: 3, history: 2 },
    hitPoints: { current: 20, max: 20, temporary: 0 },
    armorClass: 13,
    initiative: 3,
    speed: 30,
    proficiencyBonus: 2,
    features: [
      'Sharpshooter', 'Fighting Style: Defense', 'Favored Foe', 'False Identity', 'Deception Expertise',
    ],
    traits: ['Rejects Tudul heritage', 'Witnessed sister Ruth\'s murder', 'Seeks legendary Ranger status'],
    spells: [
      { level: 0, total: 0, expended: 0 },
      { level: 1, total: 2, expended: 0 },
    ],
    equipment: [
      'Longbow', 'Longsword', 'Arrows (20)', 'Quiver', 'Leather Armor', 'Hooded Cloak',
      'Fine Clothes (Tudul)', 'Explorer\'s Pack', 'Disguise Kit', 'Forgery Kit',
      'Tudul Signet Ring', 'Wilderness Survival Book', 'Loof Loaf', 'Map of Chauzy', 'Game Shop Tickets (3)',
    ],
    currency: { cp: 0, sp: 50, gp: 25, ep: 0, pp: 0 },
    backstory: 'Fled royal life after witnessing his father murder sister Ruth. Now goes by Strider, forging his own legend.',
    notes: 'Met Pavel of the Old Royal Order. Tasked with rescuing Lord Puty. Haven Tudul (brother) works with the Emperor.',
    portraitUrl: '/strider.png',
    tokenUrl: '/strider_bm.png',
    resources: [
      { name: 'Arrows', current: 17, max: 20, recharge: 'none' },
      { name: 'Favored Foe', current: 2, max: 2, recharge: 'long' },
    ],
    createdAt: NOW - 30 * DAY,
    updatedAt: NOW,
  };
}

function createToern() {
  return {
    id: uid('pc'),
    name: 'Toern Treetap',
    alias: 'Toern',
    playerName: 'Player',
    race: 'Salt Gnome',
    class: 'Artificer',
    level: 2,
    background: 'Sailor',
    alignment: 'Neutral Good',
    experience: 600,
    abilityScores: { strength: 8, dexterity: 14, constitution: 15, intelligence: 17, wisdom: 10, charisma: 12 },
    savingThrows: { constitution: 4, intelligence: 5 },
    skills: { investigation: 5, perception: 2, athletics: 1 },
    hitPoints: { current: 17, max: 17, temporary: 0 },
    armorClass: 12,
    initiative: 2,
    speed: 25,
    proficiencyBonus: 2,
    features: [
      'Darkvision', 'Gnome Cunning', 'Saltwater Heritage', 'Magical Tinkering',
      'Spellcasting (Artificer)', 'Infuse Item (4 known, 2 active)',
      'Enhanced Defense', 'Repeating Shot',
    ],
    traits: ['Loves explosives', 'Haunted by family accident', 'Searching for brother Tulin', 'Betrayed by first mate'],
    spells: [
      { level: 0, total: 2, expended: 0 },
      { level: 1, total: 2, expended: 0 },
    ],
    equipment: [
      '3 Glass Jars of Goop', 'Lizard Pin', 'Scale Mail', 'Shield (+1 Enhanced Defense)',
      '2 Daggers', 'Tinker\'s Tools', 'Alchemist\'s Supplies', 'Dungeoneer\'s Pack',
      'Letter from Jewl', 'Game Shop Tickets',
    ],
    currency: { cp: 0, sp: 0, gp: 10, ep: 0, pp: 0 },
    backstory: 'Survived an accident that dissolved his wizard family. Brother Tulin may be alive. Former captain, betrayed by first mate Bolan. Held in Poll Cave.',
    notes: 'Brother may be alive and evil. The 6 Monk schoolings. Infused shield for +1 AC = 17 total.',
    portraitUrl: '/toern.png',
    tokenUrl: '/toern_bm.png',
    resources: [],
    createdAt: NOW - 30 * DAY,
    updatedAt: NOW,
  };
}

// ── Encounters ─────────────────────────────────────────────────

function createEncounters() {
  return [
    {
      id: uid('enc'),
      name: 'Poll Cave — Screwbeard\'s Ambush',
      description: 'The party descends into Poll Cave to rescue Toern. Screwbeard and his goblin crew guard the Jewl pirates\' cache.',
      enemies: [
        { enemyId: uid('enemy'), count: 1, customHp: 10 },
        { enemyId: uid('enemy'), count: 4, customHp: 7 },
        { enemyId: uid('enemy'), count: 1, customHp: 15 },
      ],
      environment: 'Coastal Cave — slippery saltstone, glowing tidepools',
      difficulty: 'medium',
      experienceReward: 450,
      isHomebrew: false,
      createdAt: NOW - 7 * DAY,
      updatedAt: NOW,
    },
    {
      id: uid('enc'),
      name: 'Bacilia Docks — Goblin Patrol',
      description: 'A Jewl pirate goblin patrol discovers the party investigating the docks at night.',
      enemies: [
        { enemyId: uid('enemy'), count: 3, customHp: 7 },
        { enemyId: uid('enemy'), count: 1, customHp: 12 },
      ],
      environment: 'Urban Docks — crates, water hazards, dim light',
      difficulty: 'easy',
      experienceReward: 200,
      isHomebrew: false,
      createdAt: NOW - 5 * DAY,
      updatedAt: NOW,
    },
  ];
}

// ── Battle Maps ───────────────────────────────────────────────

function createBattleMaps() {
  return [
    {
      id: uid('map'),
      name: 'Poll Cave — Screwbeard\'s Camp',
      imageUrl: '/screwbeard_cave_enc.png',
      imageFit: 'cover',
      gridWidth: 47,
      gridHeight: 26,
      gridSize: 40,
      gridColor: 'rgba(255,255,255,0.35)',
      fogOfWar: [],
      tokens: [],
      createdAt: NOW - 7 * DAY,
      updatedAt: NOW,
    },
  ];
}

// ── Journal ───────────────────────────────────────────────────

function createJournal() {
  return [
    {
      id: uid('journal'),
      title: 'Session 1: The Poll Cave Rescue',
      content: `# Session 1 — The Rescue of Toern Treetap

The party, gathered by Pavel in Bacilia's Loft district, accepted a mission to rescue Lord Puty from execution. Their first lead pointed them to Poll Cave.

Key Events:
- Wendy scouted ahead with her mouse companion.
- Screwbeard's goblins spotted Kehrfuffle against the bioluminescent crystals.
- Strider took out two goblins with sharpshooter shots.
- Wendy unleashed Flurry of Blows on Screwbeard.
- Kehrfuffle used Faerie Fire to outline enemies.
- Toern used Catapult to hurl a goblin into a tidepool.

NPCs: Screwbeard (captured), Pavel (Old Royal Order), Jewl Pirates.

Loot: 50 gp, sealed letter addressed to "J", Screwbeard's boarding axe.`,
      tags: ['session', 'poll-cave', 'combat'],
      type: 'session',
      sessionNumber: 1,
      createdAt: NOW - 7 * DAY,
      updatedAt: NOW,
    },
    {
      id: uid('journal'),
      title: 'Session 2: The Bacilia Docks Investigation',
      content: `# Session 2 — Shadows of the Crown

After Poll Cave, the party rested at the Rusty Hook. Pavel debriefed them — Puty's execution is in 2 days.

Key Events:
- Armand shared rumors of Quesel's midnight meetings near the Shellhouse.
- Strider disguised as a dock worker.
- Kehrfuffle gathered gossip via performance.
- Wendy picked the Shellhouse lock, finding a logbook with strange coordinates.
- Toern examined alchemical ink traces.

Clues: Quesel reports north weekly. Coordinates point to an uncharted island. A letter mentions "the weapon the Mayor of Chauzy guards."`,
      tags: ['session', 'bacilia', 'investigation'],
      type: 'session',
      sessionNumber: 2,
      createdAt: NOW - 3 * DAY,
      updatedAt: NOW,
    },
  ];
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Arkla campaign data to Firestore...\n');

  const campaignData = {
    data: {
      id: 'arkla',
      name: 'The Arkla Chronicles',
      description: 'A campaign set in the world of Arkla — ancient magic, political intrigue, and buried secrets. The party investigates the lizard emblem, the Jewl pirates, and the disappearance of loved ones tied to "the Stranger."',
      dmName: 'MikeJello',
      playerCharacters: [createWendy(), createKehrfuffle(), createStrider(), createToern()],
      encounters: createEncounters(),
      battleMaps: createBattleMaps(),
      journal: createJournal(),
      settings: {
        homebrewRules: [
          'Currency: 50 leptons = 1 quadrans, 5 quadrans = 1 assarion',
          'Kol Points (Monk): Enriched ki for enhanced mobility',
          'Arkla Companions: Primal Bond adds PB to companion checks/saves',
          'Song of Rest: Works on any short rest',
        ],
        experienceSystem: 'xp',
        currencyName: 'Assarions (Gold)',
        privateDmNotes: `MAJOR PLOT POINTS:
1. The Lizard Emblem — connects Wendy's belt, Toern's pin, the strange coin. Represents the Lacerta.
2. The Stranger (Khaven) — trades in "charm." Took Caroline. Connected to Lacerta.
3. Haven Tudul (Strider's brother) — involved in Ruth's death.
4. The Bomb — was Toern's accident sabotage? Tulin may be alive.
5. The Weapon — Mayor Byron Tudul guards something the pirates want.

TENSION CLOCK:
- Puty's Execution: 2 days
- Quesel's reports to Haven: weekly, next in 5 days

LOOSE THREADS:
- What is the song in Palch's pocket watch?
- Who is Clarion (the reptile eye)?
- Why did Monk Wando abandon Foarn?
- What's on the uncharted island west of Arkla?`,
      },
      createdAt: NOW - 30 * DAY,
      updatedAt: NOW,
    },
    updatedAt: NOW,
    updatedBy: 'dm',
  };

  // Push campaign document
  await db.collection('campaigns').doc('arkla').set(campaignData, { merge: true });
  console.log('✅ Campaign document written (campaigns/arkla)');

  // Push initial homebrew library
  const homebrewData = {
    data: {
      items: [],
      spells: [],
      feats: [],
    },
    updatedAt: NOW,
    updatedBy: 'dm',
  };
  await db.collection('homebrew').doc('arkla').set(homebrewData, { merge: true });
  console.log('✅ Homebrew document written (homebrew/arkla)');

  // Push initial live session state
  const sessionData = {
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
        conditions: {
          weather: 'clear',
          lighting: 'bright',
          terrain: 'normal',
        },
      },
    },
    updatedAt: NOW,
    updatedBy: 'dm',
  };
  await db.collection('liveSessions').doc('arkla').set(sessionData, { merge: true });
  console.log('✅ LiveSession document written (liveSessions/arkla)');

  console.log('\n✨ Seed complete! The Arkla Chronicles campaign is ready.');
  console.log(`   Characters: ${campaignData.data.playerCharacters.length}`);
  console.log(`   Encounters: ${campaignData.data.encounters.length}`);
  console.log(`   Journal entries: ${campaignData.data.journal.length}`);
  console.log(`   Battle maps: ${campaignData.data.battleMaps.length}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
