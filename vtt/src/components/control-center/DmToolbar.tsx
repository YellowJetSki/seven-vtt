/**
 * STᚱ VTT — DM Toolbar
 *
 * Primary toolbar for the DM's master battle map view.
 * Composed of ToolButton and ToolbarDivider sub-components.
 * Provides quick-access tools for placing tokens, toggling fog,
 * managing vision, and launching the Theatric Display.
 */

import Button from "@/components/ui/Button";
import LaunchTheatricButton from "@/components/dashboard/LaunchTheatricButton";
import ToolButton from "./ToolButton";
import ToolbarDivider from "./ToolbarDivider";

export type PlacementMode = "none" | "light" | "wall" | "door" | "token" | "aoe";

interface DmToolbarProps {
  mapName: string;
  placementMode: PlacementMode;
  showFog: boolean;
  isDmView: boolean;
  showGrid: boolean;
  onSetPlacementMode: (mode: PlacementMode) => void;
  onToggleFog: () => void;
  onToggleDmView: () => void;
  onToggleGrid: () => void;
  onRecenter: () => void;
  onAddPlayerToken: () => void;
  onAddEnemyToken: () => void;
  onBack: () => void;
}

export default function DmToolbar({
  mapName,
  placementMode,
  showFog,
  isDmView,
  showGrid,
  onSetPlacementMode,
  onToggleFog,
  onToggleDmView,
  onToggleGrid,
  onRecenter,
  onAddPlayerToken,
  onAddEnemyToken,
  onBack,
}: DmToolbarProps) {
  const isActive = (mode: PlacementMode) => placementMode === mode;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-surface-900/80 backdrop-blur-md border-b border-surface-700/20 shrink-0">
      {/* Left: Map info + back */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="text-surface-400 hover:text-surface-200 text-xs transition-colors shrink-0"
        >
          ← Back
        </button>
        <ToolbarDivider />
        <h2 className="text-sm font-bold text-surface-200 truncate">{mapName}</h2>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1.5">
        {/* Grid toggle */}
        <ToolButton
          onClick={onToggleGrid}
          active={false}
          tooltip="Toggle grid overlay"
          style={!showGrid ? { opacity: 0.5 } : undefined}
        >
          ▦
        </ToolButton>

        {/* Fog of War */}
        <ToolButton
          onClick={onToggleFog}
          variant={showFog ? "fog" : "default"}
          tooltip="Toggle fog of war"
        >
          🌫️ Fog
        </ToolButton>

        {/* DM Vision toggle */}
        <ToolButton
          onClick={onToggleDmView}
          variant={isDmView ? "dm" : "default"}
          tooltip="Toggle DM vision override"
        >
          👁 DM
        </ToolButton>

        <ToolbarDivider />

        {/* Placement tools */}
        <ToolButton onClick={onAddPlayerToken} tooltip="Add player token at center">
          🛡️ PC
        </ToolButton>
        <ToolButton onClick={onAddEnemyToken} tooltip="Add enemy token at center">
          👹 Enemy
        </ToolButton>

        <ToolButton
          onClick={() => onSetPlacementMode(isActive("light") ? "none" : "light")}
          active={isActive("light")}
          tooltip="Place light source"
        >
          💡 Light
        </ToolButton>

        <ToolButton
          onClick={() => onSetPlacementMode(isActive("aoe") ? "none" : "aoe")}
          active={isActive("aoe")}
          tooltip="Place spell area-of-effect template"
        >
          ✦ AoE
        </ToolButton>

        <ToolbarDivider />

        {/* Recenter */}
        <button
          onClick={onRecenter}
          className="px-2 py-1.5 rounded-lg text-xs bg-surface-800/30 border border-surface-700/20 text-surface-400 hover:bg-surface-700/40 hover:text-surface-200 transition-all duration-150"
          title="Recenter view"
        >
          ⌖ Center
        </button>
      </div>

      {/* Right: Theatric launcher */}
      <div className="flex items-center gap-2 shrink-0">
        <LaunchTheatricButton />
      </div>
    </div>
  );
}
