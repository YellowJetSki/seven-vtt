/**
 * STᚱ VTT — AssetImage
 *
 * Reusable component for rendering both SVG inline assets and PNG image
 * assets with loading state, error fallback, and accessibility.
 *
 * Supports three modes:
 *   1. SVG inline: asset.svg is rendered via dangerouslySetInnerHTML
 *   2. PNG image: asset.imageUrl is loaded as <img>
 *   3. External URL: direct <img> with cross-origin support
 *
 * Usage:
 *   <AssetImage asset={asset} className="w-12 h-12" />
 *   <AssetImage src="/images/maps/boathouse_enc.png" className="w-full h-32" />
 *
 * Architecture:
 *   PNG assets are served from /public/images/{category}/{filename}
 *   via Vite's static asset pipeline. The copy-assets Vite plugin
 *   ensures files are synced from /images/ to /public/images/.
 */

import { useState, useCallback } from "react";
import type { AssetEntry } from "@/images/assetCatalog";
import { useAssetImage } from "@/hooks/useAssetImage";

interface AssetImageProps {
  /** Asset entry (from assetCatalog) — provides svg, imageUrl, color */
  asset?: AssetEntry | null;
  /** Direct URL override (takes priority over asset) */
  src?: string;
  /** CSS class for the container */
  className?: string;
  /** Image alt text */
  alt?: string;
  /** Background color override */
  bgColor?: string;
  /** Whether to fill the container (object-cover) */
  fill?: boolean;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

export default function AssetImage({
  asset,
  src: srcOverride,
  className = "w-12 h-12",
  alt = "Asset",
  bgColor,
  fill = true,
  onLoad,
  onError,
}: AssetImageProps) {
  const effectiveAsset = asset ?? null;
  const { src, isLoading, hasError, fallbackColor, isSvg, retry } = useAssetImage(effectiveAsset);
  const displaySrc = srcOverride || src;
  const bg = bgColor || fallbackColor;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleLoad = useCallback(() => {
    setImgLoaded(true);
    setImgError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImgError(true);
    setImgLoaded(false);
    onError?.();
    // Auto-retry once
    retry();
  }, [onError, retry]);

  // Loading state
  if (isLoading || (!imgLoaded && !imgError && !isSvg && displaySrc)) {
    return (
      <div
        className={`${className} rounded-lg flex items-center justify-center animate-pulse-soft`}
        style={{ backgroundColor: `${bg}20` }}
        role="status"
        aria-label="Loading asset"
      >
        <div
          className="w-1/3 h-1/3 rounded-full animate-ping"
          style={{ backgroundColor: `${bg}40` }}
        />
      </div>
    );
  }

  // Error state
  if (hasError || imgError) {
    return (
      <div
        className={`${className} rounded-lg flex flex-col items-center justify-center gap-1`}
        style={{ backgroundColor: `${bg}10` }}
        role="img"
        aria-label={`Failed to load: ${alt}`}
      >
        <span className="text-[9px] opacity-40">✦</span>
        <span
          className="w-1/2 h-[2px] rounded-full"
          style={{ backgroundColor: `${bg}30` }}
        />
        <button
          onClick={() => {
            setImgError(false);
            retry();
          }}
          className="text-[7px] text-surface-500 hover:text-surface-300 mt-1 transition-colors"
          title="Retry loading"
        >
          ↻
        </button>
      </div>
    );
  }

  // SVG inline rendering
  if (isSvg && displaySrc) {
    return (
      <div
        className={`${className} rounded-lg flex items-center justify-center overflow-hidden`}
        style={{ backgroundColor: `${bg}15` }}
        role="img"
        aria-label={alt}
      >
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: displaySrc }}
        />
      </div>
    );
  }

  // PNG / external image rendering
  if (displaySrc && !displaySrc.startsWith("<svg")) {
    return (
      <div
        className={`${className} rounded-lg overflow-hidden flex items-center justify-center`}
        style={{
          backgroundColor: `${bg}15`,
          ...(!imgLoaded ? {} : {}),
        }}
        role="img"
        aria-label={alt}
      >
        <img
          src={displaySrc}
          alt={alt}
          className={`w-full h-full ${fill ? "object-cover" : "object-contain"}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  // Empty/null state
  return (
    <div
      className={`${className} rounded-lg flex items-center justify-center`}
      style={{ backgroundColor: `${bg}8` }}
      role="img"
      aria-label={alt}
    >
      <span className="text-[10px] opacity-30">✦</span>
    </div>
  );
}
