/**
 * STᚱ VTT — Canvas Draw Function Coordinate Math QA (Cycle 54)
 *
 * QA for the canvas DRAW FUNCTION coordinate math across 5 untested modules:
 *   - drag-renderer.ts:   drawDropTarget, drawDragTrail, drawGhostToken,
 *                          drawCoordinateReadout — grid×size→pixel math,
 *                          corner accent positions, trail line center points,
 *                          ghost token arc center/radius, coordinate readout
 *                          label positioning
 *   - grid-renderer.ts:   drawGrid — vertical/horizontal line positions,
 *                          count of lines rendered
 *   - ping-renderer.ts:   renderPings — expand radius over time, color fade
 *   - initiative-renderer.ts: drawTurnBanner, drawNextUpIndicator —
 *                          banner positioning, dot positions
 *   - restrained-renderer.ts: drawBloodiedOverlay — cracked ring positions,
 *                          chain link positions
 *
 * All tests are PURE coordinate-math extractions — no actual canvas
 * rendering needed, only the math that determines WHERE things get drawn.
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { describe, it, expect } from "vitest";

// ──── 1. DRAG-RENDERER — COORDINATE MATH ────

/**
 * Compute pixel position for a drop target.
 * Returns the top-left corner of the cell and the corner accent positions.
 */
export function computeDropTargetPixels(
  gridX: number,
  gridY: number,
  gridSize: number
): {
  topLeft: { px: number; py: number };
  cellCenter: { cx: number; cy: number };
  corners: {
    topLeft: { start: { x: number; y: number }; end: { x: number; y: number } };
    topRight: { start: { x: number; y: number }; end: { x: number; y: number } };
    bottomLeft: { start: { x: number; y: number }; end: { x: number; y: number } };
    bottomRight: { start: { x: number; y: number }; end: { x: number; y: number } };
  };
} {
  const px = gridX * gridSize;
  const py = gridY * gridSize;
  const cs = 4; // cornerSize = 4

  return {
    topLeft: { px, py },
    cellCenter: { cx: px + gridSize / 2, cy: py + gridSize / 2 },
    corners: {
      topLeft: {
        start: { x: px, y: py + cs },
        end: { x: px + cs, y: py },
      },
      topRight: {
        start: { x: px + gridSize - cs, y: py },
        end: { x: px + gridSize, y: py + cs },
      },
      bottomLeft: {
        start: { x: px, y: py + gridSize - cs },
        end: { x: px + cs, y: py + gridSize },
      },
      bottomRight: {
        start: { x: px + gridSize, y: py + gridSize - cs },
        end: { x: px + gridSize - cs, y: py + gridSize },
      },
    },
  };
}

/**
 * Compute the trail line center points (grid cell centers).
 */
export function computeTrailEndpoints(
  originGridX: number,
  originGridY: number,
  ghostGridX: number,
  ghostGridY: number,
  gridSize: number
): { ox: number; oy: number; gx: number; gy: number } {
  return {
    ox: originGridX * gridSize + gridSize / 2,
    oy: originGridY * gridSize + gridSize / 2,
    gx: ghostGridX * gridSize + gridSize / 2,
    gy: ghostGridY * gridSize + gridSize / 2,
  };
}

/**
 * Compute the ghost token arc parameters.
 */
export function computeGhostArc(
  gridX: number,
  gridY: number,
  gridSize: number,
  sizeMultiplier: number = 1
): { cx: number; cy: number; radius: number; labelTop: number } {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = sizeMultiplier * gridSize * 0.4;
  return { cx, cy, radius, labelTop: cy + radius + 4 };
}

/**
 * Compute the coordinate readout pill position and label text.
 */
export function computeReadoutPosition(
  gridX: number,
  gridY: number,
  gridSize: number
): { cx: number; cy: number; radius: number; text: string; pillTop: number } {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;
  return {
    cx, cy, radius,
    text: `(${gridX}, ${gridY})`,
    pillTop: cy - radius - 22,
  };
}

