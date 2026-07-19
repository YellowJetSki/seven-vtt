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
      {/* Left: Map Sidebar — rigid min-w with gold glass border */}
      <div className="w-56 min-w-[14rem] max-w-[14rem] shrink-0 border-r border-gold/10 bg-obsidian-mid/80 backdrop-blur-sm flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <MapSidebar activeMapId={state.activeMapId} onSelectMap={state.handleSelectMap} />
        </div>
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

        <div className="flex-1 min-h-0 relative overflow-hidden bg-obsidian">
          {/* Ambient gold glow behind canvas */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/[0.01] to-transparent pointer-events-none" />
          <CanvasMapView
            ref={state.canvasRef}
            mapData={state.activeMap}
            tokens={state.activeTokens}
            dmView={state.isDmView}
            onTokenClick={state.handleTokenClick}
            onCellClick={state.handleCellClick}
          />

          {/* Floating bottom buttons — gold glass premium overlay */}
          <div className="absolute bottom-3 left-3 z-10 flex gap-1.5">
            <button
              onClick={() => {
                state.setShowEncounterPanel(!state.showEncounterPanel);
                state.setShowInitiative(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 border backdrop-blur-md shadow-lg ${
                state.showEncounterPanel
                  ? "bg-gold-500/10 border-gold/30 text-gold-400 shadow-gold-500/5"
                  : "bg-obsidian-mid/70 border-surface-700/30 text-surface-400 hover:border-gold/20 hover:text-gold-300 hover:bg-gold-500/5"
              }`}
            >
              ⚔ Encounters
            </button>
            <button
              onClick={() => {
                state.setShowInitiative(!state.showInitiative);
                state.setShowEncounterPanel(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 border backdrop-blur-md shadow-lg ${
                state.showInitiative
                  ? "bg-gold-500/10 border-gold/30 text-gold-400 shadow-gold-500/5"
                  : "bg-obsidian-mid/70 border-surface-700/30 text-surface-400 hover:border-gold/20 hover:text-gold-300 hover:bg-gold-500/5"
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

      {/* Right Panel: Token Inspector / Initiative / Encounter / AoE — rigid max-w with gold glass */}
      {state.selectedToken && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 backdrop-blur-sm flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <TokenInspector
              token={state.selectedToken}
              mapId={state.activeMap.id}
              onClose={state.handleCloseInspector}
              onTokenUpdated={(updated) => state.setSelectedToken(updated)}
            />
          </div>
        </div>
      )}

      {!state.selectedToken && state.showInitiative && state.activeEncounter && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 backdrop-blur-sm flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <InitiativeTracker
              encounter={state.activeEncounter}
              onSelectCombatant={() => {}}
              selectedCombatantId={state.selectedCombatantId}
            />
          </div>
        </div>
      )}

      {!state.selectedToken && state.placementMode === "aoe" && state.activeMap && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 backdrop-blur-sm flex flex-col p-3 overflow-y-auto">
          <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <h3 className="text-xs font-bold text-gold-400 tracking-wide">✦ Spell Templates</h3>
            <AoEPlacementTool mapId={state.activeMap.id} onPlace={state.handleAoEPlace} />
          </div>
        </div>
      )}

      {!state.selectedToken && state.showEncounterPanel && (
        <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-gold/10 bg-obsidian-mid/80 backdrop-blur-sm flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.02] to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <EncounterPanel
              mapId={state.activeMap.id}
              onTokensAdded={() => {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}
