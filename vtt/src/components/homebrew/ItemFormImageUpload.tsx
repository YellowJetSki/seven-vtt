/* ── ItemFormImageUpload ────────────────────────────────────────
 * Image upload with preview, file validation, and removal.
 * Handles base64 encoding and 5MB limit enforcement.
 * ─────────────────────────────────────────────────────────────── */

import { useRef } from "react";
import { useUiStore } from "@/stores/uiStore";
import { MAX_IMAGE_SIZE_BYTES } from "./ItemFormConstants";

interface ItemFormImageUploadProps {
  imagePreview: string | null;
  onImageChange: (base64: string | null) => void;
}

export function ItemFormImageUpload({ imagePreview, onImageChange }: ItemFormImageUploadProps) {
  const showToast = useUiStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast({ message: "Please select a valid image file.", type: "error" });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast({ message: "Image must be under 5MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      onImageChange(evt.target?.result as string);
      showToast({ message: "Image uploaded successfully.", type: "success" });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-surface-400">Item Image</label>
      {imagePreview ? (
        <div className="relative inline-block">
          <img
            src={imagePreview}
            alt="Item preview"
            className="max-h-48 rounded-lg border border-surface-700 object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface-900/80 text-xs text-surface-300 hover:bg-surface-800"
            aria-label="Remove image"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-700 bg-surface-800/50 px-4 py-6 text-sm text-surface-500 hover:border-surface-600 hover:text-surface-400 transition-colors"
        >
          <span className="text-lg">📷</span>
          Click to Upload Image
          <span className="text-xs text-surface-600">(max 5MB)</span>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
}