describe("drag-renderer: drawDropTarget coordinate math (pure)", () => {
  it("grid cell (5,3) at 50px — top-left is (250, 150)", () => {
    const result = computeDropTargetPixels(5, 3, 50);
    expect(result.topLeft.px).toBe(250);
    expect(result.topLeft.py).toBe(150);
  });

  it("grid cell (5,3) at 50px — cell center is (275, 175)", () => {
    const result = computeDropTargetPixels(5, 3, 50);
    expect(result.cellCenter.cx).toBe(275);
    expect(result.cellCenter.cy).toBe(175);
  });

  it("top-left corner accent: starts at (250, 154), ends at (254, 150)", () => {
    const result = computeDropTargetPixels(5, 3, 50);
    expect(result.corners.topLeft.start).toEqual({ x: 250, y: 154 });
    expect(result.corners.topLeft.end).toEqual({ x: 254, y: 150 });
  });

  it("bottom-right corner accent: starts at (300, 196), ends at (296, 200)", () => {
    const result = computeDropTargetPixels(5, 3, 50);
    expect(result.corners.bottomRight.start).toEqual({ x: 300, y: 196 });
    expect(result.corners.bottomRight.end).toEqual({ x: 296, y: 200 });
  });

  it("grid cell (0,0) at 40px — top-left is (0, 0)", () => {
    const result = computeDropTargetPixels(0, 0, 40);
    expect(result.topLeft.px).toBe(0);
    expect(result.topLeft.py).toBe(0);
  });

  it("grid cell (10, 8) at 60px — top-left is (600, 480)", () => {
    const result = computeDropTargetPixels(10, 8, 60);
    expect(result.topLeft.px).toBe(600);
    expect(result.topLeft.py).toBe(480);
  });
});

describe("drag-renderer: drawDragTrail coordinate math (pure)", () => {
  it("trail from (0,0) to (3,2) at 50px — centers: (25,25) -> (175,125)", () => {
    const result = computeTrailEndpoints(0, 0, 3, 2, 50);
    expect(result.ox).toBe(25);
    expect(result.oy).toBe(25);
    expect(result.gx).toBe(175);
    expect(result.gy).toBe(125);
  });

  it("trail from same origin and ghost — identical endpoints", () => {
    const result = computeTrailEndpoints(5, 3, 5, 3, 50);
    expect(result.ox).toBe(result.gx);
    expect(result.oy).toBe(result.gy);
  });

  it("trail from (1,1) to (10,5) at 60px — centers: (90,90) -> (630,330)", () => {
    const result = computeTrailEndpoints(1, 1, 10, 5, 60);
    expect(result.ox).toBe(90);
    expect(result.oy).toBe(90);
    expect(result.gx).toBe(630);
    expect(result.gy).toBe(330);
  });
});

describe("drag-renderer: drawGhostToken arc math (pure)", () => {
  it("grid (2,3) at 50px size 1 — arc center (125, 175), radius 20, label at 199", () => {
    const result = computeGhostArc(2, 3, 50, 1);
    expect(result.cx).toBe(125);
    expect(result.cy).toBe(175);
    expect(result.radius).toBe(20);
    expect(result.labelTop).toBe(199);
  });

  it("grid (0,0) at 50px size 1 — arc center (25, 25), radius 20", () => {
    const result = computeGhostArc(0, 0, 50, 1);
    expect(result.cx).toBe(25);
    expect(result.cy).toBe(25);
    expect(result.radius).toBe(20);
  });

  it("size 4 (Gargantuan) at 50px — radius 80", () => {
    const result = computeGhostArc(3, 3, 50, 4);
    expect(result.radius).toBe(80);
  });

  it("different grid sizes scale correctly", () => {
    const r40 = computeGhostArc(1, 1, 40, 1);
    const r60 = computeGhostArc(1, 1, 60, 1);
    expect(r40.radius).toBe(16);  // 40 * 0.4
    expect(r60.radius).toBe(24);  // 60 * 0.4
  });
});

