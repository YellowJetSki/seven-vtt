import type { LightSource, LightColor, WallSegment } from "@/types";
import { LIGHT_COLORS } from "@/types";
import { castRay } from "./raycasting";

export interface CompositedCell {
  r: number; g: number; b: number; intensity: number;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16) || 255,
    g: parseInt(clean.substring(2, 4), 16) || 200,
    b: parseInt(clean.substring(4, 6), 16) || 150,
  };
}

function getLightColorHex(color: LightColor | string): string {
  if (color in LIGHT_COLORS) return LIGHT_COLORS[color as LightColor].hex;
  return color;
}

export function computeLightIntensity(
  cellX: number, cellY: number,
  light: LightSource,
  walls: WallSegment[],
  gridSize: number
): number {
  const cx = cellX * gridSize + gridSize / 2;
  const cy = cellY * gridSize + gridSize / 2;
  const dist = Math.sqrt((cx - light.x) ** 2 + (cy - light.y) ** 2);
  const maxDist = (light.radius + light.dimRadius) * gridSize;
  if (dist > maxDist) return 0;

  const angle = Math.atan2(cy - light.y, cx - light.x);
  const hit = castRay(light.x, light.y, angle, maxDist, walls);
  if (hit.wallId && hit.distance < dist) return 0;

  if (dist <= light.radius * gridSize) return light.intensity;
  return light.intensity * (1 - (dist - light.radius * gridSize) / (light.dimRadius * gridSize)) * 0.5;
}

export function compositeLights(
  cellX: number, cellY: number,
  lights: LightSource[],
  walls: WallSegment[],
  gridSize: number,
  ambientLight: number = 0.2
): CompositedCell {
  let totalR = 0, totalG = 0, totalB = 0, totalIntensity = 0;

  for (const light of lights) {
    const intensity = computeLightIntensity(cellX, cellY, light, walls, gridSize);
    if (intensity <= 0) continue;
    const color = parseHexColor(light.colorHex || getLightColorHex(light.color));
    totalR += color.r * intensity;
    totalG += color.g * intensity;
    totalB += color.b * intensity;
    totalIntensity += intensity;
  }

  totalR += 20 * ambientLight;
  totalG += 25 * ambientLight;
  totalB += 35 * ambientLight;
  totalIntensity += ambientLight;

  if (totalIntensity === 0) return { r: 0, g: 0, b: 0, intensity: 0 };
  const max = Math.max(totalR, totalG, totalB);
  const scale = max > 255 ? 255 / max : 1;
  return {
    r: Math.round(totalR * scale),
    g: Math.round(totalG * scale),
    b: Math.round(totalB * scale),
    intensity: Math.min(1, totalIntensity),
  };
}
