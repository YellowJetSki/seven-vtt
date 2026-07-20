/**
 * STᚱ VTT — DM Control Center (Premium Command Bridge)
 *
 * The DM's master battle map interface — the VTT's most critical screen.
 *
 * Architecture:
 * ┌────────────────────────────────────────────────────────┐
 * │  Left Sidebar  │   Canvas (Battle Map)   │  Right Panel │
 * │  (w-56/224px)  │   + Floating Toolbar    │  (w-72/288px)│
 * │  Fixed min-w   │   flex-grow             │  Animated    │
 * └────────────────────────────────────────────────────────┘
 *
 * Cycle 21: Token HP Popover (rapid HP adjustment)
 * Cycle 22: Token Drag-and-Drop (smooth repositioning)
 * Cycle 23: Initiative & Turn Order system on the map
 *   - Canvas renders turn banners, next-up indicators, dead markers
 *   - InitiativeOverlay HUD floats on top of canvas
 *   - Next/Prev turn buttons wired to combatStore flow actions
 *   - Active combatant token glows gold on the canvas
 */

import { useCallback, useState } from "react";
import { useCombatStore } from "@/stores/combatStore";
import CanvasMapView from "@/components/maps/CanvasMapView";
import DmToolbar from "./DmToolbar";
import ControlCenterSidebar from "./ControlCenterSidebar";
import ControlCenterRightPanel from "./ControlCenterRightPanel";
import ControlCenterEmptyState from "./ControlCenterEmptyState";
import CanvasActionBar from "./CanvasActionBar";
import DmSharePicker from "./DmSharePicker";
import TokenHpPopover from "./TokenHpPopover";
import MultiTargetAoEPopover from "@/components/encounters/MultiTargetAoEPopover";
import { useDmControlCenter } from "./useDmControlCenter";
import type { MapToken } from "@/types";

export default function DmControlCenter() {
  const state = useDmControlCenter();
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [showAoEPopover, setShowAoEPopover] = useState(false);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  // ── Cycle 23: Combat flow actions ──
  const nextTurn = useCombatStore((s) => s.nextTurn);
  const prevTurn = useCombatStore((s) => s.prevTurn);

  /**
   * Enhanced canvas token click: opens HP popover + inspector.
   */
  const handleCanvasTokenClick = useCallback(
    (token: MapToken) => {
      state.handleTokenClickEx(token, 0, 0);
    },
    [state]
  );

  if (!state.activeMap) {
    return <ControlCenterEmptyState />;
  }

  return (
    <div className="flex h-full bg-obsidian">
      {/* ─── Token HP Popover ─────────────────────── */}
      {state.hpPopoverToken && (
        <TokenHpPopover
          token={state.hpPopoverToken}
          mapId={state.activeMap.id}
          position={state.hpPopoverPosition}
          onClose={state.handleCloseHpPopover}
          onHpChange={state.handleHpChangeFromPopover}
        />
      )}

      {/* ─── AoE Damage Popover ──────────────────────── */}
      {showAoEPopover && activeEncounter && (
        <MultiTargetAoEPopover
          combatants={activeEncounter.combatants}
          isOpen={showAoEPopover}
          onClose={() => setShowAoEPopover(false)}
          position={{ top: window.innerHeight / 2 - 300, left: window.innerWidth / 2 - 190 }}
        />
      )}

      {/* ─── Share Picker Modal ─────────────────────── */}
      <DmSharePicker isOpen={showSharePicker} onClose={() => setShowSharePicker(false)} />

      {/* ─── Left Sidebar ─────────────────────────── */}
      <ControlCenterSidebar
        activeMapId={state.activeMapId}
        battleMaps={state.battleMaps}
        onSelectMap={state.handleSelectMap}
      />

      {/* ─── Center: Canvas + Floating Toolbar ─────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Canvas fills the entire center area */}
        <div className="absolute inset-0">
          {/* Ambient gold glow behind canvas */}
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/[0.008] to-transparent pointer-events-none z-0" />
          <CanvasMapView
            ref={state.canvasRef}
            mapData={state.activeMap}
            tokens={state.activeTokens}
            dmView={state.isDmView}
            activeEncounter={state.activeEncounter}
            onNextTurn={nextTurn}
            onPrevTurn={prevTurn}
            onTokenClick={(token) => handleCanvasTokenClick(token)}
            onCellClick={state.handleCellClick}
            onMoveToken={state.handleMoveToken}
          />
        </div>

        {/* Floating toolbar overlay (like Spotify player bar) */}
        <div className="relative z-20 px-3 pt-3 pointer-events-none">
          <div className="pointer-events-auto">
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
              onShare={() => setShowSharePicker(true)}
              onAoEDamage={() => setShowAoEPopover(true)}
            />
          </div>
        </div>

        {/* Bottom floating action bar */}
        <div className="absolute bottom-3 left-3 z-20">
          <CanvasActionBar
            showEncounterPanel={state.showEncounterPanel}
            showInitiative={state.showInitiative}
            activeEncounter={state.activeEncounter}
            onToggleEncounterPanel={() => {
              state.setShowEncounterPanel(!state.showEncounterPanel);
              state.setShowInitiative(false);
            }}
            onToggleInitiative={() => {
              state.setShowInitiative(!state.showInitiative);
              state.setShowEncounterPanel(false);
            }}
          />
        </div>
      </div>

      {/* ─── Right Panel ──────────────────────────── */}
      <ControlCenterRightPanel
        selectedToken={state.selectedToken}
        activeMap={state.activeMap}
        showInitiative={state.showInitiative}
        showEncounterPanel={state.showEncounterPanel}
        placementMode={state.placementMode}
        activeEncounter={state.activeEncounter}
        selectedCombatantId={state.selectedCombatantId}
        onCloseInspector={state.handleCloseInspector}
        onTokenUpdated={(updated) => state.setSelectedToken(updated)}
        onAoEPlace={state.handleAoEPlace}
      />
    </div>
  );
}
