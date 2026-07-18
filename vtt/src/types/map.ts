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
