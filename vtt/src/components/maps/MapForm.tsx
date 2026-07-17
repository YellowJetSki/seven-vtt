/* ── MapForm ───────────────────────────────────────────────────
 * Create/Edit form for battle map metadata.
 * Uses ImagePicker with libraryCategory="battlemaps" to show SVGs.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { BattleMap } from "@/types";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/ui/ImagePicker";

interface MapFormData {
  name: string;
  imageUrl: string;
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
}

interface MapFormProps {
  existingMap?: BattleMap;
  onSave: (data: MapFormData) => void;
  onCancel: () => void;
}

export function MapForm({ existingMap, onSave, onCancel }: MapFormProps) {
  const [name, setName] = useState(existingMap?.name ?? "");
  const [imageUrl, setImageUrl] = useState(existingMap?.imageUrl ?? "");
  const [gridWidth, setGridWidth] = useState(existingMap?.gridWidth ?? 20);
  const [gridHeight, setGridHeight] = useState(existingMap?.gridHeight ?? 15);
  const [gridSize, setGridSize] = useState(existingMap?.gridSize ?? 40);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), imageUrl: imageUrl.trim(), gridWidth, gridHeight, gridSize });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Map Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Cragmaw Hideout"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>

      <ImagePicker value={imageUrl} onChange={setImageUrl} label="Map Image (optional)" libraryCategory="battlemaps" />

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Grid Width</label>
          <input type="number" value={gridWidth} onChange={(e) => setGridWidth(parseInt(e.target.value) || 20)} min={1}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Grid Height</label>
          <input type="number" value={gridHeight} onChange={(e) => setGridHeight(parseInt(e.target.value) || 15)} min={1}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Cell Size</label>
          <input type="number" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value) || 40)} min={10} max={100}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
          {existingMap ? "Update Map" : "Create Map"}
        </Button>
      </div>
    </div>
  );
}
