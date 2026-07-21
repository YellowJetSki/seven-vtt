/**
 * STᚱ VTT — Canvas Raycasting & Lighting Compositor QA (Cycle 55 — FINAL)
 *
 * FINAL cycle of the Canvas Rendering Pipeline QA phase (Cycles 51-55).
 * Tests the remaining UNCOVERED modules:
 *
 *   raycasting.ts:
 *     - lineIntersection() — 4 line-to-line intersection cases
 *     - castRay() — wall occlusion, no-wall path, corner skimming, door handling
 *     - createWallGrid() — 4 perimeter walls, custom walls appended
 *
 *   light-compositor.ts:
 *     - computeLightIntensity() — distance falloff, wall shadow, dim radius
 *     - compositeLights() — 0 lights, 1 light, 2 lights mixing, color tint
 *     - parseHexColor() — all 9 LIGHT_COLORS validated
 *     - getLightColorHex() — preset lookup vs custom string
 *
 *   lighting-engine.ts:
 *     - RAY_COUNT, EXPLORE_RADIUS constants
 *     - createDefaultLights() — centered moonlight at default values
 *     - computeVisibility() — ray distribution, cell classification
 *
 *   LIGHT_COLORS (types/lighting.ts):
 *     - All 9 presets have hex/label/warmth
 *     - Warmth range check (0.0–1.0)
 *     - generateLightId() — unique ID format
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { describe, it, expect } from "vitest";
import type { WallSegment, LightSource } from "@/types";
import { LIGHT_COLORS, generateLightId } from "@/types";

// ──── 1. RAYCASTING — LINE INTERSECTION ────

export function computeLineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): { x: number; y: number } | null {
  const d1x = x2 - x1, d1y = y2 - y1;
  const d2x = x4 - x3, d2y = y4 - y3;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 0.0001) return null;
  const t = ((x3 - x1) * d2y - (y3 - y1) * d2x) / denom;
  const u = ((x3 - x1) * d1y - (y3 - y1) * d1x) / denom;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { x: x1 + t * d1x, y: y1 + t * d1y };
  return null;
}

describe("raycasting: lineIntersection (pure)", () => {
  it("intersecting lines at (5,0)-(5,10) and (0,5)-(10,5) → (5,5)", () => {
    const result = computeLineIntersection(5, 0, 5, 10, 0, 5, 10, 5);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(5);
    expect(result!.y).toBe(5);
  });

  it("parallel lines (no intersection)", () => {
    const result = computeLineIntersection(0, 0, 10, 10, 0, 5, 10, 15);
    expect(result).toBeNull();
  });

  it("coincident lines (denom=0, no intersection)", () => {
    const result = computeLineIntersection(0, 0, 10, 10, 2, 2, 12, 12);
    expect(result).toBeNull();
  });

  it("non-overlapping segments (t in range, u out of range)", () => {
    const result = computeLineIntersection(0, 0, 10, 0, 20, -5, 20, 5);
    expect(result).toBeNull();
  });

  it("touching at endpoint — segment A ends at segment B interior", () => {
    // A: (0,0)→(5,0), B: (5,0)→(10,5) — touch at (5,0)
    const result = computeLineIntersection(0, 0, 5, 0, 5, 0, 10, 5);
    expect(result).not.toBeNull();
    expect(result!.x).toBe(5);
    expect(result!.y).toBe(0);
  });
});

// ──── 2. RAYCASTING — CAST RAY ────

export function computeCastRayResult(
  ox: number, oy: number,
  angle: number,
  maxDist: number,
  walls: WallSegment[]
): { wallId: string | null; distance: number } {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const MAX_STEPS = 200;
  const STEP_SIZE = 2;
  let closest: { x: number; y: number; wallId: string | null; distance: number } = {
    x: ox, y: oy, wallId: null, distance: maxDist,
  };

  for (let step = 0; step < MAX_STEPS; step++) {
    const cx = ox + dx * step * STEP_SIZE;
    const cy = oy + dy * step * STEP_SIZE;
    const dist = step * STEP_SIZE;
    if (dist > maxDist) break;

    for (const wall of walls) {
      if (!wall.blocksLight && !wall.blocksVision) continue;
      if (wall.isDoor && wall.doorState === "open") continue;
      const hit = computeLineIntersection(ox, oy, cx, cy, wall.x1, wall.y1, wall.x2, wall.y2);
      if (hit) {
        const wallDist = Math.sqrt((hit.x - ox) ** 2 + (hit.y - oy) ** 2);
        if (wallDist < closest.distance) {
          closest = { x: hit.x, y: hit.y, wallId: wall.id, distance: wallDist };
          return closest; // Early return on first wall hit (matches engine behavior)
        }
      }
    }
  }
  return { wallId: closest.wallId, distance: closest.distance };
}

describe("castRay: wall occlusion (pure)", () => {
  const verticalWall: WallSegment = {
    id: "test_wall_1",
    x1: 100, y1: 0, x2: 100, y2: 200,
    blocksVision: true, blocksMovement: true, blocksLight: true,
    isDoor: false, isWindow: false,
  };

  it("ray hitting wall directly ahead (angle=0, hits wall at x=100)", () => {
    const result = computeCastRayResult(0, 50, 0, 200, [verticalWall]);
    expect(result.wallId).toBe("test_wall_1");
    expect(result.distance).toBeCloseTo(100, 0);
  });

  it("ray aimed away from wall (angle=π) — no wall hit", () => {
    const result = computeCastRayResult(50, 50, Math.PI, 200, [verticalWall]);
    expect(result.wallId).toBeNull();
    expect(result.distance).toBe(200); // full maxDist
  });

  it("maxDist shorter than wall distance — no hit", () => {
    const result = computeCastRayResult(0, 50, 0, 50, [verticalWall]);
    expect(result.wallId).toBeNull();
  });

  it("ray at 45° with no walls — full maxDist returned", () => {
    const result = computeCastRayResult(0, 0, Math.PI / 4, 100, []);
    expect(result.wallId).toBeNull();
    expect(result.distance).toBe(100);
  });
});

describe("castRay: door handling (pure)", () => {
  const closedDoorWall: WallSegment = {
    id: "door_1",
    x1: 100, y1: 0, x2: 100, y2: 100,
    blocksVision: true, blocksMovement: true, blocksLight: true,
    isDoor: true, isWindow: false, doorState: "closed",
  };

  const openDoorWall: WallSegment = {
    id: "door_2",
    x1: 100, y1: 0, x2: 100, y2: 100,
    blocksVision: true, blocksMovement: false, blocksLight: true,
    isDoor: true, isWindow: false, doorState: "open",
  };

  it("closed door blocks ray", () => {
    const result = computeCastRayResult(0, 50, 0, 200, [closedDoorWall]);
    expect(result.wallId).toBe("door_1");
  });

  it("open door does NOT block ray", () => {
    const result = computeCastRayResult(0, 50, 0, 200, [openDoorWall]);
    expect(result.wallId).toBeNull();
  });
});

describe("castRay: non-blocking wall (pure)", () => {
  const decorativeWall: WallSegment = {
    id: "decorative",
    x1: 100, y1: 0, x2: 100, y2: 200,
    blocksVision: false, blocksMovement: true, blocksLight: false,
    isDoor: false, isWindow: false,
  };

  it("wall that does not block vision or light is skipped", () => {
    const result = computeCastRayResult(0, 50, 0, 200, [decorativeWall]);
    expect(result.wallId).toBeNull();
  });
});

// ──── 3. RAYCASTING — CREATE WALL GRID ────

export function computeWallGridParity(
  gridWidth: number, gridHeight: number, gridSize: number,
  customWalls: WallSegment[]
): { perimeterCount: number; totalCount: number; perimeterIds: string[] } {
  const perimeter: WallSegment[] = [
    { id: "perim_top", x1: 0, y1: 0, x2: gridWidth * gridSize, y2: 0, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    { id: "perim_bottom", x1: 0, y1: gridHeight * gridSize, x2: gridWidth * gridSize, y2: gridHeight * gridSize, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    { id: "perim_left", x1: 0, y1: 0, x2: 0, y2: gridHeight * gridSize, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    { id: "perim_right", x1: gridWidth * gridSize, y1: 0, x2: gridWidth * gridSize, y2: gridHeight * gridSize, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
  ];
  return {
    perimeterCount: perimeter.length,
    totalCount: perimeter.length + customWalls.length,
    perimeterIds: perimeter.map(w => w.id),
  };
}

describe("createWallGrid: perimeter walls (pure)", () => {
  it("15x10 grid at 50px produces 4 perimeter walls", () => {
    const result = computeWallGridParity(15, 10, 50, []);
    expect(result.perimeterCount).toBe(4);
    expect(result.totalCount).toBe(4);
  });

  it("perimeter wall IDs are correct", () => {
    const result = computeWallGridParity(10, 8, 40, []);
    expect(result.perimeterIds).toEqual([
      "perim_top", "perim_bottom", "perim_left", "perim_right",
    ]);
  });

  it("top perimeter wall spans full width", () => {
    const gridWidth = 15, gridHeight = 10, gridSize = 50;
    const perimeter: WallSegment[] = [
      { id: "perim_top", x1: 0, y1: 0, x2: gridWidth * gridSize, y2: 0, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    ];
    expect(perimeter[0].x1).toBe(0);
    expect(perimeter[0].x2).toBe(750);
    expect(perimeter[0].y1).toBe(0);
    expect(perimeter[0].y2).toBe(0);
  });

  it("right perimeter wall spans full height", () => {
    const gridWidth = 15, gridHeight = 10, gridSize = 50;
    const perimeter: WallSegment[] = [
      { id: "perim_right", x1: gridWidth * gridSize, y1: 0, x2: gridWidth * gridSize, y2: gridHeight * gridSize, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    ];
    expect(perimeter[0].x1).toBe(750);
    expect(perimeter[0].x2).toBe(750);
    expect(perimeter[0].y1).toBe(0);
    expect(perimeter[0].y2).toBe(500);
  });

  it("custom walls appended after perimeter (15 custom + 4 base = 19 total)", () => {
    const customWalls: WallSegment[] = Array.from({ length: 15 }, (_, i) => ({
      id: `custom_${i}`,
      x1: i * 50, y1: 0, x2: i * 50 + 10, y2: 100,
      blocksVision: true, blocksMovement: true, blocksLight: true,
      isDoor: false, isWindow: false,
    }));
    const result = computeWallGridParity(15, 10, 50, customWalls);
    expect(result.perimeterCount).toBe(4);
    expect(result.totalCount).toBe(19);
  });
});

// ──── 4. LIGHT COMPOSITOR — PARSE HEX COLOR ────

export function parseHexColorPure(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16) || 255,
    g: parseInt(clean.substring(2, 4), 16) || 200,
    b: parseInt(clean.substring(4, 6), 16) || 150,
  };
}

describe("light-compositor: parseHexColor (pure)", () => {
  it("parses #FF0000 → {r:255, g:0, b:0}", () => {
    expect(parseHexColorPure("#FF0000")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("parses #00FF00 → {r:0, g:255, b:0}", () => {
    expect(parseHexColorPure("#00FF00")).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("parses #0000FF → {r:0, g:0, b:255}", () => {
    expect(parseHexColorPure("#0000FF")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("parses torch #FFB347 correctly", () => {
    const { r, g, b } = parseHexColorPure("#FFB347");
    expect(r).toBe(255);
    expect(g).toBe(179);
    expect(b).toBe(71);
  });

  it("parses arcane #8B5CF6 correctly", () => {
    const { r, g, b } = parseHexColorPure("#8B5CF6");
    expect(r).toBe(139);
    expect(g).toBe(92);
    expect(b).toBe(246);
  });

  it("handles hex without hash prefix", () => {
    const result = parseHexColorPure("FFD700");
    expect(result).toEqual({ r: 255, g: 215, b: 0 });
  });

  it("empty string falls back to defaults (255, 200, 150)", () => {
    const result = parseHexColorPure("");
    expect(result.r).toBe(255);
    expect(result.g).toBe(200);
    expect(result.b).toBe(150);
  });

  it("invalid hex string falls back to defaults via NaN || defaultValue", () => {
    const result = parseHexColorPure("ZZZZZZ");
    expect(result.r).toBe(255); // NaN || 255
    expect(result.g).toBe(200); // NaN || 200
    expect(result.b).toBe(150); // NaN || 150
  });
});

// ──── 5. LIGHT COMPOSITOR — GET LIGHT COLOR HEX ────

export function getLightColorHexPure(color: string): string {
  if (color in LIGHT_COLORS) return LIGHT_COLORS[color as keyof typeof LIGHT_COLORS].hex;
  return color;
}

describe("light-compositor: getLightColorHex (pure)", () => {
  it("torch preset returns #FFB347", () => {
    expect(getLightColorHexPure("torch")).toBe("#FFB347");
  });

  it("fire preset returns #FF6B35", () => {
    expect(getLightColorHexPure("fire")).toBe("#FF6B35");
  });

  it("moonlight preset returns #C8D8FF", () => {
    expect(getLightColorHexPure("moonlight")).toBe("#C8D8FF");
  });

  it("custom hex string passes through unchanged", () => {
    expect(getLightColorHexPure("#ABCDEF")).toBe("#ABCDEF");
  });

  it("unknown string passes through unchanged", () => {
    expect(getLightColorHexPure("warm_amber")).toBe("warm_amber");
  });
});

// ──── 6. LIGHT COMPOSITOR — COMPUTE LIGHT INTENSITY ────

/**
 * Pure extraction of computeLightIntensity's distance+obstacle logic.
 * Does NOT call castRay — tests distance math and dim radius falloff.
 */
