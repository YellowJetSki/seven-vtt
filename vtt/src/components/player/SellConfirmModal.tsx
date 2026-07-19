/**
 * STᚱ VTT — Sell Confirm Modal
 *
 * Quick-sell confirmation for inventory items.
 * Calculates estimated value at 50% of base (5gp × weight lb).
 * Displays item details, sell price, and confirm/cancel buttons.
 */

import type { InventoryItem } from "@/types";
import { detectCategory, categoryIcon } from "./PlayerSheetInventoryTab";

interface SellConfirmModalProps {
  item: InventoryItem;
  estimatedValue: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SellConfirmModal({ item, estimatedValue, onConfirm, onCancel }: SellConfirmModalProps) {
  const category = detectCategory(item.name);
  const icon = categoryIcon(category);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="glass-gold rounded-2xl w-full max-w-xs mx-4 border border-gold/10 shadow-2xl shadow-gold-500/5 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <h3 className="text-xs font-black text-gold tracking-tight">Sell Item</h3>
        </div>

        <div className="bg-obsidian-mid/40 rounded-xl border border-surface-700/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-300 font-medium">{item.name}</span>
            {item.quantity > 1 && (
              <span className="text-[10px] text-surface-500">×{item.quantity}</span>
            )}
          </div>

          {item.description && (
            <p className="text-[9px] text-surface-600">{item.description}</p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-surface-700/20">
            <span className="text-[10px] text-surface-400">Estimated value</span>
            <span className="text-sm text-amber-400 font-bold tabular-nums">{estimatedValue} GP</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[9px] text-surface-600">Weight</span>
            <span className="text-[10px] text-surface-400 tabular-nums">{item.weight} lb</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gold/10">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15 active:scale-95 transition-all"
          >
            💰 Sell for {estimatedValue} GP
          </button>
        </div>
      </div>
    </div>
  );
}
