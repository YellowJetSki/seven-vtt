/* ── AddTokenForm ──────────────────────────────────────────────
 * Modal form for adding tokens to a battle map.
 * Includes ImagePicker for token images from the token library.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { MapToken } from "@/types";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/ui/ImagePicker";

const TOKEN_COLORS = [
  "#8b30ff", "#3b82f6", "#27ae60", "#f39c12",
  "#e74c3c", "#ec4899", "#14b8a6", "#f97316",
  "#6b7280", "#a855f7",
];

interface AddTokenFormProps {
  gridWidth: number;
  gridHeight: number;
  onAdd: (token: MapToken) => void;
  onCancel: () => void;
}

export function AddTokenForm({ gridWidth, gridHeight, onAdd, onCancel }: AddTokenFormProps) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<MapToken["type"]>("enemy");
  const [x, setX] = useState(Math.floor(gridWidth / 4));
  const [y, setY] = useState(Math.floor(gridHeight / 4));
  const [color, setColor] = useState(TOKEN_COLORS[0]);
  const [size, setSize] = useState(1);
  const [speed, setSpeed] = useState(30);
  const [initiative, setInitiative] = useState(0);
  const [hpMax, setHpMax] = useState(15);
  const [imageUrl, setImageUrl] = useState("");

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd({
      id: `tk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type, label: label.trim(), x, y, color, size, speed, visible: true,
      initiative: initiative > 0 ? initiative : undefined,
      hp: { current: hpMax, max: hpMax },
      imageUrl: imageUrl || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Label</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Goblin Archer"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>
      <ImagePicker value={imageUrl} onChange={setImageUrl} label="Token Image (optional, from library)" libraryCategory="tokens" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as MapToken["type"])}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent-500 focus:outline-none">
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
            <option value="npc">NPC</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Size (cells)</label>
          <input type="number" min={1} max={4} value={size} onChange={(e) => setSize(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Speed (ft) / Initiative</label>
          <div className="flex gap-2">
            <input type="number" min={0} max={120} step={5} value={speed} onChange={(e) => setSpeed(parseInt(e.target.value) || 30)} placeholder="Speed"
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
            <input type="number" min={0} max={30} value={initiative} onChange={(e) => setInitiative(parseInt(e.target.value) || 0)} placeholder="Init"
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Max HP</label>
          <input type="number" min={1} max={999} value={hpMax} onChange={(e) => setHpMax(parseInt(e.target.value) || 15)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">X (0-{gridWidth - 1})</label>
          <input type="number" min={0} max={gridWidth - 1} value={x} onChange={(e) => setX(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Y (0-{gridHeight - 1})</label>
          <input type="number" min={0} max={gridHeight - 1} value={y} onChange={(e) => setY(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Color</label>
        <div className="flex flex-wrap gap-2">
          {TOKEN_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-white ring-offset-1 ring-offset-surface-850 scale-110" : ""}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!label.trim()}>Add Token</Button>
      </div>
    </div>
  );
}
