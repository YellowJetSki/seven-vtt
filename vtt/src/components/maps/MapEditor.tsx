/* ── MapEditor ─────────────────────────────────────────────────
 * Core battle map grid tool with token placement, movement,
 * fog of war, HP tracking, and theatric view integration.
 *
 * Supports token images from /public/images/tokens/ displayed
 * as round avatars on the grid and in the inspector panel.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useRef, useCallback, useMemo } from "react";
import type { BattleMap, MapToken, MapDrawingStroke } from "@/types";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { FogOfWarLayer, FogOfWarControls } from "@/components/maps/FogOfWarLayer";
import { MovementRangeOverlay } from "@/components/maps/MovementRangeOverlay";
import { StatusMarkerOverlay } from "@/components/maps/StatusMarkerOverlay";
import { DrawingToolOverlay } from "@/components/maps/DrawingToolOverlay";

interface MapEditorProps {
  map: BattleMap;
  onUpdate: (updates: Partial<BattleMap>) => void;
  /** Callback to open the theatric tab for a specific token */
  onOpenTheatric?: (token: MapToken) => void;
}

export function MapEditor({ map, onUpdate, onOpenTheatric }: MapEditorProps) {
  const showToast = useUiStore((s) => s.showToast);
  const openModal = useUiStore((s) => s.openModal);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [showFogControls, setShowFogControls] = useState(false);
  const [showFog, setShowFog] = useState(true);
  const [gmView, setGmView] = useState(true);
  const [showMovement, setShowMovement] = useState(false);
  const [dashMode, setDashMode] = useState(false);
  const [pendingDashMove, setPendingDashMove] = useState<{ tokenId: string; x: number; y: number } | null>(null);

  // Drawing tool state
  const [drawingEnabled, setDrawingEnabled] = useState(false);

  // Grid opacity for theatric mode (on the map)
  const [gridOpacity, setGridOpacity] = useState(0.08);
  const [showGrid, setShowGrid] = useState(true);

  const selectedToken = useMemo(
    () => map.tokens.find((t) => t.id === selectedTokenId) ?? null,
    [map.tokens, selectedTokenId],
  );

  /* ── Derived dimensions ──────────────────────────────────── */
  const cellWidth = 100 / map.gridWidth;   // % per cell horizontally
  const cellHeight = 100 / map.gridHeight; // % per cell vertically

  const handleTokenClick = useCallback((tokenId: string) => {
    setSelectedTokenId((prev) => (prev === tokenId ? null : tokenId));
    setShowMovement(false);
    setDashMode(false);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedTokenId(null);
    setShowMovement(false);
    setDashMode(false);
  }, []);

  const handleRemoveToken = useCallback((tokenId: string) => {
    onUpdate({ tokens: map.tokens.filter((t) => t.id !== tokenId) });
    showToast({ message: "Token removed.", type: "info" });
  }, [map.tokens, onUpdate, showToast]);

  const handleToggleVisibility = useCallback((tokenId: string) => {
    onUpdate({ tokens: map.tokens.map((t) => t.id === tokenId ? { ...t, visible: !t.visible } : t) });
  }, [map.tokens, onUpdate]);

  const handleMoveToken = useCallback((tokenId: string, deltaX: number, deltaY: number) => {
    onUpdate({
      tokens: map.tokens.map((t) =>
        t.id === tokenId
          ? { ...t, x: Math.max(0, Math.min(map.gridWidth - 1, t.x + deltaX)), y: Math.max(0, Math.min(map.gridHeight - 1, t.y + deltaY)) }
          : t
      ),
    });
  }, [map.tokens, map.gridWidth, map.gridHeight, onUpdate]);

  const handleDragToCell = useCallback((tokenId: string, targetX: number, targetY: number) => {
    const token = map.tokens.find((t) => t.id === tokenId);
    if (!token) return;

    const dist = Math.abs(targetX - token.x) + Math.abs(targetY - token.y);
    const tokenSpeed = token.speed ?? 30;
    const normalRange = Math.floor(tokenSpeed / 5);

    if (dist > normalRange && !dashMode) {
      setPendingDashMove({ tokenId, x: targetX, y: targetY });
      return;
    }

    performMove(tokenId, targetX, targetY);
  }, [map.tokens, map.gridWidth, map.gridHeight, dashMode, onUpdate]);

  const performMove = useCallback((tokenId: string, targetX: number, targetY: number) => {
    onUpdate({
      tokens: map.tokens.map((t) =>
        t.id === tokenId
          ? { ...t, x: targetX, y: targetY }
          : t
      ),
    });
    setShowMovement(false);
    setDashMode(false);
  }, [map.tokens, onUpdate]);

  const selectedTokenSpeed = selectedToken?.speed ?? 30;
  const normalRange = Math.floor(selectedTokenSpeed / 5);
  const dashRange = Math.floor((selectedTokenSpeed * 2) / 5);

  return (
    <div className="space-y-3">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setGmView(!gmView)}
            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${gmView ? "bg-accent-600 text-white" : "bg-surface-800 text-surface-400"}`}
            title={gmView ? "DM View (no fog)" : "Player View (with fog)"}>
            {gmView ? "DM" : "Player"}
          </button>
          <button onClick={() => setShowFog(!showFog)}
            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${showFog ? "bg-surface-800 text-surface-300" : "bg-surface-800 text-surface-500 opacity-50"}`}>
            {showFog ? "Fog On" : "Fog Off"}
          </button>
          <Button size="xs" variant="ghost" onClick={() => setShowFogControls((o) => !o)}>
            {showFogControls ? "Hide Zones" : "Reveal Zones"}
          </Button>
          <Button size="xs" onClick={() => openModal("add-token")}>+ Token</Button>
          {/* Drawing tool toggle */}
          <Button size="xs" variant={drawingEnabled ? "default" : "ghost"} onClick={() => setDrawingEnabled(!drawingEnabled)}>
            🎨 Draw
          </Button>
          {/* Grid visibility */}
          <button onClick={() => setShowGrid(!showGrid)}
            className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${showGrid ? "bg-surface-800 text-surface-300" : "bg-surface-800 text-surface-500 opacity-50"}`}>
            {showGrid ? "Grid" : "No Grid"}
          </button>
          {onOpenTheatric && selectedToken && (
            <Button size="xs" variant="ghost" onClick={() => onOpenTheatric(selectedToken)}>
              🎭 Theatric
            </Button>
          )}
        </div>
      </div>

      {/* ── Map Canvas (with drag-and-drop dropzone) ──────────── */}
      <div ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-surface-700 bg-surface-900"
        style={{ aspectRatio: `${map.gridWidth}/${map.gridHeight}` }}
        onClick={handleCanvasClick}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
        onDrop={(e) => {
          e.preventDefault();
          const tokenId = e.dataTransfer.getData("text/plain");
          if (!tokenId) return;

          // Calculate grid position from mouse coordinates
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;

          const xRatio = (e.clientX - rect.left) / rect.width;
          const yRatio = (e.clientY - rect.top) / rect.height;
          const targetX = Math.floor(xRatio * map.gridWidth);
          const targetY = Math.floor(yRatio * map.gridHeight);

          // Clamp to grid bounds
          const clampedX = Math.max(0, Math.min(map.gridWidth - 1, targetX));
          const clampedY = Math.max(0, Math.min(map.gridHeight - 1, targetY));

          // Move the token
          onUpdate({
            tokens: map.tokens.map((t) =>
              t.id === tokenId
                ? { ...t, x: clampedX, y: clampedY }
                : t
            ),
          });
        }}>

        {/* Map image */}
        {map.imageUrl && (
          <img src={map.imageUrl} alt={map.name}
            className={`absolute inset-0 h-full w-full ${map.imageFit === "contain" ? "object-contain" : map.imageFit === "stretch" ? "object-fill" : "object-cover"}`} />
        )}

        {/* Grid lines — conditional + variable opacity for theatric view */}
        {showGrid && (
          <svg className="absolute inset-0 h-full w-full pointer-events-none z-0"
            viewBox={`0 0 ${map.gridWidth} ${map.gridHeight}`}
            preserveAspectRatio="none">
            {Array.from({ length: map.gridHeight + 1 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i} x2={map.gridWidth} y2={i}
                stroke={`rgba(255,255,255,${gridOpacity})`} strokeWidth="0.02" />
            ))}
            {Array.from({ length: map.gridWidth + 1 }, (_, i) => (
              <line key={`v${i}`} x1={i} y1="0" x2={i} y2={map.gridHeight}
                stroke={`rgba(255,255,255,${gridOpacity})`} strokeWidth="0.02" />
            ))}
          </svg>
        )}

        {/* Fog of War */}
        {showFog && (
          <FogOfWarLayer
            map={map}
            isGmView={gmView}
            cellWidth={cellWidth}
            cellHeight={cellHeight}
          />
        )}

        {/* Movement Range Overlay */}
        {selectedToken && showMovement && (
          <MovementRangeOverlay
            token={selectedToken}
            gridWidth={map.gridWidth}
            gridHeight={map.gridHeight}
            movementSpeed={selectedTokenSpeed}
            dashMultiplier={dashMode ? 2 : 1}
            cellSize={5}
          />
        )}

        {/* Drawing Tool Overlay (freehand annotations) */}
        <DrawingToolOverlay
          drawings={map.drawings ?? []}
          onDrawingsChange={(drawings: MapDrawingStroke[]) => onUpdate({ drawings })}
          enabled={drawingEnabled}
          gridWidth={map.gridWidth}
          gridHeight={map.gridHeight}
        />

        {/* Movement click targets */}
        {selectedToken && showMovement && (() => {
          const cells: { x: number; y: number; dist: number }[] = [];
          const totalCells = Math.floor((selectedTokenSpeed * (dashMode ? 2 : 1)) / 5);
          for (let dx = -totalCells; dx <= totalCells; dx++) {
            for (let dy = -totalCells; dy <= totalCells; dy++) {
              const dist = Math.abs(dx) + Math.abs(dy);
              if (dist === 0 || dist > totalCells) continue;
              const x = selectedToken.x + dx;
              const y = selectedToken.y + dy;
              if (x < 0 || x >= map.gridWidth || y < 0 || y >= map.gridHeight) continue;
              cells.push({ x, y, dist });
            }
          }
          return cells.map((c) => (
            <div
              key={`click-${c.x}-${c.y}`}
              onClick={(e) => { e.stopPropagation(); handleDragToCell(selectedToken.id, c.x, c.y); }}
              className="absolute cursor-pointer z-20 hover:bg-white/10 transition-colors"
              style={{
                left: `${(c.x / map.gridWidth) * 100}%`,
                top: `${(c.y / map.gridHeight) * 100}%`,
                width: `${cellWidth}%`,
                height: `${cellHeight}%`,
              }}
              title={`Move ${selectedToken.label} to (${c.x}, ${c.y})${c.dist > normalRange ? ' — Dash action required' : ''}`}
            />
          ));
        })()}

        {/* Tokens — with image support, status markers, and drag-and-drop */}
        {map.tokens.map((token) => (
          <div key={token.id}
            onClick={(e) => { e.stopPropagation(); handleTokenClick(token.id); }}
            draggable={gmView}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", token.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            className={`absolute flex items-center justify-center rounded-full cursor-grab active:cursor-grabbing transition-all hover:scale-110 overflow-visible select-none ${
              selectedTokenId === token.id ? "ring-2 ring-accent-400 ring-offset-2 ring-offset-surface-900 z-10" : "z-0"
            } ${!token.visible ? "opacity-50" : ""} ${!gmView && !token.visible ? "hidden" : ""}`}
            style={{
              left: `${(token.x / map.gridWidth) * 100}%`,
              top: `${(token.y / map.gridHeight) * 100}%`,
              width: `${((token.size * 0.8) / map.gridWidth) * 100}%`,
              height: `${((token.size * 0.8) / map.gridHeight) * 100}%`,
              backgroundColor: token.imageUrl ? 'transparent' : token.color,
              minWidth: "16px",
              minHeight: "16px",
            }}
            title={`${token.label} (${token.x},${token.y})${token.speed ? ` - speed: ${token.speed}ft` : ''}`}>
            {token.imageUrl ? (
              <img src={token.imageUrl} alt={token.label}
                className="h-full w-full rounded-full object-cover"
                draggable={false}
                style={{ backgroundColor: token.color }} />
            ) : token.icon ? (
              <span className="text-xs">{token.icon}</span>
            ) : (
              <span className="text-[8px] font-bold text-white uppercase">{token.label.charAt(0)}</span>
            )}

            {/* Status Condition Markers */}
            <StatusMarkerOverlay
              token={token}
              isSelected={selectedTokenId === token.id}
              onUpdateToken={(updates) => {
                onUpdate({
                  tokens: map.tokens.map((t) =>
                    t.id === token.id ? { ...t, ...updates } : t
                  ),
                });
              }}
            />
          </div>
        ))}
      </div>

      {/* ── Fog Controls Panel ────────────────────────────────── */}
      {showFogControls && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 animate-slide-up">
          <FogOfWarControls
            map={map}
            onUpdate={onUpdate}
            isGmView={gmView}
          />
        </div>
      )}

      {/* ── Token Inspector Panel ─────────────────────────────── */}
      {selectedToken && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 animate-slide-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden shrink-0"
                style={{ backgroundColor: selectedToken.imageUrl ? 'transparent' : selectedToken.color }}>
                {selectedToken.imageUrl ? (
                  <img src={selectedToken.imageUrl} alt={selectedToken.label}
                    className="h-full w-full rounded-full object-cover"
                    style={{ backgroundColor: selectedToken.color }} />
                ) : (
                  <span className="text-sm font-bold text-white">{selectedToken.label.charAt(0)}</span>
                )}
                {/* Status markers in inspector */}
                {(selectedToken.statusMarkers ?? []).length > 0 && (
                  <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5">
                    {(selectedToken.statusMarkers ?? []).slice(0, 3).map((m) => {
                      const icons: Record<string, string> = { blinded: "👁️‍🗨️", charmed: "💖", deafened: "🔇", exhaustion: "😰", frightened: "😱", grappled: "🤝", incapacitated: "💫", invisible: "👻", paralyzed: "🧊", petrified: "🗿", poisoned: "☠️", prone: "🙇", restrained: "⛓️", stunned: "✨", unconscious: "💤", concentration: "🧠" };
                      return <span key={m.id} className="text-[8px]" title={m.type}>{icons[m.type] || "❓"}</span>;
                    })}
                    {(selectedToken.statusMarkers ?? []).length > 3 && <span className="text-[7px] text-surface-400">+{(selectedToken.statusMarkers ?? []).length - 3}</span>}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-surface-100">{selectedToken.label}</h4>
                <p className="text-xs text-surface-400">
                  {selectedToken.type.charAt(0).toUpperCase() + selectedToken.type.slice(1)} · ({selectedToken.x},{selectedToken.y})
                  {selectedToken.hp && ` · HP ${selectedToken.hp.current}/${selectedToken.hp.max}`}
                  {selectedToken.speed && ` · ${selectedToken.speed}ft`}
                  {selectedToken.initiative !== undefined && ` · Init ${selectedToken.initiative}`}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {onOpenTheatric && (
                <button onClick={() => onOpenTheatric(selectedToken)}
                  className="rounded-md px-2 py-1 text-xs text-accent-400 hover:bg-accent-500/10 transition-colors"
                  title="Open Theatric View in new tab">🎭</button>
              )}
              <button onClick={() => handleToggleVisibility(selectedToken.id)}
                className="rounded-md px-2 py-1 text-xs text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors"
                title={selectedToken.visible ? "Hide from players" : "Show to players"}>
                {selectedToken.visible ? "visible" : "hidden"}
              </button>
              <button onClick={() => handleRemoveToken(selectedToken.id)}
                className="rounded-md px-2 py-1 text-xs text-warrior-400 hover:bg-warrior-500/10 transition-colors"
                title="Remove token">x</button>
            </div>
          </div>

          {/* Movement Controls */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-surface-400">Movement ({selectedTokenSpeed}ft)</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setShowMovement(!showMovement); setDashMode(false); }}
                  className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${showMovement && !dashMode ? "bg-rogue-500/20 text-rogue-400" : "bg-surface-800 text-surface-400 hover:text-surface-200"}`}
                >
                  Move ({normalRange} cells)
                </button>
                <button
                  onClick={() => { setShowMovement(!showMovement); setDashMode(true); }}
                  className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${showMovement && dashMode ? "bg-warrior-500/20 text-warrior-400" : "bg-surface-800 text-surface-400 hover:text-surface-200"}`}
                >
                  Dash ({dashRange} cells)
                </button>
              </div>
            </div>
            {showMovement && (
              <p className="text-[10px] text-surface-500 mb-2">
                {dashMode
                  ? "Double movement (dash) — click a yellow or green cell to move"
                  : "Click a green cell to move within normal range"}
              </p>
            )}
          </div>

          {/* HP Info */}
          {selectedToken.hp && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-surface-400">HP</span>
                <span className="text-surface-300">{selectedToken.hp.current} / {selectedToken.hp.max}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-800 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, (selectedToken.hp.current / selectedToken.hp.max) * 100)}%`,
                    backgroundColor: selectedToken.hp.current > selectedToken.hp.max * 0.5
                      ? "#27ae60"
                      : selectedToken.hp.current > 0
                        ? "#f39c12"
                        : "#e74c3c",
                  }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Pending Dash Confirmation ─────────────────────────── */}
      {pendingDashMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPendingDashMove(null)}>
          <div className="rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Dash Required</h3>
            <p className="text-sm text-surface-400 mb-4">
              This move exceeds the token's normal movement range. Use a Dash action to move there?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setPendingDashMove(null)}>Cancel</Button>
              <Button size="sm"
                onClick={() => {
                  performMove(pendingDashMove.tokenId, pendingDashMove.x, pendingDashMove.y);
                  setPendingDashMove(null);
                }}>
                Use Dash
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
