/* ── Theatric Sidebar Component ────────────────────────────────
 * Minimal sidebar for the theatric view showing map info and controls.
 * ─────────────────────────────────────────────────────────────── */

import type { BattleMap } from "@/types";

interface TheatricSidebarProps {
  map: BattleMap | null;
  tokenId: string;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function TheatricSidebar({ map, tokenId, fullscreen, onToggleFullscreen }: TheatricSidebarProps) {
  const currentToken = map?.tokens?.find((t) => t.id === tokenId);

  return (
    <div className="flex w-56 flex-col gap-4 border-r border-surface-700 bg-surface-850 p-4">
      <div>
        <h2 className="text-sm font-bold text-surface-200 truncate">
          {map?.name ?? "Theatric View"}
        </h2>
        {map && (
          <p className="mt-0.5 text-[10px] text-surface-500">
            {map.gridWidth} × {map.gridHeight} · {map.tokens?.length ?? 0} tokens
          </p>
        )}
      </div>

      {currentToken && (
        <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
          <p className="text-[10px] text-surface-500 uppercase tracking-wider">Current Token</p>
          <p className="mt-1 text-sm font-medium text-surface-200">{currentToken.label}</p>
          {currentToken.hp && (
            <p className="text-xs text-surface-400">
              HP: {currentToken.hp.current}/{currentToken.hp.max}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={onToggleFullscreen}
          className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-surface-300 hover:text-surface-100 transition-colors"
        >
          {fullscreen ? "⛶ Exit Fullscreen" : "⛶ Fullscreen"}
        </button>
        <button
          onClick={() => window.close()}
          className="rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-surface-300 hover:text-surface-100 transition-colors"
        >
          ✕ Close
        </button>
      </div>
    </div>
  );
}
