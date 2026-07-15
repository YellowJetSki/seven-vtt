/* ── ImagePicker ───────────────────────────────────────────────
 * A reusable image selection component for battle maps, portraits,
 * tokens, and homebrew items. Supports URL input, file upload,
 * and a dynamic library that reads from the auto-generated
 * /image-manifest.json file.
 *
 * ── How images appear in the Library tab ─────────────────────
 * 1. Drop any .svg, .png, .jpg, .gif, .webp into:
 *      public/images/battlemaps/
 *      public/images/portraits/
 *      public/images/tokens/
 * 2. Restart dev server — the manifest regenerates automatically
 * 3. The Library tab shows all images, grouped by category
 * ────────────────────────────────────────────────────────────── */

import { useState, useRef, useEffect } from "react";

interface ImagePickerProps {
  /** Current image URL (or empty for none) */
  value: string;
  /** Called when the image changes (URL or base64 data) */
  onChange: (url: string) => void;
  /** Placeholder label describing what this image is for */
  label: string;
  /** Optional class name */
  className?: string;
  /** Optional max file size in bytes (default: 5MB) */
  maxFileSize?: number;
  /** Optional: only show library images from a specific category (e.g. "battlemaps") */
  libraryCategory?: string;
}

interface ImageManifest {
  [category: string]: string[];
}

const MAX_FILE_SIZE_DEFAULT = 5 * 1024 * 1024; // 5MB

