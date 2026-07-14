/* ── STᚱ VTT Central Type Definitions ────────────────────────── */

/** Represents a single player character in the Arkla campaign. */
export interface PlayerCharacter {
  id: string;
  name: string;
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
  /** Initiative modifier derived from Dexterity (e.g., +2 for 14 DEX) */
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
  /** URL to the character's portrait image (for sheets and detail views) */
  portraitUrl?: string;
  /** URL to the character's battlemap token image */
  tokenUrl?: string;
  createdAt: number;
  updatedAt: number;
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

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

/* ── Enemies & Encounters ───────────────────────────────────── */

export interface Enemy {
  id: string;
  name: string;
  size: CreatureSize;
  type: string;
  alignment: string;
  armorClass: number;
  hitPoints: HitPoints;
  speed: Speed;
  abilityScores: AbilityScores;
  challengeRating: number;
  proficiencyBonus: number;

  savingThrows: Partial<Record<Ability, number>>;
  skills: Partial<Record<Skill, number>>;
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];

  senses: string;
  languages: string;
  traits: string[];
  actions: Action[];
  legendaryActions: Action[];
  reactions: string[];

  description?: string;
  portraitUrl?: string;
  tokenUrl?: string;
  source?: string;
  isHomebrew: boolean;
}

export interface Speed {
  walk: number;
  burrow?: number;
  climb?: number;
  fly?: number;
  swim?: number;
}

export interface Action {
  name: string;
  description: string;
  attackBonus?: number;
  damage?: DamageRoll[];
}

export interface DamageRoll {
  dice: string;
  damageType: string;
  bonus?: number;
}

export type CreatureSize = "tiny" | "small" | "medium" | "large" | "huge" | "gargantuan";

export interface Encounter {
  id: string;
  name: string;
  description?: string;
  enemies: EncounterEnemy[];
  environment?: string;
  difficulty?: string;
  experienceReward: number;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EncounterEnemy {
  enemyId: string;
  count: number;
  customHp?: number;
}

/* ── Battle Map ─────────────────────────────────────────────── */

/** A rectangular region of revealed fog of war */
export interface FogReveal {
  id: string;
  x: number;      // grid x origin
  y: number;      // grid y origin
  width: number;
  height: number;
  label?: string;
}

export interface BattleMap {
  id: string;
  name: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain" | "stretch";
  gridWidth: number;
  gridHeight: number;
  gridSize: number; // pixels per cell
  gridColor?: string;
  fogOfWar: FogReveal[];
  tokens: MapToken[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MapToken {
  id: string;
  type: "player" | "enemy" | "npc" | "custom";
  label: string;
  x: number;
  y: number;
  color: string;
  icon?: string;
  portraitUrl?: string;
  size: number; // grid cells occupied (1 for medium)
  visible: boolean; // hidden by fog / GM-only
  hp?: { current: number; max: number };
}

/* ── Journal ────────────────────────────────────────────────── */

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: "session" | "note" | "lore" | "quest";
  sessionNumber?: number;
  createdAt: number;
  updatedAt: number;
}

/* ── Campaign ───────────────────────────────────────────────── */

export interface Campaign {
  id: string;
  name: string;
  description?: string;
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
  experienceSystem: "milestone" | "xp";
  currencyName: string;
  privateDmNotes: string;
}
