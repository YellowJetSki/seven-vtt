/**
 * STᚱ VTT — Inventory Item Row
 *
 * Single item row in the inventory list with:
 * - Equip/unequip toggle
 * - Category icon auto-detect
 * - Quantity badge
 * - Consumable quick-use button
 * - Edit/Delete/Sell actions (show on hover)
 * - Inline edit mode
 * - Delete confirmation
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
  onToggleEquip, onUseConsumable, onEdit, onDelete, onSell,
  onCancelDelete, onCancelSell, onConfirmSell, onConfirmDelete,
  onSaveEdit, onCancelEdit,
}: InventoryItemRowProps) {
  const category = detectCategory(item.name);
  const icon = categoryIcon(category);
  const isConsumable = ["potion", "scroll", "food", "poison", "oil", "antidote"].some((t) =>
    item.name.toLowerCase().includes(t)
  );
  const isJunk = ["bone", "skull", "tooth", "pelt", "fur", "hide", "feather", "claw", "fang", "gem", "jewel", "trinket", "bauble", "scroll (spell)", "spell scroll"].some((t) =>
    item.name.toLowerCase().includes(t)
  );

  if (isEditing) {
    return (
      <EditItemRowContent
        item={item}
        onSave={onSaveEdit}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/15 transition-all duration-200 group">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Equip toggle */}
        <button
          onClick={() => onToggleEquip(index)}
          title={item.isEquipped ? "Unequip" : "Equip"}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] transition-all shrink-0 ${
            item.isEquipped
              ? "bg-gold-500/15 text-gold-400 border border-gold/20 shadow-[0_0_4px_rgba(234,179,8,0.1)]"
              : "bg-surface-800/40 text-surface-600 border border-transparent hover:border-surface-600/30 hover:text-surface-400"
          }`}
        >
          {item.isEquipped ? "✓" : "○"}
        </button>

        {/* Category icon */}
        <span className="text-xs shrink-0" title={category}>{icon}</span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs truncate ${
                item.isEquipped ? "text-gold-400 font-semibold" : "text-surface-300"
              }`}
            >
              {item.name}
            </span>
            {item.isEquipped && (
              <span className="text-[7px] uppercase bg-gold-500/10 text-gold-400 px-1 py-0.5 rounded border border-gold/15 shrink-0 font-semibold">
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

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Weight */}
        <span className="text-[9px] text-surface-500 tabular-nums">{item.weight}lb</span>

        {/* Quantity */}
        {item.quantity > 1 && (
          <span className="text-[9px] text-surface-500 bg-obsidian-mid/40 px-1.5 py-0.5 rounded tabular-nums">
            ×{item.quantity}
          </span>
        )}

        {/* Consumable use button */}
        {isConsumable && (
          <button
            onClick={() => onUseConsumable(index)}
            className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 active:scale-90 transition-all font-medium"
          >
            Use
          </button>
        )}

        {/* Action buttons (visible on hover) */}
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-5 h-5 flex items-center justify-center rounded text-[8px] text-surface-500 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all"
            title="Edit item"
          >
            ✏️
          </button>
          <button
            onClick={onSell}
            className="w-5 h-5 flex items-center justify-center rounded text-[8px] text-surface-500 hover:text-amber-400 hover:bg-amber-500/10 active:scale-90 transition-all"
            title="Sell item"
          >
            💰
          </button>
          {isDeleteConfirm ? (
            <div className="flex gap-0.5">
              <button
                onClick={onConfirmDelete}
                className="w-5 h-5 flex items-center justify-center rounded text-[8px] bg-red-500/15 text-red-400 hover:bg-red-500/25 active:scale-90 transition-all"
                title="Confirm delete"
              >
                ✓
              </button>
              <button
                onClick={onCancelDelete}
                className="w-5 h-5 flex items-center justify-center rounded text-[8px] text-surface-500 hover:text-surface-300 active:scale-90 transition-all"
                title="Cancel"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={onDelete}
              className="w-5 h-5 flex items-center justify-center rounded text-[8px] text-surface-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all"
              title="Delete item"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inline Edit Row ──
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
    <div className="px-2.5 py-2 rounded-lg bg-gold-500/5 border border-gold/15 space-y-1.5">
      <div className="grid grid-cols-[1fr_3rem_3rem] gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25"
          placeholder="Name"
        />
        <input
          type="number" value={quantity} min={1}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="bg-[#07080d]/70 border border-white/[0.06] rounded px-1 py-1 text-[10px] text-center text-surface-200 focus:outline-none focus:border-gold/25"
          title="Qty"
        />
        <input
          type="number" value={weight} min={0} step={0.1}
          onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
          className="bg-[#07080d]/70 border border-white/[0.06] rounded px-1 py-1 text-[10px] text-center text-surface-200 focus:outline-none focus:border-gold/25"
          title="Weight (lb)"
        />
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[9px] text-surface-400 focus:outline-none focus:border-gold/25"
        placeholder="Description"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isEquipped}
            onChange={(e) => setIsEquipped(e.target.checked)}
            className="rounded border-surface-600 bg-surface-800 accent-gold-500 w-3 h-3"
          />
          <span className="text-[9px] text-surface-500">Equipped</span>
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => onSave({ name: name.trim() || item.name, quantity, weight, description: description.trim(), isEquipped })}
            className="px-2 py-0.5 rounded text-[9px] font-semibold bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 active:scale-95 transition-all"
          >
            💾 Save
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-0.5 rounded text-[9px] text-surface-500 hover:text-surface-300 active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
