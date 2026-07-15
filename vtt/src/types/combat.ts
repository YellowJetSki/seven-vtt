/* ── Combat & Initiative Types ──────────────────────────────────
 * Defines all combat-related data structures:
 *  • CombatEncounter — full encounter with turn tracking
 *  • Combatant — combatant with HP, status, concentration
 *  • StatusEffect / StatusEffectInstance — conditions
 *  • LiveSessionState — real-time DM->player broadcast
 *  • LiveConditions — weather, lighting, terrain
 *  • CombatLogEntry — activity log
 * ─────────────────────────────────────────────────────────────── */

/* ── Weather, Lighting, Terrain Options ─────────────────────── */

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rainy"
  | "stormy"
  | "foggy"
  | "windy"
  | "scorching"
  | "snowy"
  | "misty";

export const WEATHER_OPTIONS: { value: WeatherCondition; label: string; desc: string }[] = [
  { value: "clear", label: "Clear", desc: "No modifiers" },
  { value: "cloudy", label: "Cloudy", desc: "No modifiers" },
  { value: "rainy", label: "Rainy", desc: "-2 Perception (sight/hearing)" },
  { value: "stormy", label: "Stormy", desc: "-4 Perception, ranged attacks at disadvantage" },
  { value: "foggy", label: "Foggy", desc: "Heavily obscured beyond 30ft" },
  { value: "windy", label: "Windy", desc: "Disadvantage on ranged weapon attacks, perception checks involving hearing" },
  { value: "scorching", label: "Scorching", desc: "Exhaustion risk every hour without water" },
  { value: "snowy", label: "Snowy", desc: "Difficult terrain, -2 Perception" },
  { value: "misty", label: "Misty", desc: "Lightly obscured beyond 60ft" },
];

export type LightingCondition =
  | "bright"
  | "dim"
  | "darkness"
  | "magical_darkness";

export const LIGHTING_OPTIONS: { value: LightingCondition; label: string; desc: string }[] = [
  { value: "bright", label: "Bright", desc: "No modifiers" },
  { value: "dim", label: "Dim Light", desc: "Disadvantage on Perception (sight)" },
  { value: "darkness", label: "Darkness", desc: "Heavily obscured without darkvision" },
  { value: "magical_darkness", label: "Magical Darkness", desc: "Cannot be seen through even with darkvision" },
];

export type TerrainCondition =
  | "normal"
  | "difficult"
  | "dense"
  | "slippery"
  | "lava"
  | "poisoned"
  | "magical"
  | "water";

export const TERRAIN_OPTIONS: { value: TerrainCondition; label: string; desc: string }[] = [
  { value: "normal", label: "Normal", desc: "No modifiers" },
  { value: "difficult", label: "Difficult", desc: "Movement costs double" },
  { value: "dense", label: "Dense", desc: "Difficult terrain, 3/4 cover" },
  { value: "slippery", label: "Slippery", desc: "DEX saves vs prone, half speed" },
  { value: "lava", label: "Lava", desc: "18d10 fire damage per round" },
  { value: "poisoned", label: "Poisoned", desc: "Poison damage per round, CON saves" },
  { value: "magical", label: "Magical", desc: "Wild magic surge chance per spell cast" },
  { value: "water", label: "Water", desc: "Swim speed required, ranged attacks at disadvantage" },
];

/* ── Live Conditions ────────────────────────────────────────── */

export interface LiveConditions {
  weather: WeatherCondition;
  lighting: LightingCondition;
  terrain: TerrainCondition;
}

/* ── Live Session State ─────────────────────────────────────── */

export interface LiveSessionState {
  activeEncounterId: string | null;
  phase: "exploration" | "combat" | "rest" | "downtime";
  currentScene?: string;
  currentMapUrl?: string;
  dmAnnouncement?: string;
  sessionStartedAt: number | null;
  lastShortRestAt: number | null;
  lastLongRestAt: number | null;
  conditions: LiveConditions;
}

/* ── Status Effects ──────────────────────────────────────────── */

export type StatusEffect =
  | "blinded"
  | "charmed"
  | "deafened"
  | "frightened"
  | "grappled"
  | "incapacitated"
  | "invisible"
  | "paralyzed"
  | "petrified"
  | "poisoned"
  | "prone"
  | "restrained"
  | "stunned"
  | "unconscious"
  | "exhaustion1"
  | "exhaustion2"
  | "exhaustion3"
  | "exhaustion4"
  | "exhaustion5"
  | "exhaustion6";

export interface StatusEffectInstance {
  id: string;
  effect: StatusEffect;
}

/* ── Combatant ───────────────────────────────────────────────── */

export interface Combatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  armorClass: number;
  hitPoints: {
    current: number;
    max: number;
    temporary: number;
  };
  statusEffects: StatusEffectInstance[];
  isDead: boolean;
  isConcentrating: boolean;
  notes: string;
  /** Optional custom portrait/image URL */
  imageUrl?: string;
}

/* ── Combat Encounter (with turn tracking) ──────────────────── */

export interface CombatEncounter {
  id: string;
  name: string;
  combatants: Combatant[];
  round: number;
  currentCombatantIndex: number;
  /** Timestamp (ms) when the current turn started. Used by CombatantTurnTimer. */
  turnStartedAt: number | null;
  phase: "prep" | "active" | "completed";
  startedAt: number | null;
  completedAt: number | null;
  elapsedSeconds: number;
  isPaused: boolean;
}

/* ── Combat Log Entry ───────────────────────────────────────── */

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

/* ── Shared Status Effect Definitions ────────────────────────── */

export interface StatusEffectDef {
  icon: string;
  label: string;
  color: string;
  description: string;
}