export function ImagePicker({
  value,
  onChange,
  label,
  className = "",
  maxFileSize = MAX_FILE_SIZE_DEFAULT,
  libraryCategory,
}: ImagePickerProps) {
  const [mode, setMode] = useState<"url" | "upload" | "library">("url");
  const [urlInput, setUrlInput] = useState(value || "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [manifest, setManifest] = useState<ImageManifest>({});
  const [manifestError, setManifestError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Fetch the manifest on mount ──────────────────────── */
  useEffect(() => {
    fetch("/image-manifest.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: ImageManifest) => {
        setManifest(data);
        setManifestError(false);
      })
      .catch(() => {
        setManifestError(true);
      });
  }, []);

  /* ── Build the library items from the manifest ────────── */
  const libraryImages = (() => {
    const items: { url: string; label: string; category: string }[] = [];

    // Always include a "None" option
    items.push({ url: "", label: "None", category: "" });

    if (manifestError || Object.keys(manifest).length === 0) {
      return items;
    }

    // If a specific category is requested, only show that
    if (libraryCategory && manifest[libraryCategory]) {
      for (const url of manifest[libraryCategory]) {
        const label = url.split("/").pop()?.replace(/\.\w+$/, "") ?? url;
        items.push({ url, label, category: libraryCategory });
      }
      return items;
    }

    // Otherwise show all categories (maps first, then portraits, then tokens)
    const categoryOrder = ["battlemaps", "portraits", "tokens"];
    const sortedCategories = Object.keys(manifest).sort((a, b) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    for (const category of sortedCategories) {
      for (const url of manifest[category]) {
        const label = url.split("/").pop()?.replace(/\.\w+$/, "") ?? url;
        items.push({ url, label, category });
      }
    }

    return items;
  })();

  /* ── Handlers ─────────────────────────────────────────── */
  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Please enter a URL.");
      return;
    }
    // Basic URL validation
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("/") &&
      !trimmed.startsWith("data:")
    ) {
      setError("URL must start with http://, https://, /, or data:");
      return;
    }
    setError(null);
    onChange(trimmed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (PNG, JPG, GIF, WebP).");
      return;
    }

    if (file.size > maxFileSize) {
      setError(
        `File is too large. Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(1)}MB.`
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange(dataUrl);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLibrarySelect = (url: string) => {
    onChange(url);
    setUrlInput(url);
    setError(null);
  };

  /* ── Render helpers ───────────────────────────────────── */
  const categoryLabel = (cat: string) => {
    switch (cat) {
      case "battlemaps":
        return "🗺️ Maps";
      case "portraits":
        return "🧑‍🎨 Portraits";
      case "tokens":
        return "🎯 Tokens";
      default:
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  };

  const categoryEmoji = (cat: string) => {
    switch (cat) {
      case "battlemaps":
        return "🗺️";
      case "portraits":
        return "🧑‍🎨";
      case "tokens":
        return "🎯";
      default:
        return "📁";
    }
  };

  /* ── Main render ──────────────────────────────────────── */
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-xs font-medium text-surface-400">
        {label}
      </label>

      {/* ── Preview ──────────────────────────────────────── */}
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-surface-700 bg-surface-800">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-full w-full object-cover"
            onError={(e) => {
              // If the image fails to load, show the fallback
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        {!value && (
          <div className="flex flex-col items-center gap-1 text-surface-500">
            <span className="text-3xl">🖼️</span>
            <span className="text-[10px]">No image selected</span>
          </div>
        )}
        {value && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-900/0 hidden pointer-events-none">
            <span className="text-3xl">🖼️</span>
          </div>
        )}
      </div>

      {/* ── Mode Tabs ─────────────────────────────────────── */}
      <div className="flex rounded-lg border border-surface-700 bg-surface-850 p-0.5">
        {(["url", "upload", "library"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
              mode === m
                ? "bg-accent-600 text-white shadow-sm"
                : "text-surface-400 hover:text-surface-200"
            }`}
          >
            {m === "url" ? "URL" : m === "upload" ? "Upload" : "Library"}
          </button>
        ))}
      </div>

      {/* ── URL Input ────────────────────────────────────── */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
          />
          <button
            onClick={handleUrlSubmit}
            className="rounded-lg bg-accent-600 px-3 py-2 text-sm font-medium text-white hover:bg-accent-500 transition-colors"
          >
            Set
          </button>
        </div>
      )}

      {/* ── Upload ───────────────────────────────────────── */}
      {mode === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full rounded-lg border-2 border-dashed border-surface-600 bg-surface-800 p-4 text-center text-sm text-surface-400 hover:border-accent-500/40 hover:text-surface-200 transition-all disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Click to upload image"}
          </button>
          <p className="mt-1 text-[10px] text-surface-500">
            Supports PNG, JPG, GIF, WebP · Max{" "}
            {(maxFileSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      )}

      {/* ── Library ──────────────────────────────────────── */}
      {mode === "library" && (
        <div className="space-y-4">
          {manifestError && (
            <p className="rounded-lg border border-warning-400/20 bg-warning-400/5 p-3 text-xs text-warning-300">
              ⚠️ Image manifest not found. Run{" "}
              <code className="rounded bg-surface-700 px-1 py-0.5 font-mono text-[10px]">
                npm run predev
              </code>{" "}
              to generate it, or place images in{" "}
              <code className="rounded bg-surface-700 px-1 py-0.5 font-mono text-[10px]">
                public/images/
              </code>
              .
            </p>
          )}

          {!manifestError && libraryImages.length <= 1 && (
            <p className="text-center text-xs text-surface-500">
              No images found. Drop image files into{" "}
              <code className="rounded bg-surface-700 px-1 py-0.5 font-mono">
                public/images/battlemaps/
              </code>
              ,{" "}
              <code className="rounded bg-surface-700 px-1 py-0.5 font-mono">
                portraits/
              </code>
              , or{" "}
              <code className="rounded bg-surface-700 px-1 py-0.5 font-mono">
                tokens/
              </code>{" "}
              and restart the dev server.
            </p>
          )}

          {!manifestError && libraryImages.length > 1 && (
            <>
              {/* "None" option row */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleLibrarySelect("")}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                    value === ""
                      ? "border-accent-500 bg-accent-500/10"
                      : "border-surface-700 bg-surface-800 hover:border-surface-600"
                  }`}
                >
                  <span className="text-xl">❌</span>
                  <span className="text-[9px] text-surface-400">None</span>
                </button>
              </div>

              {/* Group by category */}
              {(() => {
                // Group the library items by category (excluding "None")
                const grouped: Record<string, typeof libraryImages> = {};
                for (const item of libraryImages) {
                  if (!item.url) continue; // skip "None" — already rendered
                  const cat = item.category || "other";
                  if (!grouped[cat]) grouped[cat] = [];
                  grouped[cat].push(item);
                }

                return Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-surface-500">
                      {categoryLabel(cat)}
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {items.map((item) => (
                        <button
                          key={item.url}
                          onClick={() => handleLibrarySelect(item.url)}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                            value === item.url
                              ? "border-accent-500 bg-accent-500/10"
                              : "border-surface-700 bg-surface-800 hover:border-surface-600"
                          }`}
                          title={item.label}
                        >
                          <div className="flex h-10 w-full items-center justify-center overflow-hidden rounded">
                            <img
                              src={item.url}
                              alt={item.label}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                // Fallback to emoji if image fails to load
                                (e.target as HTMLImageElement).style.display = "none";
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                              }}
                            />
                            <span className="hidden text-lg">
                              {categoryEmoji(cat)}
                            </span>
                          </div>
                          <span className="max-w-full truncate text-[9px] text-surface-400">
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </>
          )}
        </div>
      )}

      {/* ── Error message ────────────────────────────────── */}
      {error && <p className="text-xs text-warrior-400">{error}</p>}
    </div>
  );
}
