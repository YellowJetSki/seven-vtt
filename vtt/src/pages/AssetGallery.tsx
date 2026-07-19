/**
 * STᚱ VTT — Asset Gallery
 *
 * A standalone page where DMs can browse, preview, and copy
 * all built-in visual assets. Assets are organized by category:
 * Portraits, Tokens, Maps, Items.
 *
 * The DM can:
 * - Browse by category
 * - Search by name or tag
 * - Preview at full size
 * - Copy the asset ID or SVG for use in character/map/item creation
 * - Switch to "Copy SVG" mode to paste into the image URL field
 *
 * Route: /campaign/assets (registered in App.tsx)
 */

import { useState, useCallback, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import {
  ALL_ASSETS,
  getAssetsByCategory,
  type AssetCategory,
  type AssetEntry,
} from "@/images/assetCatalog";

const CATEGORIES: { key: AssetCategory; label: string; icon: string }[] = [
  { key: "portrait", label: "Portraits", icon: "👤" },
  { key: "token", label: "Tokens", icon: "🎯" },
  { key: "map", label: "Maps", icon: "🗺" },
  { key: "item", label: "Items", icon: "📦" },
];

function AssetPreview({ asset, onClose }: { asset: AssetEntry; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopySvg = useCallback(() => {
    navigator.clipboard.writeText(asset.svg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [asset.svg]);

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(asset.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [asset.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.06] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview */}
        <div className="flex items-center justify-center mb-4">
          <div
            className="w-32 h-32 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${asset.color}15` }}
          >
            <div className="w-28 h-28" dangerouslySetInnerHTML={{ __html: asset.svg }} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white/90 text-center">{asset.label}</h3>
        <p className="text-xs text-surface-500 text-center mt-1 capitalize">{asset.category} asset</p>

        {/* Tags */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-3">
          {asset.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-surface-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleCopySvg}
            className="flex-1 py-2 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-semibold hover:bg-gold-500/15 active:scale-95 transition-all"
          >
            {copied ? "✓ Copied!" : "Copy SVG"}
          </button>
          <button
            onClick={handleCopyId}
            className="flex-1 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-surface-400 text-xs font-semibold hover:text-surface-200 active:scale-95 transition-all"
          >
            Copy Asset ID
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 py-2 text-[11px] text-surface-500 hover:text-surface-300 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function AssetGallery() {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("portrait");
  const [search, setSearch] = useState("");
  const [previewAsset, setPreviewAsset] = useState<AssetEntry | null>(null);

  const assets = useMemo(() => {
    const filtered = getAssetsByCategory(activeCategory);
    if (!search) return filtered;
    return filtered.filter(
      (a) =>
        a.label.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );
  }, [activeCategory, search]);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#181a2a]/80 via-[#12131e]/85 to-[#0c0d15]/90 border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 opacity-[0.04] bg-[conic-gradient(from_0deg,transparent_0%,rgba(234,179,8,0.3)_20%,transparent_40%,rgba(234,179,8,0.15)_60%,transparent_80%)]" />
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
            <div className="relative z-10 p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/15 flex items-center justify-center">
                  <span className="text-xl">🎨</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white/95">Asset Gallery</h1>
                  <p className="text-xs text-surface-400 mt-1">
                    Browse built-in fantasy assets for your campaign — portraits, tokens, maps, and items.
                  </p>
                  <p className="text-[9px] text-surface-500 mt-1">
                    {ALL_ASSETS.length} assets total
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category tabs + Search */}
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '80ms' }}>
          <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
            {/* Category tabs */}
            <div className="flex border-b border-white/[0.04]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex-1 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeCategory === cat.key
                      ? "text-gold-400 bg-gold-500/5 border-b-2 border-gold-500"
                      : "text-surface-500 hover:text-surface-300 hover:bg-white/[0.02]"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/[0.04]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${activeCategory} assets...`}
                className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 placeholder:text-surface-700"
              />
            </div>

            {/* Asset grid */}
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-surface-500">
                  {assets.length} {activeCategory}{assets.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => setPreviewAsset(asset)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#0c0d15] border border-white/[0.04] hover:border-gold-500/15 hover:bg-white/[0.02] transition-all active:scale-95 group"
                    title={asset.label}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${asset.color}15` }}
                    >
                      <div className="w-8 h-8" dangerouslySetInnerHTML={{ __html: asset.svg }} />
                    </div>
                    <span className="text-[7px] text-surface-500 group-hover:text-surface-400 text-center leading-tight truncate w-full">
                      {asset.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Empty state */}
              {assets.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-surface-500">No assets match your search</p>
                  <button
                    onClick={() => setSearch("")}
                    className="mt-2 text-[10px] text-gold-400 hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewAsset && (
        <AssetPreview asset={previewAsset} onClose={() => setPreviewAsset(null)} />
      )}
    </AppShell>
  );
}