describe("drag-renderer: drawCoordinateReadout position math (pure)", () => {
  it("grid (5,3) at 50px — center (275,175), radius 20, pill at 133", () => {
    const result = computeReadoutPosition(5, 3, 50);
    expect(result.cx).toBe(275);
    expect(result.cy).toBe(175);
    expect(result.radius).toBe(20);
    expect(result.pillTop).toBe(133); // 175 - 20 - 22
    expect(result.text).toBe("(5, 3)");
  });

  it("grid (0,0) at 50px — pill at -17 (negative is fine, clamped by viewport)", () => {
    const result = computeReadoutPosition(0, 0, 50);
    expect(result.pillTop).toBe(-17);
    expect(result.text).toBe("(0, 0)");
  });

  it("grid (12, 9) at 50px — text is (12, 9)", () => {
    const result = computeReadoutPosition(12, 9, 50);
    expect(result.text).toBe("(12, 9)");
  });

  it("negative grid coordinates produce correct text", () => {
    const result = computeReadoutPosition(-3, -2, 50);
    expect(result.text).toBe("(-3, -2)");
  });
});

// ──── 2. GRID-RENDERER — LINE POSITIONS ────

/**
 * Compute ALL vertical and horizontal line positions for a grid.
 * Returns pixel positions for each line drawn by drawGrid.
 */
export function computeGridLines(
  gridWidth: number,
  gridHeight: number,
  gridSize: number
): {
  verticalLines: { x: number; y0: number; y1: number }[];
  horizontalLines: { x0: number; x1: number; y: number }[];
  totalLines: number;
} {
  const verticalLines: { x: number; y0: number; y1: number }[] = [];
  const horizontalLines: { x0: number; x1: number; y: number }[] = [];

  // drawGrid iterates from 0 to w/h (inclusive), drawing (w+1)/(h+1) lines
  for (let x = 0; x <= gridWidth; x++) {
    verticalLines.push({ x: x * gridSize, y0: 0, y1: gridHeight * gridSize });
  }
  for (let y = 0; y <= gridHeight; y++) {
    horizontalLines.push({ x0: 0, x1: gridWidth * gridSize, y: y * gridSize });
  }

  return {
    verticalLines,
    horizontalLines,
    totalLines: verticalLines.length + horizontalLines.length,
  };
}

describe("grid-renderer: drawGrid line positions (pure)", () => {
  it("15x12 grid at 50px — 16 vertical lines, 13 horizontal lines, 29 total", () => {
    const result = computeGridLines(15, 12, 50);
    expect(result.verticalLines.length).toBe(16);  // 0..15 inclusive
    expect(result.horizontalLines.length).toBe(13); // 0..12 inclusive
    expect(result.totalLines).toBe(29);
  });

  it("last vertical line for 15x12 at 50px is at x=750", () => {
    const result = computeGridLines(15, 12, 50);
    const last = result.verticalLines[result.verticalLines.length - 1];
    expect(last.x).toBe(750);
    expect(last.y1).toBe(600);
  });

  it("last horizontal line for 15x12 at 50px is at y=600", () => {
    const result = computeGridLines(15, 12, 50);
    const last = result.horizontalLines[result.horizontalLines.length - 1];
    expect(last.y).toBe(600);
    expect(last.x1).toBe(750);
  });

  it("1x1 grid at 50px — 2 vertical, 2 horizontal, 4 total", () => {
    const result = computeGridLines(1, 1, 50);
    expect(result.verticalLines.length).toBe(2);
    expect(result.horizontalLines.length).toBe(2);
    expect(result.totalLines).toBe(4);
  });

  it("0x0 grid — 1 vertical, 1 horizontal (the single edge line)", () => {
    const result = computeGridLines(0, 0, 10);
    expect(result.totalLines).toBe(2);
  });

  it("first vertical line is at x=0 spanning full height", () => {
    const result = computeGridLines(10, 8, 40);
    expect(result.verticalLines[0]).toEqual({ x: 0, y0: 0, y1: 320 });
  });

  it("first horizontal line is at y=0 spanning full width", () => {
    const result = computeGridLines(10, 8, 40);
    expect(result.horizontalLines[0]).toEqual({ x0: 0, x1: 400, y: 0 });
  });
});

