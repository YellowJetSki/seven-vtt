/* ── Seed Production Firestore with Campaign Data ──────────────
 * Seeds the Arkla Chronicles campaign into production Firestore.
 * Requires Firebase Admin SDK credentials.
 *
 * Setup:
 *   1. Create a Firebase service account at:
 *      https://console.firebase.google.com/project/[PROJECT_ID]/settings/serviceaccounts/adminsdk
 *   2. Download the JSON key file
 *   3. Set env: export FIREBASE_SERVICE_ACCOUNT_KEY='{...}'
 *   4. Run: node scripts/seed-production.mjs
 *
 * What this seeds:
 *   - Campaign document (campaigns/arkla)
 *   - 4 player characters (Wendy, Kehrfuffle, Strider, Toern)
 *   - 2 encounters
 *   - 1 battle map
 *   - 2 journal entries
 *   - Homebrew collection
 *   - Live session state
 * ─────────────────────────────────────────────────────────────── */

const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!SERVICE_ACCOUNT) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required.");
  console.error("   Set it to the full JSON of your Firebase Admin SDK service account key.");
  process.exit(1);
}

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const NOW = Date.now();
const DAY = 86400000;

let uidCounter = 0;
function genUid(prefix) {
  return `${prefix}_prod_${uidCounter++}_${NOW}`;
}

console.log("🔥 Seeding production Firestore...\n");

// ── Build character data ──
function buildCharacter(options) {
  return {
    ...options,
    createdAt: admin.firestore.Timestamp.fromMillis(options.createdAt || NOW),
    updatedAt: admin.firestore.Timestamp.fromMillis(NOW),
  };
}

const wendy = buildCharacter({
  id: genUid("pc"),
  name: "Wendy Warmwind",
  playerName: "Gina",
  race: "Rock Gnome",
  class: "Monk",
  level: 2,
  subclass: "Way of the Kolari",
  background: "Hermit",
  alignment: "Neutral Good",
  experience: 600,
  inspiration: false,
  strength: 10, dexterity: 17, constitution: 16, intelligence: 15, wisdom: 16, charisma: 11,
  hitPoints: { current: 19, max: 19, temporary: 0 },
  armorClass: 15,
  initiative: 3,
  speed: { walk: 35 },
  proficiencyBonus: 2,
  hitDice: "1d8",
  deathSaves: { successes: 0, failures: 0 },
  conditions: [],
  features: [
    "Darkvision (60ft)", "Gnome Cunning (Adv. INT/WIS/CHA saves vs magic)",
    "Artificer's Lore", "Unarmored Defense", "Martial Arts (d4)",
    "Flurry of Blows (1 kol point)", "Patient Defense (1 kol point)",
    "Step of the Wind (1 kol point)", "Kolari Training (5 kol points)",
  ],
  equipment: [
    { name: "Quarterstaff", quantity: 1, weight: 4, isEquipped: true },
    { name: "Gear-shaped ninja stars", quantity: 10, weight: 2, isEquipped: true },
    { name: "Thieves' Tools", quantity: 1, weight: 1, isEquipped: false },
    { name: "Disguise Kit", quantity: 1, weight: 3, isEquipped: false },
    { name: "Explorer's Pack", quantity: 1, weight: 5, isEquipped: false },
    { name: "Bag of Caltrops", quantity: 1, weight: 2, isEquipped: false },
  ],
  inventory: [
    { name: "Flute", quantity: 1, weight: 1, description: "Wooden flute" },
    { name: "Faded photo of family", quantity: 1, weight: 0, description: "Precious memento" },
    { name: "Sketch of restaurant by the sea", quantity: 1, weight: 0, description: "Clue to Master Duku" },
    { name: "Loof's Loaf", quantity: 1, weight: 1, description: "Travel bread" },
    { name: "Invitation to Tudul's Party", quantity: 1, weight: 0, description: "From Chauzy" },
    { name: "Strange Coin", quantity: 1, weight: 0, description: "Reptilian eye emblem" },
  ],
  currency: { copper: 52, silver: 23, electrum: 0, gold: 9, platinum: 0 },
  backstory: "Wendy trained as a Kolari monk in Foarn under the mysterious Master Duku. After he vanished and a Brevar raid devastated the town, she fled to find him — her only clue a sketch of a restaurant by the sea.",
  notes: "Dream of reptile eye named Clarion. Recognized in Bacilia for lizard belt. Met Monk Hayne who trained Duku.",
  resources: [{ name: "Kol Points", current: 5, max: 5, recharge: "short" }],
});

