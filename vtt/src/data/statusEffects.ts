/* ── Status Effects Data ─────────────────────────────────────── */

export type StatusEffect = {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  /** Which ability saves are associated with ending this effect */
  save?: string;
};

export const STATUS_EFFECTS: Record<string, StatusEffect> = {
  blinded: {
    id: "blinded",
    label: "Blinded",
    icon: "🌑",
    color: "text-surface-400",
    description: "Attack rolls have disadvantage, attacks against have advantage.",
  },
  charmed: {
    id: "charmed",
    label: "Charmed",
    icon: "💕",
    color: "text-rose-400",
    description: "Can't attack charmer; charmer has advantage on social checks.",
  },
  concentrating: {
    id: "concentrating",
    label: "Concentrating",
    icon: "🧘",
    color: "text-mage-400",
    description: "Maintaining concentration on a spell.",
  },
  deafened: {
    id: "deafened",
    label: "Deafened",
    icon: "🔇",
    color: "text-surface-400",
    description: "Can't hear; auto-fails hearing-based checks.",
  },
  exhaustion: {
    id: "exhaustion",
    label: "Exhaustion",
    icon: "💀",
    color: "text-warrior-500",
    description: "Cumulative penalties. Level 6 = death.",
  },
  frightened: {
    id: "frightened",
    label: "Frightened",
    icon: "😰",
    color: "text-divine-400",
    description: "Disadvantage on checks while source is visible; can't move closer.",
  },
  grappled: {
    id: "grappled",
    label: "Grappled",
    icon: "🫂",
    color: "text-warrior-400",
    description: "Speed becomes 0; can't move.",
  },
  incapacitated: {
    id: "incapacitated",
    label: "Incapacitated",
    icon: "💫",
    color: "text-surface-400",
    description: "Can't take actions or reactions.",
  },
  invisible: {
    id: "invisible",
    label: "Invisible",
    icon: "👻",
    color: "text-mage-300",
    description: "Attack rolls have advantage; attacks against have disadvantage.",
  },
  paralyzed: {
    id: "paralyzed",
    label: "Paralyzed",
    icon: "🧊",
    color: "text-cyan-400",
    description: "Auto-fail STR/DEX saves; attacks auto-crit within 5ft.",
  },
  petrified: {
    id: "petrified",
    label: "Petrified",
    icon: "🗿",
    color: "text-stone-400",
    description: "Turned to stone; immune to everything; unaware.",
  },
  poisoned: {
    id: "poisoned",
    label: "Poisoned",
    icon: "☠️",
    color: "text-emerald-500",
    description: "Disadvantage on attack rolls and ability checks.",
  },
  prone: {
    id: "prone",
    label: "Prone",
    icon: "🏃",
    color: "text-amber-400",
    description: "Disadvantage on attacks; melee attacks have advantage.",
  },
  restrained: {
    id: "restrained",
    label: "Restrained",
    icon: "⛓️",
    color: "text-amber-500",
    description: "Speed 0; attacks have disadvantage; attacks against have advantage.",
  },
  stunned: {
    id: "stunned",
    label: "Stunned",
    icon: "⚡",
    color: "text-divine-400",
    description: "Can't act; auto-fail STR/DEX saves; attacks against have advantage.",
  },
  unconscious: {
    id: "unconscious",
    label: "Unconscious",
    icon: "💤",
    color: "text-surface-400",
    description: "Incapacitated; prone; auto-fail STR/DEX saves; attacks auto-crit within 5ft.",
  },
};

/* ── Condition Reference for DC Calculator ──────────────────── */

export interface DCReference {
  category: string;
  items: { label: string; dc: number; description: string }[];
}

export const DC_REFERENCES: DCReference[] = [
  {
    category: "Ability Checks",
    items: [
      { label: "Very Easy", dc: 5, description: "Simple task for anyone" },
      { label: "Easy", dc: 10, description: "Straightforward with some skill" },
      { label: "Moderate", dc: 15, description: "Requires competence" },
      { label: "Hard", dc: 20, description: "Needs expertise" },
      { label: "Very Hard", dc: 25, description: "Nearly impossible for most" },
      { label: "Nearly Impossible", dc: 30, description: "Legendary feat" },
    ],
  },
  {
    category: "Spell Save DCs",
    items: [
      { label: "Cantrip (L1 PC)", dc: 13, description: "Level 1, 16 stat, +2 prof" },
      { label: "Low Level (L5 PC)", dc: 15, description: "Level 5, 18 stat, +3 prof" },
      { label: "Mid Level (L9 PC)", dc: 16, description: "Level 9, 20 stat, +4 prof" },
      { label: "High Level (L13 PC)", dc: 18, description: "Level 13, 20 stat, +5 prof" },
      { label: "Epic (L17 PC)", dc: 19, description: "Level 17, 20 stat, +6 prof" },
      { label: "Legendary (L20 PC)", dc: 22, description: "Level 20, 24 stat (tome), +6 prof" },
    ],
  },
  {
    category: "Traps & Hazards",
    items: [
      { label: "Simple Trap", dc: 10, description: "Pitfall, weak snare" },
      { label: "Dangerous Trap", dc: 15, description: "Poison dart, swinging blade" },
      { label: "Deadly Trap", dc: 20, description: "Magical ward, collapsing room" },
      { label: "Legendary Trap", dc: 25, description: "Lich's sanctum, god-touched hazard" },
    ],
  },
  {
    category: "Environmental",
    items: [
      { label: "Calm / Easy Terrain", dc: 10, description: "Climbing a knotted rope" },
      { label: "Difficult Terrain", dc: 15, description: "Scaling a cliff in a storm" },
      { label: "Extreme Conditions", dc: 20, description: "Crossing a volcanic fissure" },
      { label: "Supernatural Hazard", dc: 25, description: "Navigating the Abyss" },
    ],
  },
  {
    category: "Social Encounters",
    items: [
      { label: "Friendly NPC", dc: 10, description: "Helpful ally, small favor" },
      { label: "Indifferent NPC", dc: 15, description: "Neutral merchant, guard" },
      { label: "Hostile NPC", dc: 20, description: "Armed enemy, rival faction" },
      { label: "Legendary Creature", dc: 25, description: "Dragon, archdevil, god" },
    ],
  },
  {
    category: "Knowledge / Lore",
    items: [
      { label: "Common Knowledge", dc: 10, description: "Local rumors, well-known history" },
      { label: "Obscure Lore", dc: 15, description: "Ancient rituals, forgotten names" },
      { label: "Esoteric Knowledge", dc: 20, description: "Planar secrets, lost civilizations" },
      { label: "Forgotten Truths", dc: 25, description: "Godly secrets, true names" },
    ],
  },
];
