/**
 * STᚱ VTT — Asset Browser (SVG + PNG)
 *
 * A searchable, filterable, gallery-style component that lets DMs
 * browse and select built-in visual assets for:
 *   - Player character portraits
 *   - Battle-map token icons
 *   - Battle-map thumbnails
 *   - Item/spell icons
 *
 * Supports BOTH inline SVG assets (zero-latency) and PNG imageUrl
 * assets (from /public/images/). PNG assets are prioritized when
 * available, with SVG as fallback on load failure.
 *
 * Usage:
 *   <AssetBrowser
 *     category="portrait"
 *     onSelect={(asset) => setImage(asset.svg || asset.imageUrl)}
 *   />
 *
 * The DM can also paste an external URL via the URL mode toggle.
 */

import { useState, useMemo } from "react";
import {
  getAllAssetsForCategory,
  type AssetCategory,
  type AssetEntry,
} from "@/images/assetCatalog";

interface AssetBrowserProps {
  category: AssetCategory;
  onSelect: (asset: AssetEntry) => void;
  /** If provided, highlights the currently selected asset */
  currentId?: string;
  /** Custom class for the container */
  className?: string;
  /** Show the "External URL" mode toggle */
  showUrlMode?: boolean;
  /** Called when user enters a custom URL */
  onUrlSubmit?: (url: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  portrait: "Character Portraits",
  token: "Token Icons",
  map: "Battle Maps",
  item: "Item Icons",
};

export default function AssetBrowser({
  category,
  onSelect,
  currentId,
  className = "",
  showUrlMode = false,
  onUrlSubmit,
}: AssetBrowserProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // ── Assets: SVG + PNG combined ──
  const assets = useMemo(() => {
    const all = getAllAssetsForCategory(category);
    if (!search && !selectedTag) return all;

    return all.filter((a) => {
      const matchesSearch =
        !search ||
        a.label.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesTag = !selectedTag || a.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [category, search, selectedTag]);

  // ── Tags ──
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    getAllAssetsForCategory(category).forEach((a) =>
      a.tags.forEach((t) => tagSet.add(t))
    );
    return Array.from(tagSet).sort();
  }, [category]);

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (trimmed && onUrlSubmit) {
      onUrlSubmit(trimmed);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
          {CATEGORY_LABELS[category] ?? category}
        </p>
        <p className="text-[9px] text-surface-500">{assets.length} assets</p>
      </div>

      {/* Search + URL toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-surface-500 pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="w-full py-1.5 pl-7 pr-2 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 placeholder:text-surface-700"
          />
        </div>
        {showUrlMode && (
          <button
            onClick={() => {
              setShowUrl(!showUrl);
              setUrlInput("");
            }}
            className={`px-2 py-1.5 rounded-lg text-[9px] font-semibold transition-all duration-150 ${
              showUrl
                ? "bg-gold-500/10 border border-gold-500/20 text-gold-400"
                : "bg-white/[0.04] border border-white/[0.06] text-surface-500 hover:text-surface-300"
            }`}
          >
            URL
          </button>
        )}
      </div>

      {/* External URL input */}
      {showUrl && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://i.imgur.com/example.jpg"
            className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 placeholder:text-surface-700"
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
          />
          <button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim()}
            className="px-2 py-1.5 rounded-lg text-[9px] font-semibold bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Apply
          </button>
        </div>
      )}

      {/* Tag chips */}
      {allTags.length > 0 && !search && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
              !selectedTag
                ? "bg-gold-500/10 border border-gold-500/20 text-gold-400"
                : "bg-white/[0.04] border border-transparent text-surface-500 hover:text-surface-300"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                selectedTag === tag
                  ? "bg-gold-500/10 border border-gold-500/20 text-gold-400"
                  : "bg-white/[0.04] border border-transparent text-surface-500 hover:text-surface-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Asset grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto scrollbar-gold pr-1">
        {assets.map((asset) => {
          const isSelected = asset.id === currentId;
          const hasPng = asset.imageUrl != null && asset.imageUrl.length > 0;

          return (
            <button
              key={asset.id}
              onClick={() => onSelect(asset)}
              className={`relative group flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150 active:scale-95 ${
                isSelected
                  ? "bg-gold-500/10 border border-gold-500/25 shadow-[0_0_8px_rgba(234,179,8,0.08)]"
                  : "bg-[#0c0d15] border border-white/[0.04] hover:border-white/[0.12] hover:bg-white/[0.02]"
              }`}
              title={asset.label}
            >
              {/* Preview: PNG image or SVG inline */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-cover bg-center"
                style={{
                  backgroundColor: `${asset.color}15`,
                  ...(hasPng ? { backgroundImage: `url(${asset.imageUrl})` } : {}),
                }}
              >
                {hasPng ? (
                  <img
                    src={asset.imageUrl!}
                    alt={asset.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback to SVG if PNG fails
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const parent = el.parentElement;
                      if (parent) {
                        parent.style.backgroundImage = "none";
                      }
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8"
                    dangerouslySetInnerHTML={{ __html: asset.svg }}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[7px] text-center leading-tight truncate w-full ${
                  isSelected ? "text-gold-400" : "text-surface-500 group-hover:text-surface-400"
                }`}
              >
                {asset.label}
              </span>

              {/* PNG indicator dot */}
              {hasPng && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_3px_rgba(52,211,153,0.4)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Empty state */}
      {assets.length === 0 && (
        <div className="text-center py-6">
          <p className="text-xs text-surface-500">No assets found</p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedTag(null);
            }}
            className="mt-2 text-[10px] text-gold-400 hover:text-gold-300 underline underline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