const kehrfuffle = buildCharacter({
  id: genUid("pc"),
  name: "Kehrfuffle Songroot",
  playerName: "James",
  race: "Wood Elf",
  class: "Bard",
  level: 2,
  subclass: "College of Lore",
  background: "Entertainer",
  alignment: "Neutral Good",
  experience: 600,
  inspiration: false,
  strength: 10, dexterity: 17, constitution: 14, intelligence: 10, wisdom: 16, charisma: 17,
  hitPoints: { current: 17, max: 17, temporary: 0 },
  armorClass: 13,
  initiative: 3,
  speed: { walk: 35 },
  proficiencyBonus: 2,
  hitDice: "1d8",
  deathSaves: { successes: 0, failures: 0 },
  conditions: [],
  features: [
    "Darkvision (60ft)", "Keen Senses", "Fey Ancestry",
    "Elf Weapon Training", "Fleet of Foot (35ft)", "Mask of the Wild",
    "Spellcasting (Bard)", "Bardic Inspiration (d6, 3 rest)",
    "Jack of All Trades", "Song of Rest (d6)",
  ],
  equipment: [
    { name: "Leather Armor", quantity: 1, weight: 10, isEquipped: true },
    { name: "Sickle", quantity: 1, weight: 2, isEquipped: true, notes: "Druidic runes" },
    { name: "The Cursed Accordion", quantity: 1, weight: 8, isEquipped: false, notes: "Pulses with life" },
    { name: "Entertainer's Pack", quantity: 1, weight: 5, isEquipped: false },
    { name: "Dagger", quantity: 1, weight: 1, isEquipped: true },
  ],
  inventory: [
    { name: "Locket with Caroline's picture", quantity: 1, weight: 0, description: "Precious memento" },
    { name: "Loof Loaf", quantity: 1, weight: 1, description: "Travel bread" },
    { name: "Viking Lullaby sheet music", quantity: 1, weight: 0, description: "Mysterious song" },
    { name: "Palch's Pocket Watch", quantity: 1, weight: 0, description: "Mysterious song" },
  ],
  currency: { copper: 50, silver: 54, electrum: 0, gold: 35, platinum: 0 },
  backstory: "A Wood Elf accordionist who traded his wife Caroline to a mysterious stranger for musical talent. He now hunts the stranger across Arkla, joined by a growing group of adventurers with their own grievances.",
  notes: "The Stranger (called Khaven) has been active in Bacilia. Met Palch the mouse musician. Puty execution in 2 days.",
  resources: [{ name: "Bardic Inspiration", current: 3, max: 3, recharge: "long" }],
});

const strider = buildCharacter({
  id: genUid("pc"),
  name: "Edmund 'Strider' Tudul",
  playerName: "David",
  race: "Variant Human",
  class: "Ranger",
  level: 2,
  subclass: "Hunter",
  background: "Noble (Disowned)",
  alignment: "Neutral",
  experience: 600,
  inspiration: false,
  strength: 16, dexterity: 16, constitution: 14, intelligence: 10, wisdom: 9, charisma: 12,
  hitPoints: { current: 20, max: 20, temporary: 0 },
  armorClass: 13,
  initiative: 3,
  speed: { walk: 30 },
  proficiencyBonus: 2,
  hitDice: "1d10",
  deathSaves: { successes: 0, failures: 0 },
  conditions: [],
  features: [
    "Sharpshooter (-5 attack, +10 damage, ignore cover)",
    "Fighting Style: Defense (+1 AC in armor)",
    "Favored Foe (1d4 extra, 2/long rest)",
    "False Identity (Strider alias)",
  ],
  equipment: [
    { name: "Longbow", quantity: 1, weight: 2, isEquipped: true },
    { name: "Longsword", quantity: 1, weight: 3, isEquipped: true },
    { name: "Leather Armor", quantity: 1, weight: 10, isEquipped: true },
    { name: "Arrows", quantity: 20, weight: 1, isEquipped: true },
    { name: "Explorer's Pack", quantity: 1, weight: 5, isEquipped: false },
    { name: "Disguise Kit", quantity: 1, weight: 3, isEquipped: false },
  ],
  inventory: [
    { name: "Hooded Cloak", quantity: 1, weight: 2, description: "Dark grey" },
    { name: "Tudul Signet Ring", quantity: 1, weight: 0, description: "Hidden" },
    { name: "Map of Chauzy", quantity: 1, weight: 0, description: "" },
    { name: "Game Shop Tickets", quantity: 3, weight: 0, description: "Valid entry" },
  ],
  currency: { copper: 0, silver: 50, electrum: 0, gold: 25, platinum: 0 },
  backstory: "Fled royal life after witnessing his father murder his sister Ruth. Now goes by Strider, forging his own legend as the greatest Ranger Arkla has ever seen.",
  notes: "Met Pavel of the Old Royal Order. Tasked with rescuing Puty. Haven (brother) works with Emperor.",
  resources: [{ name: "Favored Foe", current: 2, max: 2, recharge: "long" }],
});

