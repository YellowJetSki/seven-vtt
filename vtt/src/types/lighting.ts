// ── Lighting & Vision Types ───────────────────────────────────

export type LightShape = "circle" | "cone" | "square";
export type LightColor = "fire" | "fae" | "holy" | "arcane" | "neon" | "moonlight" | "torch" | "candle" | "lantern";

export interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;            // Bright radius in grid units
  dimRadius: number;         // Dim extension radius
  color: LightColor | string;
  intensity: number;         // 0.0 to 1.0
  shape: LightShape;
  angle?: number;            // For cone lights, in radians
  rotation?: number;         // Direction of cone
  isDynamic: boolean;        // Moves with token
  tokenId?: string;          // Parent token
  animates: boolean;         // Pulsing/flame animation
  colorHex: string;          // Computed hex color string
}

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  blocksVision: boolean;
  blocksMovement: boolean;
  blocksLight: boolean;
  isDoor: boolean;
  isWindow: boolean;
  doorState?: "open" | "closed" | "locked";
}

export interface VisionProfile {
  id: string;
  tokenId: string;
  brightRadius: number;      // In grid units
  dimRadius: number;
  hasDarkvision: boolean;
  darkvisionRadius: number;
  isBlinded: boolean;
  canSeeInvisible: boolean;
}

export interface FogOfWarState {
  explored: boolean[][];     // Per-cell explored state
  visible: boolean[][];      // Per-cell currently visible
  forceReveal: boolean;      // DM overrides
}

// ── Light Color Presets ───────────────────────────────────────

export const LIGHT_COLORS: Record<LightColor, { hex: string; label: string; warmth: number }> = {
  torch: { hex: "#FFB347", label: "Torch", warmth: 0.8 },
  fire: { hex: "#FF6B35", label: "Fire", warmth: 1.0 },
  fae: { hex: "#7CFC00", label: "Faerie", warmth: 0.2 },
  holy: { hex: "#FFF8DC", label: "Holy", warmth: 0.6 },
  arcane: { hex: "#8B5CF6", label: "Arcane", warmth: 0.3 },
  neon: { hex: "#00FF88", label: "Neon", warmth: 0.0 },
  moonlight: { hex: "#C8D8FF", label: "Moonlight", warmth: 0.1 },
  candle: { hex: "#FFD27F", label: "Candle", warmth: 0.7 },
  lantern: { hex: "#FFE4A0", label: "Lantern", warmth: 0.9 },
};

export function generateLightId(): string {
  return `light_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
