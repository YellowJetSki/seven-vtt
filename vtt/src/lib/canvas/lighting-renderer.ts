import type { LightSource, WallSegment, MapToken } from "@/types";
import { drawGrid } from "./grid-renderer";
import { applyFogOfWar, applyDynamicLighting } from "./fog-renderer";
import { drawTokens } from "./token-renderer";
import { createWallGrid } from "./raycasting";

export interface CanvasRenderState {
  image: HTMLImageElement | null;
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  gridColor: string;
  gridOpacity: number;
  lights: LightSource[];
  walls: WallSegment[];
  tokens: MapToken[];
  fogVisible: Set<string>;
  fogExplored: Set<string>;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showFog: boolean;
  dmView: boolean;
}

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: CanvasRenderState
): void {
  const { image, gridWidth, gridHeight, gridSize, gridColor, gridOpacity, lights, walls, tokens, fogVisible, fogExplored, zoom, panX, panY, showGrid, showFog, dmView } = state;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  const mapWidth = gridWidth * gridSize;
  const mapHeight = gridHeight * gridSize;
  const allWalls = createWallGrid(gridWidth, gridHeight, gridSize, walls);

  if (image) {
    ctx.drawImage(image, 0, 0, mapWidth, mapHeight);
  } else {
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(0, 0, mapWidth, mapHeight);
  }

  if (showGrid) drawGrid(ctx, gridWidth, gridHeight, gridSize, gridColor, gridOpacity);

  if (showFog && !dmView) {
    applyFogOfWar(ctx, gridWidth, gridHeight, gridSize, fogVisible, fogExplored);
  }

  if (lights.length > 0 && !dmView) {
    applyDynamicLighting(ctx, gridWidth, gridHeight, gridSize, lights, allWalls);
  }

  drawTokens(ctx, tokens, gridSize, dmView);
  ctx.restore();
}
