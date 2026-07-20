/**
 * STᚱ VTT — Canvas Battle Map (Premium)
 *
 * Canvas-based battle map renderer using HTML5 Canvas API.
 * Handles map image, grid, fog of war, dynamic lighting, and token rendering.
 *
 * Architecture:
 *   ┌──────────────────────────────────────────┐
 *   │  Canvas (z-10)                           │
 *   │  ├─ Background fill                      │
 *   │  ├─ Map image                            │
 *   │  ├─ Grid overlay                         │
 *   │  ├─ Fog of war                           │
 *   │  ├─ Dynamic lighting                     │
 *   │  ├─ Tokens (excl. dragged)               │
 *   │  └─ Drag preview (ghost + drop target)   │
 *   ├──────────────────────────────────────────┤
 *   │  ZoomControls (z-20)                     │
 *   └──MapViewControls (z-20)                  │
 *
 * Cycle 22 Enhancement (Premium Battlemap Overhaul):
 *   - FULL token drag-and-drop integration using useTokenDrag hook
 *   - Drag preview rendering: ghost token, drop target, drag trail, coordinates
 *   - Animation frame loop for selected token pulse effect
 *   - Smart pan/drag conflict detection: dragging token vs dragging canvas
 *   - Map edge boundary clamping for token positions
 *   - Coordinate passes to DmControlCenter for HP popover
 */

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import type { LightSource, WallSegment, MapToken, BattleMap } from "@/types";
import { renderCanvas, type CanvasRenderState } from "@/lib/canvas/lighting-renderer";
import { setupCanvas } from "@/lib/canvas/token-renderer";
import { useTokenDrag } from "@/hooks/useTokenDrag";
import ZoomControls from "./ZoomControls";
import MapViewControls from "./MapViewControls";

export interface CanvasMapHandle {
  recenter: () => void;
  addLight: (light: LightSource) => void;
  removeLight: (id: string) => void;
  toggleFog: () => void;
  toggleDmView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface CanvasMapViewProps {
  mapData: BattleMap;
  tokens: MapToken[];
  lights?: LightSource[];
  walls?: WallSegment[];
  dmView?: boolean;
  onTokenClick?: (token: MapToken, clientX?: number, clientY?: number) => void;
  onCellClick?: (gridX: number, gridY: number) => void;
  /** Called when a token drag completes with final snapped grid position */
  onMoveToken?: (tokenId: string, gridX: number, gridY: number) => void;
}

const CanvasMapView = forwardRef<CanvasMapHandle, CanvasMapViewProps>(({
  mapData, tokens, lights = [], walls = [], dmView = true,
  onTokenClick, onCellClick, onMoveToken,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // ── Canvas render state (ref for mutable updates without re-renders) ──
  const stateRef = useRef<CanvasRenderState>({
    image: null, gridWidth: mapData.gridWidth, gridHeight: mapData.gridHeight, gridSize: mapData.gridSize,
    gridColor: mapData.gridColor || "#808080", gridOpacity: mapData.gridOpacity ?? 0.4,
    lights: [], walls, tokens, fogVisible: new Set(), fogExplored: new Set(),
    zoom: 1, panX: 0, panY: 0, showGrid: true, showFog: !dmView, dmView,
    time: 0, dragPreview: null,
  });

  // ── React state for UI controls ──
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(!dmView);
  const [isDmView, setIsDmView] = useState(dmView);
  const [zoom, setZoom] = useState(1);
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const isCanvasDraggingRef = useRef(false);

  // ── Drag start position ref (for canvas pan vs token drag detection) ──
  const dragStart = useRef({ x: 0, y: 0 });

  // ── Token Drag Hook (Cycle 22) ─────────────────────────
  const {
    dragState,
    handleMouseDown: handleTokenDragDown,
    handleMouseMove: handleTokenDragMove,
    handleMouseUp: handleTokenDragUp,
  } = useTokenDrag({
    tokens,
    gridSize: mapData.gridSize,
    onMoveToken: (tokenId, gridX, gridY) => {
      onMoveToken?.(tokenId, gridX, gridY);
    },
    onTokenClick: (token) => {
      onTokenClick?.(token);
    },
    onCellClick: (gridX, gridY) => {
      onCellClick?.(gridX, gridY);
    },
  });

  // ── Sync drag preview state to canvas render state ──
  useEffect(() => {
    const activeToken = dragState.isDragging && dragState.activeTokenId
      ? tokens.find(t => t.id === dragState.activeTokenId)
      : null;

    if (dragState.isDragging && dragState.activeTokenId && activeToken) {
      stateRef.current.dragPreview = {
        activeTokenId: dragState.activeTokenId,
        ghostGridX: dragState.gridX,
        ghostGridY: dragState.gridY,
        isDragging: true,
        originGridX: activeToken.x,
        originGridY: activeToken.y,
      };
      stateRef.current.dragTokenColor = activeToken.color;
      stateRef.current.dragTokenLabel = activeToken.label;
      stateRef.current.dragTokenSize = activeToken.size || 1;
    } else {
      stateRef.current.dragPreview = null;
      stateRef.current.dragTokenColor = undefined;
      stateRef.current.dragTokenLabel = undefined;
      stateRef.current.dragTokenSize = undefined;
    }
  }, [dragState, tokens]);

  // ── Load map image ──────────────────────
  useEffect(() => {
    if (!mapData.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mapData.imageUrl;
    img.onload = () => { stateRef.current.image = img; };
  }, [mapData.imageUrl]);

  // ── Animation loop (60fps pulse on selected tokens) ──
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    Object.assign(stateRef.current, {
      gridWidth: mapData.gridWidth, gridHeight: mapData.gridHeight, gridSize: mapData.gridSize,
      gridColor: mapData.gridColor || "#808080", gridOpacity: mapData.gridOpacity ?? 0.4,
      tokens, showGrid, showFog, dmView: isDmView,
      time: elapsed,
    });

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderCanvas(ctx, canvas, stateRef.current);

    animFrameRef.current = requestAnimationFrame(renderFrame);
  }, [mapData, tokens, showGrid, showFog, isDmView]);

  // ── Start/stop animation loop ──
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [renderFrame]);

  // ── Resize setup ──
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    setupCanvas(canvasRef.current, containerRef.current);
    const h = () => renderFrame();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [renderFrame]);

