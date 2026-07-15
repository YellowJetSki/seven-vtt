/* ── Seed Emulator Script ──────────────────────────────────────
 * Seeds the Firestore emulator with campaign data for testing.
 * Run with: node scripts/seed-emulator.mjs
 * ─────────────────────────────────────────────────────────────── */

const BASE = 'http://127.0.0.1:8090';
const PROJECT = 'demo-str-vtt';
const DB_PATH = `projects/${PROJECT}/databases/(default)/documents`;
const NOW = Date.now();
const DM = 'dm@strvtt';

/**
 * Makes a Firestore REST API call to create/update a document.
 */
async function writeDocument(path, documentId, data) {
  const url = `${BASE}/v1/${DB_PATH}/${path}?documentId=${documentId}`;
  const body = JSON.stringify({ fields: data });
  
  try {
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const result = await resp.json();
    if (!resp.ok) {
      console.error(`[ERROR] ${path}/${documentId}:`, JSON.stringify(result).substring(0, 200));
    } else {
      console.log(`[OK] ${path}/${documentId}`);
    }
    return result;
  } catch (e) {
    console.error(`[ERROR] ${path}/${documentId}:`, e.message);
  }
}

/**
 * Converts a JS value to a Firestore REST API field value.
 */
function toFieldValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { integerValue: value.toString() };
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFieldValue) } };
  if (typeof value === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFieldValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

async function main() {
  console.log('=== SEEDING FIRESTORE EMULATOR ===\n');
  
  // ── Characters ─────────────────────────────────────────────
  const characters = [
    {
      id: 'char_wendy', name: 'Wendy', playerName: 'David',
      race: 'Half-Elf', class: 'Paladin (Oath of Vengeance)',
      level: 5, experiencePoints: 14000,
      background: 'Soldier', alignment: 'Lawful Neutral',
      inspiration: false,
      strength: 18, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 12, charisma: 16,
      hitPoints: { current: 44, max: 44, temporary: 0 },
      armorClass: 20, initiative: 0, speed: 30, hitDice: '5d10',
      proficiencyBonus: 3, conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: [
        { name: 'Darkvision', description: 'Can see in dim light as bright, and in darkness as dim light up to 60ft.', source: 'Half-Elf' },
        { name: 'Divine Smite', description: 'When you hit a creature, expend a spell slot to deal 2d8 + 1d8 per slot level above 1st radiant damage.', source: 'Paladin' },
      ],
      proficiencies: ['All armor', 'All shields', 'Simple weapons', 'Martial weapons'],
      languages: ['Common', 'Elvish', 'Dwarvish'],
      features: ['Fighting Style: Dueling', 'Divine Smite', 'Extra Attack'],
      equipment: [
        { slot: 'main_hand', item: 'Longsword +1', quantity: 1, weight: 3, notes: '+1 attack/damage' },
        { slot: 'off_hand', item: 'Shield', quantity: 1, weight: 6, notes: '+2 AC' },
        { slot: 'armor', item: 'Plate Armor', quantity: 1, weight: 65, notes: 'AC 18' },
      ],
      inventory: [
        { name: "Explorer's Pack", quantity: 1, weight: 10, description: 'Standard pack', isEquipped: true },
        { name: 'Potion of Healing', quantity: 3, weight: 0.5, description: '2d4+2 HP', isEquipped: false },
      ],
      copper: 0, silver: 0, electrum: 0, gold: 85, platinum: 0,
      appearance: 'Tall, cropped silver hair, pale blue eyes, immaculate plate armor.',
      backstory: 'Former soldier who refused an order to harm innocents.',
      allies: 'The Right Hand network', characterNotes: 'Rigid moral judgments, developing nuance.',
      isHomebrew: false, createdAt: NOW - 86400000, updatedAt: NOW,
      imageUrl: null,
    },
    {
      id: 'char_kehrfuffle', name: 'Kehrfuffle', playerName: 'Mike',
      race: 'Tiefling', class: 'Warlock (The Fiend)',
      level: 5, experiencePoints: 14000,
      background: 'Haunted One', alignment: 'Chaotic Neutral',
      inspiration: false,
      strength: 8, dexterity: 14, constitution: 14, intelligence: 12, wisdom: 10, charisma: 18,
      hitPoints: { current: 31, max: 31, temporary: 0 },
      armorClass: 14, initiative: 2, speed: 30, hitDice: '5d8',
      proficiencyBonus: 3, conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: [
        { name: 'Darkvision', description: 'See in darkness up to 60ft.', source: 'Tiefling' },
        { name: 'Hellish Resistance', description: 'Resistance to fire damage.', source: 'Tiefling' },
      ],
      proficiencies: ['Light armor', 'Simple weapons', 'Arcana', 'Deception', 'Stealth'],
      languages: ['Common', 'Infernal', 'Abyssal'],
      features: ['Agonizing Blast', 'Mask of Many Faces', 'Repelling Blast', 'Pact of the Chain'],
      equipment: [
        { slot: 'main_hand', item: 'Arcane Focus (Crystal)', quantity: 1, weight: 0, notes: 'Focus' },
        { slot: 'armor', item: 'Leather Armor', quantity: 1, weight: 10, notes: 'AC 11+DEX' },
      ],
      inventory: [
        { name: "Dungeoneer's Pack", quantity: 1, weight: 10, description: 'Standard pack', isEquipped: true },
        { name: 'Potion of Invisibility', quantity: 1, weight: 0.5, description: 'Invisible 1 hour', isEquipped: false },
      ],
      copper: 0, silver: 12, electrum: 0, gold: 47, platinum: 0,
      appearance: 'Crimson skin, black hair, orange-glowing eyes, dark practical clothes.',
      backstory: 'Made a pact with fiend Zarthus to escape execution.',
      allies: 'Underworld informants', characterNotes: 'Looking for loopholes, loyal to party.',
      isHomebrew: false, createdAt: NOW - 86400000, updatedAt: NOW,
      imageUrl: null,
    },
    {
      id: 'char_strider', name: 'Strider', playerName: 'Ben',
      race: 'Wood Elf', class: 'Ranger (Hunter)',
      level: 5, experiencePoints: 14000,
      background: 'Outlander', alignment: 'Chaotic Good',
      inspiration: false,
      strength: 12, dexterity: 18, constitution: 14, intelligence: 10, wisdom: 16, charisma: 8,
      hitPoints: { current: 38, max: 38, temporary: 0 },
      armorClass: 16, initiative: 4, speed: 35, hitDice: '5d10',
      proficiencyBonus: 3, conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: [
        { name: 'Darkvision', description: 'See in darkness up to 60ft.', source: 'Wood Elf' },
        { name: 'Fey Ancestry', description: 'Advantage vs charm, immune to sleep.', source: 'Elf' },
        { name: 'Mask of the Wild', description: 'Hide when lightly obscured by nature.', source: 'Wood Elf' },
      ],
      proficiencies: ['Light armor', 'Medium armor', 'Martial weapons', 'Survival', 'Perception', 'Stealth'],
      languages: ['Common', 'Elvish', 'Orcish', 'Giant'],
      features: ['Archery (+2 ranged)', 'Colossus Slayer (+1d8)', 'Extra Attack', 'Favored Enemy: Humanoids'],
      equipment: [
        { slot: 'ranged', item: 'Longbow +1', quantity: 1, weight: 2, notes: '+1 attack/damage' },
        { slot: 'melee', item: 'Shortswords (dual)', quantity: 2, weight: 4, notes: 'Light, finesse' },
        { slot: 'armor', item: 'Studded Leather', quantity: 1, weight: 13, notes: 'AC 12+DEX' },
      ],
      inventory: [
        { name: "Explorer's Pack", quantity: 1, weight: 15, description: 'Standard pack', isEquipped: true },
        { name: 'Hunting Trap', quantity: 2, weight: 10, description: 'DC 13 DEX or 1d4+restrained', isEquipped: false },
      ],
      copper: 0, silver: 8, electrum: 0, gold: 32, platinum: 0,
      appearance: 'Lean, sun-bronzed, brown hair, hazel eyes, forest-toned leathers.',
      backstory: 'Left elven enclave after disagreeing with isolationist policies.',
      allies: 'Forest creatures and homesteaders', characterNotes: 'Aloof but caring, struggles in cities.',
      isHomebrew: false, createdAt: NOW - 86400000, updatedAt: NOW,
      imageUrl: null,
    },
    {
      id: 'char_toern', name: 'Toern', playerName: 'Sarah',
      race: 'Lightfoot Halfling', class: 'Bard (College of Lore)',
      level: 5, experiencePoints: 14000,
      background: 'Entertainer', alignment: 'Neutral Good',
      inspiration: false,
      strength: 8, dexterity: 14, constitution: 12, intelligence: 14, wisdom: 10, charisma: 18,
      hitPoints: { current: 29, max: 29, temporary: 0 },
      armorClass: 15, initiative: 2, speed: 25, hitDice: '5d8',
      proficiencyBonus: 3, conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: [
        { name: 'Lucky', description: 'Reroll 1s on d20.', source: 'Halfling' },
        { name: 'Brave', description: 'Advantage vs frightened.', source: 'Halfling' },
        { name: 'Naturally Stealthy', description: 'Hide behind larger creatures.', source: 'Lightfoot Halfling' },
        { name: 'Bardic Inspiration (d8)', description: 'Grant a d8 to an ally.', source: 'Bard' },
        { name: 'Cutting Words', description: 'Subtract BI die from enemy rolls.', source: 'College of Lore' },
      ],
      proficiencies: ['Light armor', 'Simple weapons', 'Rapiers', 'Shortswords', 'Performance', 'Persuasion', 'Deception', 'History'],
      languages: ['Common', 'Halfling', 'Elvish', 'Draconic'],
      features: ['Jack of All Trades', 'Song of Rest (1d6)', 'Expertise: Deception, Persuasion', 'Magical Secrets'],
      equipment: [
        { slot: 'main_hand', item: 'Rapier', quantity: 1, weight: 2, notes: 'Finesse, 1d8' },
        { slot: 'ranged', item: 'Hand Crossbow', quantity: 1, weight: 3, notes: 'Range 30/120' },
        { slot: 'armor', item: 'Studded Leather', quantity: 1, weight: 13, notes: 'AC 12+DEX' },
        { slot: 'accessory', item: 'Lute', quantity: 1, weight: 3, notes: 'Spell focus' },
      ],
      inventory: [
        { name: "Entertainer's Pack", quantity: 1, weight: 12, description: 'Standard pack', isEquipped: true },
        { name: 'Acid Vial (x3)', quantity: 3, weight: 1, description: '2d6 acid, DC 12 DEX', isEquipped: false },
      ],
      copper: 0, silver: 15, electrum: 0, gold: 56, platinum: 0,
      appearance: 'Curly auburn hair, bright-eyed, colorful clothes, ornate lute.',
      backstory: 'Grew up in a traveling circus, left to find better stories.',
      allies: 'Innkeeps and bards across three kingdoms', characterNotes: 'Moral center of the party.',
      isHomebrew: false, createdAt: NOW - 86400000, updatedAt: NOW,
      imageUrl: null,
    },
  ];

  // ── Write each character ──
  for (const char of characters) {
    const fields = {};
    for (const [key, value] of Object.entries(char)) {
      fields[key] = toFieldValue(value);
    }
    await writeDocument('campaigns/arkla/characters', char.id, fields);
  }

  // ── Enemies ──
  const enemies = [
    {
      id: 'goblin_01', name: 'Goblin', type: 'Humanoid', size: 'Small',
      armorClass: 15, hitPoints: { current: 7, max: 7, temporary: 0 },
      speed: 30, abilities: { strength: 8, dexterity: 14, constitution: 10, intelligence: 10, wisdom: 8, charisma: 8 },
      savingThrows: {}, skills: { Stealth: 6 },
      damageVulnerabilities: [], damageResistances: [], damageImmunities: [], conditionImmunities: [],
      senses: 'Darkvision 60ft', languages: 'Common, Goblin', challengeRating: 0.25,
      traits: 'Nimble Escape: Bonus action Disengage or Hide',
      actions: 'Scimitar: +4, 1d6+2 slashing. Shortbow: +4, 1d6+2 piercing.',
      isHomebrew: false, createdAt: NOW, updatedAt: NOW, imageUrl: null,
    },
    {
      id: 'goblin_boss_01', name: 'Goblin Boss', type: 'Humanoid', size: 'Small',
      armorClass: 17, hitPoints: { current: 21, max: 21, temporary: 0 },
      speed: 30, abilities: { strength: 10, dexterity: 14, constitution: 12, intelligence: 10, wisdom: 10, charisma: 10 },
      savingThrows: {}, skills: { Stealth: 6, Intimidation: 4 },
      damageVulnerabilities: [], damageResistances: [], damageImmunities: [], conditionImmunities: [],
      senses: 'Darkvision 60ft', languages: 'Common, Goblin', challengeRating: 1,
      traits: 'Nimble Escape. Multiattack: Two scimitar attacks.',
      actions: 'Scimitar: +4, 1d6+2 slashing. Redirect Attack (reaction).',
      isHomebrew: false, createdAt: NOW, updatedAt: NOW, imageUrl: null,
    },
    {
      id: 'sahuagin_01', name: 'Sahuagin', type: 'Humanoid', size: 'Medium',
      armorClass: 12, hitPoints: { current: 22, max: 22, temporary: 0 },
      speed: 30, abilities: { strength: 13, dexterity: 11, constitution: 12, intelligence: 12, wisdom: 13, charisma: 9 },
      savingThrows: {}, skills: { Perception: 5 },
      damageVulnerabilities: [], damageResistances: [], damageImmunities: [], conditionImmunities: [],
      senses: 'Darkvision 120ft', languages: 'Sahuagin', challengeRating: 0.5,
      traits: 'Blood Frenzy. Limited Amphibiousness. Shark Telepathy.',
      actions: 'Bite: +3, 1d4+1. Claws: +3, 1d4+1. Trident: +3, 1d6+1.',
      isHomebrew: false, createdAt: NOW, updatedAt: NOW, imageUrl: null,
    },
    {
      id: 'sahuagin_priest', name: 'Sahuagin Priest', type: 'Humanoid', size: 'Medium',
      armorClass: 14, hitPoints: { current: 33, max: 33, temporary: 0 },
      speed: 30, abilities: { strength: 12, dexterity: 12, constitution: 12, intelligence: 14, wisdom: 14, charisma: 12 },
      savingThrows: { wisdom: 4 }, skills: { Perception: 6, Religion: 4 },
      damageVulnerabilities: [], damageResistances: [], damageImmunities: [], conditionImmunities: [],
      senses: 'Darkvision 120ft', languages: 'Sahuagin', challengeRating: 2,
      traits: 'Blood Frenzy. Spellcasting: Bless, Shield of Faith, Hold Person.',
      actions: 'Multiattack: Two claws. Claw: +4, 1d4+2 slashing.',
      isHomebrew: false, createdAt: NOW, updatedAt: NOW, imageUrl: null,
    },
    {
      id: 'giant_shark', name: 'Giant Shark', type: 'Beast', size: 'Huge',
      armorClass: 13, hitPoints: { current: 126, max: 126, temporary: 0 },
      speed: 50, abilities: { strength: 23, dexterity: 11, constitution: 21, intelligence: 1, wisdom: 10, charisma: 5 },
      savingThrows: { strength: 9, constitution: 8, wisdom: 3 }, skills: { Perception: 3 },
      damageVulnerabilities: [], damageResistances: [], damageImmunities: [], conditionImmunities: [],
      senses: 'Blindsight 60ft', languages: '', challengeRating: 5,
      traits: 'Blood Frenzy. Water Breathing. Keen Smell.',
      actions: 'Bite: +9, 3d6+6 piercing. Swallow (if target at 0 HP).',
      isHomebrew: false, createdAt: NOW, updatedAt: NOW, imageUrl: null,
    },
  ];

  for (const enemy of enemies) {
    const fields = {};
    for (const [key, value] of Object.entries(enemy)) {
      fields[key] = toFieldValue(value);
    }
    await writeDocument('campaigns/arkla/enemies', enemy.id, fields);
  }

  // ── Encounters ──
  const encounters = [
    {
      id: 'enc_poll_cave', name: 'The Poll Cave Ambush',
      description: 'Goblin ambush in narrow cave passage with pitfalls and hit-and-run tactics.',
      environment: 'Underground cave', difficulty: 'Medium', isActive: false,
      enemyGroups: [
        { enemyId: 'goblin_01', count: 4 },
        { enemyId: 'goblin_boss_01', count: 1 },
      ],
      createdAt: NOW, updatedAt: NOW,
    },
    {
      id: 'enc_bacilia_docks', name: 'The Bacilia Docks Raid',
      description: 'Sahuagin raid on Bacilia harbor. Protect dockworkers and sink the ship.',
      environment: 'Dockside / Coastal', difficulty: 'Hard', isActive: false,
      enemyGroups: [
        { enemyId: 'sahuagin_01', count: 3 },
        { enemyId: 'sahuagin_priest', count: 1 },
        { enemyId: 'giant_shark', count: 1 },
      ],
      createdAt: NOW, updatedAt: NOW,
    },
  ];

  for (const enc of encounters) {
    const fields = {};
    for (const [key, value] of Object.entries(enc)) {
      fields[key] = toFieldValue(value);
    }
    await writeDocument('campaigns/arkla/encounters', enc.id, fields);
  }

  // ── Maps ──
  const maps = [
    {
      id: 'map_poll_cave', name: 'Poll Cave System',
      imageUrl: null, imageFit: 'contain',
      gridWidth: 30, gridHeight: 20, gridSize: 50, gridColor: '#4a5568',
      notes: 'Narrow entrance, goblin tripwire at (8,10) connected to net trap.',
      createdAt: NOW, updatedAt: NOW,
    },
  ];

  for (const map of maps) {
    const fields = {};
    for (const [key, value] of Object.entries(map)) {
      fields[key] = toFieldValue(value);
    }
    await writeDocument('campaigns/arkla/maps', map.id, fields);
  }

  // ── Map Tokens ──
  const tokens = [
    { id: 'tk_wendy', type: 'player', label: 'Wendy', x: 2, y: 10, color: '#c53030', size: 1, visible: true, hp: { current: 44, max: 44 }, speed: 30 },
    { id: 'tk_kehrfuffle', type: 'player', label: 'Kehrfuffle', x: 3, y: 12, color: '#6b46c1', size: 1, visible: true, hp: { current: 31, max: 31 }, speed: 30 },
    { id: 'tk_strider', type: 'player', label: 'Strider', x: 1, y: 14, color: '#2b6cb0', size: 1, visible: true, hp: { current: 38, max: 38 }, speed: 35 },
    { id: 'tk_toern', type: 'player', label: 'Toern', x: 4, y: 8, color: '#38a169', size: 1, visible: true, hp: { current: 29, max: 29 }, speed: 25 },
  ];

  for (const token of tokens) {
    const fields = {};
    for (const [key, value] of Object.entries(token)) {
      fields[key] = toFieldValue(value);
    }
    await writeDocument('campaigns/arkla/maps/map_poll_cave/tokens', token.id, fields);
  }

  // ── Journal Entries ──
  const journal = [
    {
      id: 'journal_s01', title: 'Session 1: The Road to Poll Cave',
      content: 'The party met in Oakhaven, hired to investigate disappearances on the Poll Road. Found a broken-down merchant cart with claw marks, an abandoned guard post, and captured a goblin scout who revealed the cave location.',
      tags: ['session', 'poll-cave', 'oakhaven'],
      type: 'session', sessionNumber: 1,
      createdAt: NOW - 86400000, updatedAt: NOW,
    },
    {
      id: 'journal_lore01', title: 'The Shifting Veil: A Primer',
      content: 'An ancient magical phenomenon causing planar boundaries to thin. Monsters crossing between planes, magical anomalies, lost civilizations resurfacing. Scholars believe the Veil is being deliberately weakened.',
      tags: ['lore', 'shifting-veil', 'world-building'],
      type: 'lore',
      createdAt: NOW - 86400000, updatedAt: NOW,
    },
    {
      id: 'journal_quest01', title: 'Main Quest: Investigate the Poll Cave',
      content: 'Clear goblins from Poll Cave, find their supplier, return stolen goods. Reward: 200 GP + free lodging. Status: In Progress.',
      tags: ['quest', 'main', 'poll-cave', 'oakhaven'],
      type: 'quest',
      createdAt: NOW - 86400000, updatedAt: NOW,
    },
  ];

  for (const entry of journal) {
    const fields = {};
    for (const [key, value] of Object.entries(entry)) {
      fields[key] = toFieldValue(value);
    }
    await writeDocument('campaigns/arkla/journal', entry.id, fields);
  }

  // ── Campaign Meta (root document) ──
  const campaignMeta = {
    name: 'The Stᚱ VTT Campaign',
    description: 'A homebrew D&D 5e campaign of political intrigue, ancient magic, and looming catastrophe.',
    dmName: 'MikeJello',
    settings: {
      homebrewRules: ['Flanking grants advantage', 'Criticals on 19-20', 'Bonus action potions'],
      experienceSystem: 'milestone',
      currencyName: 'Gold',
      privateDmNotes: 'Watch party balance — Wendy and Kehrfuffle heavy hitters, Strider skill monkey, Toern support.',
    },
    stats: { characterCount: 4, enemyCount: 5, encounterCount: 2, mapCount: 1, journalCount: 3, sessionCount: 0 },
    createdAt: NOW - 86400000, updatedAt: NOW,
  };

  const metaFields = {};
  for (const [key, value] of Object.entries(campaignMeta)) {
    metaFields[key] = toFieldValue(value);
  }
  await writeDocument('campaigns', 'arkla', metaFields);

  // ── Live Session ──
  const liveSession = {
    activeEncounterId: null,
    phase: 'exploration',
    currentScene: null,
    currentMapUrl: null,
    dmAnnouncement: null,
    sessionStartedAt: null,
    lastShortRestAt: null,
    lastLongRestAt: null,
    conditions: { weather: 'clear', lighting: 'bright', terrain: 'normal' },
  };

  const sessionFields = {};
  for (const [key, value] of Object.entries(liveSession)) {
    sessionFields[key] = toFieldValue(value);
  }
  await writeDocument('liveSessions', 'arkla', sessionFields);

  // ── Homebrew ──
  const homebrew = {
    items: [],
    spells: [],
    feats: [],
  };

  const hbFields = {};
  for (const [key, value] of Object.entries(homebrew)) {
    hbFields[key] = toFieldValue(value);
  }
  await writeDocument('homebrew', 'arkla', hbFields);

  console.log('\n=== SEEDING COMPLETE ===');
}

main().catch(console.error);
