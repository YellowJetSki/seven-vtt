// Lighting Engine — re-exports from sub-modules
export { castRay, createWallGrid } from "./raycasting";
export { computeLightIntensity, compositeLights, type CompositedCell } from "./light-compositor";

import type { LightSource, WallSegment } from "@/types";
import { LIGHT_COLORS } from "@/types";
import { castRay } from "./raycasting";

export const RAY_COUNT = 64;
export const EXPLORE_RADIUS = 3;

export interface VisibilityResult {
  visiblePoints: { x: number; y: number }[];
  visibleCells: Set<string>;
  exploredCells: Set<string>;
  lightGradient: number;
}

export function computeVisibility(
  originX: number, originY: number,
  brightRadius: number,
  dimRadius: number,
  walls: WallSegment[],
  gridSize: number
): VisibilityResult {
  const maxDist = (brightRadius + dimRadius) * gridSize;
  const points: { x: number; y: number }[] = [];
  const visibleCells = new Set<string>();
  const exploredCells = new Set<string>();

  for (let i = 0; i < RAY_COUNT; i++) {
    const angle = (i / RAY_COUNT) * Math.PI * 2;
    const hit = castRay(originX, originY, angle, maxDist, walls);
    points.push({ x: hit.x, y: hit.y });
    const steps = Math.floor(hit.distance / (gridSize * 0.5));
    for (let s = 0; s < steps; s++) {
      const cx = Math.floor((originX + Math.cos(angle) * s * gridSize * 0.5) / gridSize);
      const cy = Math.floor((originY + Math.sin(angle) * s * gridSize * 0.5) / gridSize);
      visibleCells.add(`${cx},${cy}`);
      exploredCells.add(`${cx},${cy}`);
      for (let dx = -EXPLORE_RADIUS; dx <= EXPLORE_RADIUS; dx++) {
        for (let dy = -EXPLORE_RADIUS; dy <= EXPLORE_RADIUS; dy++) {
          if (dx * dx + dy * dy <= EXPLORE_RADIUS * EXPLORE_RADIUS) {
            exploredCells.add(`${cx + dx},${cy + dy}`);
          }
        }
      }
    }
  }
  return { visiblePoints: points, visibleCells, exploredCells, lightGradient: 0.3 };
}

export function createDefaultLights(gridWidth: number, gridHeight: number, gridSize: number): LightSource[] {
  return [{
    id: "ambient_global",
    x: (gridWidth * gridSize) / 2,
    y: (gridHeight * gridSize) / 2,
    radius: Math.max(gridWidth, gridHeight),
    dimRadius: 0,
    color: "moonlight",
    intensity: 0.4,
    shape: "circle",
    isDynamic: false,
    animates: false,
    colorHex: LIGHT_COLORS.moonlight.hex,
  }];
}
