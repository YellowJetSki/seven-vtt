/**
 * STᚱ VTT — Item Form Modal
 *
 * Add new item to inventory with:
 * - Name, quantity, weight, description fields
 * - Equip checkbox
 * - Auto-detect category preview
 * - Premium gold glass styling
 */

import { useState, useCallback } from "react";
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

  const category = name.trim() ? detectCategory(name) : "other";

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), quantity, weight, description: description.trim(), isEquipped });
  }, [name, quantity, weight, description, isEquipped, onSave]);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="glass-gold rounded-2xl w-full max-w-sm mx-4 border border-gold/10 shadow-2xl shadow-gold-500/5 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryIcon(category)}</span>
            <h3 className="text-xs font-black text-gold tracking-tight">Add Item</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Name */}
          <div>
            <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">
              Item Name <span className="text-rose-400">*</span>
              {name.trim() && (
                <span className="ml-1 text-[8px] text-surface-600 font-normal normal-case">
                  ({categoryIcon(category)} {category})
                </span>
              )}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Longsword, Potion of Healing..."
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
              autoFocus
            />
          </div>

          {/* Quantity + Weight */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">Quantity</label>
              <input
                type="number" value={quantity} min={1}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25"
              />
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">Weight (lb each)</label>
              <input
                type="number" value={weight} min={0} step={0.1}
                onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25"
              />
            </div>
          </div>

          {/* Total weight preview */}
          {name.trim() && (
            <div className="text-[9px] text-surface-600 text-right">
              ~{(weight * quantity).toFixed(1)} lb total
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Item properties, notes..."
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none"
            />
          </div>

          {/* Equip checkbox */}
          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={isEquipped}
              onChange={(e) => setIsEquipped(e.target.checked)}
              className="rounded border-surface-600 bg-surface-800 accent-gold-500 w-3.5 h-3.5"
            />
            <span className="text-[10px] text-surface-400">Equip this item now</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gold/10">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Add to Inventory
          </button>
        </div>
      </div>
    </div>
  );
}
