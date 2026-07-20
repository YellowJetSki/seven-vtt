/**
 * STᚱ VTT — useBattleMapImageLoader
 *
 * Hook for loading battlemap images from the PNG asset pipeline.
 * Resolves both /images/maps/{filename} local assets and external URLs.
 *
 * The CanvasMapView uses this to load the map image onto the canvas.
 * Supports:
 *   - Local PNG assets from public/images/maps/ (via imageUrl)
 *   - External URLs (http/https)
 *   - SVG inline strings
 *
 * Provides loading state so the canvas can show a placeholder while loading.
 *
 * Usage:
 *   const { imageElement, isLoading, hasError } = useBattleMapImageLoader(mapData.imageUrl);
 *
 *   // In canvas render loop:
 *   if (imageElement) ctx.drawImage(imageElement, ...);
 */

import { useState, useEffect, useRef, useCallback } from "react";

export interface UseBattleMapImageResult {
  /** The loaded HTMLImageElement (or null if not loaded) */
  imageElement: HTMLImageElement | null;
  /** Whether the image is still loading */
  isLoading: boolean;
  /** Whether the image failed to load (and all retries exhausted) */
  hasError: boolean;
  /** Retry loading the image */
  retry: () => void;
  /** Cancel any in-progress load */
  cancel: () => void;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

export function useBattleMapImageLoader(
  imageUrl: string | undefined | null
): UseBattleMapImageResult {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const loadImage = useCallback(() => {
    cancel();

    if (!imageUrl || imageUrl.startsWith("<svg")) {
      setImageElement(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    cancelledRef.current = false;
    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (!cancelledRef.current) {
        setImageElement(img);
        setIsLoading(false);
        setHasError(false);
        retryCountRef.current = 0;
      }
    };

    img.onerror = () => {
      if (!cancelledRef.current) {
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          timeoutRef.current = setTimeout(() => {
            if (!cancelledRef.current) {
              // Re-create the image and try again
              const retryImg = new Image();
              retryImg.crossOrigin = "anonymous";
              retryImg.onload = img.onload;
              retryImg.onerror = img.onerror;
              retryImg.src = imageUrl;
            }
          }, RETRY_DELAY_MS * retryCountRef.current);
        } else {
          setImageElement(null);
          setIsLoading(false);
          setHasError(true);
        }
      }
    };

    img.src = imageUrl;

    // Safety timeout — 15 seconds max
    timeoutRef.current = setTimeout(() => {
      if (!cancelledRef.current && isLoading) {
        setImageElement(null);
        setIsLoading(false);
        setHasError(true);
      }
    }, 15000);

  }, [imageUrl, cancel]);

  useEffect(() => {
    retryCountRef.current = 0;
    setImageElement(null);
    setIsLoading(false);
    setHasError(false);
    loadImage();

    return () => {
      cancel();
    };
  }, [loadImage, cancel]);

  const retry = useCallback(() => {
    retryCountRef.current = 0;
    cancel();
    loadImage();
  }, [loadImage, cancel]);

  return { imageElement, isLoading, hasError, retry, cancel };
}
