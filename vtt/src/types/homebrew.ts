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
