/**
 * STᚱ VTT — Inventory Item Row (Premium)
 *
 * Ventriloc/Overrrides-grade premium item row:
 * - Multi-layer depth with edge lighting
 * - Hover elevation lift with directional glow sweep
 * - Equip toggle with gold animated checkmark
 * - Consumable quick-use with emerald-accented button
 * - Smooth action button reveal on hover
 * - Color-coded category icon indicator
 * - Inline edit with premium form fields
 * - Delete confirmation with red accent
 */

import { useState } from "react";
import type { InventoryItem, EncumbranceState } from "@/types";
import { detectCategory, categoryIcon } from "@/lib/inventory-utils";

interface InventoryItemRowProps {
  item: InventoryItem;
  index: number;
  isEditing: boolean;
  isDeleteConfirm: boolean;
  isSellConfirm: boolean;
  encumbranceLevel: EncumbranceState["encumbranceLevel"];
  onToggleEquip: (index: number) => void;
  onUseConsumable: (index: number) => void;
  onViewDetail: (index: number) => void;
  onEdit: () => void;
  onDelete: () => void;
  onSell: () => void;
  onCancelDelete: () => void;
  onCancelSell: () => void;
  onConfirmSell: () => void;
  onConfirmDelete: () => void;
  onSaveEdit: (item: InventoryItem) => void;
  onCancelEdit: () => void;
}

