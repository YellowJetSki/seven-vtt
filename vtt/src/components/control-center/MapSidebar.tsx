/**
 * STᚱ VTT — Map Sidebar
 *
 * DM-side panel listing all battle maps with active highlight.
 * Click to switch the active map displayed in the main canvas.
 */

import { useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { BattleMap } from "@/types";

interface MapSidebarProps {
  activeMapId: string | null;
  onSelectMap: (map: BattleMap) => void;
}

export default function MapSidebar({ activeMapId, onSelectMap }: MapSidebarProps) {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const removeBattleMap = useCampaignStore((s) => s.removeBattleMap);

  const handleDelete = useCallback(
    (e: React.MouseEvent, mapId: string) => {
      e.stopPropagation();
      removeBattleMap(mapId);
    },
    [removeBattleMap]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700/20 shrink-0">
        <span className="text-sm font-bold text-gradient-arcane">Maps</span>
        <span className="text-[10px] text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded-full">
          {battleMaps.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {battleMaps.length === 0 && (
          <div className="text-center py-8">
            <p className="text-surface-500 text-xs">No maps</p>
            <p className="text-surface-600 text-[10px] mt-1">Create a map to get started</p>
          </div>
        )}

        {battleMaps.map((map) => {
          const isActive = map.id === activeMapId;
          const tokenCount = useCampaignStore.getState().mapTokens[map.id]?.length ?? 0;

          return (
            <div
              key={map.id}
              onClick={() => onSelectMap(map)}
              className={`
                group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150
                ${isActive
                  ? "bg-accent-600/15 text-accent-300 border border-accent-500/20"
                  : "text-surface-400 hover:bg-surface-700/30 hover:text-surface-200 border border-transparent"
                }
              `}
            >
              {/* Map icon or thumbnail placeholder */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                  isActive ? "bg-accent-600/20" : "bg-surface-800/50"
                }`}
              >
                {map.imageUrl ? (
                  <img
                    src={map.imageUrl}
                    alt=""
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <span>🗺</span>
                )}
              </div>

              {/* Map info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${isActive ? "text-accent-200" : "text-surface-300"}`}>
                  {map.name}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-surface-500 mt-0.5">
                  <span>{map.gridWidth}×{map.gridHeight}</span>
                  {tokenCount > 0 && (
                    <>
                      <span>·</span>
                      <span>{tokenCount} tokens</span>
                    </>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, map.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-surface-500 hover:text-red-400 transition-all"
                title="Delete map"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
