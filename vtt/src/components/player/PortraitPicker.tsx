/**
 * STᚱ VTT — PortraitPicker
 *
 * Image URL input with live preview, gallery toggle, and error handling.
 * Extracted from PlayerCreateModal.tsx monolith (Sprint 10 refactor).
 */

import { useState } from "react";
import AssetBrowser from "@/components/ui/AssetBrowser";
import type { AssetEntry } from "@/images/assetCatalog";

interface PortraitPickerProps {
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
}

export default function PortraitPicker({ imageUrl, onImageUrlChange }: PortraitPickerProps) {
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[10px] uppercase tracking-widest font-black text-gold-500/60">
          Portrait <span className="text-surface-600">(optional)</span>
        </label>
        <button
          onClick={() => setShowGallery(!showGallery)}
          className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition-all ${
            showGallery
              ? "bg-gold-500/10 border border-gold-500/20 text-gold-400"
              : "bg-white/[0.04] border border-white/[0.06] text-surface-500 hover:text-surface-300"
          }`}
        >
          {showGallery ? "\u2715 Close Gallery" : "\uD83C\uDFA8 Browse Art"}
        </button>
      </div>

      {showGallery ? (
        <div className="bg-[#0c0d15] border border-white/[0.04] rounded-xl p-3">
          <AssetBrowser
            category="portrait"
            currentId={selectedAssetId ?? undefined}
            onSelect={(asset: AssetEntry) => {
              setSelectedAssetId(asset.id);
              onImageUrlChange(asset.imageUrl || asset.svg);
              setImagePreviewError(false);
              setShowGallery(false);
            }}
            showUrlMode
            onUrlSubmit={(url: string) => {
              onImageUrlChange(url);
              setImagePreviewError(false);
              setShowGallery(false);
            }}
          />
        </div>
      ) : (
        <>
          <input
            value={imageUrl}
            onChange={(e) => {
              onImageUrlChange(e.target.value);
              setImagePreviewError(false);
              setSelectedAssetId(null);
            }}
            placeholder="https://i.imgur.com/example.jpg"
            className="w-full bg-obsidian-mid/60 border border-surface-700/30 rounded-xl px-3.5 py-2.5 text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all font-mono text-[11px]"
          />

          {/* Live preview */}
          {imageUrl.trim() && (
            <div className="mt-2 relative w-full h-24 rounded-xl overflow-hidden border border-surface-700/30">
              {imageUrl.trim().startsWith("<svg") ? (
                <div className="w-full h-full flex items-center justify-center bg-obsidian-mid/40">
                  <div
                    className="w-16 h-16"
                    dangerouslySetInnerHTML={{ __html: imageUrl.trim() }}
                  />
                </div>
              ) : (
                <>
                  <img
                    src={imageUrl.trim()}
                    alt="Preview"
                    onError={() => setImagePreviewError(true)}
                    onLoad={() => setImagePreviewError(false)}
                    className={`w-full h-full object-cover ${imagePreviewError ? "hidden" : ""}`}
                  />
                  {imagePreviewError && (
                    <div className="w-full h-full flex items-center justify-center bg-obsidian-mid/60">
                      <span className="text-[10px] text-rose-400">Could not load image</span>
                    </div>
                  )}
                  {!imagePreviewError && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-obsidian/80 to-transparent h-8" />
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
