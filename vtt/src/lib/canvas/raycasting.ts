import type { WallSegment } from "@/types";

const MAX_STEPS = 200;
const STEP_SIZE = 2;

interface RayHit {
  x: number;
  y: number;
  wallId: string | null;
  distance: number;
}

function lineIntersection(
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

export function castRay(
  ox: number, oy: number,
  angle: number,
  maxDist: number,
  walls: WallSegment[]
): RayHit {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let closest: RayHit = { x: ox, y: oy, wallId: null, distance: maxDist };

  for (let step = 0; step < MAX_STEPS; step++) {
    const cx = ox + dx * step * STEP_SIZE;
    const cy = oy + dy * step * STEP_SIZE;
    const dist = step * STEP_SIZE;
    if (dist > maxDist) break;

    for (const wall of walls) {
      if (!wall.blocksLight && !wall.blocksVision) continue;
      if (wall.isDoor && wall.doorState === "open") continue;
      const hit = lineIntersection(ox, oy, cx, cy, wall.x1, wall.y1, wall.x2, wall.y2);
      if (hit) {
        const wallDist = Math.sqrt((hit.x - ox) ** 2 + (hit.y - oy) ** 2);
        if (wallDist < closest.distance) {
          closest = { x: hit.x, y: hit.y, wallId: wall.id, distance: wallDist };
          return closest;
        }
      }
    }
  }
  return closest;
}

export function createWallGrid(
  gridWidth: number, gridHeight: number, gridSize: number,
  walls: WallSegment[]
): WallSegment[] {
  const perimeter: WallSegment[] = [
    { id: "perim_top", x1: 0, y1: 0, x2: gridWidth * gridSize, y2: 0, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    { id: "perim_bottom", x1: 0, y1: gridHeight * gridSize, x2: gridWidth * gridSize, y2: gridHeight * gridSize, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    { id: "perim_left", x1: 0, y1: 0, x2: 0, y2: gridHeight * gridSize, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
    { id: "perim_right", x1: gridWidth * gridSize, y1: 0, x2: gridWidth * gridSize, y2: gridHeight * gridSize, blocksVision: true, blocksMovement: true, blocksLight: true, isDoor: false, isWindow: false },
  ];
  return [...perimeter, ...walls];
}
