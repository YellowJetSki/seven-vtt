/**
 * STᚱ VTT — BattleMapAssetPanel
 *
 * Reusable panel for browsing and selecting battlemap PNG assets.
 * Shows all _enc.png maps with preview thumbnails.
 * Used by: MapCreatorModal, ControlCenterSidebar
 *
 * Architecture:
 *   Assets sourced from getAllAssetsForCategory("map")
 *   Filtered to only show PNG assets (imageUrl present)
 *   Each asset's imageUrl = "/images/maps/{filename}"
 *   Vite serves these from /public/images/maps/
 */

import { useState, useMemo } from "react";
import { getAllAssetsForCategory, type AssetEntry } from "@/images/assetCatalog";
import AssetImage from "@/components/ui/AssetImage";

interface BattleMapAssetPanelProps {
  /** Called when DM selects a map asset */
  onSelect: (asset: AssetEntry) => void;
  /** Currently selected asset ID (for highlight) */
  currentId?: string;
  /** Custom class */
  className?: string;
}

export default function BattleMapAssetPanel({
  onSelect,
  currentId,
  className = "",
}: BattleMapAssetPanelProps) {
  const [search, setSearch] = useState("");

  const mapAssets = useMemo(() => {
    const all = getAllAssetsForCategory("map");
    const pngs = all.filter((a) => a.imageUrl && a.imageUrl.length > 0);
    if (!search) return pngs;

    const q = search.toLowerCase();
    return pngs.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [search]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search */}
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-surface-500 pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search battle maps..."
          className="w-full py-1.5 pl-7 pr-2 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 placeholder:text-surface-700"
        />
      </div>

      {/* Asset Grid */}
      {mapAssets.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[10px] text-surface-500">No maps match your search.</p>
          <p className="text-[8px] text-surface-600 mt-1">Try: boathouse, prison, forest</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto scrollbar-gold pr-1">
          {mapAssets.map((asset) => {
            const isSelected = asset.id === currentId;

            return (
              <button
                key={asset.id}
                onClick={() => onSelect(asset)}
                className={`relative group flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? "bg-gold-500/10 border border-gold-500/25 shadow-[0_0_8px_rgba(234,179,8,0.08)]"
                    : "bg-[#0c0d15] border border-white/[0.04] hover:border-white/[0.12] hover:bg-white/[0.02]"
                }`}
                title={asset.label}
              >
                {/* Thumbnail */}
                <AssetImage
                  asset={asset}
                  className="w-full aspect-[4/3] rounded-lg"
                  alt={asset.label}
                  fill={true}
                />

                {/* Label */}
                <span
                  className={`text-[7px] text-center leading-tight truncate w-full ${
                    isSelected ? "text-gold-400" : "text-surface-500 group-hover:text-surface-400"
                  }`}
                >
                  {asset.label}
                </span>

                {/* Selected indicator */}
                {isSelected && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_4px_rgba(234,179,8,0.4)]" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p className="text-[8px] text-surface-600 text-center">
        {mapAssets.length} battle map{mapAssets.length !== 1 ? "s" : ""} available
      </p>
    </div>
  );
}
