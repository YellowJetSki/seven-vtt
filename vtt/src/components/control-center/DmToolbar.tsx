/**
 * STᚱ VTT — DM Toolbar (Premium Gold)
 *
 * Primary toolbar for the DM's master battle map view.
 * Gold-accented glassmorphism with ToolButton and ToolbarDivider sub-components.
 */

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
    <div className="flex items-center justify-between px-4 py-2.5 glass-gold border-b border-gold/10 shrink-0">
      {/* Left: Map info + back */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="text-surface-400 hover:text-gold-400 text-xs transition-colors shrink-0"
        >
          ← Back
        </button>
        <ToolbarDivider />
        <h2 className="text-sm font-bold text-gold-300 truncate drop-shadow-[0_0_4px_rgba(234,179,8,0.08)]">
          {mapName}
        </h2>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1.5">
        {/* Grid toggle */}
        <ToolButton
          onClick={onToggleGrid}
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
        <ToolButton onClick={onAddPlayerToken} tooltip="Add player token">
          🛡️ PC
        </ToolButton>
        <ToolButton onClick={onAddEnemyToken} tooltip="Add enemy token">
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

        {/* Recenter — gold accent */}
        <button
          onClick={onRecenter}
          className="px-2 py-1.5 rounded-lg text-xs bg-obsidian-mid/60 border border-gold/10 text-surface-400 hover:text-gold-400 hover:border-gold/20 hover:bg-gold-500/5 transition-all duration-150"
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
