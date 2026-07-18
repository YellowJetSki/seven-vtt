// ── Campaign Data Models ──────────────────────────────────────

export interface CampaignMeta {
  id: string;
  name: string;
  description: string;
  dmName: string;
  settings: CampaignSettings;
  stats: CampaignStats;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignSettings {
  experienceSystem: "xp" | "milestone";
  currencyName: string;
  privateDmNotes: string;
  allowedRaces: string[];
  allowedClasses: string[];
  currencyPreset: string;
}

export interface CampaignStats {
  characterCount: number;
  enemyCount: number;
  encounterCount: number;
  mapCount: number;
  journalCount: number;
  sessionCount: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  dmName: string;
  settings: CampaignSettings;
  stats: CampaignStats;
  playerCharacters: PlayerCharacter[];
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
  createdAt: number;
  updatedAt: number;
}

// ── Player Character ──────────────────────────────────────────

export interface ClassEntry {
  name: string;
  level: number;
  subclass?: string;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  playerName: string;
  race: string;
  class: string;
  subClass?: string;
  level: number;
  classes: ClassEntry[];
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
  savingThrows: Record<string, SavingThrow>;
  skills: Record<string, SkillProficiency>;
  hitPoints: HitPoints;
  armorClass: number;
  initiative: number;
  speed: Speed;
  hitDice: string;
  proficiencyBonus: number;
  conditions: string[];
  deathSaves: DeathSaves;
  temporaryHitPoints: number;
  traits: Feature[];
  proficiencies: Proficiency[];
  languages: string[];
  features: Feature[];
  equipment: EquipmentSlot[];
  inventory: InventoryItem[];
  currency: Currency;
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
  spellSlots?: SpellSlots;
  resources?: ClassResource[];
  createdAt: number;
  updatedAt: number;
}

export interface SavingThrow {
  proficient: boolean;
  bonus: number;
}

export type SkillProficiency = "none" | "proficient" | "expertise";

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface Speed {
  walk: number;
  fly?: number;
  swim?: number;
  climb?: number;
  burrow?: number;
  canHover?: boolean;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Feature {
  name: string;
  description: string;
  source: string;
}

export interface Proficiency {
  name: string;
  type: string;
  isProficient: boolean;
  notes?: string;
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

export interface Currency {
  copper: number;
  silver: number;
  electrum: number;
  gold: number;
  platinum: number;
}

export interface SpellSlots {
  level1: { current: number; max: number };
  level2: { current: number; max: number };
  level3: { current: number; max: number };
  level4: { current: number; max: number };
  level5: { current: number; max: number };
  level6: { current: number; max: number };
  level7: { current: number; max: number };
  level8: { current: number; max: number };
  level9: { current: number; max: number };
}

export interface ClassResource {
  name: string;
  current: number;
  max: number;
  recharge: "short_rest" | "long_rest" | "dawn";
}

// ── Enemies ───────────────────────────────────────────────────

export type CreatureType =
  | "Aberration" | "Beast" | "Celestial" | "Construct"
  | "Dragon" | "Elemental" | "Fey" | "Fiend"
  | "Giant" | "Humanoid" | "Monstrosity" | "Ooze"
  | "Plant" | "Undead" | "Custom";

export type CreatureSize = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";

export interface EnemyDoc {
  id: string;
  name: string;
  type: CreatureType;
  size: CreatureSize;
  armorClass: number;
  hitPoints: HitPoints;
  speed: number;
  abilities: AbilityScores;
  savingThrows: Partial<Record<string, number>>;
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

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// ── Encounters ────────────────────────────────────────────────

export interface Encounter {
  id: string;
  name: string;
  description: string;
  environment: string;
  difficulty: string;
  isActive: boolean;
  enemyGroups: EnemyGroup[];
  createdAt: number;
  updatedAt: number;
}

export interface EnemyGroup {
  enemyId: string;
  count: number;
  label?: string;
}

// ── Battle Maps ───────────────────────────────────────────────

export interface BattleMap {
  id: string;
  name: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain" | "stretch";
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  gridColor?: string;
  gridOpacity?: number;
  notes?: string;
  drawings?: MapDrawingStroke[];
  aoeTemplates?: AoETemplate[];
  createdAt: number;
  updatedAt: number;
}

export interface MapDrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: "pen" | "highlighter" | "eraser";
}

// ── Map Tokens ────────────────────────────────────────────────

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
  initiative?: number;
  statusMarkers?: string[];
  createdAt: number;
  updatedAt: number;
}

// ── Journal ───────────────────────────────────────────────────

export type JournalEntryType = "session" | "lore" | "quest" | "note" | "handout";

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: JournalEntryType;
  sessionNumber?: number;
  createdAt: number;
  updatedAt: number;
}

// ── Combat ────────────────────────────────────────────────────

export interface CombatEncounter {
  id: string;
  name: string;
  combatants: Combatant[];
  round: number;
  currentCombatantIndex: number;
  turnStartedAt: number | null;
  phase: "prep" | "active" | "completed";
  startedAt: number | null;
  completedAt: number | null;
  elapsedSeconds: number;
  isPaused: boolean;
}

export interface Combatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  armorClass: number;
  hitPoints: CombatantHP;
  statusEffects: StatusEffect[];
  isDead: boolean;
  isConcentrating: boolean;
  notes: string;
  imageUrl?: string;
}

