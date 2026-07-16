/* ── Drawing Tool Overlay ──────────────────────────────────────
 * Freehand drawing tool for the battle map. Supports pen,
 * highlighter, and eraser tools with configurable color and width.
 * Drawings are stored as MapDrawingStroke[] in the BattleMap data.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useRef, useCallback, useEffect } from "react";
import type { MapDrawingStroke } from "@/types";

interface DrawingToolOverlayProps {
  drawings: MapDrawingStroke[];
  onDrawingsChange: (drawings: MapDrawingStroke[]) => void;
  enabled: boolean;
  gridWidth: number;
  gridHeight: number;
}

type DrawingTool = "pen" | "highlighter" | "eraser";

const TOOL_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff",
];

export function DrawingToolOverlay({ drawings, onDrawingsChange, enabled, gridWidth, gridHeight }: DrawingToolOverlayProps) {
  const [activeTool, setActiveTool] = useState<DrawingTool>("pen");
  const [activeColor, setActiveColor] = useState("#ef4444");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPalette, setShowPalette] = useState(true);

  const currentStroke = useRef<{ x: number; y: number }[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    // Convert to grid coordinates
    const x = ((clientX - rect.left) / rect.width) * gridWidth;
    const y = ((clientY - rect.top) / rect.height) * gridHeight;
    return { x, y };
  }, [gridWidth, gridHeight]);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!enabled) return;
    e.preventDefault();
    const point = getPoint(e);
    if (!point) return;

    if (activeTool === "eraser") {
      // Erase: find and remove strokes near the click point
      const threshold = 0.5;
      const remaining = drawings.filter((stroke) => {
        const close = stroke.points.some(
          (p) => Math.abs(p.x - point.x) < threshold && Math.abs(p.y - point.y) < threshold
        );
        return !close;
      });
      onDrawingsChange(remaining);
      return;
    }

    setIsDrawing(true);
    currentStroke.current = [point];
  }, [enabled, activeTool, drawings, getPoint, onDrawingsChange]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !enabled) return;
    e.preventDefault();
    const point = getPoint(e);
    if (!point) return;
    currentStroke.current.push(point);

    // Render live (optimistic) — we just need to trigger render
    const latest: MapDrawingStroke[] = [
      ...drawings.filter((s) => s.id !== "live"),
      {
        id: "live",
        points: currentStroke.current,
        color: activeTool === "highlighter" ? activeColor + "66" : activeColor,
        width: activeTool === "highlighter" ? strokeWidth * 3 : strokeWidth,
        opacity: activeTool === "highlighter" ? 0.4 : 1,
        tool: activeTool,
      },
    ];
    onDrawingsChange(latest);
  }, [isDrawing, enabled, drawings, getPoint, activeTool, activeColor, strokeWidth, onDrawingsChange]);

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !enabled) return;
    setIsDrawing(false);

    if (currentStroke.current.length < 2) {
      currentStroke.current = [];
      return;
    }

    const newStroke: MapDrawingStroke = {
      id: `draw_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      points: currentStroke.current,
      color: activeTool === "highlighter" ? activeColor + "66" : activeColor,
      width: activeTool === "highlighter" ? strokeWidth * 3 : strokeWidth,
      opacity: activeTool === "highlighter" ? 0.4 : 1,
      tool: activeTool,
    };

    // Remove the "live" stroke and add the final one
    const final = [
      ...drawings.filter((s) => s.id !== "live"),
      newStroke,
    ];
    onDrawingsChange(final);
    currentStroke.current = [];
  }, [isDrawing, enabled, drawings, activeTool, activeColor, strokeWidth, onDrawingsChange]);

  const clearAll = useCallback(() => {
    onDrawingsChange([]);
  }, [onDrawingsChange]);

  const undoLast = useCallback(() => {
    const nonLive = drawings.filter((s) => s.id !== "live");
    onDrawingsChange(nonLive.slice(0, -1));
  }, [drawings, onDrawingsChange]);

  // Touch event handlers
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) e.preventDefault();
    };
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.removeEventListener("touchmove", preventScroll);
  }, [isDrawing]);

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 z-15 pointer-events-none">
      {/* Drawing Canvas */}
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full pointer-events-auto cursor-crosshair"
        viewBox={`0 0 ${gridWidth} ${gridHeight}`}
        preserveAspectRatio="none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {drawings.map((stroke) => (
          <polyline
            key={stroke.id}
            points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.width / Math.max(gridWidth, gridHeight) * 100}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={stroke.opacity}
            style={{ pointerEvents: "none" }}
          />
        ))}
      </svg>

      {/* Drawing Toolbar */}
      {showPalette && (
        <div
          className="absolute top-2 left-2 pointer-events-auto flex items-center gap-1 rounded-xl border border-surface-700 bg-surface-850/90 p-1.5 shadow-lg backdrop-blur-md"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Tool selection */}
          <div className="flex gap-0.5 border-r border-surface-700 pr-1.5">
            {(["pen", "highlighter", "eraser"] as const).map((tool) => (
              <button
                key={tool}
                onClick={() => setActiveTool(tool)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-all ${
                  activeTool === tool
                    ? "bg-accent-600 text-white"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                }`}
                title={tool === "pen" ? "Pen" : tool === "highlighter" ? "Highlighter" : "Eraser"}
              >
                {tool === "pen" ? "✏️" : tool === "highlighter" ? "🖍️" : "🧹"}
              </button>
            ))}
          </div>

          {/* Color selection */}
          {activeTool !== "eraser" && (
            <div className="flex gap-0.5 border-r border-surface-700 pr-1.5">
              {TOOL_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setActiveColor(color)}
                  className={`h-5 w-5 rounded-full transition-all ${
                    activeColor === color ? "ring-2 ring-white ring-offset-1 ring-offset-surface-850 scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* Stroke width */}
          {activeTool !== "eraser" && (
            <div className="flex items-center gap-1 border-r border-surface-700 pr-1.5">
              {[1, 2, 4, 6].map((w) => (
                <button
                  key={w}
                  onClick={() => setStrokeWidth(w)}
                  className={`rounded px-1.5 py-1 text-[10px] font-medium transition-all ${
                    strokeWidth === w
                      ? "bg-accent-600 text-white"
                      : "text-surface-400 hover:bg-surface-800"
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-0.5">
            <button
              onClick={undoLast}
              className="rounded-md px-1.5 py-1 text-[10px] text-surface-400 hover:bg-surface-800 hover:text-surface-200 transition-all"
              title="Undo last stroke"
              disabled={drawings.filter(s => s.id !== "live").length === 0}
            >
              ↩
            </button>
            <button
              onClick={clearAll}
              className="rounded-md px-1.5 py-1 text-[10px] text-warrior-400 hover:bg-warrior-500/10 transition-all"
              title="Clear all drawings"
              disabled={drawings.length === 0}
            >
              🗑️
            </button>
            <button
              onClick={() => setShowPalette(false)}
              className="rounded-md px-1.5 py-1 text-[10px] text-surface-500 hover:text-surface-300 transition-all"
              title="Hide toolbar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Show palette button (when hidden) */}
      {!showPalette && (
        <button
          onClick={() => setShowPalette(true)}
          className="absolute top-2 left-2 pointer-events-auto rounded-lg border border-surface-700 bg-surface-850/90 p-2 shadow-lg backdrop-blur-md text-surface-400 hover:text-surface-200 transition-all"
          title="Show drawing tools"
        >
          🎨
        </button>
      )}
    </div>
  );
}
