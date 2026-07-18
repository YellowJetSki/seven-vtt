/* ── CanvasMapView ──────────────────────────────────────────────
 * React wrapper around the HTML5 Canvas engine for the battle map.
 * Handles mouse/touch interactions, pan/zoom, and bridges React
 * state to the imperative Canvas renderer.
 *
 * ARCHITECTURE: This replaces the old DOM+SVG MapCanvas with a
 * pure Canvas renderer for 10-20x better frame rates during
 * drag, hover, and token movement.
 * ─────────────────────────────────────────────────────────────── */

import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from "react";
import type { BattleMap, MapToken, MapDrawingStroke } from "@/types";
import type { AoETemplate } from "@/types/aoe-templates";
import { MapCanvasEngine, type CanvasRenderOptions } from "@/lib/canvas/MapCanvasEngine";

export interface CanvasMapHandle {
  engine: MapCanvasEngine | null;
  getGridCoords: (clientX: number, clientY: number) => { gridX: number; gridY: number } | null;
  getTokenAt: (clientX: number, clientY: number) => MapToken | null;
}

interface Props {
  map: BattleMap;
  tokens: MapToken[];
  aoeTemplates: AoETemplate[];
  drawings: MapDrawingStroke[];
  fogZones: { id: string; x: number; y: number; width: number; height: number }[];
  gmView: boolean;
  showFog: boolean;
  showGrid: boolean;
  gridOpacity: number;
  selectedTokenId: string | null;
  hoveredCell: { x: number; y: number } | null;
  onTokenClick: (tokenId: string) => void;
  onCanvasClick: (gridX: number, gridY: number) => void;
  onCanvasMove: (gridX: number, gridY: number) => void;
  onTokenDragEnd: (tokenId: string, gridX: number, gridY: number) => void;
  onCanvasContextMenu?: (gridX: number, gridY: number) => void;
  /** Callback when canvas is mounted and engine is ready */
  onEngineReady?: (engine: MapCanvasEngine) => void;
  className?: string;
}

