/* ── Combat & Initiative System Types ────────────────────────── */

export type StatusEffect =
  | "blinded"
  | "charmed"
  | "concentrating"
  | "deafened"
  | "exhaustion"
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
  | "concentration";

export interface StatusEffectInstance {
  id: string;
  effect: StatusEffect;
  source?: string;          // e.g. "Hold Person", "Web"
  duration?: string;        // e.g. "1 minute", "until save"
  remainingRounds?: number; // decremented each round
  sourceEntityId?: string;  // who applied it
}

export interface Combatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "npc" | "ally";
  initiative: number;
  initiativeBonus: number;   // raw Dex mod for recalculation
  armorClass: number;
  hitPoints: HitPoints;
  maxHitPoints: number;
  temporaryHitPoints: number;
  statusEffects: StatusEffectInstance[];
  notes?: string;
  color?: string;          // token/accent color
  portraitUrl?: string;
  isDead: boolean;
  isConcentrating: boolean;
  concentrationOn?: string; // spell name
}

export interface HitPoints {
  current: number;
  max: number;
  temporary: number;
}

export interface CombatEncounter {
  id: string;
  name: string;
  combatants: Combatant[];
  round: number;
  currentCombatantIndex: number;
  phase: "prep" | "active" | "completed";
  startedAt: number | null;
  completedAt: number | null;
  elapsedSeconds: number;
  isPaused: boolean;
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
  description: string;
}

/* ── Live Session State ─────────────────────────────────────── */

export type SessionPhase = "downtime" | "exploration" | "combat" | "rest";

export type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "fog" | "snow";
export type LightingCondition = "bright" | "dim" | "darkness" | "magical_darkness";
export type TerrainCondition = "normal" | "difficult" | "extreme" | "water" | "lava";

export interface LiveConditions {
  weather: WeatherCondition;
  lighting: LightingCondition;
  terrain: TerrainCondition;
}

export const WEATHER_OPTIONS: { value: WeatherCondition; label: string; desc: string }[] = [
  { value: "clear", label: "☀️ Clear", desc: "Standard visibility" },
  { value: "cloudy", label: "☁️ Cloudy", desc: "Dim light, -2 to Perception" },
  { value: "rain", label: "🌧️ Rainy", desc: "Heavy precipitation, -5 to Perception" },
  { value: "storm", label: "⛈️ Storm", desc: "Gale winds + rain, ranged attacks disadvantage" },
  { value: "fog", label: "🌫️ Fog", desc: "Heavily obscured, blinded beyond 30ft" },
  { value: "snow", label: "❄️ Snow", desc: "Difficult terrain, -5 to Perception" },
];

export const LIGHTING_OPTIONS: { value: LightingCondition; label: string; desc: string }[] = [
  { value: "bright", label: "☀️ Bright", desc: "Normal vision" },
  { value: "dim", label: "🌅 Dim", desc: "Disadvantage on Perception (darkvision sees normally)" },
  { value: "darkness", label: "🌑 Darkness", desc: "Heavily obscured (blinded without darkvision)" },
  { value: "magical_darkness", label: "🔮 Magical Darkness", desc: "Can't be seen through even with darkvision" },
];

export const TERRAIN_OPTIONS: { value: TerrainCondition; label: string; desc: string }[] = [
  { value: "normal", label: "🌿 Normal", desc: "Standard movement" },
  { value: "difficult", label: "🌳 Difficult", desc: "Movement costs 2x speed" },
  { value: "extreme", label: "🏔️ Extreme", desc: "Difficult terrain + climbing required" },
  { value: "water", label: "🌊 Water", desc: "Swimming, movement halved" },
  { value: "lava", label: "🌋 Lava", desc: "Fire damage per round in contact" },
];

export interface LiveSessionState {
  /** Which encounter is currently active (if in combat) */
  activeEncounterId: string | null;
  /** Overall session phase */
  phase: SessionPhase;
  /** Scene description that players see */
  currentScene?: string;
  /** The battle map image URL currently displayed to players */
  currentMapUrl?: string;
  /** DM notes visible to players (e.g. quest updates) */
  dmAnnouncement?: string;
  /** Timestamp when session started */
  sessionStartedAt: number | null;
  /** Timestamps for rest tracking */
  lastShortRestAt: number | null;
  lastLongRestAt: number | null;
  /** Environmental conditions synced to players */
  conditions: LiveConditions;
}
