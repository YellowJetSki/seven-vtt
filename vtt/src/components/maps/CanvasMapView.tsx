/**
 * STᚱ VTT — Canvas Battle Map (Premium)
 *
 * The VTT's core interactive battle map — a full HTML5 Canvas implementation
 * delivering 60fps rendering with 10 composited layers.
 *
 * Architecture:
 *   ┌──────────────────────────────────────────────┐
 *   │  Canvas (z-10, 60fps RAF loop)               │
 *   │  ├─ 1. Background fill                       │
 *   │  ├─ 2. Map image                             │
 *   │  ├─ 3. Grid overlay                          │
 *   │  ├─ 4. Fog of war                            │
 *   │  ├─ 5. Dynamic lighting                       │
 *   │  ├─ 6. Tokens (turn highlight + state overlays)│
 *   │  ├─ 7. Initiative overlays                    │
 *   │  ├─ 8. Ping effects (expanding rings)          │
 *   │  ├─ 9. Measurement/ruler lines                 │
 *   │  └─ 10. Drag preview                          │
 *   ├──────────────────────────────────────────────┤
 *   │  DOM Overlays (z-20):                         │
 *   │  ├─ ZoomControls (bottom-right)               │
 *   │  ├─ CanvasZoomIndicator (bottom-center)       │
 *   │  ├─ MapViewControls (top-right)               │
 *   │  ├─ MapPingRulerTools (bottom-center)         │
 *   │  └─ InitiativeOverlay (top-right)             │
 *   └──────────────────────────────────────────────┘
 *
 * Cycle 22: Token drag-and-drop (useTokenDrag hook)
 * Cycle 23: Initiative & Turn Order system on the map
 * Cycle 24: Token visual state overlays, ping/ripple effects,
 *           measurement/ruler tool
 * Cycle 25 (FINAL): Keyboard shortcuts (G/F/V/R/P/M/Esc...),
 *           premium zoom indicator, keyboard shortcut hints overlay,
 *           multi-tool keyboard integration
 */

import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import type { LightSource, WallSegment, MapToken, BattleMap, CombatEncounter } from "@/types";
import { renderCanvas, type CanvasRenderState } from "@/lib/canvas/lighting-renderer";
import { setupCanvas } from "@/lib/canvas/token-renderer";
import { useTokenDrag } from "@/hooks/useTokenDrag";
import { createPing } from "@/lib/canvas/ping-renderer";
import { snapToGrid, completeMeasurement, type RulerState } from "@/lib/canvas/measure-renderer";
import type { PingEffect } from "@/lib/canvas/ping-renderer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { KeyboardShortcutActions } from "@/hooks/useKeyboardShortcuts";
import { useBattleMapImageLoader } from "@/hooks/useBattleMapImageLoader";
import ZoomControls from "./ZoomControls";
import MapViewControls from "./MapViewControls";
import MapPingRulerTools from "./MapPingRulerTools";
import CanvasZoomIndicator from "./CanvasZoomIndicator";
import KeyboardShortcutHints from "./KeyboardShortcutHints";
import InitiativeOverlay from "./InitiativeOverlay";

