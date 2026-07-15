/* ── STᚱ VTT Central Type Definitions ────────────────────────── */

/** Represents a single player character in the Arkla campaign. */
export interface PlayerCharacter {
  id: string;
  name: string;
  /** Alternate name used for player login lookup.
   *  Example: For "Edmund 'Strider' Tudul", alias would be "Strider".
   *  Players can log in using their first name OR alias (case-insensitive). */
  alias?: string;
  playerName: string;
  race: string;
  class: string;
  level: number;
  subclass?: string;
  background?: string;
  alignment?: string;
  experience: number;

  abilityScores: AbilityScores;
  savingThrows: Partial<Record<Ability, number>>;
  skills: Partial<Record<Skill, number>>;

  hitPoints: HitPoints;
  armorClass: number;
  initiative: number;
  speed: number;
  proficiencyBonus: number;

  features: string[];
  traits: string[];
  spells: SpellSlot[];
  equipment: string[];
  currency: Currency;

  backstory?: string;
  notes?: string;
  portraitUrl?: string;
  tokenUrl?: string;

  /** Arkla-specific: companions (mouse, bear cub, etc.) */
  companion?: ArklaCompanion;
  /** Arkla-specific: class resources (Bardic Inspiration, Arrows, etc.) */
  resources?: ArklaResource[];

  createdAt: number;
  updatedAt: number;
}

/** Companion data from the Arkla export */
export interface ArklaCompanion {
  name: string;
  species: string;
  hp: number;
  ac: number;
  speed: number;
  isDormant: boolean;
  awakeLevel: number;
  desc: string;
  attacks?: string;
  stats?: Partial<AbilityScores>;
  traits?: string;
}

/** Trackable resource (Bardic Inspiration uses, arrows, etc.) */
export interface ArklaResource {
  name: string;
  current: number;
  max: number;
  recharge: "long" | "short" | "none";
}

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type Ability = keyof AbilityScores;

export type Skill =
  | "acrobatics"
  | "animalHandling"
  | "arcana"
  | "athletics"
  | "deception"
  | "history"
  | "insight"
  | "intimidation"
  | "investigation"
  | "medicine"
  | "nature"
  | "perception"
  | "performance"
  | "persuasion"
  | "religion"
  | "sleightOfHand"
  | "stealth"
  | "survival";

export const SKILL_ABILITY_MAP: Record<Skill, Ability> = {
  acrobatics: "dexterity",
  animalHandling: "wisdom",
  arcana: "intelligence",
  athletics: "strength",
  deception: "charisma",
  history: "intelligence",
  insight: "wisdom",
  intimidation: "charisma",
  investigation: "intelligence",
  medicine: "wisdom",
  nature: "intelligence",
  perception: "wisdom",
  performance: "charisma",
  persuasion: "charisma",
  religion: "intelligence",
  sleightOfHand: "dexterity",
  stealth: "dexterity",
  survival: "wisdom",
};

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface SpellSlot {
  level: number;
  total: number;
  expended: number;
}

/**
 * Universal currency system.
 * The Arkla campaign uses custom denominations mapped here:
 *   leptons (cp) → quadrans (sp) → assarions (gp)
 * Exchange: 50 leptons = 1 quadrans, 5 quadrans = 1 assarion
 * ep and pp remain optional for homebrew.
 */
export interface Currency {
  /** Copper pieces (standard) / Leptons (Arkla) */
  cp: number;
  /** Silver pieces (standard) / Quadrans (Arkla) */
  sp: number;
  /** Electrum pieces (standard, rarely used in Arkla) */
  ep: number;
  /** Gold pieces (standard) / Assarions (Arkla) */
  gp: number;
  /** Platinum pieces (standard, rarely used in Arkla) */
  pp: number;
}

/* ── Enemies & Encounters ───────────────────────────────────── */

export interface Enemy {
  id: string;
  name: string;
  size: CreatureSize;
  type: CreatureType;
  alignment?: string;
  armorClass: number;
  hitPoints: number;
  speed: string;
  abilityScores: AbilityScores;
  skills?: string;
  senses?: string;
  languages?: string;
  challengeRating: number;
  traits?: string;
  actions?: string;
  reactions?: string;
  specialAbilities?: string;
  legendaryActions?: string;
  isHomebrew: boolean;
  imageUrl?: string;
}

export type CreatureSize = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
export type CreatureType = "Aberration" | "Beast" | "Celestial" | "Construct" | "Dragon" | "Elemental" | "Fey" | "Fiend" | "Giant" | "Humanoid" | "Monstrosity" | "Ooze" | "Plant" | "Undead" | "Custom";

export interface Encounter {
  id: string;
  name: string;
  description: string;
  enemies: EncounterEnemy[];
  environment?: string;
  difficulty?: "easy" | "medium" | "hard" | "deadly";
  experienceReward?: number;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EncounterEnemy {
  enemyId: string;
  count: number;
  customHp?: number;
}

/* ── Battle Maps ────────────────────────────────────────────── */

export interface BattleMap {
  id: string;
  name: string;
  imageUrl: string;
  imageFit: "cover" | "contain" | "stretch";
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  gridColor: string;
  fogOfWar: FogZone[];
  tokens: MapToken[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FogZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface MapToken {
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
  imageUrl?: string;
}

/* ── Journal ────────────────────────────────────────────────── */

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: "session" | "lore" | "quest";
  sessionNumber?: number;
  createdAt: number;
  updatedAt: number;
}

/* ── Campaign ───────────────────────────────────────────────── */

export interface Campaign {
  id: string;
  name: string;
  description: string;
  dmName: string;
  playerCharacters: PlayerCharacter[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
  settings: CampaignSettings;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignSettings {
  homebrewRules: string[];
  experienceSystem: "xp" | "milestone";
  currencyName: string;
  privateDmNotes: string;
}

/* ── Combat ─────────────────────────────────────────────────── */

export interface Combatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "npc";
  initiative: number;
  hitPoints: HitPoints;
  armorClass: number;
  conditions: string[];
  isDead: boolean;
  isPlayerControlled?: boolean;
  imageUrl?: string;
}

export interface CombatEncounter {
  id: string;
  name: string;
  round: number;
  phase: "active" | "pending" | "completed";
  currentCombatantIndex: number;
  combatants: Combatant[];
  startedAt: number | null;
  endedAt: number | null;
}

/* ── Session (Live Player View) ─────────────────────────────── */

export interface LiveSession {
  phase: "exploration" | "combat" | "rest" | "downtime";
  sessionStartedAt: number | null;
  currentScene: string | null;
  currentMapUrl: string | null;
  dmAnnouncement: string | null;
  conditions: SessionConditions | null;
}

export interface SessionConditions {
  weather: "clear" | "rain" | "storm" | "fog" | "snow" | "extreme";
  lighting: "bright" | "dim" | "darkness" | "magical_darkness";
  terrain: "normal" | "difficult" | "obscured" | "dangerous";
}