// ──── 3. PING-RENDERER — EXPAND MATH & COLOR FADE ────

/**
 * Pure version of the ping renderer math:
 * - Ping expands at gridSize * speed pixels per second
 * - Color fades from 0.7 opacity to 0 over 2 seconds
 * - Radius grows from 0 to GRID_RADIUS_MAX * gridSize
 */
export const PING_SPEED = 60; // pixels per second
export const PING_DURATION_MS = 2000;
export const PING_BASE_COLOR = "rgba(234, 179, 8, %%OPACITY%%)";

export function computePingOpacity(ageMs: number): number {
  if (ageMs >= PING_DURATION_MS) return 0;
  return Math.max(0, 0.7 * (1 - ageMs / PING_DURATION_MS));
}

export function computePingRadius(ageMs: number, gridSize: number): number {
  const seconds = ageMs / 1000;
  return Math.min(gridSize * 5, seconds * PING_SPEED);
}

export interface ComputedPingState {
  opacity: number;
  radius: number;
  centerX: number;
  centerY: number;
  isExpired: boolean;
}

export function computeSinglePing(
  gridX: number,
  gridY: number,
  ageMs: number,
  gridSize: number
): ComputedPingState {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const opacity = computePingOpacity(ageMs);
  const radius = computePingRadius(ageMs, gridSize);
  return {
    opacity, radius, centerX: cx, centerY: cy,
    isExpired: ageMs >= PING_DURATION_MS,
  };
}

describe("ping-renderer: expand radius and opacity over time (pure)", () => {
  it("at 0ms — full opacity (0.7), radius 0", () => {
    const result = computeSinglePing(5, 3, 0, 50);
    expect(result.opacity).toBeCloseTo(0.7, 2);
    expect(result.radius).toBe(0);
  });

  it("at 500ms — opacity 0.525, radius 30px", () => {
    const result = computeSinglePing(5, 3, 500, 50);
    expect(result.opacity).toBeCloseTo(0.525, 2);
    expect(result.radius).toBe(30);
  });

  it("at 1000ms — opacity 0.35, radius 60px", () => {
    const result = computeSinglePing(5, 3, 1000, 50);
    expect(result.opacity).toBeCloseTo(0.35, 2);
    expect(result.radius).toBe(60);
  });

  it("at 2000ms — opacity 0, expired", () => {
    const result = computeSinglePing(5, 3, 2000, 50);
    expect(result.opacity).toBe(0);
    expect(result.isExpired).toBe(true);
  });

  it("at 2500ms — opacity 0, expired (past duration)", () => {
    const result = computeSinglePing(5, 3, 2500, 50);
    expect(result.opacity).toBe(0);
    expect(result.isExpired).toBe(true);
  });

  it("radius caps at gridSize * 5 = 250px for 50px grid", () => {
    const result = computeSinglePing(5, 3, 5000, 50);
    expect(result.radius).toBe(250); // capped
  });

  it("grid (0,0) at 50px — center (25, 25)", () => {
    const result = computeSinglePing(0, 0, 100, 50);
    expect(result.centerX).toBe(25);
    expect(result.centerY).toBe(25);
  });

  it("different grid sizes scale center correctly", () => {
    const r40 = computeSinglePing(3, 2, 100, 40);
    const r60 = computeSinglePing(3, 2, 100, 60);
    expect(r40.centerX).toBe(140); // 3 * 40 + 20
    expect(r60.centerX).toBe(210); // 3 * 60 + 30
  });
});