export interface CanvasMapHandle {
  recenter: () => void;
  addLight: (light: LightSource) => void;
  removeLight: (id: string) => void;
  toggleFog: () => void;
  toggleDmView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

export interface CanvasMapViewProps {
  mapData: BattleMap;
  tokens: MapToken[];
  lights?: LightSource[];
  walls?: WallSegment[];
  dmView?: boolean;
  onTokenClick?: (token: MapToken, clientX?: number, clientY?: number) => void;
  onCellClick?: (gridX: number, gridY: number) => void;
  onMoveToken?: (tokenId: string, gridX: number, gridY: number) => void;
  activeEncounter?: CombatEncounter | null;
  onNextTurn?: () => void;
  onPrevTurn?: () => void;
  viewOnly?: boolean;
  /**
   * Token ID to highlight on the canvas. Set by DM popover "Locate on map" buttons.
   * When non-null, a golden pulsing ring is rendered around the matching token.
   * The focus auto-clears after 3 seconds (handled by canvasFocusStore).
   */
  focusTokenId?: string | null;
}

const CanvasMapView = forwardRef<CanvasMapHandle, CanvasMapViewProps>(({
  mapData, tokens, lights = [], walls = [], dmView = true,
  onTokenClick, onCellClick, onMoveToken,
  activeEncounter, onNextTurn, onPrevTurn, viewOnly = false,
  focusTokenId = null,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // ── Derived active turn token ID ──
  const activeTurnTokenId = activeEncounter?.phase === "active"
    ? activeEncounter.combatants[activeEncounter.currentCombatantIndex]?.id ?? null
    : null;

  // ── Canvas render state (ref for mutable updates without re-renders) ──
  const stateRef = useRef<CanvasRenderState>({
    image: null,
    gridWidth: mapData.gridWidth, gridHeight: mapData.gridHeight, gridSize: mapData.gridSize,
    gridColor: mapData.gridColor || "#808080", gridOpacity: mapData.gridOpacity ?? 0.4,
    lights: [], walls, tokens, fogVisible: new Set(), fogExplored: new Set(),
    zoom: 1, panX: 0, panY: 0, showGrid: true, showFog: !dmView, dmView,
    time: 0, dragPreview: null,
    activeEncounter,
    activeTurnTokenId,
    activePings: [],
    rulerState: {
      rulerMode: false,
      originX: null, originY: null,
      currentX: 0, currentY: 0,
      isDragging: false,
      measurements: [],
    },
  });

  // ── React state for UI controls ──
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(!dmView);
  const [isDmView, setIsDmView] = useState(dmView);
  const [zoom, setZoom] = useState(1);
  const [panState, setPanState] = useState({ x: 0, y: 0 });
  const [showInitiativeOverlay, setShowInitiativeOverlay] = useState(true);
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const isCanvasDraggingRef = useRef(false);
  const [pingMode, setPingMode] = useState(false);
  const [rulerMode, setRulerMode] = useState(false);

  // ── Keyboard state ref (for compatibility with canvas-only state) ──
  const pingModeRef = useRef(false);
  const rulerModeRef = useRef(false);
  useEffect(() => { pingModeRef.current = pingMode; }, [pingMode]);
  useEffect(() => { rulerModeRef.current = rulerMode; }, [rulerMode]);

  // ── Drag start position ref ──
  const dragStart = useRef({ x: 0, y: 0 });

  // ── Token Drag Hook (Cycle 22) ──
  const {
    dragState,
    handleMouseDown: handleTokenDragDown,
    handleMouseMove: handleTokenDragMove,
    handleMouseUp: handleTokenDragUp,
  } = useTokenDrag(
    viewOnly
      ? { tokens: [], gridSize: mapData.gridSize }
      : {
          tokens,
          gridSize: mapData.gridSize,
          onMoveToken: (tokenId, gridX, gridY) => onMoveToken?.(tokenId, gridX, gridY),
          onTokenClick: (token) => onTokenClick?.(token),
          onCellClick: (gridX, gridY) => onCellClick?.(gridX, gridY),
        }
  );

  // ── Sync drag preview state ──
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

  // ── Load map image (with retry + error handling) ──
  const { imageElement, isLoading: isMapLoading, hasError: mapLoadError } =
    useBattleMapImageLoader(mapData.imageUrl);

  // Sync loaded image to canvas render state
  useEffect(() => {
    stateRef.current.image = imageElement;
  }, [imageElement]);

  // ── Sync render state from props via refs (avoids stale closures) ──
  const mapDataRef = useRef(mapData);
  mapDataRef.current = mapData;
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  const activeEncounterRef = useRef(activeEncounter);
  activeEncounterRef.current = activeEncounter;
  const showGridRef = useRef(showGrid);
  showGridRef.current = showGrid;
  const showFogRef = useRef(showFog);
  showFogRef.current = showFog;
  const isDmViewRef = useRef(isDmView);
  isDmViewRef.current = isDmView;
  const activeTurnTokenIdRef = useRef(activeTurnTokenId);
  activeTurnTokenIdRef.current = activeTurnTokenId;
  const focusTokenIdRef = useRef(focusTokenId);
  focusTokenIdRef.current = focusTokenId;

  // ── Stable render callback — reads latest values from refs ──
  const renderFrameRef = useRef<() => void>(() => {});
  renderFrameRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const s = stateRef.current;
    const md = mapDataRef.current;

    Object.assign(s, {
      gridWidth: md.gridWidth, gridHeight: md.gridHeight, gridSize: md.gridSize,
      gridColor: md.gridColor || "#808080", gridOpacity: md.gridOpacity ?? 0.4,
      tokens: tokensRef.current,
      showGrid: showGridRef.current, showFog: showFogRef.current, dmView: isDmViewRef.current,
      time: elapsed,
      activeEncounter: activeEncounterRef.current,
      activeTurnTokenId: activeTurnTokenIdRef.current,
      focusTokenId: focusTokenIdRef.current,
    });

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderCanvas(ctx, canvas, s);

    animFrameRef.current = requestAnimationFrame(renderFrameRef.current);
  };
  const render = renderFrameRef.current;

  // ── Start/stop animation loop (stable deps — never re-creates) ──
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Canvas resize setup (stable — runs once on mount) ──
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    setupCanvas(canvasRef.current, containerRef.current);
    const h = () => renderFrameRef.current();
    window.addEventListener("resize", h);
    return () => {
      window.removeEventListener("resize", h);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helper: pixel to grid conversion ──
  const getCanvasGridPos = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const s = stateRef.current;
    const canvasX = (clientX - rect.left - s.panX) / s.zoom;
    const canvasY = (clientY - rect.top - s.panY) / s.zoom;
    return snapToGrid(canvasX, canvasY, s.gridSize);
  }, []);

  // ── Mouse handlers ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewOnly || e.button !== 0) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const s = stateRef.current;
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // ═══ Ping mode ═══
    if (pingModeRef.current) {
      const gridPos = getCanvasGridPos(e.clientX, e.clientY);
      if (gridPos) {
        const ping = createPing(gridPos.gridX, gridPos.gridY);
        stateRef.current.activePings = [...(stateRef.current.activePings || []), ping];
      }
      return;
    }

    // ═══ Ruler mode ═══
    if (rulerModeRef.current) {
      const gridPos = getCanvasGridPos(e.clientX, e.clientY);
      if (gridPos) {
        const rs = stateRef.current.rulerState!;
        if (rs.originX !== null && rs.originY !== null && !rs.isDragging) {
          rs.currentX = gridPos.gridX;
          rs.currentY = gridPos.gridY;
          const measurement = completeMeasurement(rs);
          rs.measurements = [...rs.measurements, measurement];
          rs.originX = null;
          rs.originY = null;
          rs.isDragging = false;
        } else {
          rs.originX = gridPos.gridX;
          rs.originY = gridPos.gridY;
          rs.currentX = gridPos.gridX;
          rs.currentY = gridPos.gridY;
          rs.isDragging = true;
        }
      }
      return;
    }

    // ═══ Normal mode: Try token hit first ═══
    const hit = handleTokenDragDown(
      canvasX, canvasY,
      s.panX, s.panY, s.zoom
    );

    if (hit) {
      isCanvasDraggingRef.current = false;
      return;
    }

    // No token hit → start canvas pan
    isCanvasDraggingRef.current = true;
    dragStart.current = { x: e.clientX - s.panX, y: e.clientY - s.panY };
  }, [handleTokenDragDown, viewOnly, getCanvasGridPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (viewOnly) return;

    const s = stateRef.current;

    // ═══ Ruler mode: Update cursor position ═══
    if (rulerModeRef.current && s.rulerState?.isDragging && s.rulerState.originX !== null) {
      const gridPos = getCanvasGridPos(e.clientX, e.clientY);
      if (gridPos) {
        s.rulerState.currentX = gridPos.gridX;
        s.rulerState.currentY = gridPos.gridY;
      }
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const dragConsumed = handleTokenDragMove(
      canvasX, canvasY,
      s.panX, s.panY, s.zoom
    );

    if (dragConsumed) return;

    if (isCanvasDraggingRef.current) {
      s.panX = e.clientX - dragStart.current.x;
      s.panY = e.clientY - dragStart.current.y;
      setPanState({ x: s.panX, y: s.panY });
    }
  }, [handleTokenDragMove, viewOnly, getCanvasGridPos]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (viewOnly) return;

    const s = stateRef.current;

    // ═══ Ruler mode: Complete measurement on release ═══
    if (rulerModeRef.current && s.rulerState?.isDragging && s.rulerState.originX !== null) {
      const gridPos = getCanvasGridPos(e.clientX, e.clientY);
      if (gridPos) {
        s.rulerState.currentX = gridPos.gridX;
        s.rulerState.currentY = gridPos.gridY;
        const measurement = completeMeasurement(s.rulerState);
        s.rulerState.measurements = [...s.rulerState.measurements, measurement];
      }
      s.rulerState.isDragging = false;
      s.rulerState.originX = null;
      s.rulerState.originY = null;
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    const dragConsumed = handleTokenDragUp(
      canvasX, canvasY,
      s.panX, s.panY, s.zoom
    );

    isCanvasDraggingRef.current = false;

    if (dragConsumed) return;
  }, [handleTokenDragUp, viewOnly, getCanvasGridPos]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const n = Math.max(0.25, Math.min(4, stateRef.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    stateRef.current.zoom = n;
    setZoom(n);
  }, []);

  // ── Ping/Ruler handlers ──
  const handleTogglePing = useCallback(() => {
    setPingMode((prev) => {
      const next = !prev;
      pingModeRef.current = next;
      if (next) {
        rulerModeRef.current = false;
        setRulerMode(false);
        stateRef.current.rulerState!.rulerMode = false;
      }
      return next;
    });
  }, []);

  const handleToggleRuler = useCallback(() => {
    setRulerMode((prev) => {
      const next = !prev;
      rulerModeRef.current = next;
      stateRef.current.rulerState!.rulerMode = next;
      if (next) {
        pingModeRef.current = false;
        setPingMode(false);
      } else {
        stateRef.current.rulerState!.originX = null;
        stateRef.current.rulerState!.originY = null;
        stateRef.current.rulerState!.isDragging = false;
      }
      return next;
    });
  }, []);

  const handleClearMeasurements = useCallback(() => {
    stateRef.current.rulerState!.measurements = [];
    stateRef.current.rulerState!.originX = null;
    stateRef.current.rulerState!.originY = null;
  }, []);

  // ── Keyboard shortcut actions (Cycle 25) ──
  const shortcutActions: KeyboardShortcutActions = {
    onToggleGrid: () => {
      const n = !showGrid;
      setShowGrid(n);
      stateRef.current.showGrid = n;
    },
    onToggleFog: () => {
      const n = !showFog;
      setShowFog(n);
      stateRef.current.showFog = n;
    },
    onToggleDmView: () => {
      const n = !isDmView;
      setIsDmView(n);
      stateRef.current.dmView = n;
      stateRef.current.showFog = !n;
      setShowFog(!n);
    },
    onNextTurn: () => onNextTurn?.(),
    onPrevTurn: () => onPrevTurn?.(),
    onRecenter: () => {
      stateRef.current.panX = 0;
      stateRef.current.panY = 0;
      stateRef.current.zoom = 1;
      setPanState({ x: 0, y: 0 });
      setZoom(1);
    },
    onZoomIn: () => {
      const n = Math.min(4, zoom * 1.25);
      stateRef.current.zoom = n;
      setZoom(n);
    },
    onZoomOut: () => {
      const n = Math.max(0.25, zoom * 0.8);
      stateRef.current.zoom = n;
      setZoom(n);
    },
    onTogglePing: handleTogglePing,
    onToggleRuler: handleToggleRuler,
    onClearMeasurements: handleClearMeasurements,
    onEscape: () => {
      // Cancel ping mode
      if (pingModeRef.current) {
        pingModeRef.current = false;
        setPingMode(false);
      }
      // Cancel ruler mode + clear pending measurement
      if (rulerModeRef.current) {
        rulerModeRef.current = false;
        setRulerMode(false);
        stateRef.current.rulerState!.rulerMode = false;
        stateRef.current.rulerState!.originX = null;
        stateRef.current.rulerState!.originY = null;
        stateRef.current.rulerState!.isDragging = false;
      }
      // Close shortcut hints if open
      setShowShortcutHints(false);
    },
    onToggleInitiative: () => setShowInitiativeOverlay((prev) => !prev),
  };

  const { getShortcutList } = useKeyboardShortcuts(shortcutActions, !viewOnly);

  // Keyboard "?" handler for showing shortcut hints
  useEffect(() => {
    if (viewOnly) return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "?" && !e.shiftKey) return; // "?" is actually shift+/
      if (e.key === "/" && e.shiftKey) {
        e.preventDefault();
        setShowShortcutHints(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewOnly]);

  // ── Imperative handle ──
  useImperativeHandle(ref, () => ({
    recenter: () => {
      stateRef.current.panX = 0; stateRef.current.panY = 0;
      stateRef.current.zoom = 1;
      setPanState({ x: 0, y: 0 });
      setZoom(1);
    },
    addLight: (l: LightSource) => { stateRef.current.lights = [...stateRef.current.lights, l]; },
    removeLight: (id: string) => { stateRef.current.lights = stateRef.current.lights.filter(x => x.id !== id); },
    toggleFog: () => {
      const n = !showFog;
      setShowFog(n);
      stateRef.current.showFog = n;
    },
    toggleDmView: () => {
      const n = !isDmView;
      setIsDmView(n);
      stateRef.current.dmView = n;
      stateRef.current.showFog = !n;
      setShowFog(!n);
    },
    zoomIn: () => {
      const n = Math.min(4, zoom * 1.25);
      stateRef.current.zoom = n;
      setZoom(n);
    },
    zoomOut: () => {
      const n = Math.max(0.25, zoom * 0.8);
      stateRef.current.zoom = n;
      setZoom(n);
    },
  }), [zoom, showFog, isDmView]);

  const hasMeasurements = (stateRef.current.rulerState?.measurements.length ?? 0) > 0;

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-obsidian" style={{ minHeight: "400px" }}>
      {/* ── Canvas layer ── */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 ${
          pingMode ? 'cursor-crosshair' :
          rulerMode ? 'cursor-cell' :
          isCanvasDraggingRef.current ? 'cursor-grabbing' :
          viewOnly ? 'cursor-default' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(e) => {
          if (rulerMode && stateRef.current.rulerState?.isDragging) {
            const gridPos = getCanvasGridPos(e.clientX, e.clientY);
            if (gridPos && stateRef.current.rulerState.originX !== null) {
              stateRef.current.rulerState.currentX = gridPos.gridX;
              stateRef.current.rulerState.currentY = gridPos.gridY;
              const measurement = completeMeasurement(stateRef.current.rulerState);
              stateRef.current.rulerState.measurements = [...stateRef.current.rulerState.measurements, measurement];
            }
            stateRef.current.rulerState.isDragging = false;
            stateRef.current.rulerState.originX = null;
            stateRef.current.rulerState.originY = null;
          }
          handleMouseUp(e);
        }}
        onWheel={handleWheel}
      />

      {/* ── Zoom controls (bottom-right) ── */}
      {!viewOnly && (
        <ZoomControls zoom={zoom}
          onZoomIn={() => {
            const n = Math.min(4, zoom * 1.25);
            stateRef.current.zoom = n;
            setZoom(n);
          }}
          onZoomOut={() => {
            const n = Math.max(0.25, zoom * 0.8);
            stateRef.current.zoom = n;
            setZoom(n);
          }}
        />
      )}

      {/* ── Premium zoom indicator (bottom-center) ── */}
      <CanvasZoomIndicator
        zoom={zoom}
        panX={panState.x}
        panY={panState.y}
      />

      {/* ── Map view controls (top-right) ── */}
      {!viewOnly && (
        <MapViewControls
          showFog={showFog} isDmView={isDmView} showGrid={showGrid}
          onToggleFog={() => {
            const n = !showFog;
            setShowFog(n);
            stateRef.current.showFog = n;
          }}
          onToggleDmView={() => {
            const n = !isDmView;
            setIsDmView(n);
            stateRef.current.dmView = n;
            stateRef.current.showFog = !n;
            setShowFog(!n);
          }}
          onToggleGrid={() => {
            const n = !showGrid;
            setShowGrid(n);
            stateRef.current.showGrid = n;
          }}
        />
      )}

      {/* ── Ping & Ruler tools (bottom-center) ── */}
      {!viewOnly && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20">
          <MapPingRulerTools
            pingMode={pingMode}
            rulerMode={rulerMode}
            hasMeasurements={hasMeasurements}
            onTogglePing={handleTogglePing}
            onToggleRuler={handleToggleRuler}
            onClearMeasurements={handleClearMeasurements}
          />
        </div>
      )}

      {/* ── Initiative overlay (top-right) ── */}
      {!viewOnly && isDmView && showInitiativeOverlay && (
        <InitiativeOverlay
          visible={true}
          onNextTurn={() => onNextTurn?.()}
          onPrevTurn={() => onPrevTurn?.()}
          activeCombatantId={activeTurnTokenId}
        />
      )}

      {/* ── Keyboard shortcut hints (modal overlay) ── */}
      {showShortcutHints && (
        <KeyboardShortcutHints
          visible={showShortcutHints}
          onDismiss={() => setShowShortcutHints(false)}
        />
      )}
    </div>
  );
});

CanvasMapView.displayName = "CanvasMapView";
export default CanvasMapView;
