/**
 * STᚱ VTT — Canvas Renderer (Premium)
 *
 * Main canvas rendering pipeline.
 *
 * Rendering order (bottom → top):
 *   1. Background fill
 *   2. Map image
 *   3. Grid overlay
 *   4. Fog of war
 *   5. Dynamic lighting
 *   6. Tokens (with active turn highlighting)
 *   7. Initiative overlays (turn banner, next-up, dead markers, status chips)
 *   8. Drag preview (ghost + drop target + trail + coordinate readout)
 *
 * Cycle 22 Enhancement (Premium Battlemap Overhaul):
 *   - DragPreviewState integration for rendering ghost tokens while dragging
 *
 * Cycle 23 Enhancement (Premium Battlemap Overhaul):
 *   - Initiative overlay rendering directly on the canvas
 *   - ActiveTurnTokenId for dynamic turn highlighting on tokens
 *   - Turn banners, next-up indicators, dead markers, concentration chips
 *   - InitiativeOverlayState integration for canvas initiative rendering
 */

import type { LightSource, WallSegment, MapToken, CombatEncounter } from "@/types";
import { drawGrid } from "./grid-renderer";
import { applyFogOfWar, applyDynamicLighting } from "./fog-renderer";
import { drawTokens } from "./token-renderer";
import { createWallGrid } from "./raycasting";
import {
  drawDropTarget,
  drawDragTrail,
  drawGhostToken,
  drawCoordinateReadout,
  type DragPreviewState,
} from "./drag-renderer";
import {
  renderInitiativeOverlay,
  type InitiativeOverlayState,
} from "./initiative-renderer";

// ── Types ────────────────────────────────────────────────

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
  /** Animation time in seconds (for pulse effects) */
  time?: number;
  /** Current drag preview state (null when not dragging) */
  dragPreview?: DragPreviewState | null;
  /** The color of the token being dragged (for ghost rendering) */
  dragTokenColor?: string;
  /** The label of the token being dragged */
  dragTokenLabel?: string;
  /** The size multiplier of the token being dragged */
  dragTokenSize?: number;
  /** Current initiative/combat encounter for turn overlay rendering */
  activeEncounter?: CombatEncounter | null;
  /** Token ID of the currently active turn combatant */
  activeTurnTokenId?: string | null;
}

// ── Renderer ─────────────────────────────────────────────

export function renderCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: CanvasRenderState
): void {
  const {
    image, gridWidth, gridHeight, gridSize, gridColor, gridOpacity,
    lights, walls, tokens, fogVisible, fogExplored,
    zoom, panX, panY, showGrid, showFog, dmView,
    time = 0, dragPreview, dragTokenColor, dragTokenLabel, dragTokenSize,
    activeEncounter, activeTurnTokenId,
  } = state;

  const mapWidth = gridWidth * gridSize;
  const mapHeight = gridHeight * gridSize;

  ctx.save();

  // ── 1. Clear & Transform ──
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // ── 2. Background fill ──
  if (image) {
    ctx.drawImage(image, 0, 0, mapWidth, mapHeight);
  } else {
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(0, 0, mapWidth, mapHeight);
  }

  // ── 3. Grid overlay ──
  if (showGrid) {
    drawGrid(ctx, gridWidth, gridHeight, gridSize, gridColor, gridOpacity);
  }

  // ── 4. Fog of war ──
  if (showFog && !dmView) {
    applyFogOfWar(ctx, gridWidth, gridHeight, gridSize, fogVisible, fogExplored);
  }

  // ── 5. Dynamic lighting ──
  const allWalls = createWallGrid(gridWidth, gridHeight, gridSize, walls);
  if (lights.length > 0 && !dmView) {
    applyDynamicLighting(ctx, gridWidth, gridHeight, gridSize, lights, allWalls);
  }

  // ── 6. Tokens (excluding the one being dragged) ──
  const draggedTokenId = dragPreview?.activeTokenId ?? null;
  const visibleTokens = draggedTokenId
    ? tokens.filter((t) => t.id !== draggedTokenId)
    : tokens;
  drawTokens(ctx, visibleTokens, gridSize, dmView, undefined, time, activeTurnTokenId);

  // ── 7. Initiative overlay ──
  if (activeEncounter && activeEncounter.phase === "active" && dmView) {
    const initState: InitiativeOverlayState = {
      activeEncounter: activeEncounter,
      time,
      dmView,
    };
    // Build token position map for initiative overlay
    const tokenPositions = tokens.map((t) => ({
      gridX: t.x,
      gridY: t.y,
      id: t.id,
    }));
    renderInitiativeOverlay(ctx, tokenPositions, initState, gridSize);
  }

  // ── 8. Drag preview overlay ──
  if (dragPreview && dragPreview.isDragging && dragPreview.activeTokenId) {
    const { ghostGridX, ghostGridY, originGridX, originGridY } = dragPreview;

    // Drop target cell highlight
    drawDropTarget(ctx, ghostGridX, ghostGridY, gridSize);

    // Drag trail line
    if (originGridX !== ghostGridX || originGridY !== ghostGridY) {
      drawDragTrail(ctx, originGridX, originGridY, ghostGridX, ghostGridY, gridSize);
    }

    // Ghost token at current position
    if (dragTokenColor) {
      drawGhostToken(
        ctx,
        dragTokenColor,
        ghostGridX,
        ghostGridY,
        gridSize,
        dragTokenSize ?? 1,
        dragTokenLabel ?? ""
      );
    }

    // Coordinate readout
    drawCoordinateReadout(ctx, ghostGridX, ghostGridY, gridSize);
  }

  ctx.restore();
}
