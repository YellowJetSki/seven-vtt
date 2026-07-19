/**
 * STᚱ VTT — useTokenDrag
 *
 * Pure React hook for managing token drag-and-drop on the battlemap canvas.
 *
 * Features:
 *   - Grid-snapping: All pixel positions snap to the nearest grid cell center
 *     (grid coordinate = pixel position / gridSize, rounded to nearest integer)
 *   - Drag threshold: Prevent accidental drags with a 5px dead zone
 *   - Token under cursor detection: Hit-tests tokens using circular bounds
 *   - Callbacks: onDragStart, onDragMove, onDragEnd (all return grid coordinates)
 *   - Firestore integration: onDragEnd writes the final snapped position
 *
 * Architecture:
 *   Canvas mousedown ──► hit-test tokens ──► onDragStart(tokenId, gridX, gridY)
 *   Canvas mousemove ──► snap to grid ──► onDragMove(tokenId, gridX, gridY)
 *   Canvas mouseup ──► final snap ──► onDragEnd(tokenId, gridX, gridY) ──► useTokenMutations.moveToken()
 *
 * Usage in CanvasMapView:
 *   const { dragState, handleTokenMouseDown, handleMouseMove, handleMouseUp } = useTokenDrag({
 *     tokens, gridSize, onMoveToken,
 *   });
 */

import { useState, useCallback, useRef } from "react";
import type { MapToken } from "@/types";

// ── Types ─────────────────────────────────────────────────

export interface DragState {
  /** The token currently being dragged, or null */
  activeTokenId: string | null;
  /** The grid column the token is currently snapped to */
  gridX: number;
  /** The grid row the token is currently snapped to */
  gridY: number;
  /** Whether a drag is actively in progress */
  isDragging: boolean;
}

export interface UseTokenDragOptions {
  /** All tokens on the map (for hit-testing) */
  tokens: MapToken[];
  /** Grid size in pixels (e.g., 60px per 5ft square) */
  gridSize: number;
  /** Called when a drag completes with the final snapped position */
  onMoveToken?: (tokenId: string, gridX: number, gridY: number) => void;
  /** Called when a token is clicked (not dragged) */
  onTokenClick?: (token: MapToken) => void;
  /** Called when an empty cell is clicked */
  onCellClick?: (gridX: number, gridY: number) => void;
}

// ── Constants ─────────────────────────────────────────────

/** Minimum drag distance (pixels) before a drag is considered active */
const DRAG_THRESHOLD = 5;

// ── Hook ──────────────────────────────────────────────────

