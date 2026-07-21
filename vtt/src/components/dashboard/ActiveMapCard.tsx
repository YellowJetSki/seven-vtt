/**
 * STᚱ VTT — Active Map Card (Spotify-Grade Premium)
 *
 * Premium active map preview card inspired by Spotify's
 * album art playlist cards.
 *
 * Features:
 * - Glass gradient background with hover elevation
 * - Map thumbnail with cinematic gradient overlay
 * - Grid dimensions, token count, and quick actions
 * - Launch Theatric button integration
 * - Premium empty state with CTA
 */

import { useNavigate } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import LaunchTheatricButton from "./LaunchTheatricButton";

export default function ActiveMapCard() {
  const navigate = useNavigate();
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);

  const activeMap = battleMaps.length > 0 ? battleMaps[0] : null;
  const tokenCount = activeMap ? (mapTokens[activeMap.id]?.length ?? 0) : 0;

  return (
    <div className="relative group">
      {/* Glass gradient background */}
      <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-sm">🗺</span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              Active Map
            </span>
          </div>
        </div>

        <div className="p-4">
          {!activeMap ? (
            /* ── Empty state ── */
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-xl bg-[#0c0d15] border border-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <span className="text-lg opacity-50">🗺</span>
              </div>
              <p className="text-[11px] font-semibold text-surface-400">No Maps Yet</p>
              <p className="text-[9px] text-surface-600 mt-1 max-w-[180px] mx-auto">
                Create your first battle map to start running encounters
              </p>
              <button
                onClick={() => navigate("/campaign/maps")}
                className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 hover:shadow-[0_0_12px_rgba(234,179,8,0.06)] active:scale-95 transition-all duration-150"
              >
                → Create Map
              </button>
            </div>
          ) : (
            /* ── Active map preview ── */
            <div className="space-y-3">
              {/* Map thumbnail with cinematic overlay */}
              <div className="relative w-full h-28 rounded-lg overflow-hidden bg-[#0c0d15] border border-white/[0.04] group/preview">
                {activeMap.imageUrl ? (
                  <>
                    <img
                      src={activeMap.imageUrl}
                      alt={activeMap.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-105"
                    />
                    {/* Gradient fade to bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1019]/80 via-transparent to-transparent" />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1">
                    <span className="text-3xl opacity-30">🗺</span>
                    <span className="text-[10px] text-surface-600">{activeMap.name}</span>
                  </div>
                )}

                {/* Top edge light on hover */}
                <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover/preview:via-gold-500/20 transition-all duration-500" />
              </div>

              {/* Map info row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white/80 leading-tight">{activeMap.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-surface-500">
                      {activeMap.gridWidth}×{activeMap.gridHeight}
                    </span>
                    {tokenCount > 0 && (
                      <>
                        <span className="text-[8px] text-surface-600">·</span>
                        <span className="text-[10px] text-surface-500">{tokenCount} tokens</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate("/campaign/maps")}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] border border-white/[0.06] text-surface-400 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/[0.10] active:scale-95 transition-all duration-150"
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
    </div>
  );
}