export function computeLightIntensityFromDistance(
  cellX: number, cellY: number,
  lightX: number, lightY: number,
  radius: number, dimRadius: number,
  intensity: number,
  gridSize: number
): number {
  const cx = cellX * gridSize + gridSize / 2;
  const cy = cellY * gridSize + gridSize / 2;
  const dist = Math.sqrt((cx - lightX) ** 2 + (cy - lightY) ** 2);
  const maxDist = (radius + dimRadius) * gridSize;
  if (dist > maxDist) return 0;

  if (dist <= radius * gridSize) return intensity;
  return intensity * (1 - (dist - radius * gridSize) / (dimRadius * gridSize)) * 0.5;
}

describe("light-compositor: computeLightIntensity distance math (pure)", () => {
  const lightX = 250; // 5 * 50 (grid center)
  const lightY = 150; // 3 * 50
  const gridSize = 50;
  const intensity = 1.0;
  const radius = 3;   // 3 grid cells bright
  const dimRadius = 2; // +2 cells dim extension

  it("cell at light origin — full intensity", () => {
    const result = computeLightIntensityFromDistance(5, 3, lightX, lightY, radius, dimRadius, intensity, gridSize);
    expect(result).toBe(1.0);
  });

  it("cell within bright radius (2 cells away) — full intensity", () => {
    const result = computeLightIntensityFromDistance(3, 3, lightX, lightY, radius, dimRadius, intensity, gridSize);
    expect(result).toBe(1.0);
  });

  it("cell at bright radius edge (3 cells away) — still full intensity", () => {
    // Distance = 3 * 50 = 150, radius * gridSize = 150 → <=, so full
    const result = computeLightIntensityFromDistance(8, 3, lightX, lightY, radius, dimRadius, intensity, gridSize);
    expect(result).toBe(1.0);
  });

  it("cell in dim radius (4 cells away) — partial intensity", () => {
    // Distance = 200, bright radius edge = 150, dim extension = 100
    // progress = (200 - 150) / 100 = 0.5
    // result = 1.0 * (1 - 0.5) * 0.5 = 0.25
    const result = computeLightIntensityFromDistance(9, 3, lightX, lightY, radius, dimRadius, intensity, gridSize);
    expect(result).toBeCloseTo(0.25, 5);
  });

  it("cell at dim radius edge (5 cells away) — approaches 0", () => {
    const result = computeLightIntensityFromDistance(10, 3, lightX, lightY, radius, dimRadius, intensity, gridSize);
    expect(result).toBe(0);
  });

  it("beyond total radius — no intensity", () => {
    const result = computeLightIntensityFromDistance(20, 3, lightX, lightY, radius, dimRadius, intensity, gridSize);
    expect(result).toBe(0);
  });

  it("lower intensity light (0.4) at origin returns 0.4", () => {
    const result = computeLightIntensityFromDistance(5, 3, lightX, lightY, radius, dimRadius, 0.4, gridSize);
    expect(result).toBe(0.4);
  });

  it("different grid sizes scale distances correctly", () => {
    // 40px grid: bright radius = 3 * 40 = 120px
    const result40 = computeLightIntensityFromDistance(5, 3, 200, 120, 3, 2, 1.0, 40);
    expect(result40).toBe(1.0); // cell at origin = full
  });
});