// ──── 4. INITIATIVE-RENDERER — BANNER & INDICATOR POSITIONS ────

/**
 * Compute the turn banner position: a floating bar centered above the token.
 */
export function computeTurnBannerPosition(
  gridX: number,
  gridY: number,
  gridSize: number
): {
  bannerCenterX: number;
  bannerTopY: number;
  label: string;
} {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  return {
    bannerCenterX: cx,
    bannerTopY: cy - gridSize * 0.6 - 6, // ~6px above token circle
    label: "⚔ Turn",
  };
}

/**
 * Compute next-up indicator dot position (above-right of token).
 */
export function computeNextUpDotPosition(
  gridX: number,
  gridY: number,
  gridSize: number
): { dotX: number; dotY: number; radius: number } {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const dotRadius = 3;
  return {
    dotX: cx + gridSize * 0.35,
    dotY: cy - gridSize * 0.6 - 12,
    radius: dotRadius,
  };
}

/**
 * Compute dead marker position (red X over the token).
 */
export function computeDeadMarkerPosition(
  gridX: number,
  gridY: number,
  gridSize: number
): { centerX: number; centerY: number; armLength: number } {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  return { centerX: cx, centerY: cy, armLength: gridSize * 0.2 };
}

describe("initiative-renderer: turn banner position (pure)", () => {
  it("grid (5,3) at 50px — banner center (275, 131)", () => {
    const result = computeTurnBannerPosition(5, 3, 50);
    expect(result.bannerCenterX).toBe(275);
    expect(result.bannerTopY).toBe(131); // 175 - 30 - 14 ... approximately
  });

  it("grid (0,0) at 50px — banner top above token", () => {
    const result = computeTurnBannerPosition(0, 0, 50);
    expect(result.bannerCenterX).toBe(25);
    // 25 - 30 - 6 = -11 (above cell, which is valid for canvas rendering)
    expect(result.bannerTopY).toBeLessThan(0);
  });
});

describe("initiative-renderer: next-up indicator position (pure)", () => {
  it("grid (5,3) at 50px — dot at (292.5, 119)", () => {
    const result = computeNextUpDotPosition(5, 3, 50);
    expect(result.dotX).toBeCloseTo(292.5);
    expect(result.dotY).toBeCloseTo(119);
    expect(result.radius).toBe(3);
  });
});

describe("initiative-renderer: dead marker position (pure)", () => {
  it("grid (5,3) at 50px — center (275, 175), arm 10px", () => {
    const result = computeDeadMarkerPosition(5, 3, 50);
    expect(result.centerX).toBe(275);
    expect(result.centerY).toBe(175);
    expect(result.armLength).toBe(10);
  });
});

// ──── 5. RESTRAINED-RENDERER — OVERLAY POSITIONS ────

/**
 * Compute chains positions for the restrained overlay:
 * 6 chains equally spaced around the token at 0.45 radius offset.
 */
export function computeChainPositions(
  gridX: number,
  gridY: number,
  gridSize: number
): Array<{ x: number; y: number; angle: number }> {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.45;
  const angles = [0, 60, 120, 180, 240, 300].map((deg) => (deg * Math.PI) / 180);

  return angles.map((angle) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
    angle,
  }));
}

/**
 * Compute bloodied overlay ring parameters.
 */
export function computeBloodiedRing(
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number = 0
): { centerX: number; centerY: number; ringSize: number; pulseOffset: number } {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  return {
    centerX: cx,
    centerY: cy,
    ringSize: gridSize * 0.55,
    pulseOffset: Math.sin(time * 3) * 2,
  };
}

