/* ── STᚱ VTT Type Definitions ──────────────────────────────────
 * Core data types shared across the app.
 * ─────────────────────────────────────────────────────────────── */

/* ── Ability Score Type ─────────────────────────────────────── */

export type Ability = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";

/* ── Player Character (D&D 5e Complete) ─────────────────────── */

export interface PlayerCharacter {
  id: string;
  name: string;
  playerName: string;
  race: string;
  class: string;
  subClass?: string;               // e.g. "School of Evocation", "Path of the Berserker"
  level: number;
  experiencePoints: number;
  background: string;
  alignment: string;
  inspiration: boolean;

  // Core Ability Scores
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  // Saving Throws (proficiency flags + bonuses)
  savingThrows: {
    strength: { proficient: boolean; bonus: number };
    dexterity: { proficient: boolean; bonus: number };
    constitution: { proficient: boolean; bonus: number };
    intelligence: { proficient: boolean; bonus: number };
    wisdom: { proficient: boolean; bonus: number };
    charisma: { proficient: boolean; bonus: number };
  };

  // Skills (proficiency flags)
  skills: {
    acrobatics: SkillProficiency;
    animalHandling: SkillProficiency;
    arcana: SkillProficiency;
    athletics: SkillProficiency;
    deception: SkillProficiency;
    history: SkillProficiency;
    insight: SkillProficiency;
    intimidation: SkillProficiency;
    investigation: SkillProficiency;
    medicine: SkillProficiency;
    nature: SkillProficiency;
    perception: SkillProficiency;
    performance: SkillProficiency;
    persuasion: SkillProficiency;
    religion: SkillProficiency;
    sleightOfHand: SkillProficiency;
    stealth: SkillProficiency;
    survival: SkillProficiency;
  };

  // Combat Stats
  hitPoints: HitPoints;
  armorClass: number;
  initiative: number;
  speed: Speed;
  hitDice: string;
  proficiencyBonus: number;
  conditions: string[];
  deathSaves: DeathSaves;
  temporaryHitPoints: number;

  // Spellcasting
  spellcasting?: Spellcasting;

  // Traits, Proficiencies & Features
  traits: TraitEntry[];
  proficiencies: Proficiency[];
  languages: string[];
  features: FeatureEntry[];

  // Equipment & Inventory
  equipment: EquipmentSlot[];
  inventory: InventoryItem[];
  currency: Currency;

  // Biography & Notes
  appearance: string;
  backstory: string;
  allies: string;
  characterNotes: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;

  // Meta
  imageUrl?: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SkillProficiency = "none" | "proficient" | "expertise" | "jack_of_all_trades";

export interface Proficiency {
  name: string;
  type: "armor" | "weapon" | "tool" | "saving_throw" | "skill" | "language" | "other";
  isProficient: boolean;
  notes?: string;
}

export interface FeatureEntry {
  name: string;
  description: string;
  source: string;                  // e.g. "Class: Wizard Lvl 3", "Race: Human"
  uses?: {
    current: number;
    max: number;
    recharge: "short_rest" | "long_rest" | "dawn" | "dusk" | "special";
  };
}

export interface Speed {
  walk: number;                    // in feet
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  canHover?: boolean;
}

export interface Currency {
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
}

export interface Spellcasting {
  spellcastingAbility: Ability;
  spellSaveDC: number;
  spellAttackBonus: number;
  cantripsKnown: number;
  spellsKnown: number;
  spellSlots: SpellSlots;
  preparedSpells?: string[];
  spells: SpellEntry[];
}

export interface SpellSlots {
  level1: { max: number; used: number };
  level2: { max: number; used: number };
  level3: { max: number; used: number };
  level4: { max: number; used: number };
  level5: { max: number; used: number };
  level6: { max: number; used: number };
  level7: { max: number; used: number };
  level8: { max: number; used: number };
  level9: { max: number; used: number };
}

export interface SpellEntry {
  id: string;
  name: string;
  level: number;
  prepared: boolean;
  alwaysPrepared?: boolean;
  uses?: { current: number; max: number; recharge: string };
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

export interface EncounterEnemy {
  enemyId: string;
  count: number;
  customHp?: number;
  customName?: string;
}

export interface Encounter {
  id: string;
  name: string;
  description: string;
  enemies: EncounterEnemy[];
  environment: string;
  difficulty: string;
  experienceReward?: number;
  isActive: boolean;
  isHomebrew?: boolean;
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
  speed?: number;
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

  // ── Campaign creation metadata ──
  allowedRaces?: string[];
  allowedClasses?: string[];
  currencyPreset?: {
    copperLabel: string;
    silverLabel: string;
    electrumLabel: string;
    goldLabel: string;
    platinumLabel: string;
  };
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
