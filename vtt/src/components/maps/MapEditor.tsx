import { useState, useRef, useCallback, useMemo } from "react";
import type { BattleMap, MapToken } from "@/types";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FogOfWarLayer, FogOfWarControls } from "@/components/maps/FogOfWarLayer";
import { MovementRangeOverlay } from "@/components/maps/MovementRangeOverlay";

interface MapEditorProps {
  map: BattleMap;
  onUpdate: (updates: Partial<BattleMap>) => void;
}

const TOKEN_COLORS = [
  "#8b30ff", "#3b82f6", "#27ae60", "#f39c12",
  "#e74c3c", "#ec4899", "#14b8a6", "#f97316",
  "#6b7280", "#a855f7",
];

export function MapEditor({ map, onUpdate }: MapEditorProps) {
  const showToast = useUiStore((s) => s.showToast);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [showAddToken, setShowAddToken] = useState(false);
  const [showFogControls, setShowFogControls] = useState(false);
  const [showFog, setShowFog] = useState(true);
  const [gmView, setGmView] = useState(true);
  const [showMovement, setShowMovement] = useState(false);
  const [dashMode, setDashMode] = useState(false);

  const containerWidth = useRef(800);
  const cellWidth = containerWidth.current / map.gridWidth;
  const cellHeight = containerWidth.current / map.gridHeight;

  const selectedToken = map.tokens.find((t) => t.id === selectedTokenId);

  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let x = 0; x <= map.gridWidth; x++) {
      lines.push(
        <div key={`v${x}`}
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: `${(x / map.gridWidth) * 100}%`, width: `${(100 / map.gridWidth)}%`, borderLeft: x > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
        />
      );
    }
    for (let y = 0; y <= map.gridHeight; y++) {
      lines.push(
        <div key={`h${y}`}
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: `${(y / map.gridHeight) * 100}%`, height: `${(100 / map.gridHeight)}%`, borderTop: y > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
        />
      );
    }
    return lines;
  }, [map.gridWidth, map.gridHeight]);

  const handleTokenClick = useCallback((tokenId: string) => {
    setSelectedTokenId((prev) => (prev === tokenId ? null : tokenId));
  }, []);

  const handleCanvasClick = useCallback((_e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTokenId) {
      setSelectedTokenId(null);
      return;
    }
  }, [selectedTokenId]);

  const handleRemoveToken = useCallback((tokenId: string) => {
    onUpdate({ tokens: map.tokens.filter((t) => t.id !== tokenId) });
    setSelectedTokenId(null);
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
    onUpdate({
      tokens: map.tokens.map((t) =>
        t.id === tokenId
          ? { ...t, x: Math.max(0, Math.min(map.gridWidth - 1, targetX)), y: Math.max(0, Math.min(map.gridHeight - 1, targetY)) }
          : t
      ),
    });
  }, [map.tokens, map.gridWidth, map.gridHeight, onUpdate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-surface-200">{map.name}</h3>
          <span className="text-[10px] text-surface-500">{map.gridWidth}x{map.gridHeight} - {map.tokens.length} tokens</span>
        </div>
        <div className="flex items-center gap-2">
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
          <Button size="xs" onClick={() => setShowAddToken(true)}>+ Token</Button>
        </div>
      </div>

      <div ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-surface-700 bg-surface-900"
        style={{ aspectRatio: `${map.gridWidth}/${map.gridHeight}` }}
        onClick={handleCanvasClick}>

        {map.imageUrl && (
          <img src={map.imageUrl} alt={map.name}
            className={`absolute inset-0 h-full w-full ${map.imageFit === "contain" ? "object-contain" : map.imageFit === "stretch" ? "object-fill" : "object-cover"}`} />
        )}

        {gridLines}

        {/* Legacy fog reveals */}
        {!gmView && showFog && map.fogOfWar.map((fog) => (
          <div key={fog.id} className="absolute bg-black/40 border border-accent-500/20"
            style={{
              left: `${(fog.x / map.gridWidth) * 100}%`,
              top: `${(fog.y / map.gridHeight) * 100}%`,
              width: `${(fog.width / map.gridWidth) * 100}%`,
              height: `${(fog.height / map.gridHeight) * 100}%`,
            }} />
        ))}

        {/* Dynamic Fog */}
        {showFog && !gmView && (
          <FogOfWarLayer map={map} isGmView={false} cellWidth={cellWidth || 50} cellHeight={cellHeight || 50} />
        )}

        {/* Movement Range Overlay for selected token */}
        {showMovement && selectedToken && (
          <MovementRangeOverlay
            token={selectedToken}
            gridWidth={map.gridWidth}
            gridHeight={map.gridHeight}
            movementSpeed={30}
            dashMultiplier={dashMode ? 2 : 1}
            cellSize={5}
          />
        )}

        {/* Clickable cells for drag movement */}
        {showMovement && selectedToken && (() => {
          const cells = [];
          const totalCells = Math.floor((30 * (dashMode ? 2 : 1)) / 5);
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
            <div
              key={`click-${c.x}-${c.y}`}
              onClick={(e) => { e.stopPropagation(); handleDragToCell(selectedToken.id, c.x, c.y); }}
              className="absolute cursor-pointer z-20 hover:bg-white/10 transition-colors"
              style={{
                left: `${(c.x / map.gridWidth) * 100}%`,
                top: `${(c.y / map.gridHeight) * 100}%`,
                width: `${(100 / map.gridWidth)}%`,
                height: `${(100 / map.gridHeight)}%`,
              }}
              title={`Move ${selectedToken.label} to (${c.x}, ${c.y})`}
            />
          ));
        })()}

        {/* Tokens */}
        {map.tokens.map((token) => (
          <div key={token.id}
            onClick={(e) => { e.stopPropagation(); handleTokenClick(token.id); }}
            className={`absolute flex items-center justify-center rounded-full cursor-pointer transition-all hover:scale-110 ${
              selectedTokenId === token.id ? "ring-2 ring-accent-400 ring-offset-2 ring-offset-surface-900 z-10" : "z-0"
            } ${!token.visible ? "opacity-50" : ""} ${!gmView && !token.visible ? "hidden" : ""}`}
            style={{
              left: `${(token.x / map.gridWidth) * 100}%`,
              top: `${(token.y / map.gridHeight) * 100}%`,
              width: `${((token.size * 0.8) / map.gridWidth) * 100}%`,
              height: `${((token.size * 0.8) / map.gridHeight) * 100}%`,
              backgroundColor: token.color,
              minWidth: "16px",
              minHeight: "16px",
            }}
            title={`${token.label} (${token.x},${token.y})`}>
            {token.icon ? (
              <span className="text-xs">{token.icon}</span>
            ) : (
              <span className="text-[8px] font-bold text-white uppercase">{token.label.charAt(0)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Token Inspector Panel */}
      {selectedToken && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 animate-slide-up">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: selectedToken.color }}>
                <span className="text-sm font-bold text-white">{selectedToken.label.charAt(0)}</span>
              </div>
              <div>
                <h4 className="font-semibold text-surface-100">{selectedToken.label}</h4>
                <p className="text-xs text-surface-400">
                  {selectedToken.type.charAt(0).toUpperCase() + selectedToken.type.slice(1)} - Position ({selectedToken.x},{selectedToken.y})
                  {selectedToken.hp && ` - HP ${selectedToken.hp.current}/${selectedToken.hp.max}`}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
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
              <span className="text-[10px] font-medium text-surface-400">Movement</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setShowMovement(!showMovement); setDashMode(false); }}
                  className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${showMovement && !dashMode ? "bg-rogue-500/20 text-rogue-400" : "bg-surface-800 text-surface-400 hover:text-surface-200"}`}
                >
                  Move
                </button>
                <button
                  onClick={() => { setShowMovement(!showMovement); setDashMode(true); }}
                  className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${showMovement && dashMode ? "bg-warrior-500/20 text-warrior-400" : "bg-surface-800 text-surface-400 hover:text-surface-200"}`}
                >
                  Dash
                </button>
              </div>
            </div>
            {showMovement && (
              <p className="text-[10px] text-surface-500 mb-2">
                {dashMode ? "Double movement (dash) — click a yellow or green cell to move" : "Normal movement — click a green cell to move"}
              </p>
            )}
            <div className="grid grid-cols-3 gap-1 max-w-[200px] mx-auto">
              <div />
              <button onClick={() => handleMoveToken(selectedToken.id, 0, -1)} className="rounded bg-surface-800 p-2 text-center text-surface-400 hover:bg-surface-700 hover:text-surface-200 text-xs">up</button>
              <div />
              <button onClick={() => handleMoveToken(selectedToken.id, -1, 0)} className="rounded bg-surface-800 p-2 text-center text-surface-400 hover:bg-surface-700 hover:text-surface-200 text-xs">left</button>
              <div className="rounded bg-surface-800 p-2 text-center text-surface-500 text-[10px]">{selectedToken.x},{selectedToken.y}</div>
              <button onClick={() => handleMoveToken(selectedToken.id, 1, 0)} className="rounded bg-surface-800 p-2 text-center text-surface-400 hover:bg-surface-700 hover:text-surface-200 text-xs">right</button>
              <div />
              <button onClick={() => handleMoveToken(selectedToken.id, 0, 1)} className="rounded bg-surface-800 p-2 text-center text-surface-400 hover:bg-surface-700 hover:text-surface-200 text-xs">down</button>
              <div />
            </div>
          </div>
        </div>
      )}

      {/* Fog Controls */}
      {showFogControls && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
          <FogOfWarControls map={map} onUpdate={onUpdate} isGmView={gmView} />
        </div>
      )}

      {/* Add Token Modal */}
      {showAddToken && (
        <Modal modalId="add-token" title="Add Token" size="sm">
          <AddTokenForm
            gridWidth={map.gridWidth}
            gridHeight={map.gridHeight}
            onAdd={(token) => {
              onUpdate({ tokens: [...map.tokens, token] });
              setShowAddToken(false);
              showToast({ message: `Token "${token.label}" added.`, type: "success" });
            }}
            onCancel={() => setShowAddToken(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function AddTokenForm({
  gridWidth,
  gridHeight,
  onAdd,
  onCancel,
}: {
  gridWidth: number;
  gridHeight: number;
  onAdd: (token: MapToken) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<MapToken["type"]>("enemy");
  const [x, setX] = useState(Math.floor(gridWidth / 4));
  const [y, setY] = useState(Math.floor(gridHeight / 4));
  const [color, setColor] = useState(TOKEN_COLORS[0]);
  const [size, setSize] = useState(1);

  const handleAdd = () => {
    if (!label.trim()) return;
    const token: MapToken = {
      id: `tk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: label.trim(),
      x: Math.max(0, Math.min(gridWidth - 1, x)),
      y: Math.max(0, Math.min(gridHeight - 1, y)),
      color,
      size,
      visible: true,
    };
    onAdd(token);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Label</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Goblin Archer"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as MapToken["type"])}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent-500 focus:outline-none">
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
            <option value="npc">NPC</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Size (cells)</label>
          <input type="number" min={1} max={4} value={size} onChange={(e) => setSize(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">X Position (0-{gridWidth - 1})</label>
          <input type="number" min={0} max={gridWidth - 1} value={x} onChange={(e) => setX(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Y Position (0-{gridHeight - 1})</label>
          <input type="number" min={0} max={gridHeight - 1} value={y} onChange={(e) => setY(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Color</label>
        <div className="flex flex-wrap gap-2">
          {TOKEN_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-white ring-offset-1 ring-offset-surface-850 scale-110" : ""}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!label.trim()}>Add Token</Button>
      </div>
    </div>
  );
}
