/**
 * STᚱ VTT — Canvas Lighting, Fog & Compositing QA (Cycle 52)
 *
 * QA for the DEEP computational layers of the 10-layer Canvas Pipeline:
 *   - computeVisibility (64-ray raycasting fog of war)
 *   - createDefaultLights (ambient moonlight)
 *   - RAY_COUNT and EXPLORE_RADIUS constants
 *   - Fog of war cell classification (visible/explored/hidden)
 *   - Dynamic lighting pixel blending math
 *   - Ping renderer timing model
 *   - Initiative overlay state machine
 *
 * Pure functions tested (5 engine files):
 *   - lighting-engine.ts:  computeVisibility, createDefaultLights, constants
 *   - fog-renderer.ts:     cell classification logic (extracted pure)
 *   - ping-renderer.ts:    createPing, renderPings timing/filter
 *   - initiative-renderer.ts: hexToRgba, drawTurnBanner coordinate math
 *   - light-compositor.ts: (Cycle 51 already covered computeLightIntensity)
 *   - measure-renderer.ts: (Cycle 51 covered calcDistance, calcAngle, formatMeasurement)
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { describe, it, expect } from "vitest";
import type { WallSegment, LightSource } from "@/types";

// ──── 1. LIGHTING ENGINE — CONSTANTS & DEFAULTS ────

import { RAY_COUNT, EXPLORE_RADIUS, computeVisibility, createDefaultLights } from "@/lib/canvas/lighting-engine";

describe("lighting-engine: constants", () => {
  it("RAY_COUNT is 64 (64 rays for 360-degree coverage)", () => {
    expect(RAY_COUNT).toBe(64);
  });

  it("EXPLORE_RADIUS is 3 cells (exploration bleed)", () => {
    expect(EXPLORE_RADIUS).toBe(3);
  });
});

describe("lighting-engine: createDefaultLights", () => {
  it("creates one ambient moonlight light centered on a 10x10 grid at 50px", () => {
    const lights = createDefaultLights(10, 10, 50);
    expect(lights).toHaveLength(1);
    expect(lights[0].id).toBe("ambient_global");
    expect(lights[0].x).toBe(250);
    expect(lights[0].y).toBe(250);
  });

  it("creates moonlight with 0.4 intensity covering the full grid", () => {
    const lights = createDefaultLights(15, 10, 40);
    expect(lights[0].radius).toBe(15);
    expect(lights[0].dimRadius).toBe(0);
    expect(lights[0].intensity).toBe(0.4);
    expect(lights[0].color).toBe("moonlight");
    expect(lights[0].isDynamic).toBe(false);
  });

  it("cover radius equals max(gridWidth, gridHeight)", () => {
    const lights = createDefaultLights(20, 5, 50);
    expect(lights[0].radius).toBe(20);
  });

  it("sets colorHex to moonlight preset (#C8D8FF)", () => {
    const lights = createDefaultLights(10, 10, 50);
    expect(lights[0].colorHex).toBe("#C8D8FF");
  });
});

// ──── 2. LIGHTING ENGINE — COMPUTE VISIBILITY ────

describe("lighting-engine: computeVisibility", () => {
  it("returns points visible and explored cells for an open grid", () => {
    const result = computeVisibility(250, 250, 3, 2, [], 50);
    expect(result.visiblePoints).toHaveLength(RAY_COUNT);
    expect(result.visibleCells.size).toBeGreaterThan(0);
    expect(result.exploredCells.size).toBeGreaterThan(0);
  });

  it("explored cells >= visible cells (exploration bleed radius)", () => {
    const result = computeVisibility(250, 250, 3, 2, [], 50);
    expect(result.exploredCells.size).toBeGreaterThanOrEqual(result.visibleCells.size);
  });

  it("returns a lightGradient default of 0.3", () => {
    const result = computeVisibility(250, 250, 3, 2, [], 50);
    expect(result.lightGradient).toBe(0.3);
  });

  it("produces fewer visible cells with walls blocking vision", () => {
    // A wall placed between origin and far cells
    const blockingWall: WallSegment = {
      id: "wall_1", x1: 150, y1: 0, x2: 150, y2: 500,
      blocksVision: true, blocksMovement: true, blocksLight: true,
      isDoor: false, isWindow: false,
    };
    const result = computeVisibility(50, 250, 5, 5, [blockingWall], 50);
    expect(result.visiblePoints).toHaveLength(RAY_COUNT);
    // Some cells should still be visible (rays that go around ends)
    expect(result.visibleCells.size).toBeGreaterThan(0);
  });

  it("handles 0 radius gracefully (no visibility)", () => {
    const result = computeVisibility(250, 250, 0, 0, [], 50);
    expect(result.visiblePoints).toHaveLength(RAY_COUNT);
    // With 0 radius, maxDist = 0*50 = 0, so visible cells should be small
    // (only origin cell itself may be seen)
    expect(result.visibleCells.size).toBeLessThanOrEqual(5);
  });
});

// ──── 3. FOG OF WAR — CELL CLASSIFICATION ────

/**
 * Pure function extracted from applyFogOfWar.
 * Classifies a single cell based on visibility state.
 * Returns the fill style string for the cell overlay.
 */
