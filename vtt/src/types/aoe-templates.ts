/* ── Spell Area-of-Effect Template Types ────────────────────────
 * Data structures for placing spell / ability area overlays
 * on the battle map canvas.
 * Each template defines a shape, position, color, label, and
 * optional DC/saving throw metadata.
 * ─────────────────────────────────────────────────────────────── */

/** Supported AOE shape types */
export type AoE_Shape = "circle" | "cone" | "line" | "cube" | "sphere";

/** Orientation for cones and lines (which direction they point) */
export type AoE_Direction = "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest";

/** Map grid anchors: where the origin point is relative to a cell */
export type AoE_OriginAnchor = "center" | "corner" | "edge";

/** Core AOE template placed on the battle map */
export interface AoETemplate {
  /** Unique ID for the template instance */
  id: string;

  /** Human-readable label (e.g. "Fireball", "DMG Breath") */
  label: string;

  /** Shape geometry */
  shape: AoE_Shape;

  /** Size in feet (or grid cells — interpreted as feet, then divided by 5) */
  size: number;

  /** Position on the grid (cell coordinates) */
  gridX: number;
  gridY: number;

  /** For cones and lines: which direction the effect emanates */
  direction: AoE_Direction;

  /** Optional color override (defaults to spell school color) */
  color?: string;

  /** Optional fill opacity 0–1 */
  opacity?: number;

  /** Optional DC for saving throws */
  savingThrowDC?: number;

  /** Optional ability for saving throws */
  savingThrowAbility?: "str" | "dex" | "con" | "int" | "wis" | "cha";

  /** Whether to show the effect description tooltip on hover */
  showTooltip?: boolean;

  /** Optional damage dice string (e.g. "8d6") for quick reference */
  damageDice?: string;

  /** Optional damage type for coloring */
  damageType?: string;

  /** Arbitrary notes for the DM */
  notes?: string;

  /** Whether this template is visible to players */
  visibleToPlayers: boolean;

  /** Animation style: none, pulse, shimmer, or burn */
  animation?: "none" | "pulse" | "shimmer" | "burn";

  /** Grid cell width override (in pixels) — set at render time */
  cellWidth?: number;

  /** Grid cell height override — set at render time */
  cellHeight?: number;

  /** Creation timestamp */
  createdAt: number;
}

/** Simplified AOE preset for quick-access buttons */
export interface AoEPreset {
  id: string;
  label: string;
  shape: AoE_Shape;
  size: number;
  color: string;
  damageDice?: string;
  damageType?: string;
  description: string;
}

/** Pre-built library of common spell AOE templates */
export const AOE_PRESETS: AoEPreset[] = [
  { id: "fireball", label: "Fireball", shape: "sphere", size: 20, color: "#ff4444", damageDice: "8d6", damageType: "fire", description: "20-ft radius sphere. DEX save." },
  { id: "fireball_circle", label: "Fireball (2D)", shape: "circle", size: 20, color: "#ff4444", damageDice: "8d6", damageType: "fire", description: "20-ft radius circle. DEX save." },
  { id: "lightning_bolt", label: "Lightning Bolt", shape: "line", size: 100, color: "#ffdd00", damageDice: "8d6", damageType: "lightning", description: "100-ft line. DEX save." },
  { id: "cone_of_cold", label: "Cone of Cold", shape: "cone", size: 60, color: "#88ddff", damageDice: "8d8", damageType: "cold", description: "60-ft cone. CON save." },
  { id: "burning_hands", label: "Burning Hands", shape: "cone", size: 15, color: "#ff6622", damageDice: "3d6", damageType: "fire", description: "15-ft cone. DEX save." },
  { id: "thunderwave", label: "Thunderwave", shape: "cube", size: 15, color: "#aa88ff", damageDice: "2d8", damageType: "thunder", description: "15-ft cube. CON save." },
  { id: "moonbeam", label: "Moonbeam", shape: "circle", size: 5, color: "#eeeeff", damageDice: "2d10", damageType: "radiant", description: "5-ft radius cylinder. CON save." },
  { id: "spirit_guardians", label: "Spirit Guardians", shape: "circle", size: 15, color: "#88aaff", damageDice: "3d8", damageType: "radiant", description: "15-ft radius. WIS save." },
  { id: "hypnotic_pattern", label: "Hypnotic Pattern", shape: "cube", size: 30, color: "#ff88ff", damageDice: undefined, damageType: undefined, description: "30-ft cube. WIS save or charmed." },
  { id: "shatter", label: "Shatter", shape: "sphere", size: 10, color: "#ffaa00", damageDice: "3d8", damageType: "thunder", description: "10-ft radius sphere. CON save." },
  { id: "breath_weapon", label: "Dragon Breath", shape: "cone", size: 30, color: "#ff6622", damageDice: "12d6", damageType: "fire", description: "30-ft cone. DEX save." },
  { id: "cloudkill", label: "Cloudkill", shape: "circle", size: 20, color: "#44cc44", damageDice: "5d8", damageType: "poison", description: "20-ft radius. CON save." },
];

