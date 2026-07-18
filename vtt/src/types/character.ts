// ── Player Character ──────────────────────────────────────────

export interface ClassEntry {
  name: string;
  level: number;
  subclass?: string;
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
  tempBuffs?: TempBuff[];
  createdAt: number;
  updatedAt: number;
}

// ── Temp Buffs ────────────────────────────────────────────────

export type BuffTarget = "AC" | "Attack" | "Speed" | "SavingThrow" | "Damage";

export interface TempBuff {
  id: string;
  name: string;
  target: BuffTarget;
  value: number;
  isDebuff: boolean;
  source?: string;
  duration?: string;
  notes?: string;
}