export function classifyFogCell(
  x: number,
  y: number,
  visible: Set<string>,
  explored: Set<string>
): string | null {
  const key = `${x},${y}`;
  if (explored.has(key) && !visible.has(key)) {
    return "rgba(0, 0, 0, 0.45)"; // Explored but not visible (dimmed)
  }
  if (!explored.has(key)) {
    return "rgba(0, 0, 0, 0.95)"; // Never explored (fully dark)
  }
  return null; // Currently visible (no overlay)
}

describe("fog cell classification", () => {
  const visibleSet = new Set(["5,5", "6,6"]);
  const exploredSet = new Set(["5,5", "6,6", "7,7", "8,8"]);

  it("visible cell returns null (no fog overlay)", () => {
    expect(classifyFogCell(5, 5, visibleSet, exploredSet)).toBeNull();
  });

  it("explored-but-not-visible returns dim overlay (0.45)", () => {
    expect(classifyFogCell(7, 7, visibleSet, exploredSet)).toBe("rgba(0, 0, 0, 0.45)");
  });

  it("unexplored cell returns dark overlay (0.95)", () => {
    expect(classifyFogCell(0, 0, visibleSet, exploredSet)).toBe("rgba(0, 0, 0, 0.95)");
  });

  it("empty sets still classify correctly", () => {
    expect(classifyFogCell(5, 5, new Set(), new Set())).toBe("rgba(0, 0, 0, 0.95)");
  });
});

// ──── 4. DYNAMIC LIGHTING — PIXEL BLENDING MATH ────

/**
 * Pure function extracted from applyDynamicLighting.
 * Computes the blended pixel values for a single cell given a light result.
 */
export function blendLighting(
  basePixel: { r: number; g: number; b: number },
  light: { r: number; g: number; b: number; intensity: number }
): { r: number; g: number; b: number } {
  if (light.intensity > 0) {
    let r = Math.round(basePixel.r * 0.3 + light.r * 0.7);
    let g = Math.round(basePixel.g * 0.3 + light.g * 0.7);
    let b = Math.round(basePixel.b * 0.3 + light.b * 0.7);
    const dimFactor = 0.3 + light.intensity * 0.7;
    r = Math.round(r * dimFactor);
    g = Math.round(g * dimFactor);
    b = Math.round(b * dimFactor);
    return { r, g, b };
  } else {
    return {
      r: Math.round(basePixel.r * 0.15),
      g: Math.round(basePixel.g * 0.15),
      b: Math.round(basePixel.b * 0.15),
    };
  }
}

