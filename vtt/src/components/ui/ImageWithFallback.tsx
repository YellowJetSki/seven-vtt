/* ── ImageWithFallback ─────────────────────────────────────────
 * A reusable image component that gracefully degrades to a
 * placeholder emoji when the image URL is missing or fails to load.
 * Handles loading states with a subtle skeleton shimmer.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";

interface ImageWithFallbackProps {
  src?: string;
  alt: string;
  /** Emoji fallback (e.g. "🗺️", "👤", "🎯") */
  fallback?: string;
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Image fit (default: cover) */
  fit?: "cover" | "contain" | "fill" | "none";
}

export function ImageWithFallback({
  src,
  alt,
  fallback = "📷",
  className = "",
  onClick,
  fit = "cover",
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    // Graceful fallback — show emoji
    return (
      <div
        className={`flex items-center justify-center bg-surface-800 text-3xl ${className} ${onClick ? "cursor-pointer" : ""}`}
        onClick={onClick}
        role="img"
        aria-label={alt}
        title={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className} ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-surface-800 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoading(false)}
        onError={() => { setHasError(true); setIsLoading(false); }}
        className={`h-full w-full transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} ${fit === "cover" ? "object-cover" : fit === "contain" ? "object-contain" : fit === "fill" ? "object-fill" : "object-none"}`}
        loading="lazy"
      />
    </div>
  );
}