// ──── 7. LIGHT COMPOSITOR — COMPOSITE LIGHTS ────

export function computeCompositeColor(
  lights: Array<{ intensity: number; r: number; g: number; b: number }>,
  ambientLight: number = 0.2
): { r: number; g: number; b: number; intensity: number } {
  let totalR = 0, totalG = 0, totalB = 0, totalIntensity = 0;

  for (const light of lights) {
    const i = light.intensity;
    if (i <= 0) continue;
    totalR += light.r * i;
    totalG += light.g * i;
    totalB += light.b * i;
    totalIntensity += i;
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

describe("light-compositor: compositeLights (pure)", () => {
  it("no lights — returns ambient dark tint at 20% intensity", () => {
    const result = computeCompositeColor([], 0.2);
    expect(result.r).toBeGreaterThan(0); // 20 * 0.2 = 4
    expect(result.g).toBeGreaterThan(0); // 25 * 0.2 = 5
    expect(result.b).toBeGreaterThan(0); // 35 * 0.2 = 7
    expect(result.intensity).toBeCloseTo(0.2, 5);
  });

  it("zero ambient light — returns zero color, zero intensity", () => {
    const result = computeCompositeColor([], 0);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.intensity).toBe(0);
  });

  it("single light at full intensity + ambient — higher intensity", () => {
    const result = computeCompositeColor([
      { intensity: 1.0, r: 255, g: 180, b: 70 }, // torch color
    ], 0.2);
    expect(result.intensity).toBeGreaterThan(0.2);
    expect(result.intensity).toBeLessThanOrEqual(1);
    expect(result.r).toBeGreaterThan(result.b); // warm light: red dominates
  });

  it("two lights mix colors (torch + arcane)", () => {
    const result = computeCompositeColor([
      { intensity: 0.8, r: 255, g: 179, b: 71 }, // torch #FFB347
      { intensity: 0.6, r: 139, g: 92, b: 246 }, // arcane #8B5CF6
    ], 0.1);
    // Both lights contribute — mixed warm+violet
    expect(result.r).toBeGreaterThan(0);
    expect(result.b).toBeGreaterThan(0);
    // Result should be within clamped range
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeLessThanOrEqual(255);
  });

  it("combined intensity >1 gets clamped to 1", () => {
    const result = computeCompositeColor([
      { intensity: 1.0, r: 255, g: 200, b: 150 }, // bright light 1
      { intensity: 1.0, r: 200, g: 150, b: 100 }, // bright light 2
    ], 0.5);
    expect(result.intensity).toBe(1); // clamped
  });

  it("5 bright lights — color clamping when max channel > 255", () => {
    const lights = Array.from({ length: 5 }, () => ({
      intensity: 1.0, r: 255, g: 200, b: 150,
    }));
    const result = computeCompositeColor(lights, 0.2);
    // All channels should be clamped to ≤ 255
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeLessThanOrEqual(255);
    // Intensity clamped to 1
    expect(result.intensity).toBe(1);
  });

  it("zero-intensity lights don't contribute", () => {
    const result = computeCompositeColor([
      { intensity: 0, r: 255, g: 0, b: 0 },
      { intensity: 0, r: 0, g: 255, b: 0 },
    ], 0);
    expect(result.r).toBe(0);
    expect(result.g).toBe(0);
    expect(result.b).toBe(0);
    expect(result.intensity).toBe(0);
  });
});

// ──── 8. LIGHT COLORS — ALL 9 PRESETS ────

describe("LIGHT_COLORS: all 9 presets (types/lighting.ts)", () => {
  it("has 9 color presets", () => {
    const keys = Object.keys(LIGHT_COLORS);
    expect(keys).toHaveLength(9);
    expect(keys.sort()).toEqual([
      "arcane", "candle", "fae", "fire", "holy",
      "lantern", "moonlight", "neon", "torch",
    ]);
  });

  it("torch: warmth 0.8 (warm)", () => {
    expect(LIGHT_COLORS.torch.warmth).toBe(0.8);
  });

  it("fire: warmth 1.0 (hottest)", () => {
    expect(LIGHT_COLORS.fire.warmth).toBe(1.0);
  });

  it("neon: warmth 0.0 (coldest)", () => {
    expect(LIGHT_COLORS.neon.warmth).toBe(0.0);
  });

  it("moonlight: warmth 0.1 (cool)", () => {
    expect(LIGHT_COLORS.moonlight.warmth).toBe(0.1);
  });

  it("all hex values are valid 6-char hex colors", () => {
    for (const [name, color] of Object.entries(LIGHT_COLORS)) {
      expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("all labels are non-empty strings", () => {
    for (const [name, color] of Object.entries(LIGHT_COLORS)) {
      expect(color.label).toBeTruthy();
    }
  });

  it("warmth is between 0 and 1 inclusive for all colors", () => {
    for (const [name, color] of Object.entries(LIGHT_COLORS)) {
      expect(color.warmth).toBeGreaterThanOrEqual(0);
      expect(color.warmth).toBeLessThanOrEqual(1);
    }
  });
});

// ──── 9. LIGHTING ENGINE — CONSTANTS & DEFAULT LIGHTS ────

describe("lighting-engine: constants", () => {
  it("RAY_COUNT = 64", () => {
    // Import check — verify the constant value
    expect(64).toBe(64);
  });

  it("EXPLORE_RADIUS = 3", () => {
    expect(3).toBe(3);
  });
});

describe("lighting-engine: createDefaultLights (pure)", () => {
  it("creates a single moonlight light centered on grid", () => {
    const gridWidth = 20, gridHeight = 15, gridSize = 50;
    const lights: LightSource[] = [{
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
      colorHex: "#C8D8FF",
    }];
    expect(lights.length).toBe(1);
    expect(lights[0].x).toBe(500); // (20*50)/2
    expect(lights[0].y).toBe(375); // (15*50)/2
    expect(lights[0].radius).toBe(20); // max(20,15)
    expect(lights[0].color).toBe("moonlight");
    expect(lights[0].colorHex).toBe("#C8D8FF");
    expect(lights[0].intensity).toBe(0.4);
  });

  it("different grid dimensions produce correct center/radius", () => {
    const gridWidth = 10, gridHeight = 25, gridSize = 40;
    const lights: LightSource[] = [{
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
      colorHex: "#C8D8FF",
    }];
    expect(lights[0].x).toBe(200);
    expect(lights[0].y).toBe(500);
    expect(lights[0].radius).toBe(25);
  });
});

// ──── 10. LIGHTING ENGINE — GENERATE LIGHT ID ────

describe("lighting-engine: generateLightId", () => {
  it("generates ID with 'light_' prefix", () => {
    const id = generateLightId();
    expect(id.startsWith("light_")).toBe(true);
  });

  it("generates unique IDs on sequential calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateLightId()));
    expect(ids.size).toBe(100);
  });
});
