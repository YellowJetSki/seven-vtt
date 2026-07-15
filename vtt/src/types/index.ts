/* ── STᚱ VTT Type Definitions ──────────────────────────────────
 * Core data types shared across the app.
 * ─────────────────────────────────────────────────────────────── */

/* ── Player Character ───────────────────────────────────────── */

export interface PlayerCharacter {
  id: string;
  name: string;
  playerName: string;
  race: string;
  class: string;
  level: number;
  experiencePoints: number;
  background: string;
  alignment: string;
  inspiration: boolean;

  // Core Stats
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  // Combat Stats
  hitPoints: HitPoints;
  armorClass: number;
  initiative: number;
  speed: number;
  hitDice: string;
  proficiencyBonus: number;
  conditions: string[];
  deathSaves: DeathSaves;
  temporaryHitPoints: number;

  // Traits
  traits: TraitEntry[];
  proficiencies: string[];
  languages: string[];
  features: string[];

  // Equipment
  equipment: EquipmentSlot[];
  inventory: InventoryItem[];
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;

  // Biography
  appearance: string;
  backstory: string;
  allies: string;
  characterNotes: string;

  // Meta
  imageUrl?: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

/* ── Hit Points & Death Saves ───────────────────────────────── */

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

/* ── Traits & Equipment ─────────────────────────────────────── */

export interface TraitEntry {
  name: string;
  description: string;
  source: string;
}

export interface EquipmentSlot {
  slot: string;
  item: string;
  quantity: number;
  weight: number;
  notes: string;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  weight: number;
  description: string;
  isEquipped: boolean;
}

/* ── Encounters & Combatants ────────────────────────────────── */

export interface Encounter {
  id: string;
  name: string;
  description: string;
  creatures: EncounterCreature[];
  environment: string;
  difficulty: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EncounterCreature {
  id: string;
  name: string;
  type: CreatureType;
  size: CreatureSize;
  armorClass: number;
  hitPoints: HitPoints;
  speed: number;
  abilities: AbilityScores;
  savingThrows: Partial<AbilityScores>;
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
}

export type CreatureSize = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
export type CreatureType = "Aberration" | "Beast" | "Celestial" | "Construct" | "Dragon" | "Elemental" | "Fey" | "Fiend" | "Giant" | "Humanoid" | "Monstrosity" | "Ooze" | "Plant" | "Undead" | "Custom";

export interface Encounter {
  id: string;
  name: string;
  description: string;
  creatures: EncounterCreature[];
  environment: string;
  difficulty: string;
  isActive: boolean;
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

/* ── Battle Maps ────────────────────────────────────────────── */

export interface BattleMap {
  id: string;
  name: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain" | "stretch";
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  gridColor?: string;
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
  speed?: number; // Movement speed in feet (D&D 5e default: 30). Used by MovementRangeOverlay.
  imageUrl?: string;
}

/* ── Journal ────────────────────────────────────────────────── */

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: "session" | "lore" | "quest" | "note" | "handout";
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

/* ── Homebrew ───────────────────────────────────────────────── */

export interface HomebrewItem {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  weight: number;
  value: number;
  description: string;
  flavorText?: string;
  requiresAttunement: boolean;
  charges?: number;
  maxCharges?: number;
  recharge?: string;
  isCursed: boolean;
  tags: string[];
  source: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export type ItemCategory =
  | "weapon" | "armor" | "potion" | "scroll" | "wand" | "ring"
  | "wondrous" | "tool" | "ammunition" | "food" | "poison" | "other";

export type ItemRarity =
  | "common" | "uncommon" | "rare" | "very rare" | "legendary" | "artifact" | "varies";

export interface HomebrewFeat {
  id: string;
  name: string;
  description: string;
  prerequisites: string;
  benefits: string[];
  tags: string[];
  source: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface HomebrewSpell {
  id: string;
  name: string;
  level: number;
  school: SpellSchool;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  higherLevels?: string;
  source: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export type SpellSchool =
  | "Abjuration" | "Conjuration" | "Divination" | "Enchantment"
  | "Evocation" | "Illusion" | "Necromancy" | "Transmutation";