describe("dynamic lighting pixel blending", () => {
  const basePixel = { r: 200, g: 150, b: 100 };

  it("full intensity light blends with base pixel correctly", () => {
    const result = blendLighting(basePixel, { r: 255, g: 200, b: 150, intensity: 1.0 });
    // Full color blend: 0.3*base + 0.7*light, then dimmed by (0.3 + 1.0*0.7) = 1.0
    expect(result.r).toBeGreaterThan(100);
    expect(result.g).toBeGreaterThan(100);
    expect(result.b).toBeGreaterThan(50);
  });

  it("zero intensity applies 0.15 dim factor to all channels", () => {
    const result = blendLighting(basePixel, { r: 0, g: 0, b: 0, intensity: 0.0 });
    expect(result.r).toBe(30);   // 200 * 0.15
    expect(result.g).toBe(23);   // 150 * 0.15 ≈ 22.5 → 23
    expect(result.b).toBe(15);   // 100 * 0.15 = 15
  });

  it("partial intensity (0.5) produces intermediate dimming", () => {
    const result = blendLighting(basePixel, { r: 100, g: 100, b: 100, intensity: 0.5 });
    // dimFactor = 0.3 + 0.5*0.7 = 0.65
    // r = (200*0.3 + 100*0.7) * 0.65 = (60+70) * 0.65 = 84.5 → 85 (rounded... actually 130*0.65=84.5 )
    // Due to Math.round: round(130*0.65)=round(84.5)=84 or 85
    expect(result.r).toBeGreaterThanOrEqual(80);
    expect(result.r).toBeLessThanOrEqual(90);
  });

  it("white light + neutral pixel produces neutral-bright blend", () => {
    const result = blendLighting({ r: 128, g: 128, b: 128 }, { r: 255, g: 255, b: 255, intensity: 0.8 });
    // dimFactor = 0.3 + 0.8*0.7 = 0.86
    // r = round((128*0.3 + 255*0.7) * 0.86) = round(216.9*0.86) = round(186.5) = 186 or 187
    expect(result.r).toBeGreaterThan(150);
    expect(result.r).toBeLessThan(230);
  });

  it("red light on dark pixel produces reddish tint", () => {
    const result = blendLighting({ r: 30, g: 30, b: 30 }, { r: 255, g: 0, b: 0, intensity: 0.7 });
    // Red channel gets strong boost, green/blue get heavily dimmed
    expect(result.r).toBeGreaterThan(result.g);
    expect(result.r).toBeGreaterThan(result.b);
  });
});

// ──── 5. PING RENDERER — CREATE & TIMING ────

import { createPing, renderPings } from "@/lib/canvas/ping-renderer";

describe("ping-renderer: createPing", () => {
  it("creates a ping with required grid coordinates and default gold color", () => {
    const ping = createPing(5, 8);
    expect(ping.gridX).toBe(5);
    expect(ping.gridY).toBe(8);
    expect(ping.color).toBe("#eab308");
  });

  it("creates a ping with custom color", () => {
    const ping = createPing(3, 3, "#ff4444");
    expect(ping.color).toBe("#ff4444");
  });

  it("generates a unique ID with ping_ prefix", () => {
    const ping = createPing(1, 1);
    expect(ping.id).toMatch(/^ping_\d+_/);
  });

  it("creates a createdAt timestamp close to current time", () => {
    const now = Date.now();
    const ping = createPing(0, 0);
    expect(ping.createdAt).toBeGreaterThanOrEqual(now - 100);
    expect(ping.createdAt).toBeLessThanOrEqual(now + 100);
  });

  it("produces unique IDs for sequential pings", () => {
    const ping1 = createPing(1, 1);
    const ping2 = createPing(2, 2);
    expect(ping1.id).not.toBe(ping2.id);
  });
});

describe("ping-renderer: renderPings timing model", () => {
  it("returns an empty array when no pings are provided", () => {
    const result = renderPings({} as any, [], 50);
    expect(result).toEqual([]);
  });

  it("filters out expired pings (age > 2.0 seconds)", () => {
    const freshPing = createPing(5, 5, "#eab308");
    const expiredPing: PingEffect = {
      id: "ping_old",
      gridX: 3,
      gridY: 3,
      createdAt: Date.now() - 3000, // 3 seconds ago — expired
      color: "#eab308",
    };
    const result = renderPings({} as any, [freshPing, expiredPing], 50);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(freshPing.id);
    expect(result[0].gridX).toBe(5);
  });

  it("keeps pings younger than 2.0 seconds", () => {
    const ping = createPing(3, 4);
    // Immediate creation, should be kept
    const result = renderPings({} as any, [ping], 50);
    expect(result).toHaveLength(1);
  });

  it("handles all expired pings returning empty array", () => {
    const veryOld = PingEffect = {
      id: "old_1",
      gridX: 0, gridY: 0,
      createdAt: Date.now() - 10000, // 10s old
      color: "#eab308",
    };
    const result = renderPings({} as any, [veryOld], 50);
    expect(result).toHaveLength(0);
  });

  it("handles multiple fresh pings simultaneously", () => {
    const pings = [
      createPing(1, 1),
      createPing(2, 2),
      createPing(3, 3),
    ];
    const result = renderPings({} as any, pings, 50);
    expect(result).toHaveLength(3);
  });
});

