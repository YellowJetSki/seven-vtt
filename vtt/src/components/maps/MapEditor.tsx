/* ── MapEditor ─────────────────────────────────────────────────
 * Core battle map grid tool with token placement, movement,
 * fog of war, HP tracking, and theatric view integration.
 * Orchestrates MapCanvas, MapEditorToolbar, TokenInspector.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useMemo } from "react";
import type { BattleMap, MapToken } from "@/types";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { FogOfWarControls } from "@/components/maps/FogOfWarLayer";
import { MapEditorToolbar } from "./MapEditorToolbar";
import { MapCanvas } from "./MapCanvas";
import { TokenInspector } from "./TokenInspector";

interface Props {
  map: BattleMap;
  onUpdate: (updates: Partial<BattleMap>) => void;
  onOpenTheatric?: (token: MapToken) => void;
}

export function MapEditor({ map, onUpdate, onOpenTheatric }: Props) {
  const showToast = useUiStore((s) => s.showToast);
  const openModal = useUiStore((s) => s.openModal);

  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [showFogControls, setShowFogControls] = useState(false);
  const [showFog, setShowFog] = useState(true);
  const [gmView, setGmView] = useState(true);
  const [showMovement, setShowMovement] = useState(false);
  const [dashMode, setDashMode] = useState(false);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [gridOpacity] = useState(0.08);
  const [showGrid, setShowGrid] = useState(true);
  const [pendingDashMove, setPendingDashMove] = useState<{ tokenId: string; x: number; y: number } | null>(null);

  const selectedToken = useMemo(() => map.tokens.find((t) => t.id === selectedTokenId) ?? null, [map.tokens, selectedTokenId]);
  const tokenSpeed = selectedToken?.speed ?? 30;

  const handleTokenClick = useCallback((tokenId: string) => {
    setSelectedTokenId((prev) => (prev === tokenId ? null : tokenId));
    setShowMovement(false); setDashMode(false);
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedTokenId(null); setShowMovement(false); setDashMode(false);
  }, []);

  const handleRemoveToken = useCallback((tokenId: string) => {
    onUpdate({ tokens: map.tokens.filter((t) => t.id !== tokenId) });
    showToast({ message: "Token removed.", type: "info" });
  }, [map.tokens, onUpdate, showToast]);

  const handleToggleVisibility = useCallback((tokenId: string) => {
    onUpdate({ tokens: map.tokens.map((t) => t.id === tokenId ? { ...t, visible: !t.visible } : t) });
  }, [map.tokens, onUpdate]);

  const handleDragToCell = useCallback((tokenId: string, targetX: number, targetY: number) => {
    const token = map.tokens.find((t) => t.id === tokenId);
    if (!token) return;
    const dist = Math.abs(targetX - token.x) + Math.abs(targetY - token.y);
    if (dist > normalRange && !dashMode) {
      setPendingDashMove({ tokenId, x: targetX, y: targetY });
      return;
    }
    performMove(tokenId, targetX, targetY);
  }, [map.tokens, dashMode]);

  const performMove = useCallback((tokenId: string, targetX: number, targetY: number) => {
    onUpdate({ tokens: map.tokens.map((t) => t.id === tokenId ? { ...t, x: targetX, y: targetY } : t) });
    setShowMovement(false); setDashMode(false);
  }, [map.tokens, onUpdate]);

  const handleUpdateToken = useCallback((tokenId: string, updates: Partial<MapToken>) => {
    onUpdate({ tokens: map.tokens.map((t) => t.id === tokenId ? { ...t, ...updates } : t) });
  }, [map.tokens, onUpdate]);

  const normalRange = Math.floor(tokenSpeed / 5);
  const dashRange = Math.floor((tokenSpeed * 2) / 5);

  return (
    <div className="space-y-3">
      <MapEditorToolbar
        gmView={gmView} showFog={showFog} showFogControls={showFogControls}
        drawingEnabled={drawingEnabled} showGrid={showGrid} hasSelectedToken={!!selectedToken}
        onToggleGmView={() => setGmView(!gmView)}
        onToggleFog={() => setShowFog(!showFog)}
        onToggleFogControls={() => setShowFogControls((o) => !o)}
        onAddToken={() => openModal("add-token")}
        onToggleDrawing={() => setDrawingEnabled(!drawingEnabled)}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onOpenTheatric={onOpenTheatric} selectedToken={selectedToken}
      />

      <MapCanvas
        map={map} gmView={gmView} showFog={showFog} showGrid={showGrid}
        gridOpacity={gridOpacity} selectedTokenId={selectedTokenId}
        showMovement={showMovement} dashMode={dashMode} drawingEnabled={drawingEnabled}
        onTokenClick={handleTokenClick} onCanvasClick={handleCanvasClick}
        onDragToCell={handleDragToCell}
        onMoveToken={(id, dx, dy) => {
          const t = map.tokens.find(tk => tk.id === id);
          if (!t) return;
          performMove(id, t.x + dx, t.y + dy);
        }}
        onUpdateToken={handleUpdateToken}
        onTokensUpdate={(tokens) => onUpdate({ tokens })}
        onDrawingsChange={(drawings) => onUpdate({ drawings })}
      />

      {showFogControls && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 animate-slide-up">
          <FogOfWarControls map={map} onUpdate={onUpdate} isGmView={gmView} />
        </div>
      )}

      {selectedToken && (
        <TokenInspector
          token={selectedToken} showMovement={showMovement} dashMode={dashMode}
          normalRange={normalRange} dashRange={dashRange}
          onToggleVisibility={() => handleToggleVisibility(selectedToken.id)}
          onRemove={() => handleRemoveToken(selectedToken.id)}
          onToggleMovement={(dash) => { setShowMovement((o) => dash === dashMode ? !o : true); setDashMode(dash); }}
          onOpenTheatric={onOpenTheatric ? () => onOpenTheatric(selectedToken) : undefined}
        />
      )}

      {pendingDashMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPendingDashMove(null)}>
          <div className="rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Dash Required</h3>
            <p className="text-sm text-surface-400 mb-4">This move exceeds normal range. Use Dash?</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setPendingDashMove(null)}>Cancel</Button>
              <Button size="sm" onClick={() => { performMove(pendingDashMove.tokenId, pendingDashMove.x, pendingDashMove.y); setPendingDashMove(null); }}>Use Dash</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
