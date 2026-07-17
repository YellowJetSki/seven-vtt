/* ── SafeImage ─────────────────────────────────────────────────
 * Image component that gracefully handles load failures
 * by showing a fallback placeholder instead of a broken icon.
 * ─────────────────────────────────────────────────────────────── */

import { useState, type ImgHTMLAttributes } from "react";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

export function SafeImage({ src, alt, fallback, className, ...props }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-surface-800 text-surface-500 ${className ?? ""}`}
        title={alt ?? "Image unavailable"}>
        <span className="text-xs">{fallback ?? "🖼️"}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ""}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
