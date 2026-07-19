/**
 * STᚱ VTT — Control Center Sidebar
 *
 * Left sidebar for the DM Control Center showing all battle maps.
 * Gold-accented active state with hover glow on map items.
 * Ambient gradient overlay for depth.
 */

import { useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { BattleMap } from "@/types";

interface ControlCenterSidebarProps {
  activeMapId: string | null;
  battleMaps: BattleMap[];
  onSelectMap: (map: BattleMap) => void;
}

export default function ControlCenterSidebar({
  activeMapId,
  battleMaps,
  onSelectMap,
}: ControlCenterSidebarProps) {
  const removeBattleMap = useCampaignStore((s) => s.removeBattleMap);

  const handleDelete = useCallback(
    (e: React.MouseEvent, mapId: string) => {
      e.stopPropagation();
      removeBattleMap(mapId);
    },
    [removeBattleMap]
  );

  return (
    <div className="w-56 min-w-[14rem] max-w-[14rem] shrink-0 border-r border-white/[0.04] bg-gradient-to-b from-[#141520] to-[#0f1019] flex flex-col relative">
      {/* Ambient gold gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.015] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-3.5 py-3.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white/80 tracking-wide">
            Maps
          </span>
          <span className="text-[10px] text-surface-500 bg-surface-800/40 border border-white/[0.04] px-1.5 py-0.5 rounded-full font-mono tabular-nums">
            {battleMaps.length}
          </span>
        </div>
      </div>

      {/* Map list */}
      <div className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1 scrollbar-gold">
        {battleMaps.length === 0 && (
          <div className="text-center py-10">
            <p className="text-surface-500 text-xs">No maps</p>
            <p className="text-surface-600 text-[10px] mt-1">Create a map in Battle Maps</p>
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
                group relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200
                ${isActive
                  ? "bg-gold-500/8 text-white/90 border border-gold-500/15 shadow-[0_0_12px_rgba(234,179,8,0.04)]"
                  : "text-surface-400 hover:bg-white/[0.02] hover:text-surface-300 border border-transparent"
                }
              `}
            >
              {/* Active left glow pill */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-gold-500 shadow-[0_0_6px_rgba(234,179,8,0.3)]" />
              )}

              {/* Map icon */}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0 overflow-hidden ${
                  isActive
                    ? "bg-gold-500/12 ring-1 ring-gold-500/20"
                    : "bg-[#0c0d15] ring-1 ring-white/[0.04]"
                }`}
              >
                {map.imageUrl ? (
                  <img
                    src={map.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-base">🗺</span>
                )}
              </div>

              {/* Map info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${
                  isActive ? "text-white/90" : "text-surface-300"
                }`}>
                  {map.name}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-surface-500 mt-0.5">
                  <span className="tabular-nums">{map.gridWidth}×{map.gridHeight}</span>
                  {tokenCount > 0 && (
                    <>
                      <span className="text-white/[0.04]">·</span>
                      <span className="text-gold-500/30">{tokenCount} tokens</span>
                    </>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(e, map.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-surface-500 hover:text-red-400 transition-all duration-150"
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