export interface CombatantHP {
  current: number;
  max: number;
  temporary: number;
}

export interface StatusEffect {
  id: string;
  effect: string;
}

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  type: "damage" | "heal" | "temp_hp" | "status" | "death" | "revive" | "note" | "round_start";
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  value?: number;
  description?: string;
}

export interface LiveSessionState {
  activeEncounterId: string | null;
  phase: "exploration" | "combat" | "rest" | "downtime";
  currentScene?: string;
  currentMapUrl?: string;
  dmAnnouncement?: string;
  sessionStartedAt: number | null;
  lastShortRestAt: number | null;
  lastLongRestAt: number | null;
  conditions: SessionConditions;
}

export interface SessionConditions {
  weather: "clear" | "cloudy" | "rain" | "storm" | "fog" | "snow";
  lighting: "bright" | "dim" | "darkness" | "magical_darkness";
  terrain: "normal" | "difficult" | "extreme" | "water" | "lava";
}

// ── Homebrew ──────────────────────────────────────────────────

export interface HomebrewItem {
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
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface HomebrewSpell {
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

export interface HomebrewFeat {
  id: string;
  name: string;
  description: string;
  flavorText?: string;
  prerequisites: FeatPrerequisite[];
  benefits: string[];
  repeatable: boolean;
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FeatPrerequisite {
  type: string;
  description: string;
  ability?: string;
  minimumValue?: number;
}

// ── AOE Templates ─────────────────────────────────────────────

export type AoE_Shape = "circle" | "cone" | "line" | "cube" | "sphere";
export type AoE_Direction = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
export type AoE_OriginAnchor = "center" | "corner" | "edge";

export interface AoETemplate {
  id: string;
  label: string;
  shape: AoE_Shape;
  size: number;
  gridX: number;
  gridY: number;
  direction: AoE_Direction;
  color: string;
  opacity: number;
  savingThrowDC?: number;
  savingThrowAbility?: string;
  damageDice?: string;
  damageType?: string;
  visibleToPlayers: boolean;
  animation?: string;
  notes?: string;
}

export interface AoEPreset {
  name: string;
  label: string;
  shape: AoE_Shape;
  size: number;
  school: string;
  damageType?: string;
  damageDice?: string;
  savingThrowDC?: number;
  savingThrowAbility?: string;
  color: string;
}

// ── UI State ──────────────────────────────────────────────────

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

// ── Auth ──────────────────────────────────────────────────────

export type AuthState = "unauthenticated" | "authenticated";
export type UserRole = "dm" | "player";
