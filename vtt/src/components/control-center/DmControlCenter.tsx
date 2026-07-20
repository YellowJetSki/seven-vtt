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
 * Cycle 21 Enhancement (Premium Battlemap Overhaul):
 *   - Token HP Popover: rapid DM HP adjustment directly from token click
 *   - Popover appears near the clicked token with gold glass styling
 *   - Instant HP updates: -10/-5/-1/+1/+5/+10 + custom set
 *   - Escape key or click outside to dismiss
 */

import { useCallback, useState } from "react";
import CanvasMapView from "@/components/maps/CanvasMapView";
import DmToolbar from "./DmToolbar";
import ControlCenterSidebar from "./ControlCenterSidebar";
import ControlCenterRightPanel from "./ControlCenterRightPanel";
import ControlCenterEmptyState from "./ControlCenterEmptyState";
import CanvasActionBar from "./CanvasActionBar";
import DmSharePicker from "./DmSharePicker";
import TokenHpPopover from "./TokenHpPopover";
import { useDmControlCenter } from "./useDmControlCenter";
import type { MapToken } from "@/types";

export default function DmControlCenter() {
  const state = useDmControlCenter();
  const [showSharePicker, setShowSharePicker] = useState(false);

  /**
   * Enhanced canvas click handler: extracts click position for the HP popover
   * and delegates to the hook's enhanced token click handler.
   */
  const handleCanvasTokenClick = useCallback(
    (token: MapToken, _clientX?: number, _clientY?: number) => {
      // Use the enhanced click handler from the hook which opens both popover + inspector
      state.handleTokenClickEx(token, _clientX ?? 0, _clientY ?? 0);
    },
    [state.handleTokenClickEx]
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
            onTokenClick={(token) => {
              // Enhanced: pass click position via mouse event
              // The CanvasMapView's onClick already gives us clientX/clientY
              handleCanvasTokenClick(token);
            }}
            onCellClick={state.handleCellClick}
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