  // ── Mouse handlers ──

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Try token hit first (for drag)
    const hit = handleTokenDragDown(
      canvasX, canvasY,
      stateRef.current.panX, stateRef.current.panY, stateRef.current.zoom
    );

    if (hit) {
      // Token hit — don't start canvas pan
      isCanvasDraggingRef.current = false;
      return;
    }

    // No token hit — start canvas pan
    isCanvasDraggingRef.current = true;
    setIsCanvasDragging(true);
    dragStart.current = {
      x: e.clientX - stateRef.current.panX,
      y: e.clientY - stateRef.current.panY,
    };
  }, [handleTokenDragDown]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Try token drag move first
    const dragConsumed = handleTokenDragMove(
      canvasX, canvasY,
      stateRef.current.panX, stateRef.current.panY, stateRef.current.zoom
    );

    if (dragConsumed) return;

    // Fall back to canvas pan
    if (isCanvasDraggingRef.current) {
      stateRef.current.panX = e.clientX - dragStart.current.x;
      stateRef.current.panY = e.clientY - dragStart.current.y;
    }
  }, [handleTokenDragMove]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Try token drag end first
    const dragConsumed = handleTokenDragUp(
      canvasX, canvasY,
      stateRef.current.panX, stateRef.current.panY, stateRef.current.zoom
    );

    isCanvasDraggingRef.current = false;
    setIsCanvasDragging(false);

    if (dragConsumed) return;
  }, [handleTokenDragUp]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const n = Math.max(0.25, Math.min(4, stateRef.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    stateRef.current.zoom = n;
    setZoom(n);
  }, []);

  const updateAndRender = useCallback((fn: () => void) => { fn(); }, []);

  // ── Imperative handle ──
  useImperativeHandle(ref, () => ({
    recenter: () => { stateRef.current.panX = 0; stateRef.current.panY = 0; stateRef.current.zoom = 1; setZoom(1); },
    addLight: (l: LightSource) => { stateRef.current.lights = [...stateRef.current.lights, l]; },
    removeLight: (id: string) => { stateRef.current.lights = stateRef.current.lights.filter(x => x.id !== id); },
    toggleFog: () => { const n = !showFog; setShowFog(n); stateRef.current.showFog = n; },
    toggleDmView: () => { const n = !isDmView; setIsDmView(n); stateRef.current.dmView = n; stateRef.current.showFog = !n; setShowFog(!n); },
    zoomIn: () => { const n = Math.min(4, zoom * 1.25); stateRef.current.zoom = n; setZoom(n); },
    zoomOut: () => { const n = Math.max(0.25, zoom * 0.8); stateRef.current.zoom = n; setZoom(n); },
  }), [renderFrame, zoom, showFog, isDmView]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-obsidian" style={{ minHeight: "400px" }}>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${isCanvasDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <ZoomControls zoom={zoom}
        onZoomIn={() => { const n = Math.min(4, zoom * 1.25); stateRef.current.zoom = n; setZoom(n); }}
        onZoomOut={() => { const n = Math.max(0.25, zoom * 0.8); stateRef.current.zoom = n; setZoom(n); }}
      />
      <MapViewControls
        showFog={showFog} isDmView={isDmView} showGrid={showGrid}
        onToggleFog={() => { const n = !showFog; setShowFog(n); stateRef.current.showFog = n; }}
        onToggleDmView={() => { const n = !isDmView; setIsDmView(n); stateRef.current.dmView = n; stateRef.current.showFog = !n; setShowFog(!n); }}
        onToggleGrid={() => { const n = !showGrid; setShowGrid(n); stateRef.current.showGrid = n; }}
      />
    </div>
  );
});

CanvasMapView.displayName = "CanvasMapView";
export default CanvasMapView;
