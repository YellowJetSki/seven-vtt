/* ── ImagePicker ───────────────────────────────────────────────
 * A reusable image selection component for battle maps, portraits,
 * tokens, and homebrew items. Supports URL input, file upload,
 * and a library of pre-built placeholder images.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useRef } from "react";

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
}

const MAX_FILE_SIZE_DEFAULT = 5 * 1024 * 1024; // 5MB

export function ImagePicker({
  value,
  onChange,
  label,
  className = "",
  maxFileSize = MAX_FILE_SIZE_DEFAULT,
}: ImagePickerProps) {
  const [mode, setMode] = useState<"url" | "upload" | "library">("url");
  const [urlInput, setUrlInput] = useState(value || "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Please enter a URL.");
      return;
    }
    // Basic URL validation
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      setError("URL must start with http://, https://, or /");
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
      setError(`File is too large. Maximum size is ${(maxFileSize / 1024 / 1024).toFixed(1)}MB.`);
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

  /** Pre-built library of placeholder images (SVG data URIs for common VTT needs) */
  const handleLibrarySelect = (url: string) => {
    onChange(url);
    setUrlInput(url);
    setError(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-xs font-medium text-surface-400">{label}</label>

      {/* Preview */}
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-surface-700 bg-surface-800">
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-surface-500">
            <span className="text-3xl">🖼️</span>
            <span className="text-[10px]">No image selected</span>
          </div>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="flex rounded-lg border border-surface-700 bg-surface-850 p-0.5">
        {(["url", "upload", "library"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-all ${
              mode === m ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"
            }`}
          >
            {m === "url" ? "URL" : m === "upload" ? "Upload" : "Library"}
          </button>
        ))}
      </div>

      {/* URL Input */}
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

      {/* Upload */}
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
          <p className="mt-1 text-[10px] text-surface-500">Supports PNG, JPG, GIF, WebP · Max {(maxFileSize / 1024 / 1024).toFixed(0)}MB</p>
        </div>
      )}

      {/* Library */}
      {mode === "library" && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { url: "", label: "None", emoji: "❌" },
            { url: "/images/maps/dungeon_01.png", label: "Dungeon", emoji: "🏰" },
            { url: "/images/maps/forest_01.png", label: "Forest", emoji: "🌲" },
            { url: "/images/maps/tavern_01.png", label: "Tavern", emoji: "🍺" },
            { url: "/images/maps/swamp_01.png", label: "Swamp", emoji: "🌿" },
            { url: "/images/maps/cave_01.png", label: "Cave", emoji: "🕳️" },
            { url: "/images/maps/road_01.png", label: "Road", emoji: "🛣️" },
            { url: "/images/maps/keep_01.png", label: "Keep", emoji: "🏰" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleLibrarySelect(item.url)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                value === item.url
                  ? "border-accent-500 bg-accent-500/10"
                  : "border-surface-700 bg-surface-800 hover:border-surface-600"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-[9px] text-surface-400">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-xs text-warrior-400">{error}</p>}
    </div>
  );
}