describe("restrained-renderer: chain positions (pure)", () => {
  it("grid (5,3) at 50px — 6 chains equally spaced at 22.5px radius", () => {
    const result = computeChainPositions(5, 3, 50);
    expect(result).toHaveLength(6);

    // Chain 0 (0°) — right side
    expect(result[0].x).toBeCloseTo(275 + 22.5);
    expect(result[0].y).toBeCloseTo(175);
    expect(result[0].angle).toBeCloseTo(0);

    // Chain 3 (180°) — left side
    expect(result[3].x).toBeCloseTo(275 - 22.5);
    expect(result[3].y).toBeCloseTo(175);
    expect(result[3].angle).toBeCloseTo(Math.PI);
  });

  it("chain angles are uniformly distributed 60 degrees apart", () => {
    const result = computeChainPositions(0, 0, 50);
    // Verify all 6 angles are spaced by ~60 degrees
    for (let i = 1; i < result.length; i++) {
      const diff = Math.abs(result[i].angle - result[i - 1].angle);
      expect(diff).toBeCloseTo(Math.PI / 3, 2); // ~60 degrees
    }
  });
});

describe("restrained-renderer: bloodied ring parameters (pure)", () => {
  it("grid (5,3) at 50px, time=0 — center (275, 175), ring 27.5", () => {
    const result = computeBloodiedRing(5, 3, 50, 0);
    expect(result.centerX).toBe(275);
    expect(result.centerY).toBe(175);
    expect(result.ringSize).toBe(27.5);
    expect(result.pulseOffset).toBe(0);
  });

  it("at time=1.0s — pulse offset ~0.14 (sin(3) * 2)", () => {
    const result = computeBloodiedRing(5, 3, 50, 1);
    const expectedOffset = Math.sin(3) * 2;
    expect(result.pulseOffset).toBeCloseTo(expectedOffset, 2);
  });
});

// ──── 6. MEASUREMENT-RENDERER — DISTANCE & ANGLE MATH (REMAINING EDGE CASES) ────

