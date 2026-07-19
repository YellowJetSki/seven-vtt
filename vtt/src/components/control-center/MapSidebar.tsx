/**
 * STᚱ VTT — Map Sidebar (Premium Gold)
 *
 * Gold-accented DM-side panel listing all battle maps.
 * Active map highlighted with gold glow, hover effects with gold borders.
 * Scrollable map list with delete. All tokens from `accent` → `gold` palette.
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
      {/* Gold-accented header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gold/10 shrink-0">
        <span className="text-sm font-bold text-gold-300 tracking-wide drop-shadow-[0_0_6px_rgba(234,179,8,0.1)]">
          ✦ Maps
        </span>
        <span className="text-[10px] text-gold-400/50 bg-gold-500/10 border border-gold/15 px-1.5 py-0.5 rounded-full font-mono">
          {battleMaps.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1 scrollbar-gold">
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
                group flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200
                ${isActive
                  ? "bg-gold-500/10 text-gold-300 border border-gold/25 shadow-[0_0_12px_rgba(234,179,8,0.06)]"
                  : "text-surface-400 hover:bg-gold-500/[0.04] hover:text-surface-200 border border-transparent hover:border-gold/10"
                }
              `}
            >
              {/* Map icon or thumbnail placeholder */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 overflow-hidden ${
                  isActive
                    ? "bg-gold-500/15 ring-1 ring-gold/20"
                    : "bg-obsidian-mid/60 ring-1 ring-surface-700/20"
                }`}
              >
                {map.imageUrl ? (
                  <img
                    src={map.imageUrl}
                    alt=""
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-base">🗺</span>
                )}
              </div>

              {/* Map info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${
                  isActive ? "text-gold-200" : "text-surface-300"
                }`}>
                  {map.name}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-surface-500 mt-0.5">
                  <span>{map.gridWidth}×{map.gridHeight}</span>
                  {tokenCount > 0 && (
                    <>
                      <span className="text-gold-500/30">·</span>
                      <span className="text-gold-500/40">{tokenCount} tokens</span>
                    </>
                  )}
                </div>
              </div>

              {/* Delete button — gold hover */}
              <button
                onClick={(e) => handleDelete(e, map.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/15 text-surface-500 hover:text-red-400 transition-all duration-150"
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
