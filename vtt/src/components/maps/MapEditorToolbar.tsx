/* ── MapEditorToolbar ──────────────────────────────────────────
 * Toolbar for the map editor: view toggle, fog, AOE templates,
 * drawing, grid, and theatric view.
 * ─────────────────────────────────────────────────────────────── */

import type { MapToken } from "@/types";
import { Button } from "@/components/ui/Button";

interface Props {
  gmView: boolean;
  showFog: boolean;
  showFogControls: boolean;
  drawingEnabled: boolean;
  showGrid: boolean;
  hasSelectedToken: boolean;
  showAoePanel: boolean;
  onToggleGmView: () => void;
  onToggleFog: () => void;
  onToggleFogControls: () => void;
  onToggleAoePanel: () => void;
  onAddToken: () => void;
  onToggleDrawing: () => void;
  onToggleGrid: () => void;
  onOpenTheatric?: (token: MapToken) => void;
  selectedToken: MapToken | null;
}

export function MapEditorToolbar({
  gmView, showFog, showFogControls, drawingEnabled, showGrid,
  showAoePanel, hasSelectedToken,
  onToggleGmView, onToggleFog, onToggleFogControls, onToggleAoePanel,
  onAddToken, onToggleDrawing, onToggleGrid,
  onOpenTheatric, selectedToken,
}: Props) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={onToggleGmView}
          className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${gmView ? "bg-accent-600 text-white" : "bg-surface-800 text-surface-400"}`}>
          {gmView ? "DM" : "Player"}
        </button>
        <button onClick={onToggleFog}
          className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${showFog ? "bg-surface-800 text-surface-300" : "bg-surface-800 text-surface-500 opacity-50"}`}>
          {showFog ? "Fog On" : "Fog Off"}
        </button>
        <Button size="xs" variant="ghost" onClick={onToggleFogControls}>
          {showFogControls ? "Hide Zones" : "Reveal Zones"}
        </Button>
        <Button size="xs" variant={showAoePanel ? "default" : "ghost"} onClick={onToggleAoePanel}>
          ✦ AOE
        </Button>
        <Button size="xs" onClick={onAddToken}>+ Token</Button>
        <Button size="xs" variant={drawingEnabled ? "default" : "ghost"} onClick={onToggleDrawing}>
          🎨 Draw
        </Button>
        <button onClick={onToggleGrid}
          className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${showGrid ? "bg-surface-800 text-surface-300" : "bg-surface-800 text-surface-500 opacity-50"}`}>
          {showGrid ? "Grid" : "No Grid"}
        </button>
        {onOpenTheatric && selectedToken && (
          <Button size="xs" variant="ghost" onClick={() => onOpenTheatric(selectedToken)}>🎭 Theatric</Button>
        )}
      </div>
    </div>
  );
}