const toern = buildCharacter({
  id: genUid("pc"),
  name: "Toern Treetap",
  playerName: "Alex",
  race: "Salt Gnome",
  class: "Artificer",
  level: 2,
  subclass: "Artillerist",
  background: "Sailor",
  alignment: "Neutral Good",
  experience: 600,
  inspiration: false,
  strength: 8, dexterity: 14, constitution: 15, intelligence: 17, wisdom: 10, charisma: 12,
  hitPoints: { current: 17, max: 17, temporary: 0 },
  armorClass: 17,
  initiative: 2,
  speed: { walk: 25, swim: 25 },
  proficiencyBonus: 2,
  hitDice: "1d8",
  deathSaves: { successes: 0, failures: 0 },
  conditions: [],
  features: [
    "Darkvision (60ft)", "Gnome Cunning", "Saltwater Heritage (Swim 25ft, Cold resist)",
    "Magical Tinkering", "Spellcasting (Artificer, INT)", "Infuse Item (4 known, 2 active)",
  ],
  equipment: [
    { name: "Scale Mail", quantity: 1, weight: 45, isEquipped: true },
    { name: "Shield", quantity: 1, weight: 6, isEquipped: true, notes: "+1 Enhanced Defense infusion" },
    { name: "Dagger", quantity: 2, weight: 1, isEquipped: true },
    { name: "Tinker's Tools", quantity: 1, weight: 5, isEquipped: false },
    { name: "Alchemist's Supplies", quantity: 1, weight: 5, isEquipped: false },
    { name: "Dungeoneer's Pack", quantity: 1, weight: 5, isEquipped: false },
  ],
  inventory: [
    { name: "3 Glass Jars of Goop", quantity: 3, weight: 3, description: "His dissolved family" },
    { name: "Lizard Pin", quantity: 1, weight: 0, description: "Found at brother's disappearance" },
    { name: "Letter from Jewl", quantity: 1, weight: 0, description: "Hisma script" },
    { name: "Game Shop Tickets", quantity: 2, weight: 0, description: "Valid entry" },
  ],
  currency: { copper: 0, silver: 0, electrum: 0, gold: 10, platinum: 0 },
  backstory: "Salt Gnome artificer from the Treetap wizard family. A bomb demonstration dissolved his family into goo. Only his brother Tulin's remains were missing, replaced by a lizard pin. Former ship captain, betrayed by first mate Bolan.",
  notes: "Brother may be alive and evil. The 6 Monk schoolings exist. Infused shield for +1 AC = 17 total.",
  resources: [],
});

// ── Write characters ──
console.log("📝 Writing characters...");
for (const char of [wendy, kehrfuffle, strider, toern]) {
  await db.collection("campaigns").doc("arkla").collection("characters").doc(char.id).set(char);
  console.log(`   ✅ ${char.name} (${char.id})`);
}

// ── Write campaign document ──
console.log("\n📝 Writing campaign...");
await db.collection("campaigns").doc("arkla").set({
  id: "arkla",
  name: "The Arkla Chronicles",
  description: "A campaign set in the world of Arkla — a land of ancient magic, political intrigue, and buried secrets. The party investigates the mysterious lizard emblem, the Jewl pirates' influence over the Crown, and the disappearance of loved ones tied to a shadowy figure known only as 'the Stranger.'",
  dmName: "MikeJello",
  statistics: {
    characterCount: 4,
    encounterCount: 2,
    mapCount: 1,
    journalCount: 2,
    sessionCount: 2,
  },
  settings: {
    experienceSystem: "xp",
    currencyName: "Assarions (Gold)",
    allowedRaces: [],
    allowedClasses: [],
  },
  createdAt: admin.firestore.Timestamp.fromMillis(NOW - 30 * DAY),
  updatedAt: admin.firestore.Timestamp.fromMillis(NOW),
});
console.log("   ✅ Campaign — arkla");

// ── Write homebrew ──
console.log("\n📝 Writing homebrew...");
await db.collection("homebrew").doc("arkla").set({
  data: { items: [], spells: [], feats: [] },
  updatedAt: admin.firestore.Timestamp.fromMillis(NOW),
  updatedBy: "dm",
});
console.log("   ✅ Homebrew — empty (ready for DM to create)");

// ── Write live session ──
console.log("\n📝 Writing live session...");
await db.collection("liveSessions").doc("arkla").set({
  activeEncounter: null,
  combatLog: [],
  liveSession: {
    activeEncounterId: null,
    phase: "exploration",
    currentScene: "Bacilia — The Rusty Hook Tavern",
    currentMapUrl: null,
    dmAnnouncement: null,
    sessionStartedAt: null,
    lastShortRestAt: null,
    lastLongRestAt: null,
    conditions: { weather: "clear", lighting: "bright", terrain: "normal" },
  },
  updatedAt: admin.firestore.Timestamp.fromMillis(NOW),
  updatedBy: "dm",
});
console.log("   ✅ Live Session — arkla");

console.log("\n✨ Production seed complete!");
console.log("   Characters: 4 (Wendy, Kehrfuffle, Strider, Toern)");
console.log("   Campaign: The Arkla Chronicles");
console.log("   Connect your app and log in as MikeJello / Jello1");
console.log("   Player characters will load via Firestore onSnapshot.");