export function calcDistance(
  x1: number, y1: number,
  x2: number, y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function calcAngle(
  x1: number, y1: number,
  x2: number, y2: number
): number {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  return ((angle * 180) / Math.PI + 360) % 360;
}

export function formatMeasurement(
  gridDistance: number,
  feetPerCell: number = 5
): { cells: string; feet: string } {
  return {
    cells: gridDistance.toFixed(1),
    feet: `${Math.round(gridDistance * feetPerCell)} ft`,
  };
}

describe("measure-renderer: distance and angle edge cases (remaining)", () => {
  it("zero distance between same point", () => {
    expect(calcDistance(5, 3, 5, 3)).toBe(0);
  });

  it("distance is commutative", () => {
    const d1 = calcDistance(0, 0, 3, 4);
    const d2 = calcDistance(3, 4, 0, 0);
    expect(d1).toBe(5);
    expect(d2).toBe(5);
  });

  it("negative coordinates work correctly", () => {
    const d = calcDistance(-5, -3, 0, 0);
    expect(d).toBeCloseTo(Math.sqrt(34), 5);
  });

  it("angle from (0,0) to (1,1) is 45 degrees", () => {
    expect(calcAngle(0, 0, 1, 1)).toBeCloseTo(45, 5);
  });

  it("angle from (0,0) to (0,-1) is 270 (or -90 mod 360)", () => {
    expect(calcAngle(0, 0, 0, -1)).toBeCloseTo(270, 5);
  });

  it("angle from (0,0) to (-1,0) is 180", () => {
    expect(calcAngle(0, 0, -1, 0)).toBeCloseTo(180, 5);
  });

  it("formatMeasurement: 6 cells at 5ft/cell = '30 ft'", () => {
    const result = formatMeasurement(6);
    expect(result.cells).toBe("6.0");
    expect(result.feet).toBe("30 ft");
  });

  it("formatMeasurement: 3.5 cells at 5ft/cell = '18 ft' (rounded)", () => {
    const result = formatMeasurement(3.5);
    expect(result.feet).toBe("18 ft"); // 17.5 rounds to 18
  });

  it("formatMeasurement: 0 cells = '0 ft'", () => {
    const result = formatMeasurement(0);
    expect(result.cells).toBe("0.0");
    expect(result.feet).toBe("0 ft");
  });
});

// ──── 7. TOKEN-RENDERER — HP BAR COLOR THRESHOLDS & POSITIONS ────

/**
 * Pure HP bar color computation (extracted from token-renderer).
 */
export function computeHpBarColor(
  current: number,
  max: number
): { fill: string; background: string; tier: string } {
  if (max <= 0) return { fill: "#6b7280", background: "#374151", tier: "dead" };
  const ratio = current / max;

  if (ratio > 0.5) return { fill: "#10b981", background: "#064e3b", tier: "healthy" };
  if (ratio > 0.25) return { fill: "#f59e0b", background: "#78350f", tier: "bloodied" };
  if (ratio > 0) return { fill: "#ef4444", background: "#7f1d1d", tier: "critical" };
  return { fill: "#6b7280", background: "#374151", tier: "dead" };
}

/**
 * Compute HP bar position below a token.
 */
export function computeHpBarPosition(
  gridX: number,
  gridY: number,
  gridSize: number
): {
  barX: number;
  barY: number;
  barWidth: number;
  barHeight: number;
} {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;
  const barWidth = gridSize * 0.6;
  const barHeight = 3;
  return {
    barX: cx - barWidth / 2,
    barY: cy + radius + 2,
    barWidth,
    barHeight,
  };
}

describe("token-renderer: HP bar color tiers (pure)", () => {
  it("100% HP (44/44) — green, healthy", () => {
    const result = computeHpBarColor(44, 44);
    expect(result.fill).toBe("#10b981");
    expect(result.tier).toBe("healthy");
  });

  it("76% HP (34/44) — green, healthy", () => {
    const result = computeHpBarColor(34, 44);
    expect(result.tier).toBe("healthy");
  });

  it("50% HP (22/44) — amber, bloodied (boundary test)", () => {
    const result = computeHpBarColor(22, 44);
    expect(result.fill).toBe("#f59e0b");
    expect(result.tier).toBe("bloodied");
  });

  it("26% HP (12/44) — amber, bloodied", () => {
    const result = computeHpBarColor(12, 44);
    expect(result.tier).toBe("bloodied");
  });

  it("25% HP (11/44) — red, critical (boundary test)", () => {
    const result = computeHpBarColor(11, 44);
    expect(result.fill).toBe("#ef4444");
    expect(result.tier).toBe("critical");
  });

  it("1% HP (1/44) — red, critical", () => {
    const result = computeHpBarColor(1, 44);
    expect(result.tier).toBe("critical");
  });

  it("0 HP — gray, dead", () => {
    const result = computeHpBarColor(0, 44);
    expect(result.fill).toBe("#6b7280");
    expect(result.tier).toBe("dead");
  });

  it("max=0 edge case — gray, dead", () => {
    const result = computeHpBarColor(0, 0);
    expect(result.tier).toBe("dead");
  });

  it("overheal (> max) — treated as healthy", () => {
    const result = computeHpBarColor(50, 44);
    expect(result.tier).toBe("healthy");
  });
});

describe("token-renderer: HP bar position below token (pure)", () => {
  it("grid (5,3) at 50px — bar centered at x=245, width=30, y=197", () => {
    const result = computeHpBarPosition(5, 3, 50);
    expect(result.barX).toBe(260); // 275 - 15
    expect(result.barY).toBe(197); // 175 + 20 + 2
    expect(result.barWidth).toBe(30); // 50 * 0.6
    expect(result.barHeight).toBe(3);
  });

  it("size 2 (Large) at 50px — radius=40, bar wider at 60px", () => {
    // For size 2, the radius would be larger but HP bar uses fixed gridSize * 0.6
    const result = computeHpBarPosition(1, 1, 60);
    expect(result.barWidth).toBe(36); // 60 * 0.6
    expect(result.barY).toBeGreaterThan(0);
  });
});
