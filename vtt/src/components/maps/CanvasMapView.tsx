import { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import type { LightSource, WallSegment, MapToken, BattleMap } from "@/types";
import { renderCanvas, type CanvasRenderState } from "@/lib/canvas/lighting-renderer";
import { setupCanvas } from "@/lib/canvas/token-renderer";
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
  onTokenClick?: (token: MapToken) => void;
  onCellClick?: (gridX: number, gridY: number) => void;
}

const CanvasMapView = forwardRef<CanvasMapHandle, CanvasMapViewProps>(({
  mapData, tokens, lights = [], walls = [], dmView = true,
  onTokenClick, onCellClick,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CanvasRenderState>({
    image: null, gridWidth: mapData.gridWidth, gridHeight: mapData.gridHeight, gridSize: mapData.gridSize,
    gridColor: mapData.gridColor || "#808080", gridOpacity: mapData.gridOpacity ?? 0.4,
    lights: [], walls, tokens, fogVisible: new Set(), fogExplored: new Set(),
    zoom: 1, panX: 0, panY: 0, showGrid: true, showFog: !dmView, dmView,
  });
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(!dmView);
  const [isDmView, setIsDmView] = useState(dmView);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mapData.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mapData.imageUrl;
    img.onload = () => { stateRef.current.image = img; renderFrame(); };
  }, [mapData.imageUrl]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    Object.assign(stateRef.current, { gridWidth: mapData.gridWidth, gridHeight: mapData.gridHeight, gridSize: mapData.gridSize, gridColor: mapData.gridColor || "#808080", gridOpacity: mapData.gridOpacity ?? 0.4, tokens, showGrid, showFog, dmView: isDmView });
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderCanvas(ctx, canvas, stateRef.current);
  }, [mapData, tokens, showGrid, showFog, isDmView]);

  useEffect(() => { renderFrame(); }, [renderFrame]);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    setupCanvas(canvasRef.current, containerRef.current);
    renderFrame();
    const h = () => renderFrame();
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [renderFrame]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - stateRef.current.panX, y: e.clientY - stateRef.current.panY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    stateRef.current.panX = e.clientX - dragStart.current.x;
    stateRef.current.panY = e.clientY - dragStart.current.y;
    renderFrame();
  }, [isDragging, renderFrame]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const n = Math.max(0.25, Math.min(4, stateRef.current.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    stateRef.current.zoom = n;
    setZoom(n);
    renderFrame();
  }, [renderFrame]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - stateRef.current.panX) / stateRef.current.zoom;
    const y = (e.clientY - rect.top - stateRef.current.panY) / stateRef.current.zoom;
    const gx = Math.floor(x / mapData.gridSize);
    const gy = Math.floor(y / mapData.gridSize);
    const t = tokens.find(tk => tk.x === gx && tk.y === gy);
    if (t && onTokenClick) onTokenClick(t);
    else if (onCellClick) onCellClick(gx, gy);
  }, [isDragging, tokens, mapData.gridSize, onTokenClick, onCellClick]);

  const updateAndRender = useCallback((fn: () => void) => { fn(); renderFrame(); }, [renderFrame]);

  useImperativeHandle(ref, () => ({
    recenter: () => { stateRef.current.panX = 0; stateRef.current.panY = 0; stateRef.current.zoom = 1; setZoom(1); renderFrame(); },
    addLight: (l: LightSource) => { stateRef.current.lights = [...stateRef.current.lights, l]; renderFrame(); },
    removeLight: (id: string) => { stateRef.current.lights = stateRef.current.lights.filter(x => x.id !== id); renderFrame(); },
    toggleFog: () => updateAndRender(() => { const n = !showFog; setShowFog(n); stateRef.current.showFog = n; }),
    toggleDmView: () => updateAndRender(() => { const n = !isDmView; setIsDmView(n); stateRef.current.dmView = n; stateRef.current.showFog = !n; setShowFog(!n); }),
    zoomIn: () => updateAndRender(() => { const n = Math.min(4, zoom * 1.25); stateRef.current.zoom = n; setZoom(n); }),
    zoomOut: () => updateAndRender(() => { const n = Math.max(0.25, zoom * 0.8); stateRef.current.zoom = n; setZoom(n); }),
  }), [renderFrame, updateAndRender, zoom, showFog, isDmView]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-obsidian" style={{ minHeight: "400px" }}>
      <canvas ref={canvasRef} className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} onWheel={handleWheel} onClick={handleClick} />
      <ZoomControls zoom={zoom}
        onZoomIn={() => updateAndRender(() => { const n = Math.min(4, zoom * 1.25); stateRef.current.zoom = n; setZoom(n); })}
        onZoomOut={() => updateAndRender(() => { const n = Math.max(0.25, zoom * 0.8); stateRef.current.zoom = n; setZoom(n); })}
      />
      <MapViewControls showFog={showFog} isDmView={isDmView} showGrid={showGrid}
        onToggleFog={() => updateAndRender(() => { const n = !showFog; setShowFog(n); stateRef.current.showFog = n; })}
        onToggleDmView={() => updateAndRender(() => { const n = !isDmView; setIsDmView(n); stateRef.current.dmView = n; stateRef.current.showFog = !n; setShowFog(!n); })}
        onToggleGrid={() => updateAndRender(() => { const n = !showGrid; setShowGrid(n); stateRef.current.showGrid = n; })}
      />
    </div>
  );
});

CanvasMapView.displayName = "CanvasMapView";
export default CanvasMapView;
