/**
 * ST R VTT - Map Creator Modal
 *
 * Full map creation form for the DM.
 * Fields: name, image URL (with live preview), grid dimensions,
 * grid size (5ft default), image fit, notes.
 *
 * Integrates with campaignStore.addBattleMap().
 * All maps start with sensible defaults for a standard 5e encounter.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { BattleMap } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";

interface MapCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_GRID_W = 40;  // 40x30 = 200ft x 150ft standard encounter
const DEFAULT_GRID_H = 30;
const DEFAULT_GRID_SIZE = 50; // 50px per cell

export default function MapCreatorModal({ isOpen, onClose }: MapCreatorModalProps) {
  const addBattleMap = useCampaignStore((s) => s.addBattleMap);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gridWidth, setGridWidth] = useState(DEFAULT_GRID_W);
  const [gridHeight, setGridHeight] = useState(DEFAULT_GRID_H);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [imageFit, setImageFit] = useState<"cover" | "contain" | "stretch">("cover");
  const [notes, setNotes] = useState("");
  const [imageError, setImageError] = useState(false);

  const resetForm = useCallback(() => {
    setName("");
    setImageUrl("");
    setGridWidth(DEFAULT_GRID_W);
    setGridHeight(DEFAULT_GRID_H);
    setGridSize(DEFAULT_GRID_SIZE);
    setImageFit("cover");
    setNotes("");
    setImageError(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    if (gridWidth < 1 || gridHeight < 1 || gridSize < 10) return;

    const now = Date.now();
    const map: BattleMap = {
      id: `map_${now}`,
      name: name.trim(),
      imageUrl: imageUrl.trim() || undefined,
      imageFit,
      gridWidth,
      gridHeight,
      gridSize,
      notes: notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    addBattleMap(map);
    resetForm();
    onClose();
  }, [name, imageUrl, imageFit, gridWidth, gridHeight, gridSize, notes, addBattleMap, resetForm, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const imageHasUrl = imageUrl.trim().length > 0;
  const isValid = name.trim().length > 0 && gridWidth >= 1 && gridHeight >= 1 && gridSize >= 10;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-gold rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col relative overflow-hidden border border-gold/10 shadow-2xl shadow-gold-500/5">
        {/* Corner ornaments */}
        <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-br corner-gold corner-gold-glow" />

        {/* Header */}
        <div className="shrink-0 p-4 pb-3 border-b border-gold/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺</span>
              <h2 className="text-sm font-black text-gold tracking-tight">Create Battle Map</h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all duration-150"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] text-surface-500 mt-1">Configure a new tactical encounter map</p>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Map Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gold-400/60 flex items-center gap-1">
              Map Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Goblin Ambush, Cragmaw Hideout..."
              className="w-full py-2 px-3 rounded-lg text-sm font-semibold bg-[#07080d] border border-white/[0.06] text-gold-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700"
              autoFocus
            />
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Image URL (optional)</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImageError(false); }}
              placeholder="https://example.com/map.jpg"
              className="w-full py-2 px-3 rounded-lg text-sm bg-[#07080d] border border-white/[0.06] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700"
            />
            {/* Live Preview */}
            {imageHasUrl && (
              <div className="relative rounded-lg overflow-hidden bg-[#07080d] border border-white/[0.06] h-20 mt-1">
                {imageError ? (
                  <div className="flex items-center justify-center h-full text-[10px] text-rose-400/60">
                    Image failed to load
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt="Map preview"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                )}
              </div>
            )}
          </div>

          {/* Image Fit */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Image Fit</label>
            <div className="flex gap-1.5">
              {(["cover", "contain", "stretch"] as const).map((fit) => (
                <button
                  key={fit}
                  onClick={() => setImageFit(fit)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all duration-150 active:scale-95 ${
                    imageFit === fit
                      ? "bg-gold-500/10 border border-gold/20 text-gold-300"
                      : "bg-[#07080d] border border-white/[0.04] text-surface-500 hover:text-surface-300"
                  }`}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Dimensions */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Grid Dimensions</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[8px] text-surface-600">Width (cells)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={gridWidth}
                  onChange={(e) => setGridWidth(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                  className="w-full py-1.5 px-2 rounded-lg text-xs bg-[#07080d] border border-white/[0.06] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
                />
              </div>
              <div className="flex-1">
                <label className="text-[8px] text-surface-600">Height (cells)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={gridHeight}
                  onChange={(e) => setGridHeight(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
                  className="w-full py-1.5 px-2 rounded-lg text-xs bg-[#07080d] border border-white/[0.06] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
                />
              </div>
              <div className="flex-1">
                <label className="text-[8px] text-surface-600">Cell Size (px)</label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  step={10}
                  value={gridSize}
                  onChange={(e) => setGridSize(Math.max(10, Math.min(200, parseInt(e.target.value) || 50)))}
                  className="w-full py-1.5 px-2 rounded-lg text-xs bg-[#07080d] border border-white/[0.06] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
                />
              </div>
            </div>
            <div className="text-[8px] text-surface-600/60">
              Standard encounter: 40x30 (200ft x 150ft at 5ft/ft)
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-gold-400/60">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Terrain notes, encounter layout, lighting conditions..."
              rows={2}
              className="w-full py-1.5 px-3 rounded-lg text-[10px] bg-[#07080d] border border-white/[0.06] text-surface-400 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-700 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 pt-3 border-t border-gold/10 flex items-center justify-between">
          <div className="text-[9px] text-surface-600">
            {gridWidth * gridHeight} cells | {(gridWidth * 5)}ft x {(gridHeight * 5)}ft
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!isValid}
              className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-1"
            >
              Create Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
