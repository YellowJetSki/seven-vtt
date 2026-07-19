/**
 * STᚱ VTT — Active Map Card (DM War Room)
 *
 * Shows the currently active battle map with token count,
 * grid dimensions, and a "Launch Theatric" quick-action.
 *
 * If no map is selected, shows a prompt to open Battle Maps.
 */

import { useNavigate } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import LaunchTheatricButton from "./LaunchTheatricButton";

export default function ActiveMapCard() {
  const navigate = useNavigate();
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);

  // Pick the first map (or none)
  const activeMap = battleMaps.length > 0 ? battleMaps[0] : null;
  const tokenCount = activeMap ? (mapTokens[activeMap.id]?.length ?? 0) : 0;

  return (
    <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-sm">🗺</span>
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
            Active Map
          </span>
        </div>
      </div>

      <div className="p-4">
        {!activeMap ? (
          /* ── No map selected ── */
          <div className="text-center py-3">
            <p className="text-surface-500 text-xs">No maps created yet</p>
            <p className="text-surface-600 text-[10px] mt-1">Create a map in Battle Maps</p>
            <button
              onClick={() => navigate("/campaign/battle-maps")}
              className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all duration-150"
            >
              → Open Battle Maps
            </button>
          </div>
        ) : (
          /* ── Active map ── */
          <div className="space-y-3">
            {/* Map thumbnail */}
            <div className="w-full h-24 rounded-lg bg-[#0c0d15] overflow-hidden border border-white/[0.04] flex items-center justify-center">
              {activeMap.imageUrl ? (
                <img
                  src={activeMap.imageUrl}
                  alt={activeMap.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">🗺</span>
                  <span className="text-[9px] text-surface-500">{activeMap.name}</span>
                </div>
              )}
            </div>

            {/* Map info */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white/80">{activeMap.name}</p>
                <p className="text-[10px] text-surface-500 mt-0.5">
                  {activeMap.gridWidth}×{activeMap.gridHeight} grid
                  {tokenCount > 0 && <> · {tokenCount} tokens</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/campaign/battle-maps")}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-surface-400 hover:text-white/80 hover:bg-white/[0.06] active:scale-95 transition-all duration-150"
                >
                  Open
                </button>
                <LaunchTheatricButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
