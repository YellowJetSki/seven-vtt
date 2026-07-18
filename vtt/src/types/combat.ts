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
