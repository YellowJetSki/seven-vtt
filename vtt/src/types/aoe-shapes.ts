/* ── AOE Shape Path Geometry ───────────────────────────────────
 * Shape-specific SVG path generators for each AOE template shape.
 * Extracted from aoe-templates.ts to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

import type { AoE_Shape, AoE_Direction } from "./aoe-templates";

/** Returns an SVG path `d` attribute for the given shape and direction */
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
      const w = gridSize;
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