export const CanvasMapView = forwardRef<CanvasMapHandle, Props>(function CanvasMapView(
  {
    map, tokens, aoeTemplates, drawings, fogZones,
    gmView, showFog, showGrid, gridOpacity,
    selectedTokenId, hoveredCell,
    onTokenClick, onCanvasClick, onCanvasMove,
    onTokenDragEnd, onCanvasContextMenu,
    onEngineReady, className = "",
  }: Props,
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MapCanvasEngine | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTokenId, setDragTokenId] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const panOffsetRef = useRef(panOffset);
  const zoomLevelRef = useRef(zoomLevel);

  // Update refs on state change so engine always has latest
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);
  useEffect(() => { zoomLevelRef.current = zoomLevel; }, [zoomLevel]);

  /* ── Initialize Canvas Engine ──────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new MapCanvasEngine(canvas);
    engineRef.current = engine;

    // Size to container
    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      engine.updateSize(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    engine.setMap(map);
    engine.setTokens(tokens);
    engine.setAoETemplates(aoeTemplates);
    engine.setDrawings(drawings);
    engine.setFogZones(fogZones);
    engine.setOptions({
      gmView,
      showFog,
      showGrid,
      gridOpacity,
      selectedTokenId,
      hoveredCell,
      panOffset,
      zoomLevel,
    });
    engine.startRenderLoop();

    if (onEngineReady) onEngineReady(engine);

    return () => {
      window.removeEventListener("resize", resize);
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Keep engine in sync with props ───────────────────── */
  useEffect(() => {
    engineRef.current?.setMap(map);
  }, [map]);

  useEffect(() => {
    engineRef.current?.setTokens(tokens);
  }, [tokens]);

  useEffect(() => {
    engineRef.current?.setAoETemplates(aoeTemplates);
  }, [aoeTemplates]);

  useEffect(() => {
    engineRef.current?.setDrawings(drawings);
  }, [drawings]);

  useEffect(() => {
    engineRef.current?.setFogZones(fogZones);
  }, [fogZones]);

  useEffect(() => {
    engineRef.current?.setOptions({
      gmView, showFog, showGrid, gridOpacity,
      selectedTokenId, hoveredCell,
      panOffset, zoomLevel,
    });
  }, [gmView, showFog, showGrid, gridOpacity, selectedTokenId, hoveredCell, panOffset, zoomLevel]);

  /* ── Expose imperative API via ref ─────────────────────── */
  useImperativeHandle(ref, () => ({
    engine: engineRef.current,
    getGridCoords: (clientX: number, clientY: number) => {
      return engineRef.current?.getGridCoords(clientX, clientY) ?? null;
    },
    getTokenAt: (clientX: number, clientY: number) => {
      return engineRef.current?.getTokenAt(clientX, clientY) ?? null;
    },
  }));

  /* ── Mouse Handlers ────────────────────────────────────── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      const engine = engineRef.current;
      if (!engine) return;
      const token = engine.getTokenAt(e.clientX, e.clientY);
      if (token) {
        setDragTokenId(token.id);
        onTokenClick(token.id);
        setIsDragging(false);
        return;
      }
      // Start panning
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffsetRef.current.x,
        panY: panOffsetRef.current.y,
      };
      setDragTokenId(null);
    }
  }, [onTokenClick]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const engine = engineRef.current;
    if (!engine) return;

    const coords = engine.getGridCoords(e.clientX, e.clientY);
    if (coords) onCanvasMove(coords.gridX, coords.gridY);

    if (isDragging && !dragTokenId) {
      // Pan the map
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const newPan = {
        x: dragStart.current.panX + dx,
        y: dragStart.current.panY + dy,
      };
      // Throttle pan updates for performance
      panOffsetRef.current = newPan;
      setPanOffset(newPan);
    }
  }, [isDragging, dragTokenId, onCanvasMove]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragTokenId) {
      const engine = engineRef.current;
      if (engine) {
        const coords = engine.getGridCoords(e.clientX, e.clientY);
        if (coords) {
          onTokenDragEnd(dragTokenId, coords.gridX, coords.gridY);
        }
      }
      setDragTokenId(null);
    } else if (isDragging) {
      const dx = Math.abs(e.clientX - dragStart.current.x);
      const dy = Math.abs(e.clientY - dragStart.current.y);
      if (dx < 5 && dy < 5) {
        // Click (not drag)
        const engine = engineRef.current;
        if (engine) {
          const coords = engine.getGridCoords(e.clientX, e.clientY);
          if (coords) onCanvasClick(coords.gridX, coords.gridY);
        }
      }
    }
    setIsDragging(false);
  }, [isDragging, dragTokenId, onCanvasClick, onTokenDragEnd]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    const newZoom = Math.min(3, Math.max(0.3, zoomLevelRef.current * zoomFactor));
    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const engine = engineRef.current;
    if (!engine || !onCanvasContextMenu) return;
    const coords = engine.getGridCoords(e.clientX, e.clientY);
    if (coords) onCanvasContextMenu(coords.gridX, coords.gridY);
  }, [onCanvasContextMenu]);

  /* ── Zoom controls overlay ─────────────────────────────── */
  const handleZoomIn = () => {
    const newZoom = Math.min(3, zoomLevelRef.current * 1.25);
    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.3, zoomLevelRef.current * 0.8);
    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);
  };

  const handleResetView = () => {
    panOffsetRef.current = { x: 0, y: 0 };
    zoomLevelRef.current = 1;
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border border-surface-700 bg-surface-900 select-none ${className}`}
      style={{ aspectRatio: `${map.gridWidth}/${map.gridHeight}`, minHeight: 300 }}
    >
      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />

      {/* Zoom Controls (glassmorphic overlay) */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
        <button
          onClick={handleZoomIn}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-850/80 backdrop-blur-md border border-surface-700/60 text-surface-300 hover:text-accent-300 hover:border-accent-500/40 transition-all text-sm"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-850/80 backdrop-blur-md border border-surface-700/60 text-surface-300 hover:text-accent-300 hover:border-accent-500/40 transition-all text-sm"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleResetView}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-850/80 backdrop-blur-md border border-surface-700/60 text-surface-300 hover:text-accent-300 hover:border-accent-500/40 transition-all text-xs"
          title="Reset View"
        >
          ⌖
        </button>
      </div>

      {/* Zoom level indicator */}
      {zoomLevel !== 1 && (
        <div className="absolute bottom-3 left-3 rounded-lg bg-surface-850/80 backdrop-blur-md border border-surface-700/60 px-2.5 py-1 text-[10px] text-surface-400 font-mono z-10">
          {Math.round(zoomLevel * 100)}%
        </div>
      )}
    </div>
  );
});
