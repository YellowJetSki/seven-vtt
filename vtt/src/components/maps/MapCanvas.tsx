/* ── MapCanvas ─────────────────────────────────────────────────
 * The core grid canvas showing map image, grid lines, fog of war,
 * movement range, drawings, tokens, and drop target.
 * ─────────────────────────────────────────────────────────────── */

import { useRef, type RefObject } from "react";
import type { BattleMap, MapToken, MapDrawingStroke } from "@/types";
import { FogOfWarLayer } from "@/components/maps/FogOfWarLayer";
import { MovementRangeOverlay } from "@/components/maps/MovementRangeOverlay";
import { StatusMarkerOverlay } from "@/components/maps/StatusMarkerOverlay";
import { DrawingToolOverlay } from "@/components/maps/DrawingToolOverlay";

interface Props {
  map: BattleMap;
  gmView: boolean;
  showFog: boolean;
  showGrid: boolean;
  gridOpacity: number;
  selectedTokenId: string | null;
  showMovement: boolean;
  dashMode: boolean;
  drawingEnabled: boolean;
  onTokenClick: (tokenId: string) => void;
  onCanvasClick: () => void;
  onDragToCell: (tokenId: string, x: number, y: number) => void;
  onMoveToken: (tokenId: string, dx: number, dy: number) => void;
  onUpdateToken: (tokenId: string, updates: Partial<MapToken>) => void;
  onTokensUpdate: (tokens: MapToken[]) => void;
  onDrawingsChange: (drawings: MapDrawingStroke[]) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
}

export function MapCanvas({
  map, gmView, showFog, showGrid, gridOpacity, selectedTokenId,
  showMovement, dashMode, drawingEnabled,
  onTokenClick, onCanvasClick, onDragToCell,
  onUpdateToken, onTokensUpdate, onDrawingsChange,
  containerRef: externalRef,
}: Props) {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = (externalRef ?? internalRef) as RefObject<HTMLDivElement | null>;

  const cellWidth = 100 / map.gridWidth;
  const cellHeight = 100 / map.gridHeight;
  const selectedToken = map.tokens.find((t) => t.id === selectedTokenId) ?? null;
  const tokenSpeed = selectedToken?.speed ?? 30;
  const normalRange = Math.floor(tokenSpeed / 5);

  return (
    <div ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-surface-700 bg-surface-900"
      style={{ aspectRatio: `${map.gridWidth}/${map.gridHeight}` }}
      onClick={onCanvasClick}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={(e) => {
        e.preventDefault();
        const tokenId = e.dataTransfer.getData("text/plain");
        if (!tokenId) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const targetX = Math.max(0, Math.min(map.gridWidth - 1, Math.floor(((e.clientX - rect.left) / rect.width) * map.gridWidth)));
        const targetY = Math.max(0, Math.min(map.gridHeight - 1, Math.floor(((e.clientY - rect.top) / rect.height) * map.gridHeight)));
        onTokensUpdate(map.tokens.map((t) => t.id === tokenId ? { ...t, x: targetX, y: targetY } : t));
      }}>

      {map.imageUrl && (
        <img src={map.imageUrl} alt={map.name}
          className={`absolute inset-0 h-full w-full ${map.imageFit === "contain" ? "object-contain" : map.imageFit === "stretch" ? "object-fill" : "object-cover"}`} />
      )}

      {showGrid && (
        <svg className="absolute inset-0 h-full w-full pointer-events-none z-0"
          viewBox={`0 0 ${map.gridWidth} ${map.gridHeight}`} preserveAspectRatio="none">
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

      {showFog && <FogOfWarLayer map={map} isGmView={gmView} cellWidth={cellWidth} cellHeight={cellHeight} />}

      {selectedToken && showMovement && (
        <MovementRangeOverlay token={selectedToken} gridWidth={map.gridWidth} gridHeight={map.gridHeight}
          movementSpeed={tokenSpeed} dashMultiplier={dashMode ? 2 : 1} cellSize={5} />
      )}

      <DrawingToolOverlay drawings={map.drawings ?? []} onDrawingsChange={onDrawingsChange}
        enabled={drawingEnabled} gridWidth={map.gridWidth} gridHeight={map.gridHeight} />

      {/* Movement click targets */}
      {selectedToken && showMovement && (() => {
        const totalCells = Math.floor((tokenSpeed * (dashMode ? 2 : 1)) / 5);
        const cells: { x: number; y: number }[] = [];
        for (let dx = -totalCells; dx <= totalCells; dx++) {
          for (let dy = -totalCells; dy <= totalCells; dy++) {
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist === 0 || dist > totalCells) continue;
            const x = selectedToken.x + dx;
            const y = selectedToken.y + dy;
            if (x < 0 || x >= map.gridWidth || y < 0 || y >= map.gridHeight) continue;
            cells.push({ x, y });
          }
        }
        return cells.map((c) => (
          <div key={`mc-${c.x}-${c.y}`} onClick={(e) => { e.stopPropagation(); onDragToCell(selectedToken.id, c.x, c.y); }}
            className="absolute cursor-pointer z-20 hover:bg-white/10 transition-colors"
            style={{ left: `${(c.x / map.gridWidth) * 100}%`, top: `${(c.y / map.gridHeight) * 100}%`, width: `${cellWidth}%`, height: `${cellHeight}%` }}
            title={`Move ${selectedToken.label} to (${c.x}, ${c.y})`} />
        ));
      })()}

      {/* Tokens */}
      {map.tokens.map((token) => (
        <div key={token.id} onClick={(e) => { e.stopPropagation(); onTokenClick(token.id); }}
          draggable={gmView}
          onDragStart={(e) => { e.dataTransfer.setData("text/plain", token.id); e.dataTransfer.effectAllowed = "move"; }}
          className={`absolute flex items-center justify-center rounded-full cursor-grab active:cursor-grabbing transition-all hover:scale-110 overflow-visible select-none ${
            selectedTokenId === token.id ? "ring-2 ring-accent-400 ring-offset-2 ring-offset-surface-900 z-10" : "z-0"
          } ${!token.visible ? "opacity-50" : ""} ${!gmView && !token.visible ? "hidden" : ""}`}
          style={{
            left: `${(token.x / map.gridWidth) * 100}%`,
            top: `${(token.y / map.gridHeight) * 100}%`,
            width: `${((token.size * 0.8) / map.gridWidth) * 100}%`,
            height: `${((token.size * 0.8) / map.gridHeight) * 100}%`,
            backgroundColor: token.imageUrl ? 'transparent' : token.color,
            minWidth: "16px", minHeight: "16px",
          }}
          title={`${token.label} (${token.x},${token.y})${token.speed ? ` - speed: ${token.speed}ft` : ''}`}>
          {token.imageUrl ? (
            <img src={token.imageUrl} alt={token.label} className="h-full w-full rounded-full object-cover" draggable={false} style={{ backgroundColor: token.color }} />
          ) : token.icon ? (
            <span className="text-xs">{token.icon}</span>
          ) : (
            <span className="text-[8px] font-bold text-white uppercase">{token.label.charAt(0)}</span>
          )}
          <StatusMarkerOverlay token={token} isSelected={selectedTokenId === token.id}
            onUpdateToken={(updates) => onUpdateToken(token.id, updates)} />
        </div>
      ))}
    </div>
  );
}