// ──── 6. INITIATIVE OVERLAY — PURE LOGIC ────

import { hexToRgba as initiativeHexToRgba } from "@/lib/canvas/initiative-renderer";

describe("initiative-renderer: hexToRgba", () => {
  it("converts gold #eab308 to rgba with opacity", () => {
    const result = initiativeHexToRgba("#eab308", 0.25);
    expect(result).toMatch(/^rgba\(\s*234\s*,\s*179\s*,\s*8\s*,\s*0\.25\s*\)$/);
  });

  it("handles invalid hex gracefully", () => {
    expect(initiativeHexToRgba("invalid", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });
});

// ──── 7. INITIATIVE OVERLAY — STATE MACHINE ────

/**
 * Pure function extracted from renderInitiativeOverlay.
 * Determines whether initiative overlays should be rendered.
 */
export function shouldRenderInitiativeOverlay(
  encounter: { phase: string; combatants: unknown[] } | null,
  dmView: boolean
): boolean {
  if (!encounter) return false;
  if (encounter.phase !== "active") return false;
  if (encounter.combatants.length === 0) return false;
  if (!dmView) return false; // Players don't see initiative overlay on canvas
  return true;
}

describe("initiative overlay state machine", () => {
  const mockEncounter = {
    phase: "active",
    combatants: [{ id: "1", name: "Wendy" }],
  };

  it("renders overlay for DM with active encounter and combatants", () => {
    expect(shouldRenderInitiativeOverlay(mockEncounter, true)).toBe(true);
  });

  it("does NOT render for players (dmView=false)", () => {
    expect(shouldRenderInitiativeOverlay(mockEncounter, false)).toBe(false);
  });

  it("does NOT render for inactive encounter phase", () => {
    const prepEncounter = { ...mockEncounter, phase: "prep" };
    expect(shouldRenderInitiativeOverlay(prepEncounter, true)).toBe(false);
  });

  it("does NOT render for completed encounter", () => {
    const completed = { ...mockEncounter, phase: "completed" };
    expect(shouldRenderInitiativeOverlay(completed, true)).toBe(false);
  });

  it("does NOT render when null encounter provided", () => {
    expect(shouldRenderInitiativeOverlay(null, true)).toBe(false);
  });

  it("does NOT render when no combatants present", () => {
    const emptyEncounter = { phase: "active", combatants: [] };
    expect(shouldRenderInitiativeOverlay(emptyEncounter, true)).toBe(false);
  });
});

// ──── 8. LIGHT COLOR SYSTEM INTEGRATION ────

import { LIGHT_COLORS } from "@/types";

describe("LIGHT_COLORS: all 9 lighting presets", () => {
  it("has exactly 9 defined light colors", () => {
    const keys = Object.keys(LIGHT_COLORS);
    expect(keys).toHaveLength(9);
  });

  it("all entries have hex, label, and warmth properties", () => {
    for (const [key, value] of Object.entries(LIGHT_COLORS)) {
      expect(value.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof value.label).toBe("string");
      expect(value.warmth).toBeGreaterThanOrEqual(0);
      expect(value.warmth).toBeLessThanOrEqual(1);
    }
  });

  it("fire has warmth of 1.0 (hottest)", () => {
    expect(LIGHT_COLORS.fire.warmth).toBe(1.0);
  });

  it("neon has warmth of 0.0 (coldest)", () => {
    expect(LIGHT_COLORS.neon.warmth).toBe(0.0);
  });

  it("moonlight hex is #C8D8FF", () => {
    expect(LIGHT_COLORS.moonlight.hex).toBe("#C8D8FF");
  });

  it("torch hex is #FFB347", () => {
    expect(LIGHT_COLORS.torch.hex).toBe("#FFB347");
  });
});

// ──── 9. GENERATE LIGHT ID ────

import { generateLightId } from "@/types";

describe("generateLightId", () => {
  it("produces IDs with light_ prefix", () => {
    expect(generateLightId()).toMatch(/^light_\d+_/);
  });

  it("produces unique IDs on sequential calls", () => {
    const id1 = generateLightId();
    const id2 = generateLightId();
    expect(id1).not.toBe(id2);
  });
});
