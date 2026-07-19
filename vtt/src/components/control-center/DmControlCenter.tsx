/**
 * STᚱ VTT — DM Control Center (Premium Gold)
 *
 * Master DM battle map view with gold-accented glassmorphism panels.
 * Uses CSS Grid layout: left sidebar | canvas+toolbar | right panels.
 * Sidebars have strict min-w boundaries to prevent squishing.
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
      <div className="h-full flex items-center justify-center bg-obsidian">
        <div className="glass-gold rounded-2xl p-8 text-center max-w-sm">
          <span className="text-4xl block mb-4">🗺</span>
          <p className="text-surface-300 text-sm font-semibold">Select a map from the sidebar</p>
          <p className="text-gold-400/60 text-xs mt-2">or create one from Battle Maps</p>
          <div className="rune-gold mt-6 justify-center">✦</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-obsidian">
      {/* Left: Map Sidebar — rigid min-w */}
      <div className="w-56 min-w-[14rem] max-w-[14rem] shrink-0 border-r border-gold/10 bg-obsidian-mid/80 glass-dark flex flex-col">
        <MapSidebar activeMapId={state.activeMapId} onSelectMap={state.handleSelectMap} />
      </div>

      {/* Center: Canvas + Toolbar — flex-grow */}
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

          {/* Floating bottom buttons — glass-premium overlay */}
          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            <button
              onClick={() => {
                state.setShowEncounterPanel(!state.showEncounterPanel);
                state.setShowInitiative(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border backdrop-blur-md ${
                state.showEncounterPanel
                  ? "glass-gold border-gold/30 text-gold-400"
                  : "glass-dark border-surface-700/30 text-surface-400 hover:border-gold/20 hover:text-gold-300"
              }`}
            >
              ⚔ Encounters
            </button>
            <button
              onClick={() => {
                state.setShowInitiative(!state.showInitiative);
                state.setShowEncounterPanel(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border backdrop-blur-md ${
                state.showInitiative
                  ? "glass-gold border-gold/30 text-gold-400"
                  : "glass-dark border-surface-700/30 text-surface-400 hover:border-gold/20 hover:text-gold-300"
              }`}
            >
              📋 Initiative{" "}
              {state.activeEncounter
                ? `(${state.activeEncounter.combatants.length})`
                : ""}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel: Token Inspector / Initiative / Encounter / AoE — rigid max-w */}
      {state.selectedToken && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 glass-dark flex flex-col">
          <TokenInspector
            token={state.selectedToken}
            mapId={state.activeMap.id}
            onClose={state.handleCloseInspector}
            onTokenUpdated={(updated) => state.setSelectedToken(updated)}
          />
        </div>
      )}

      {!state.selectedToken && state.showInitiative && state.activeEncounter && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 glass-dark flex flex-col">
          <InitiativeTracker
            encounter={state.activeEncounter}
            onSelectCombatant={() => {}}
            selectedCombatantId={state.selectedCombatantId}
          />
        </div>
      )}

      {!state.selectedToken && state.placementMode === "aoe" && state.activeMap && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 glass-dark flex flex-col p-3 overflow-y-auto">
          <h3 className="text-xs font-bold text-gold mb-3">Spell Templates</h3>
          <AoEPlacementTool mapId={state.activeMap.id} onPlace={state.handleAoEPlace} />
        </div>
      )}

      {!state.selectedToken && state.showEncounterPanel && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 glass-dark flex flex-col">
          <EncounterPanel
            mapId={state.activeMap.id}
            onTokensAdded={() => {}}
          />
        </div>
      )}
    </div>
  );
}