export default function InventoryItemRow({
  item, index, isEditing, isDeleteConfirm, isSellConfirm, encumbranceLevel,
  onToggleEquip, onUseConsumable, onViewDetail, onEdit, onDelete, onSell,
  onCancelDelete, onCancelSell, onConfirmSell, onConfirmDelete,
  onSaveEdit, onCancelEdit,
}: InventoryItemRowProps) {
  const category = detectCategory(item.name);
  const icon = categoryIcon(category);
  const isConsumable = ["potion", "scroll", "food", "poison", "oil", "antidote"].some((t) =>
    item.name.toLowerCase().includes(t)
  );

  if (isEditing) {
    return <EditItemRowContent item={item} onSave={onSaveEdit} onCancel={onCancelEdit} />;
  }

  return (
    <div className="relative group rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04] hover:border-gold/15 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 overflow-hidden">
      {/* Directional glow sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-gold-500/[0.02] via-transparent to-amber-500/[0.02]" />

      {/* Edge light on hover */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

      <div className="relative flex items-center justify-between px-3 py-2.5 z-[1]">
        {/* Left: equip toggle + icon + name */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Equip toggle */}
          <button
            onClick={() => onToggleEquip(index)}
            title={item.isEquipped ? "Unequip" : "Equip"}
            className={`relative w-7 h-7 rounded-lg flex items-center justify-center text-[9px] transition-all duration-200 shrink-0 ${
              item.isEquipped
                ? "bg-gradient-to-br from-gold-500/15 to-gold-500/8 text-gold-400 border border-gold/20 shadow-[0_0_6px_rgba(234,179,8,0.1)]"
                : "bg-surface-800/40 text-surface-600 border border-transparent hover:border-surface-600/30 hover:text-surface-400"
            }`}
          >
            {item.isEquipped ? (
              <span className="scale-100 transition-transform">✓</span>
            ) : (
              <span className="opacity-60 group-hover:opacity-100 transition-opacity">○</span>
            )}
          </button>

          {/* Category icon */}
          <span className="text-xs shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" title={category}>
            {icon}
          </span>

          {/* Name + description */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onViewDetail(index)}
                className={`text-[11px] truncate transition-colors duration-200 text-left hover:text-gold-300 ${
                  item.isEquipped
                    ? "text-gold-400 font-semibold drop-shadow-[0_0_4px_rgba(234,179,8,0.05)]"
                    : "text-surface-300"
                }`}
              >
                {item.name}
              </button>
              {item.isEquipped && (
                <span className="text-[6px] uppercase tracking-wider bg-gold-500/10 text-gold-400/80 px-1.5 py-0.5 rounded-full border border-gold/15 font-bold shrink-0">
                  Equipped
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-[8px] text-surface-600 mt-0.5 truncate max-w-[160px]">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: weight + quantity + actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Weight */}
          <span className="text-[9px] text-surface-500 tabular-nums font-medium">{item.weight}lb</span>

          {/* Quantity badge */}
          {item.quantity > 1 && (
            <span className="text-[8px] font-semibold text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded-md border border-surface-700/20 tabular-nums">
              ×{item.quantity}
            </span>
          )}

          {/* Consumable use button */}
          {isConsumable && (
            <button
              onClick={() => onUseConsumable(index)}
              className="px-1.5 py-0.5 rounded-lg text-[8px] font-semibold bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 text-emerald-400 border border-emerald-500/15 hover:from-emerald-500/20 hover:to-emerald-500/10 active:scale-90 transition-all duration-150"
            >
              Use
            </button>
          )}

          {/* Action buttons (visible on hover) */}
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={onEdit}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-[8px] text-surface-500 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all duration-150"
              title="Edit item"
            >
              ✏️
            </button>
            <button
              onClick={onSell}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-[8px] text-surface-500 hover:text-amber-400 hover:bg-amber-500/10 active:scale-90 transition-all duration-150"
              title="Sell item"
            >
              💰
            </button>
            {isDeleteConfirm ? (
              <div className="flex gap-0.5">
                <button
                  onClick={onConfirmDelete}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-[8px] bg-red-500/15 text-red-400 hover:bg-red-500/25 active:scale-90 transition-all duration-150"
                  title="Confirm delete"
                >
                  ✓
                </button>
                <button
                  onClick={onCancelDelete}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-[8px] text-surface-500 hover:text-surface-300 active:scale-90 transition-all duration-150"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={onDelete}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-[8px] text-surface-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all duration-150"
                title="Delete item"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline Edit Row (Premium) ──

function EditItemRowContent({
  item, onSave, onCancel,
}: {
  item: InventoryItem;
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [weight, setWeight] = useState(item.weight);
  const [description, setDescription] = useState(item.description);
  const [isEquipped, setIsEquipped] = useState(item.isEquipped);

  return (
    <div className="relative rounded-xl bg-gradient-to-b from-gold-500/5 to-gold-500/2 border border-gold/15 p-3 overflow-hidden">
      {/* Edge light */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      <div className="relative z-[1] space-y-2">
        {/* Name, Qty, Weight grid */}
        <div className="grid grid-cols-[1fr_3.5rem_3.5rem] gap-2">
          <div>
            <label className="block text-[7px] uppercase tracking-widest font-black text-gold-500/50 mb-0.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 transition-all"
              placeholder="Item name"
            />
          </div>
          <div>
            <label className="block text-[7px] uppercase tracking-widest font-black text-gold-500/50 mb-0.5">Qty</label>
            <input
              type="number" value={quantity} min={1}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-center text-surface-200 focus:outline-none focus:border-gold/25 transition-all tabular-nums"
            />
          </div>
          <div>
            <label className="block text-[7px] uppercase tracking-widest font-black text-gold-500/50 mb-0.5">Weight</label>
            <input
              type="number" value={weight} min={0} step={0.1}
              onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-center text-surface-200 focus:outline-none focus:border-gold/25 transition-all tabular-nums"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[7px] uppercase tracking-widest font-black text-gold-500/50 mb-0.5">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[9px] text-surface-400 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 transition-all"
            placeholder="Item notes or properties..."
          />
        </div>

        {/* Footer: equip toggle + actions */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <div
              className={`relative w-4 h-4 rounded border transition-all duration-150 flex items-center justify-center ${
                isEquipped
                  ? "bg-gold-500/20 border-gold/30 shadow-[0_0_4px_rgba(234,179,8,0.1)]"
                  : "border-surface-600 bg-surface-800/40 group-hover:border-surface-500"
              }`}
            >
              <input
                type="checkbox"
                checked={isEquipped}
                onChange={(e) => setIsEquipped(e.target.checked)}
                className="sr-only"
              />
              {isEquipped && <span className="text-[8px] text-gold-400">✓</span>}
            </div>
            <span className="text-[9px] text-surface-500 group-hover:text-surface-400 transition-colors">Equipped</span>
          </label>

          <div className="flex gap-1.5">
            <button
              onClick={() => onSave({ name: name.trim() || item.name, quantity, weight, description: description.trim(), isEquipped })}
              disabled={!name.trim()}
              className="px-3 py-1 rounded-lg text-[9px] font-bold bg-gradient-to-b from-gold-500/10 to-gold-500/5 text-gold-400 border border-gold/15 hover:from-gold-500/20 hover:to-gold-500/10 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              💾 Save
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 rounded-lg text-[9px] font-semibold text-surface-500 hover:text-surface-300 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
