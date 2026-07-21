/**
 * STᚱ VTT — DM Toolbar (Floating Glass — Premium)
 *
 * Floating toolbar that overlays the canvas (like Spotify's player bar).
 * Uses glass-blur with gold edge lighting and premium button styling.
 * Composed of ToolButton and ToolbarDivider sub-components.
 */

import LaunchTheatricButton from "@/components/dashboard/LaunchTheatricButton";
import ToolButton from "./ToolButton";

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
  onShare?: () => void;
  onAoEDamage?: () => void;
  onRest?: () => void;
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
  onShare, onAoEDamage, onRest,
}: DmToolbarProps) {
  const isActive = (mode: PlacementMode) => placementMode === mode;

  return (
    <div className="relative flex items-center justify-between px-3 py-2 rounded-xl bg-[#12131e]/85 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.03)]">
      {/* Top gold edge */}
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent pointer-events-none" />

      {/* Left: Back + Map name */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          className="text-[10px] text-surface-400 hover:text-gold-400 transition-colors font-medium px-1.5 py-1 rounded hover:bg-gold-500/5"
        >
          ← Back
        </button>
        <div className="w-px h-6 bg-white/[0.06]" />
        <h2 className="text-xs font-bold text-white/80 truncate drop-shadow-[0_0_4px_rgba(255,215,0,0.06)] max-w-[120px]">
          {mapName}
        </h2>
      </div>

      {/* Center: Tools */}
      <div className="flex items-center gap-1">
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
          active={showFog}
          tooltip="Toggle fog of war"
          variant="fog"
        >
          🌫️
        </ToolButton>

        {/* DM Vision */}
        <ToolButton
          onClick={onToggleDmView}
          active={isDmView}
          tooltip="Toggle DM vision override"
          variant="dm"
        >
          👁
        </ToolButton>

        <div className="w-px h-6 bg-white/[0.06]" />

        {/* Token tools */}
        <ToolButton onClick={onAddPlayerToken} tooltip="Add player token">
          🛡️
        </ToolButton>
        <ToolButton onClick={onAddEnemyToken} tooltip="Add enemy token">
          👹
        </ToolButton>

        <div className="w-px h-6 bg-white/[0.06]" />

        {/* Placement tools */}
        <ToolButton
          onClick={() => onSetPlacementMode(isActive("aoe") ? "none" : "aoe")}
          active={isActive("aoe")}
          tooltip="Place spell AoE template"
        >
          ✦
        </ToolButton>

        {/* Recenter */}
        <button
          onClick={onRecenter}
          className="px-2 py-1.5 rounded-lg text-[10px] bg-[#0c0d15] border border-white/[0.06] text-surface-400 hover:text-gold-400 hover:border-gold-500/15 hover:bg-gold-500/5 transition-all duration-200 font-medium active:scale-90"
          title="Recenter view"
        >
          ⌖
        </button>
      </div>

      {/* Rest button */}
      {onRest && (
        <>
          <div className="w-px h-6 bg-white/[0.06]" />
          <button
            onClick={onRest}
            className="px-2 py-1.5 rounded-lg text-[10px] bg-[#0c0d15] border border-white/[0.06] text-surface-400 hover:text-emerald-400 hover:border-emerald-500/15 hover:bg-emerald-500/5 transition-all duration-200 font-medium flex items-center gap-1 active:scale-90"
            title="Apply Short or Long Rest to the party"
          >
            <span>😴</span>
            <span>Rest</span>
          </button>
        </>
      )}

      {/* Right: Theatric launcher + Share + AoE */}
      <div className="flex items-center gap-2 shrink-0">
        {onAoEDamage && (
          <button
            onClick={onAoEDamage}
            className="px-2 py-1.5 rounded-lg text-[10px] bg-[#0c0d15] border border-white/[0.06] text-surface-400 hover:text-rose-400 hover:border-rose-500/15 hover:bg-rose-500/5 transition-all duration-200 font-medium flex items-center gap-1 active:scale-90"
            title="Apply AoE damage to multiple targets"
          >
            <span>💥</span>
            <span>AoE</span>
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="px-2 py-1.5 rounded-lg text-[10px] bg-[#0c0d15] border border-white/[0.06] text-surface-400 hover:text-cyan-400 hover:border-cyan-500/15 hover:bg-cyan-500/5 transition-all duration-200 font-medium active:scale-90"
            title="Share image to player screens"
          >
            Share
          </button>
        )}
        <LaunchTheatricButton />
      </div>
    </div>
  );
}
