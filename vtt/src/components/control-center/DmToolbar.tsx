/**
 * STᚱ VTT — DM Toolbar
 *
 * Primary toolbar for the DM's master battle map view.
 * Provides quick-access tools for placing tokens, toggling fog,
 * managing vision, and launching the Theatric Display.
 */

import Button from "@/components/ui/Button";
import LaunchTheatricButton from "@/components/dashboard/LaunchTheatricButton";

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

  const toolBtnClass = (mode: PlacementMode) =>
    `px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
      isActive(mode)
        ? "bg-accent-600/20 border-accent-500/30 text-accent-300 shadow-sm shadow-accent-500/10"
        : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40 hover:text-surface-200 hover:border-surface-600/30"
    }`;

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
        <div className="h-4 w-px bg-surface-600/20" />
        <h2 className="text-sm font-bold text-surface-200 truncate">{mapName}</h2>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1.5">
        {/* Grid toggle */}
        <button
          onClick={onToggleGrid}
          className={toolBtnClass("none")}
          title="Toggle grid overlay"
          style={!showGrid ? { opacity: 0.5 } : undefined}
        >
          ▦
        </button>

        {/* Fog of War */}
        <button
          onClick={onToggleFog}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
            showFog
              ? "bg-mage-600/20 border-mage-500/30 text-mage-300"
              : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40"
          }`}
          title="Toggle fog of war"
        >
          🌫️ Fog
        </button>

        {/* DM Vision toggle */}
        <button
          onClick={onToggleDmView}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
            isDmView
              ? "bg-warrior-600/20 border-warrior-500/30 text-warrior-300"
              : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40"
          }`}
          title="Toggle DM vision override"
        >
          👁 DM
        </button>

        <div className="h-5 w-px bg-surface-600/20 mx-0.5" />

        {/* Placement tools */}
        <button
          onClick={() => onAddPlayerToken()}
          className={toolBtnClass("token")}
          title="Add player token at center"
        >
          🛡️ PC
        </button>
        <button
          onClick={() => onAddEnemyToken()}
          className={toolBtnClass("token")}
          title="Add enemy token at center"
        >
          👹 Enemy
        </button>

        <button
          onClick={() => onSetPlacementMode(isActive("light") ? "none" : "light")}
          className={toolBtnClass("light")}
          title="Place light source"
        >
          💡 Light
        </button>

        <button
          onClick={() => onSetPlacementMode(isActive("aoe") ? "none" : "aoe")}
          className={toolBtnClass("aoe")}
          title="Place spell area-of-effect template"
        >
          ✦ AoE
        </button>

        <div className="h-5 w-px bg-surface-600/20 mx-0.5" />

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