/** Shape-specific geometry helpers — returns SVG path data */
export function getAoEShapePath(
  shape: AoE_Shape,
  size: number,
  direction: AoE_Direction,
  gridSize: number,
): string {
  const cells = Math.floor(size / 5);
  switch (shape) {
    case "circle":
    case "sphere": {
      const r = cells * gridSize;
      return `M ${r} 0 A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 ${r} 0 Z`;
    }
    case "cone": {
      // Cone is a triangle pointing in the given direction
      const len = cells * gridSize;
      const width = Math.floor(cells / 2) * gridSize;
      const dirs: Record<AoE_Direction, string> = {
        north: `M 0 ${len} L ${width} 0 L ${-width} 0 Z`,
        south: `M 0 ${-len} L ${width} 0 L ${-width} 0 Z`,
        east: `M ${-len} 0 L 0 ${width} L 0 ${-width} Z`,
        west: `M ${len} 0 L 0 ${width} L 0 ${-width} Z`,
        northeast: `M 0 ${len} L ${len} 0 L ${-width} ${-width} Z`,
        northwest: `M 0 ${len} L ${-len} 0 L ${width} ${-width} Z`,
        southeast: `M 0 ${-len} L ${len} 0 L ${-width} ${width} Z`,
        southwest: `M 0 ${-len} L ${-len} 0 L ${width} ${width} Z`,
      };
      return dirs[direction];
    }
    case "line": {
      const l = cells * gridSize;
      const w = gridSize; // line is 1 cell wide
      const dirs: Record<AoE_Direction, string> = {
        north: `M ${-w} ${l} L ${w} ${l} L ${w} 0 L ${-w} 0 Z`,
        south: `M ${-w} ${-l} L ${w} ${-l} L ${w} 0 L ${-w} 0 Z`,
        east: `M ${-l} ${-w} L ${-l} ${w} L 0 ${w} L 0 ${-w} Z`,
        west: `M ${l} ${-w} L ${l} ${w} L 0 ${w} L 0 ${-w} Z`,
        northeast: `M ${-w} ${l} L ${l} ${-w} L ${w} ${-w} L ${-w} ${w} Z`,
        northwest: `M ${w} ${l} L ${-l} ${-w} L ${-w} ${-w} L ${w} ${w} Z`,
        southeast: `M ${-w} ${-l} L ${l} ${w} L ${w} ${w} L ${-w} ${-w} Z`,
        southwest: `M ${w} ${-l} L ${-l} ${w} L ${-w} ${w} L ${w} ${-w} Z`,
      };
      return dirs[direction];
    }
    case "cube": {
      const s = cells * gridSize;
      return `M ${-s / 2} ${-s / 2} L ${s / 2} ${-s / 2} L ${s / 2} ${s / 2} L ${-s / 2} ${s / 2} Z`;
    }
    default:
      return "";
  }
}
