/**
 * STᚱ VTT — Item Form Modal (Premium)
 *
 * Lusion/Ventriloc-grade add-item modal:
 * - Multi-layer depth with edge lighting
 * - Gold gradient glass card backdrop
 * - Auto-detect category with live preview
 * - Animated entrance with slide-in-up
 * - Floating label inputs with focus glow
 * - Total weight preview with real-time calculation
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { InventoryItem } from "@/types";
import { detectCategory, categoryIcon } from "@/lib/inventory-utils";

interface ItemFormModalProps {
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}

export default function ItemFormModal({ onSave, onCancel }: ItemFormModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0.5);
  const [description, setDescription] = useState("");
  const [isEquipped, setIsEquipped] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const category = name.trim() ? detectCategory(name) : "other";

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), quantity, weight, description: description.trim(), isEquipped });
  }, [name, quantity, weight, description, isEquipped, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && name.trim()) {
        handleSave();
      }
      if (e.key === "Escape") onCancel();
    },
    [handleSave, name, onCancel]
  );

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold edge light */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        {/* Bottom edge light */}
        <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent" />

        {/* Corner ornaments */}
        <div className="corner-ornament corner-tl corner-gold" />
        <div className="corner-ornament corner-tr corner-gold" />
        <div className="corner-ornament corner-bl corner-gold" />
        <div className="corner-ornament corner-br corner-gold" />

        <div className="relative p-5 z-[1]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-500/8 to-gold-500/2 border border-gold/10 flex items-center justify-center">
                <span className="text-sm">{categoryIcon(category)}</span>
              </div>
              <div>
                <h3 className="text-xs font-black text-gold tracking-tight">Add Item</h3>
                {category !== "other" && name.trim() && (
                  <p className="text-[8px] text-surface-600 mt-0.5">{category}</p>
                )}
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all duration-150"
            >
              ✕
            </button>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
                Item Name <span className="text-rose-400">*</span>
              </label>
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Longsword, Potion of Healing..."
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15 placeholder:text-surface-700 transition-all"
              />
              {/* Live category preview */}
              {name.trim() && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[8px] text-gold-500/50 font-semibold">
                    {categoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Quantity + Weight grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center transition-all active:scale-90"
                  >
                    −
                  </button>
                  <input
                    type="number" value={quantity} min={1}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-center text-surface-200 focus:outline-none focus:border-gold/25 transition-all tabular-nums"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(999, quantity + 1))}
                    className="w-7 h-7 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center transition-all active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
                  Weight (lb)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWeight(Math.max(0, parseFloat((weight - 0.5).toFixed(1))))}
                    disabled={weight <= 0}
                    className="w-7 h-7 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    type="number" value={weight} min={0} step={0.5}
                    onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[11px] text-center text-surface-200 focus:outline-none focus:border-gold/25 transition-all tabular-nums"
                  />
                  <button
                    onClick={() => setWeight(parseFloat((weight + 0.5).toFixed(1)))}
                    className="w-7 h-7 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 hover:text-surface-200 flex items-center justify-center transition-all active:scale-90"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Total weight preview */}
            {name.trim() && (
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[8px] text-surface-600">Total weight:</span>
                <span className="text-[10px] font-bold text-gold-400 tabular-nums">
                  {(weight * quantity).toFixed(1)} lb
                </span>
                <span className="text-[7px] text-surface-600">({weight} lb × {quantity})</span>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Item properties, magical effects, or notes..."
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-xl px-3 py-1.5 text-[10px] text-surface-300 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 transition-all resize-none"
              />
            </div>

            {/* Equip checkbox with custom toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer group py-1">
              <div
                className={`relative w-5 h-5 rounded border-2 transition-all duration-150 flex items-center justify-center ${
                  isEquipped
                    ? "bg-gold-500/20 border-gold/40 shadow-[0_0_6px_rgba(234,179,8,0.1)]"
                    : "border-surface-600 bg-surface-800/40 group-hover:border-surface-500"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isEquipped}
                  onChange={(e) => setIsEquipped(e.target.checked)}
                  className="sr-only"
                />
                {isEquipped && <span className="text-[10px] text-gold-400">✓</span>}
              </div>
              <div>
                <span className="text-[10px] text-surface-400 group-hover:text-surface-300 transition-colors font-medium">
                  Equip this item now
                </span>
                <p className="text-[7px] text-surface-600">Adds to your equipped gear and active stats</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-gold/10">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-xl text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="relative px-5 py-1.5 rounded-xl text-[10px] font-bold bg-gradient-to-b from-gold-500/12 to-gold-500/5 border border-gold/15 text-gold-400 hover:from-gold-500/20 hover:to-gold-500/10 active:scale-95 transition-all duration-150 shadow-[0_0_8px_rgba(234,179,8,0.05)] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="relative z-[1]">+ Add to Inventory</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
