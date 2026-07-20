/**
 * STᚱ VTT — useAssetImage
 *
 * Hook for loading and managing PNG/SVG asset images.
 * Provides fallback handling, loading states, and error recovery.
 *
 * Handles three asset types:
 *   1. Inline SVG (asset.svg) — rendered via dangerouslySetInnerHTML
 *   2. PNG image URL (asset.imageUrl) — loaded as <img>, e.g. /images/tokens/bengo_bm.png
 *   3. External URL — any http/https URL
 *
 * Usage:
 *   const { src, isLoading, hasError, fallbackColor } = useAssetImage(asset);
 *
 *   // In JSX:
 *   {isLoading && <div className="..." style={{backgroundColor: fallbackColor}} />}
 *   {!isLoading && !hasError && <img src={src} />}
 *   {hasError && <div>Fallback content</div>}
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { AssetEntry } from "@/images/assetCatalog";

export interface UseAssetImageResult {
  /** The image URL or SVG string to render */
  src: string;
  /** Whether the image is still loading (PNG/external only) */
  isLoading: boolean;
  /** Whether the image failed to load */
  hasError: boolean;
  /** The asset's dominant color for placeholder backgrounds */
  fallbackColor: string;
  /** Whether this is an SVG (inline render) or img (src render) */
  isSvg: boolean;
  /** Retry loading the image */
  retry: () => void;
}

export function useAssetImage(asset: AssetEntry | null): UseAssetImageResult {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSvg = !!asset?.svg && !asset?.imageUrl;
  const src = asset?.imageUrl || asset?.svg || "";
  const fallbackColor = asset?.color || "#334155";

  const loadImage = useCallback(() => {
    if (!asset || !asset.imageUrl) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    let cancelled = false;

    img.onload = () => {
      if (!cancelled) {
        setIsLoading(false);
        setHasError(false);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setIsLoading(false);
        setHasError(true);
        // Auto-retry once
        if (retryCountRef.current < 1) {
          retryCountRef.current++;
          timeoutRef.current = setTimeout(() => {
            loadImage();
          }, 1000);
        }
      }
    };

    img.src = asset.imageUrl;

    // Safety timeout — if image takes > 10s, mark as error
    timeoutRef.current = setTimeout(() => {
      if (!cancelled && isLoading) {
        cancelled = true;
        setIsLoading(false);
        setHasError(true);
      }
    }, 10000);

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [asset]);

  useEffect(() => {
    retryCountRef.current = 0;
    const cleanup = loadImage();
    return () => {
      if (cleanup) cleanup();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadImage]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    loadImage();
  }, [loadImage]);

  return { src, isLoading, hasError, fallbackColor, isSvg, retry };
}
