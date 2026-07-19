/**
 * STᚱ VTT — DM Control Center
 *
 * Master DM battle map view with token placement, initiative tracking,
 * encounter population, and AoE placement. All changes sync to Theatric.
 */

import CanvasMapView from "@/components/maps/CanvasMapView";
import DmToolbar from "./DmToolbar";
import MapSidebar from "./MapSidebar";
import TokenInspector from "./TokenInspector";
import InitiativeTracker from "./InitiativeTracker";
import EncounterPanel from "./EncounterPanel";
import AoEPlacementTool from "@/components/maps/AoEPlacementTool";
import { useDmControlCenter } from "./useDmControlCenter";

export default function DmControlCenter() {
  const state = useDmControlCenter();

  if (!state.activeMap) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-surface-400 text-sm">Select a map from the sidebar</p>
          <p className="text-surface-600 text-xs mt-1">or create one from Battle Maps</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Map Sidebar */}
      <div className="w-56 shrink-0 border-r border-surface-700/20 bg-surface-900/50 flex flex-col">
        <MapSidebar activeMapId={state.activeMapId} onSelectMap={state.handleSelectMap} />
      </div>

      {/* Center: Canvas + Toolbar */}
      <div className="flex-1 flex flex-col min-w-0">
        <DmToolbar
          mapName={state.activeMap.name}
          placementMode={state.placementMode}
          showFog={state.showFog}
          isDmView={state.isDmView}
          showGrid={state.showGrid}
          onSetPlacementMode={state.setPlacementMode}
          onToggleFog={() => state.canvasRef.current?.toggleFog()}
          onToggleDmView={() => state.canvasRef.current?.toggleDmView()}
          onToggleGrid={() => state.setShowGrid((g) => !g)}
          onRecenter={() => state.canvasRef.current?.recenter()}
          onAddPlayerToken={state.handleAddPlayerToken}
          onAddEnemyToken={state.handleAddEnemyToken}
          onBack={state.handleGoBack}
        />

        <div className="flex-1 relative overflow-hidden">
          <CanvasMapView
            ref={state.canvasRef}
            mapData={state.activeMap}
            tokens={state.activeTokens}
            dmView={state.isDmView}
            onTokenClick={state.handleTokenClick}
            onCellClick={state.handleCellClick}
          />

          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            <button
              onClick={() => { state.setShowEncounterPanel(!state.showEncounterPanel); state.setShowInitiative(false); }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border backdrop-blur-sm ${
                state.showEncounterPanel
                  ? "bg-accent-600/20 border-accent-500/30 text-accent-300"
                  : "bg-surface-900/60 border-surface-700/30 text-surface-400 hover:bg-surface-800/70"
              }`}
            >
              ⚔ Encounters
            </button>
            <button
              onClick={() => { state.setShowInitiative(!state.showInitiative); state.setShowEncounterPanel(false); }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border backdrop-blur-sm ${
                state.showInitiative
                  ? "bg-accent-600/20 border-accent-500/30 text-accent-300"
                  : "bg-surface-900/60 border-surface-700/30 text-surface-400 hover:bg-surface-800/70"
              }`}
            >
              📋 Initiative {state.activeEncounter ? `(${state.activeEncounter.combatants.length})` : ""}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Token Inspector / Initiative / Encounter / AoE */}
      {state.selectedToken && (
        <div className="w-72 shrink-0 border-l border-surface-700/20 bg-surface-900/50 flex flex-col">
          <TokenInspector
            token={state.selectedToken}
            mapId={state.activeMap.id}
            onClose={state.handleCloseInspector}
            onTokenUpdated={(updated) => state.setSelectedToken(updated)}
          />
        </div>
      )}

      {!state.selectedToken && state.showInitiative && state.activeEncounter && (
        <div className="w-72 shrink-0 border-l border-surface-700/20 bg-surface-900/50 flex flex-col">
          <InitiativeTracker
            encounter={state.activeEncounter}
            onSelectCombatant={() => {}}
            selectedCombatantId={state.selectedCombatantId}
          />
        </div>
      )}

      {!state.selectedToken && state.placementMode === "aoe" && state.activeMap && (
        <div className="w-72 shrink-0 border-l border-surface-700/20 bg-surface-900/50 flex flex-col p-3 overflow-y-auto">
          <h3 className="text-xs font-bold text-gradient-arcane mb-3">Spell Templates</h3>
          <AoEPlacementTool mapId={state.activeMap.id} onPlace={state.handleAoEPlace} />
        </div>
      )}

      {!state.selectedToken && state.showEncounterPanel && (
        <div className="w-72 shrink-0 border-l border-surface-700/20 bg-surface-900/50 flex flex-col">
          <EncounterPanel
            mapId={state.activeMap.id}
            onTokensAdded={() => {
              if (state.activeMapId) {
                // Refresh handled by hook
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
