/* ── Firestore Collection Paths & Document Schemas ────────────
 *
 * This file defines STRING CONSTANTS for all Firestore collection
 * paths, plus TypeScript interfaces for documents stored in each
 * subcollection.
 *
 * Using string constants (not enums) so they can be used as
 * dynamic template literals without type assertions.
 *
 * ── Path Convention ──────────────────────────────────────────
 *   campaigns/{campaignId}
 *   campaigns/{campaignId}/characters/{charId}
 *   campaigns/{campaignId}/enemies/{enemyId}
 *   campaigns/{campaignId}/encounters/{encounterId}
 *   campaigns/{campaignId}/maps/{mapId}
 *   campaigns/{campaignId}/maps/{mapId}/tokens/{tokenId}
 *   campaigns/{campaignId}/journal/{entryId}
 *   campaigns/{campaignId}/sessions/{sessionId}
 *   campaigns/{campaignId}/sessions/{sessionId}/combatants/{cId}
 *   campaigns/{campaignId}/combatLog/{logId}
 *   homebrew/items/{itemId}
 *   homebrew/spells/{spellId}
 *   homebrew/feats/{featId}
 * ─────────────────────────────────────────────────────────────── */

/* ── Campaign Metadata Document (campaigns/{campaignId}) ───────
 * This is the ROOT document. It contains ONLY lightweight metadata
 * and references. All bulk data lives in subcollections.
 * ─────────────────────────────────────────────────────────────── */

export interface CampaignMeta {
  readonly id: string;
  name: string;
  description: string;
  dmName: string;
  settings: CampaignMetaSettings;
  createdAt: number;
  updatedAt: number;
  /** Counts for dashboard display — updated via Cloud Functions or manual sync */
  stats: CampaignStats;
}

export interface CampaignMetaSettings {
  homebrewRules: string[];
  experienceSystem: "xp" | "milestone";
  currencyName: string;
  privateDmNotes: string;
}

export interface CampaignStats {
  characterCount: number;
  enemyCount: number;
  encounterCount: number;
  mapCount: number;
  journalCount: number;
  sessionCount: number;
}

/* ── Subcollection Document Schemas ───────────────────────────
 * These are stored as individual documents at their respective paths.
 * The interface names match the `campaigns/{id}/{subcollection}/{docId}` pattern.
 * ─────────────────────────────────────────────────────────────── */

/** Document stored at campaigns/{campaignId}/characters/{charId} */
export interface CharacterDoc {
  /* Enhanced PlayerCharacter schema (v2) — see @/types for full documentation */
  id: string;
  name: string;
  playerName: string;
  race: string;
  class: string;
  subClass?: string;
  level: number;
  experiencePoints: number;
  background: string;
  alignment: string;
  inspiration: boolean;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  savingThrows: {
    strength: { proficient: boolean; bonus: number };
    dexterity: { proficient: boolean; bonus: number };
    constitution: { proficient: boolean; bonus: number };
    intelligence: { proficient: boolean; bonus: number };
    wisdom: { proficient: boolean; bonus: number };
    charisma: { proficient: boolean; bonus: number };
  };
  skills: Record<string, string>;    // key → "none" | "proficient" | "expertise"
  hitPoints: { current: number; max: number; temporary: number };
  armorClass: number;
  initiative: number;
  speed: { walk: number; fly?: number; swim?: number; climb?: number; burrow?: number; canHover?: boolean };
  hitDice: string;
  proficiencyBonus: number;
  conditions: string[];
  deathSaves: { successes: number; failures: number };
  temporaryHitPoints: number;
  traits: { name: string; description: string; source: string }[];
  proficiencies: { name: string; type: string; isProficient: boolean; notes?: string }[];
  languages: string[];
  features: { name: string; description: string; source: string }[];
  equipment: { slot: string; item: string; quantity: number; weight: number; notes: string }[];
  inventory: { name: string; quantity: number; weight: number; description: string; isEquipped: boolean }[];
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number };
  appearance: string;
  backstory: string;
  allies: string;
  characterNotes: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  imageUrl?: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at campaigns/{campaignId}/enemies/{enemyId} */
export interface EnemyDoc {
  id: string;
  name: string;
  type: "Aberration" | "Beast" | "Celestial" | "Construct" | "Dragon" | "Elemental" | "Fey" | "Fiend" | "Giant" | "Humanoid" | "Monstrosity" | "Ooze" | "Plant" | "Undead" | "Custom";
  size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
  speed: number;
  abilities: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number };
  savingThrows: Partial<{ strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number }>;
  skills: Record<string, number>;
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string;
  languages: string;
  challengeRating: number;
  traits?: string;
  actions?: string;
  reactions?: string;
  specialAbilities?: string;
  legendaryActions?: string;
  isHomebrew: boolean;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at campaigns/{campaignId}/encounters/{encounterId}
 *  References enemies by their ID. The full enemy data is looked up from
 *  the enemies subcollection at render time. */
export interface EncounterDoc {
  id: string;
  name: string;
  description: string;
  environment: string;
  difficulty: string;
  isActive: boolean;
  /** References to EnemyDoc IDs, with quantity for grouped spawns */
  enemyGroups: EncounterEnemyGroup[];
  createdAt: number;
  updatedAt: number;
}

export interface EncounterEnemyGroup {
  enemyId: string;
  count: number;
  /** Optional override name prefix, e.g. "Goblin Alpha" */
  label?: string;
}

