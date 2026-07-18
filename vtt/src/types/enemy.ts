// ── Enemies ──────────────────────────────────────────────────

export type CreatureType =
  | "Aberration" | "Beast" | "Celestial" | "Construct"
  | "Dragon" | "Elemental" | "Fey" | "Fiend"
  | "Giant" | "Humanoid" | "Monstrosity" | "Ooze"
  | "Plant" | "Undead" | "Custom";

export type CreatureSize = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface EnemyDoc {
  id: string;
  name: string;
  type: CreatureType;
  size: CreatureSize;
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
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