export function useTokenDrag(options: UseTokenDragOptions) {
  const { tokens, gridSize, onMoveToken, onTokenClick, onCellClick } = options;

  const [dragState, setDragState] = useState<DragState>({
    activeTokenId: null,
    gridX: 0,
    gridY: 0,
    isDragging: false,
  });

  // Refs for tracking drag state without re-renders
  const dragRef = useRef({
    isDragging: false,
    activeTokenId: null as string | null,
    startClientX: 0,
    startClientY: 0,
    hasMoved: false,
    // Canvas-space offsets at drag start
    offsetX: 0,
    offsetY: 0,
  });

  /**
   * Convert a pixel coordinate to a grid-snapped position.
   * gridCoordinate = Math.round(pixel / gridSize)
   */
  const snapToGrid = useCallback(
    (pixelX: number, pixelY: number): { gridX: number; gridY: number } => {
      return {
        gridX: Math.round(pixelX / gridSize),
        gridY: Math.round(pixelY / gridSize),
      };
    },
    [gridSize]
  );

  /**
   * Hit-test tokens at a given canvas pixel coordinate.
   * Returns the top-most token under the cursor, or null.
   */
  const hitTestToken = useCallback(
    (
      canvasX: number,
      canvasY: number,
      panX: number,
      panY: number,
      zoom: number
    ): MapToken | null => {
      // Convert screen coordinates to canvas-space
      const mapX = (canvasX - panX) / zoom;
      const mapY = (canvasY - panY) / zoom;

      // Iterate tokens in reverse (top-most drawn last)
      for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i];
        const tx = token.x * gridSize + gridSize / 2;
        const ty = token.y * gridSize + gridSize / 2;
        const radius = (token.size || 1) * gridSize * 0.4;

        // Circle hit-test
        const dx = mapX - tx;
        const dy = mapY - ty;
        if (dx * dx + dy * dy <= radius * radius) {
          return token;
        }
      }

      return null;
    },
    [tokens, gridSize]
  );

  /**
   * Handle mouse down on the canvas.
   * Returns true if a token was hit (caller should prevent canvas pan).
   */
  const handleMouseDown = useCallback(
    (
      canvasX: number,
      canvasY: number,
      panX: number,
      panY: number,
      zoom: number
    ): boolean => {
      const hit = hitTestToken(canvasX, canvasY, panX, panY, zoom);
      if (!hit) return false;

      const ref = dragRef.current;
      ref.activeTokenId = hit.id;
      ref.startClientX = canvasX;
      ref.startClientY = canvasY;
      ref.hasMoved = false;
      ref.isDragging = false;

      // Calculate canvas-space offset
      const mapX = (canvasX - panX) / zoom;
      const mapY = (canvasY - panY) / zoom;
      ref.offsetX = mapX - hit.x * gridSize;
      ref.offsetY = mapY - hit.y * gridSize;

      return true;
    },
    [hitTestToken, gridSize]
  );

  /**
   * Handle mouse move on the canvas during a potential drag.
   */
  const handleMouseMove = useCallback(
    (
      canvasX: number,
      canvasY: number,
      panX: number,
      panY: number,
      zoom: number
    ): boolean => {
      const ref = dragRef.current;
      if (!ref.activeTokenId) return false;

      // Check drag threshold
      const dx = canvasX - ref.startClientX;
      const dy = canvasY - ref.startClientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!ref.hasMoved && dist < DRAG_THRESHOLD) {
        return false; // Not yet past threshold
      }

      ref.hasMoved = true;
      ref.isDragging = true;

      // Convert to canvas-space
      const mapX = (canvasX - panX) / zoom - ref.offsetX;
      const mapY = (canvasY - panY) / zoom - ref.offsetY;

      // Snap to grid
      const { gridX, gridY } = snapToGrid(mapX, mapY);

      // Clamp to map boundaries (0 to max)
      const clampedGridX = Math.max(0, gridX);
      const clampedGridY = Math.max(0, gridY);

      // Update visual state
      setDragState({
        activeTokenId: ref.activeTokenId,
        gridX: clampedGridX,
        gridY: clampedGridY,
        isDragging: true,
      });

      return true;
    },
    [snapToGrid]
  );

  /**
   * Handle mouse up — finalize the drag.
   */
  const handleMouseUp = useCallback(
    (canvasX: number, canvasY: number, panX: number, panY: number, zoom: number): boolean => {
      const ref = dragRef.current;
      const tokenId = ref.activeTokenId;

      if (!tokenId) return false;

      if (!ref.hasMoved) {
        // It was a click, not a drag — trigger click callbacks
        const hit = hitTestToken(
          canvasX,
          canvasY,
          panX,
          panY,
          zoom
        );
        if (hit && onTokenClick) {
          onTokenClick(hit);
        } else if (onCellClick) {
          // Convert to grid coordinates
          const mapX = (canvasX - panX) / zoom;
          const mapY = (canvasY - panY) / zoom;
          const { gridX, gridY } = snapToGrid(mapX, mapY);
          onCellClick(gridX, gridY);
        }
      } else if (ref.isDragging) {
        // Drag completed — commit the final position
        const finalState = dragState;
        if (onMoveToken && finalState.activeTokenId) {
          onMoveToken(finalState.activeTokenId, finalState.gridX, finalState.gridY);
        }
      }

      // Reset drag state
      ref.activeTokenId = null;
      ref.isDragging = false;
      ref.hasMoved = false;

      setDragState({
        activeTokenId: null,
        gridX: 0,
        gridY: 0,
        isDragging: false,
      });

      return true;
    },
    [dragState, hitTestToken, onTokenClick, onCellClick, onMoveToken, snapToGrid]
  );

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    snapToGrid,
    hitTestToken,
  };
}
