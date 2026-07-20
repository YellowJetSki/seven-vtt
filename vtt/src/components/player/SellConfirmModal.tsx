/**
 * STᚱ VTT — Sell Confirm Modal (Premium)
 *
 * Ventriloc-grade quick-sell confirmation:
 * - Multi-layer cash register aesthetic
 * - Gold/amber premium glass card
 * - Animated coin floating entrance
 * - Item detail card with depth border
 * - Clear value proposition with GP emphasis
 */

import type { InventoryItem } from "@/types";
import { detectCategory, categoryIcon } from "@/lib/inventory-utils";

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
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold edge light */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />

        {/* Corner ornaments */}
        <div className="corner-ornament corner-tl corner-gold" />
        <div className="corner-ornament corner-tr corner-gold" />
        <div className="corner-ornament corner-bl corner-gold" />
        <div className="corner-ornament corner-br corner-gold" />

        <div className="relative p-5 z-[1]">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/2 border border-amber-500/15 flex items-center justify-center">
              <span className="text-sm">{icon}</span>
            </div>
            <div>
              <h3 className="text-xs font-black text-gold tracking-tight">Sell Item</h3>
              <p className="text-[8px] text-surface-600 mt-0.5">Confirm to receive gold</p>
            </div>
          </div>

          {/* Item detail card */}
          <div className="bg-gradient-to-b from-obsidian-mid/50 to-obsidian-mid/30 rounded-xl border border-white/[0.04] p-3.5 space-y-2.5">
            {/* Item name + quantity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{icon}</span>
                <span className="text-xs text-surface-300 font-medium">{item.name}</span>
              </div>
              {item.quantity > 1 && (
                <span className="text-[9px] font-semibold text-surface-500 bg-surface-800/40 px-1.5 py-0.5 rounded-md border border-surface-700/20">
                  ×{item.quantity}
                </span>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-[9px] text-surface-600 leading-relaxed">{item.description}</p>
            )}

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

            {/* Value + Weight grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <span className="text-[7px] uppercase tracking-wider text-amber-500/50 font-semibold block">Value</span>
                <span className="text-sm font-black text-amber-400 tabular-nums">{estimatedValue} GP</span>
              </div>
              <div className="p-2 rounded-lg bg-surface-800/30 border border-surface-700/15">
                <span className="text-[7px] uppercase tracking-wider text-surface-600 font-semibold block">Weight</span>
                <span className="text-sm font-bold text-surface-300 tabular-nums">{item.weight} lb</span>
              </div>
            </div>

            {/* Rate note */}
            <p className="text-[7px] text-surface-600 text-center">
              Estimated at 5 GP/lb (50% of base value)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 mt-5 pt-4 border-t border-gold/10">
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-xl text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all duration-150"
            >
              Keep Item
            </button>
            <button
              onClick={onConfirm}
              className="relative px-5 py-1.5 rounded-xl text-[10px] font-bold bg-gradient-to-b from-amber-500/12 to-amber-500/5 border border-amber-500/20 text-amber-400 hover:from-amber-500/20 hover:to-amber-500/10 active:scale-95 transition-all duration-150 shadow-[0_0_8px_rgba(245,158,11,0.08)]"
            >
              <span className="relative z-[1]">💰 Sell for {estimatedValue} GP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
