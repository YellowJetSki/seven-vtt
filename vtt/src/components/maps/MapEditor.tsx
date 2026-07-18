/* ── MapEditor ─────────────────────────────────────────────────
 * Core battle map grid tool with token placement, movement,
 * fog of war, HP tracking, AOE templates, and theatric view.
 * Orchestrates MapCanvas, MapEditorToolbar, TokenInspector,
 * AoEPresetPanel, and AoEPlacementMode.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useMemo } from "react";
import type { BattleMap, MapToken, AoETemplate, AoE_Direction } from "@/types";
import type { MagicSchool, AltitudeLayer } from "@/types/hazard-zones";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { FogOfWarControls } from "@/components/maps/FogOfWarLayer";
import { useHazardEngine } from "@/hooks/useHazardEngine";
import { AoEPresetPanel } from "./AoEPresetPanel";
import { AoEPlacementMode } from "./AoEPlacementMode";
import { AoETemplateOverlay } from "./AoETemplateOverlay";
import { HazardTimeline } from "./HazardTimeline";
import { GroundEffectOverlay } from "./GroundEffectOverlay";
import { RunicRingOverlay } from "./RunicRingOverlay";
import { MapEditorToolbar } from "./MapEditorToolbar";
import { MapCanvas } from "./MapCanvas";
import { TokenInspector } from "./TokenInspector";

const ROTATION_ORDER: AoE_Direction[] = [
  "east", "southeast", "south", "southwest",
  "west", "northwest", "north", "northeast",
];

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
  const [showAoePanel, setShowAoePanel] = useState(false);
  const [placementMode, setPlacementMode] = useState<{
    template: AoETemplate; hoverX: number; hoverY: number;
  } | null>(null);
  const [placementDirection, setPlacementDirection] = useState<AoE_Direction>("east");
  const [gmView, setGmView] = useState(true);
  const [showMovement, setShowMovement] = useState(false);
  const [dashMode, setDashMode] = useState(false);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [gridOpacity] = useState(0.08);
  const [showGrid, setShowGrid] = useState(true);
  const [pendingDashMove, setPendingDashMove] = useState<{ tokenId: string; x: number; y: number } | null>(null);
  const [showHazardTimeline, setShowHazardTimeline] = useState(false);

  const hazardEngine = useHazardEngine();

  const selectedToken = useMemo(
    () => map.tokens.find((t) => t.id === selectedTokenId) ?? null,
    [map.tokens, selectedTokenId],
  );
  const normalRange = Math.floor((selectedToken?.speed ?? 30) / 5);
  const dashRange = Math.floor(((selectedToken?.speed ?? 30) * 2) / 5);
  const templates = useMemo(() => map.aoeTemplates ?? [], [map.aoeTemplates]);

  /* ── AOE Template Handlers ── */
  const handleAddAoETemplate = useCallback((template: AoETemplate) => {
    const current = map.aoeTemplates ?? [];
    onUpdate({ aoeTemplates: [...current, template] });
    setPlacementMode({ template, hoverX: template.gridX, hoverY: template.gridY });
    // Register as persistent hazard zone (client-side state)
    hazardEngine.registerHazardFromTemplate(template, {
      durationRounds: template.damageDice ? 3 : null,
      requiresConcentration: true,
      tickDamage: template.damageDice,
      magicSchool: "evocation",
      altitude: "ground",
      leavesGroundEffect: !!template.damageType,
    });
    showToast({ message: `${template.label} template added. Click map to position.`, type: "info" });
  }, [map.aoeTemplates, onUpdate, showToast, hazardEngine]);

  const handleRemoveAoETemplate = useCallback((id: string) => {
    const current = map.aoeTemplates ?? [];
    onUpdate({ aoeTemplates: current.filter((t) => t.id !== id) });
    hazardEngine.expireHazard(id);
  }, [map.aoeTemplates, onUpdate, hazardEngine]);

  const handleUpdateAoETemplate = useCallback((id: string, updates: Partial<AoETemplate>) => {
    const current = map.aoeTemplates ?? [];
    onUpdate({ aoeTemplates: current.map((t) => t.id === id ? { ...t, ...updates } : t) });
  }, [map.aoeTemplates, onUpdate]);

  const handlePlaceAtCell = useCallback((x: number, y: number) => {
    if (!placementMode) return;
    const needsDir = placementMode.template.shape !== "circle"
      && placementMode.template.shape !== "sphere"
      && placementMode.template.shape !== "cube";
    const dir = needsDir ? placementDirection : placementMode.template.direction;
    handleUpdateAoETemplate(placementMode.template.id, { gridX: x, gridY: y, direction: dir });
    setPlacementMode(null);
  }, [placementMode, placementDirection, handleUpdateAoETemplate]);

  /* ── Token Handlers ── */
  const performMove = useCallback((tokenId: string, targetX: number, targetY: number) => {
    onUpdate({ tokens: map.tokens.map((t) => t.id === tokenId ? { ...t, x: targetX, y: targetY } : t) });
    setShowMovement(false); setDashMode(false);
  }, [map.tokens, onUpdate]);

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
  }, [map.tokens, dashMode, normalRange, performMove]);

  const handleUpdateToken = useCallback((tokenId: string, updates: Partial<MapToken>) => {
    onUpdate({ tokens: map.tokens.map((t) => t.id === tokenId ? { ...t, ...updates } : t) });
  }, [map.tokens, onUpdate]);

  const handleCanvasMove = useCallback((gridX: number, gridY: number) => {
    if (placementMode) setPlacementMode((p) => p ? { ...p, hoverX: gridX, hoverY: gridY } : null);
  }, [placementMode]);

  const handleCanvasClickGrid = useCallback((gridX: number, gridY: number) => {
    if (placementMode) handlePlaceAtCell(gridX, gridY);
  }, [placementMode, handlePlaceAtCell]);

  return (
    <div className="space-y-3">
      <MapEditorToolbar
        gmView={gmView} showFog={showFog} showFogControls={showFogControls}
        drawingEnabled={drawingEnabled} showGrid={showGrid}
        showAoePanel={showAoePanel} hasSelectedToken={!!selectedToken}
        onToggleGmView={() => setGmView(!gmView)}
        onToggleFog={() => setShowFog(!showFog)}
        onToggleFogControls={() => setShowFogControls((o) => !o)}
        onToggleAoePanel={() => setShowAoePanel((o) => !o)}
        onAddToken={() => openModal("add-token")}
        onToggleDrawing={() => setDrawingEnabled(!drawingEnabled)}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onOpenTheatric={onOpenTheatric} selectedToken={selectedToken}
      />
      {/* Hazard Timeline toggle */}
      <div className="flex items-center gap-2 px-1">
        <Button
          size="xs"
          variant={showHazardTimeline ? "accent" : "ghost"}
          onClick={() => setShowHazardTimeline((o) => !o)}
          title="Toggle Hazard Timeline"
        >
          ⏳ Hazards
        </Button>
      </div>

      <div className="relative">
        <MapCanvas
          map={map} gmView={gmView} showFog={showFog} showGrid={showGrid}
          gridOpacity={gridOpacity} selectedTokenId={selectedTokenId}
          showMovement={showMovement} dashMode={dashMode} drawingEnabled={drawingEnabled}
          onTokenClick={handleTokenClick} onCanvasClick={handleCanvasClick}
          onDragToCell={handleDragToCell}
          _onMoveToken={(id, dx, dy) => {
            const t = map.tokens.find((tk) => tk.id === id);
            if (!t) return;
            performMove(id, t.x + dx, t.y + dy);
          }}
          onCanvasMove={handleCanvasMove}
          onCanvasClickWithGrid={handleCanvasClickGrid}
          onUpdateToken={handleUpdateToken}
          onTokensUpdate={(tokens) => onUpdate({ tokens })}
          onDrawingsChange={(drawings) => onUpdate({ drawings })}
          _onAoETemplatesChange={(aoeTemplates) => onUpdate({ aoeTemplates })}
        />

        {/* AOE Template Overlay */}
        {templates.length > 0 && !placementMode && (
          <div className="absolute inset-0 z-[6] pointer-events-none">
            <AoETemplateOverlay
              templates={templates}
              gridWidth={map.gridWidth}
              gridHeight={map.gridHeight}
              isGmView={gmView}
            />
          </div>
        )}

        {/* Ground Effect Overlay (residual AOE) */}
        {hazardEngine.groundEffects.length > 0 && !placementMode && (
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none z-[7]"
            viewBox={`0 0 ${map.gridWidth} ${map.gridHeight}`}
            preserveAspectRatio="none"
          >
            <GroundEffectOverlay
              effects={hazardEngine.groundEffects}
              gridWidth={map.gridWidth}
              gridHeight={map.gridHeight}
              isGmView={gmView}
            />
          </svg>
        )}

        {/* Runic Ring Overlays for persistent HazardZones */}
        {hazardEngine.hazardZones.length > 0 && !placementMode && (
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none z-[4]"
            viewBox={`0 0 ${map.gridWidth} ${map.gridHeight}`}
            preserveAspectRatio="none"
          >
            {hazardEngine.hazardZones.map((hz) => (
              <RunicRingOverlay
                key={hz.id}
                hazard={hz}
                radiusCells={hz.size / 5}
                cx={hz.gridX}
                cy={hz.gridY}
              />
            ))}
          </svg>
        )}

        {/* AOE Placement Mode */}
        {placementMode && (
          <AoEPlacementMode
            pendingTemplate={placementMode.template}
            hoverGridX={placementMode.hoverX}
            hoverGridY={placementMode.hoverY}
            gridWidth={map.gridWidth}
            gridHeight={map.gridHeight}
            onPlaceAtCell={handlePlaceAtCell}
            onCancel={() => {
              handleRemoveAoETemplate(placementMode.template.id);
              setPlacementMode(null);
            }}
            onRotateDirection={() =>
              setPlacementDirection(
                (d) => ROTATION_ORDER[(ROTATION_ORDER.indexOf(d) + 1) % ROTATION_ORDER.length],
              )
            }
          />
        )}
      </div>

      {showFogControls && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 animate-slide-up">
          <FogOfWarControls map={map} onUpdate={onUpdate} isGmView={gmView} />
        </div>
      )}

      {showAoePanel && (
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 animate-slide-up">
          <AoEPresetPanel
            templates={templates}
            onAddTemplate={handleAddAoETemplate}
            onRemoveTemplate={handleRemoveAoETemplate}
            onUpdateTemplate={handleUpdateAoETemplate}
          />
        </div>
      )}

      {showHazardTimeline && (
        <div className="animate-slide-up">
          <HazardTimeline
            hazards={hazardEngine.hazardZones}
            groundEffects={hazardEngine.groundEffects}
            currentRound={hazardEngine.currentRound}
            onExpireHazard={hazardEngine.expireHazard}
            onExtendHazard={hazardEngine.extendHazard}
            onToggleHazardVisibility={hazardEngine.toggleHazardVisibility}
            onAdvanceRound={hazardEngine.advanceRound}
            onProcessTicks={hazardEngine.processTicks}
          />
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
