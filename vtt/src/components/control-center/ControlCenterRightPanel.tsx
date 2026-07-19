/**
 * STᚱ VTT — Control Center Right Panel
 *
 * Unified right panel manager for the DM Control Center.
 * Shows one of: TokenInspector | InitiativeTracker | EncounterPanel | AoEPlacementTool
 * Panel slides in/out with smooth transitions via conditional mounting.
 *
 * This panel has strict width boundaries (w-72/288px) to prevent canvas squishing.
 */

import TokenInspector from "./TokenInspector";
import InitiativeTracker from "./InitiativeTracker";
import EncounterPanel from "./EncounterPanel";
import AoEPlacementTool from "@/components/maps/AoEPlacementTool";
import type { MapToken, BattleMap, CombatEncounter, AoETemplate } from "@/types";
import type { PlacementMode } from "./DmToolbar";

interface ControlCenterRightPanelProps {
  selectedToken: MapToken | null;
  activeMap: BattleMap;
  showInitiative: boolean;
  showEncounterPanel: boolean;
  placementMode: PlacementMode;
  activeEncounter: CombatEncounter | null;
  selectedCombatantId: string | undefined;
  onCloseInspector: () => void;
  onTokenUpdated: (token: MapToken) => void;
  onAoEPlace: (template: AoETemplate) => void;
}

export default function ControlCenterRightPanel({
  selectedToken,
  activeMap,
  showInitiative,
  showEncounterPanel,
  placementMode,
  activeEncounter,
  selectedCombatantId,
  onCloseInspector,
  onTokenUpdated,
  onAoEPlace,
}: ControlCenterRightPanelProps) {
  // Token Inspector (highest priority)
  if (selectedToken) {
    return (
      <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-white/[0.04] bg-gradient-to-bl from-[#141520] to-[#0f1019] flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.015] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <TokenInspector
            token={selectedToken}
            mapId={activeMap.id}
            onClose={onCloseInspector}
            onTokenUpdated={onTokenUpdated}
          />
        </div>
      </div>
    );
  }

  // Initiative Tracker
  if (showInitiative && activeEncounter) {
    return (
      <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-white/[0.04] bg-gradient-to-bl from-[#141520] to-[#0f1019] flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.015] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <InitiativeTracker
            encounter={activeEncounter}
            onSelectCombatant={() => {}}
            selectedCombatantId={selectedCombatantId}
          />
        </div>
      </div>
    );
  }

  // AoE Placement Tool
  if (placementMode === "aoe") {
    return (
      <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-white/[0.04] bg-gradient-to-bl from-[#141520] to-[#0f1019] flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.015] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full p-3 overflow-y-auto">
          {/* Panel header */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.04]">
            <span className="text-xs font-bold text-white/60 uppercase tracking-wide">
              ✦ Spell Templates
            </span>
          </div>
          <AoEPlacementTool mapId={activeMap.id} onPlace={onAoEPlace} />
        </div>
      </div>
    );
  }

  // Encounter Panel
  if (showEncounterPanel) {
    return (
      <div className="w-72 min-w-[18rem] max-w-[18rem] shrink-0 border-l border-white/[0.04] bg-gradient-to-bl from-[#141520] to-[#0f1019] flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-bl from-gold-500/[0.015] to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col h-full">
          <EncounterPanel
            mapId={activeMap.id}
            onTokensAdded={() => {}}
          />
        </div>
      </div>
    );
  }

  // No panel — render nothing, canvas takes full width
  return null;
}