/** Document stored at campaigns/{campaignId}/maps/{mapId} */
export interface MapDoc {
  id: string;
  name: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain" | "stretch";
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  gridColor?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at campaigns/{campaignId}/maps/{mapId}/tokens/{tokenId} */
export interface MapTokenDoc {
  id: string;
  type: "player" | "enemy" | "npc" | "custom";
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
  visible: boolean;
  icon?: string;
  hp?: { current: number; max: number };
  speed?: number;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at campaigns/{campaignId}/journal/{entryId} */
export interface JournalEntryDoc {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: "session" | "lore" | "quest" | "note" | "handout";
  sessionNumber?: number;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at campaigns/{campaignId}/sessions/{sessionId} */
export interface SessionDoc {
  id: string;
  name: string;
  phase: "exploration" | "combat" | "rest" | "downtime";
  startedAt: number | null;
  endedAt: number | null;
  currentScene?: string;
  currentMapUrl?: string;
  dmAnnouncement?: string;
  conditions: {
    weather: string;
    lighting: string;
    terrain: string;
  };
  /** FK to the active encounter, if any */
  activeEncounterId: string | null;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at campaigns/{campaignId}/sessions/{sessionId}/combatants/{combatantId}
 *  Separate from the encounter's combatant list. This tracks LIVE state. */
export interface SessionCombatantDoc {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
  statusEffects: { id: string; effect: string }[];
  isDead: boolean;
  isConcentrating: boolean;
  notes: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at campaigns/{campaignId}/combatLog/{logEntryId} */
export interface CombatLogEntryDoc {
  id: string;
  timestamp: number;
  type: "damage" | "heal" | "temp_hp" | "status" | "death" | "revive" | "note" | "round_start";
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  value?: number;
  description?: string;
  createdAt: number;
}

/* ── Homebrew Subcollections ────────────────────────────────── */

/** Document stored at homebrew/items/{itemId} */
export interface HomebrewItemDoc {
  id: string;
  name: string;
  category: string;
  rarity: string;
  description: string;
  flavorText?: string;
  requiresAttunement: boolean;
  attunementDetails?: string;
  charges?: number;
  chargesMax?: number;
  chargesRecharge?: string;
  weight: number;
  value: number;
  isCursed: boolean;
  curseDetails?: string;
  imageUrl?: string;
  weaponData?: Record<string, unknown>;
  armorData?: Record<string, unknown>;
  potionData?: Record<string, unknown>;
  scrollData?: Record<string, unknown>;
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Document stored at homebrew/spells/{spellId} */
export interface HomebrewSpellDoc {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  ritual: boolean;
  components: string[];
  materialComponent?: string;
  concentration: boolean;
  duration: string;
  range: string;
  area?: string;
  classes: string[];
  description: string;
  atHigherLevels?: string;
  isHomebrew: boolean;
  source: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** Document stored at homebrew/feats/{featId} */
export interface HomebrewFeatDoc {
  id: string;
  name: string;
  description: string;
  flavorText?: string;
  prerequisites: { type: string; description: string; ability?: string; minimumValue?: number }[];
  benefits: string[];
  repeatable: boolean;
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Collection Path Helpers ────────────────────────────────── */

export const Paths = {
  campaignMeta: (campaignId: string) => `campaigns/${campaignId}` as const,

  characters: (campaignId: string) => `campaigns/${campaignId}/characters` as const,
  character: (campaignId: string, charId: string) =>
    `campaigns/${campaignId}/characters/${charId}` as const,

  enemies: (campaignId: string) => `campaigns/${campaignId}/enemies` as const,
  enemy: (campaignId: string, enemyId: string) =>
    `campaigns/${campaignId}/enemies/${enemyId}` as const,

  encounters: (campaignId: string) => `campaigns/${campaignId}/encounters` as const,
  encounter: (campaignId: string, encounterId: string) =>
    `campaigns/${campaignId}/encounters/${encounterId}` as const,

  maps: (campaignId: string) => `campaigns/${campaignId}/maps` as const,
  map: (campaignId: string, mapId: string) =>
    `campaigns/${campaignId}/maps/${mapId}` as const,

  tokens: (campaignId: string, mapId: string) =>
    `campaigns/${campaignId}/maps/${mapId}/tokens` as const,
  token: (campaignId: string, mapId: string, tokenId: string) =>
    `campaigns/${campaignId}/maps/${mapId}/tokens/${tokenId}` as const,

  journal: (campaignId: string) => `campaigns/${campaignId}/journal` as const,
  journalEntry: (campaignId: string, entryId: string) =>
    `campaigns/${campaignId}/journal/${entryId}` as const,

  sessions: (campaignId: string) => `campaigns/${campaignId}/sessions` as const,
  session: (campaignId: string, sessionId: string) =>
    `campaigns/${campaignId}/sessions/${sessionId}` as const,

  sessionCombatants: (campaignId: string, sessionId: string) =>
    `campaigns/${campaignId}/sessions/${sessionId}/combatants` as const,
  sessionCombatant: (campaignId: string, sessionId: string, combatantId: string) =>
    `campaigns/${campaignId}/sessions/${sessionId}/combatants/${combatantId}` as const,

  combatLog: (campaignId: string) => `campaigns/${campaignId}/combatLog` as const,
  combatLogEntry: (campaignId: string, logId: string) =>
    `campaigns/${campaignId}/combatLog/${logId}` as const,

  homebrewItems: () => `homebrew/items` as const,
  homebrewItem: (itemId: string) => `homebrew/items/${itemId}` as const,

  homebrewSpells: () => `homebrew/spells` as const,
  homebrewSpell: (spellId: string) => `homebrew/spells/${spellId}` as const,

  homebrewFeats: () => `homebrew/feats` as const,
  homebrewFeat: (featId: string) => `homebrew/feats/${featId}` as const,
} as const;
