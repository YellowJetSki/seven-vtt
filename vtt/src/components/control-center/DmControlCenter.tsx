/**
 * STᚱ VTT — DM Control Center
 *
 * The master orchestration component for the DM's battle map view.
 * Layout:
 *   ┌────────────┬────────────────────────────────┬────────────┐
 *   │ Map List   │   Canvas (Battle Map View)     │ Inspector  │
 *   │ (sidebar)  │   + DmToolbar (top)           │ (right)    │
 *   │            │                                │            │
 *   └────────────┴────────────────────────────────┴────────────┘
 *
 * The DM can:
 *   - Switch between maps (sidebar left)
 *   - Place/edit/manage tokens (toolbar + inspector)
 *   - Track initiative & HP (bottom panel)
 *   - Load encounters onto the map
 *   - All changes sync to Theatric Display via shared stores
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import CanvasMapView, { type CanvasMapHandle } from "@/components/maps/CanvasMapView";
import DmToolbar, { type PlacementMode } from "./DmToolbar";
import MapSidebar from "./MapSidebar";
import TokenInspector from "./TokenInspector";
import InitiativeTracker from "./InitiativeTracker";
import EncounterPanel from "./EncounterPanel";
import type { BattleMap, MapToken, LightSource } from "@/types";

export default function DmControlCenter() {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);
  const addMapToken = useCampaignStore((s) => s.addMapToken);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const createEncounter = useCombatStore((s) => s.createEncounter);
  const addCombatant = useCombatStore((s) => s.addCombatant);

  const canvasRef = useRef<CanvasMapHandle>(null);

  // ── Active Map State ──
  const [activeMapId, setActiveMapId] = useState<string | null>(
    battleMaps.length > 0 ? battleMaps[0].id : null
  );
  const [activeMap, setActiveMap] = useState<BattleMap | null>(
    battleMaps.length > 0 ? battleMaps[0] : null
  );
  const [activeTokens, setActiveTokens] = useState<MapToken[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<MapToken | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showFog, setShowFog] = useState(false);
  const [isDmView, setIsDmView] = useState(true);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("none");
  const [showInitiative, setShowInitiative] = useState(false);
  const [showEncounterPanel, setShowEncounterPanel] = useState(false);

  // Update active map data
  useEffect(() => {
    if (!activeMapId) {
      setActiveMap(null);
      setActiveTokens([]);
      return;
    }
    const map = battleMaps.find((m) => m.id === activeMapId);
    if (map) {
      setActiveMap(map);
      setActiveTokens(mapTokens[activeMapId] || []);
    }
  }, [activeMapId, battleMaps, mapTokens]);

  const handleSelectMap = useCallback((map: BattleMap) => {
    setActiveMapId(map.id);
    setSelectedTokenId(null);
    setSelectedToken(null);
    canvasRef.current?.recenter();
  }, []);

  const handleTokenClick = useCallback((token: MapToken) => {
    setSelectedTokenId(token.id);
    setSelectedToken(token);
  }, []);

  const handleCellClick = useCallback((gridX: number, gridY: number) => {
    // Click on empty cell deselects token
    setSelectedTokenId(null);
    setSelectedToken(null);
  }, []);

  const handleAddPlayerToken = useCallback(() => {
    if (!activeMap) return;
    const token: MapToken = {
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "player",
      label: `PC ${(mapTokens[activeMap.id]?.length ?? 0) + 1}`,
      x: Math.floor(activeMap.gridWidth / 2),
      y: Math.floor(activeMap.gridHeight / 2),
      color: "#4a9eff",
      size: 1,
      visible: true,
      icon: "🛡️",
      hp: { current: 50, max: 50 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addMapToken(activeMap.id, token);
    setSelectedTokenId(token.id);
    setSelectedToken(token);
  }, [activeMap, mapTokens, addMapToken]);

  const handleAddEnemyToken = useCallback(() => {
    if (!activeMap) return;
    const token: MapToken = {
      id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "enemy",
      label: `Enemy ${(mapTokens[activeMap.id]?.length ?? 0) + 1}`,
      x: Math.floor(activeMap.gridWidth / 2) + 2,
      y: Math.floor(activeMap.gridHeight / 2),
      color: "#ef4444",
      size: 1,
      visible: true,
      icon: "👹",
      hp: { current: 30, max: 30 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addMapToken(activeMap.id, token);
    setSelectedTokenId(token.id);
    setSelectedToken(token);
  }, [activeMap, mapTokens, addMapToken]);

  const handleTokensAdded = useCallback((_tokens: MapToken[]) => {
    // Refresh tokens after encounter population
    if (activeMapId) {
      setActiveTokens(mapTokens[activeMapId] || []);
    }
  }, [activeMapId, mapTokens]);

  const handleSelectCombatant = useCallback((_combatantId: string) => {
    // Could highlight the corresponding map token
  }, []);

  const handleCloseInspector = useCallback(() => {
    setSelectedTokenId(null);
    setSelectedToken(null);
  }, []);

  const handleGoBack = useCallback(() => {
    // Navigate back handled by parent
  }, []);

  // Loading state
  if (!activeMap) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-400 text-sm">Select a map from the sidebar</p>
          <p className="text-surface-600 text-xs mt-1">or create one from Battle Maps</p>
        </div>
      </div>
    );
  }

  const selectedCombatantId = activeEncounter?.combatants.find(
    (c) => c.id === selectedTokenId
  )?.id;

  return (
    <div className="flex h-full">
      {/* ── Left: Map Sidebar ── */}
      <div className="w-56 shrink-0 border-r border-surface-700/20 bg-surface-900/50 flex flex-col">
        <MapSidebar activeMapId={activeMapId} onSelectMap={handleSelectMap} />
      </div>

      {/* ── Center: Canvas + Toolbar ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DM Toolbar */}
        <DmToolbar
          mapName={activeMap.name}
          placementMode={placementMode}
          showFog={showFog}
          isDmView={isDmView}
          showGrid={showGrid}
          onSetPlacementMode={setPlacementMode}
          onToggleFog={() => canvasRef.current?.toggleFog()}
          onToggleDmView={() => canvasRef.current?.toggleDmView()}
          onToggleGrid={() => setShowGrid((g) => !g)}
          onRecenter={() => canvasRef.current?.recenter()}
          onAddPlayerToken={handleAddPlayerToken}
          onAddEnemyToken={handleAddEnemyToken}
          onBack={handleGoBack}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <CanvasMapView
            ref={canvasRef}
            mapData={activeMap}
            tokens={activeTokens}
            dmView={isDmView}
            onTokenClick={handleTokenClick}
            onCellClick={handleCellClick}
          />

          {/* Quick-add encounter / initiative toggle buttons (floating bottom-left) */}
          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            <button
              onClick={() => { setShowEncounterPanel(!showEncounterPanel); setShowInitiative(false); }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border backdrop-blur-sm ${
                showEncounterPanel
                  ? "bg-accent-600/20 border-accent-500/30 text-accent-300"
                  : "bg-surface-900/60 border-surface-700/30 text-surface-400 hover:bg-surface-800/70"
              }`}
            >
              ⚔ Encounters
            </button>
            <button
              onClick={() => { setShowInitiative(!showInitiative); setShowEncounterPanel(false); }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border backdrop-blur-sm ${
                showInitiative
                  ? "bg-accent-600/20 border-accent-500/30 text-accent-300"
                  : "bg-surface-900/60 border-surface-700/30 text-surface-400 hover:bg-surface-800/70"
              }`}
            >
              📋 Initiative {activeEncounter ? `(${activeEncounter.combatants.length})` : ""}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Token Inspector / Initiative Tracker / Encounter Panel ── */}
      {selectedToken && (
        <div className="w-72 shrink-0 border-l border-surface-700/20 bg-surface-900/50 flex flex-col">
          <TokenInspector
            token={selectedToken}
            mapId={activeMap.id}
            onClose={handleCloseInspector}
            onTokenUpdated={(updated) => setSelectedToken(updated)}
          />
        </div>
      )}

      {!selectedToken && showInitiative && activeEncounter && (
        <div className="w-72 shrink-0 border-l border-surface-700/20 bg-surface-900/50 flex flex-col">
          <InitiativeTracker
            encounter={activeEncounter}
            onSelectCombatant={handleSelectCombatant}
            selectedCombatantId={selectedCombatantId}
          />
        </div>
      )}

      {!selectedToken && showEncounterPanel && (
        <div className="w-72 shrink-0 border-l border-surface-700/20 bg-surface-900/50 flex flex-col">
          <EncounterPanel
            mapId={activeMap.id}
            onTokensAdded={handleTokensAdded}
          />
        </div>
      )}
    </div>
  );
}
