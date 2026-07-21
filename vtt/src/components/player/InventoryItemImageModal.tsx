/**
 * STᚱ VTT — Inventory Item Image Modal (Overrrides-Grade Premium)
 *
 * Cycle 43: Full-screen image viewing modal triggered by tapping an inventory item
 * that has an `imageUrl` field set. Provides:
 *   - Full-screen premium glass backdrop with blurred overlay
 *   - Gradient-framed image with ambient glow pocket
 *   - Item name + description card overlaid below image
 *   - Equip/Consume quick-actions in the footer
 *   - Tap to dismiss + Escape key support
 *   - Staggered entrance animation
 *   - Premium edge-lit glass card framing
 *
 * Design: Overrrides/Lusion premium — deep glass overlays, gradient edges,
 *   staggered entrances, gold accent on equipped items.
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useEffect, useRef } from "react";
import type { InventoryItem } from "@/types";
import { detectCategory, categoryIcon } from "@/lib/inventory-utils";

interface InventoryItemImageModalProps {
  item: InventoryItem;
  onClose: () => void;
  onToggleEquip?: () => void;
  onUseConsumable?: () => void;
}

function getStatusLabel(item: InventoryItem): { text: string; color: string; icon: string } {
  const low = item.name.toLowerCase();
  if (item.isEquipped) return { text: "Equipped", color: "text-gold-400 bg-gold-500/10 border-gold/20", icon: "✓" };
  if (["potion", "elixir", "scroll"].some((k) => low.includes(k))) return { text: "Consumable", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "🧪" };
  if (["food", "ration", "wine", "ale"].some((k) => low.includes(k))) return { text: "Provision", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: "🍞" };
  if (["ring", "wand", "amulet"].some((k) => low.includes(k))) return { text: "Magic Item", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: "🪄" };
  return { text: "Item", color: "text-surface-400 bg-surface-800/40 border-surface-700/20", icon: "📦" };
}

export default function InventoryItemImageModal({
  item, onClose, onToggleEquip, onUseConsumable,
}: InventoryItemImageModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const category = detectCategory(item.name);
  const icon = categoryIcon(category);
  const status = getStatusLabel(item);
  const isConsumable = ["potion", "scroll", "food", "poison", "oil", "antidote"].some((t) =>
    item.name.toLowerCase().includes(t)
  );

  // Escape key to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-in fade-in duration-300"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Card container — premium glass with edge light */}
      <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] shadow-[0_32px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(234,179,8,0.02)] animate-in zoom-in-95 duration-300">
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── Image Container ── */}
        {item.imageUrl ? (
          <div className="relative w-full aspect-video overflow-hidden rounded-t-2xl bg-[#0a0b12]">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#14151f]/90 to-transparent pointer-events-none" />
            {/* Ambient glow pocket */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gold-500/5 blur-3xl rounded-full pointer-events-none" />

            {/* Close button — positioned top-right over the image */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all duration-150 z-10"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ) : (
          /* Placeholder when no image URL */
          <div className="w-full aspect-video rounded-t-2xl bg-gradient-to-br from-surface-900/80 to-[#0a0b12] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl opacity-30">{icon}</span>
              <span className="text-[9px] uppercase tracking-wider text-surface-600">No Image</span>
            </div>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-black/50 backdrop-blur-sm border border-white/[0.08] flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 transition-all duration-150"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Item Details ── */}
        <div className="p-4 space-y-3">
          {/* Header row: category icon + name + status badge */}
          <div className="flex items-center gap-2">
            <span className="text-lg opacity-60">{icon}</span>
            <h3 className="text-sm font-bold text-white/90 flex-1 leading-tight">
              {item.name}
            </h3>
            <span className={`text-[7px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-md border ${status.color}`}>
              {status.icon} {status.text}
            </span>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2 text-center">
              <span className="block text-[7px] uppercase tracking-wider text-surface-500">Qty</span>
              <span className="block text-sm font-mono tabular-nums font-bold text-white/80">{item.quantity}</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2 text-center">
              <span className="block text-[7px] uppercase tracking-wider text-surface-500">Weight</span>
              <span className="block text-sm font-mono tabular-nums font-bold text-white/80">{item.weight} lb</span>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-2 text-center">
              <span className="block text-[7px] uppercase tracking-wider text-surface-500">Category</span>
              <span className="block text-xs font-medium text-white/60 capitalize">{category}</span>
            </div>
          </div>

          {/* Attack/Damage stats — only if weapon has them */}
          {(item.attackBonus !== undefined || item.damageDice) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
              {item.attackBonus !== undefined && (
                <span className="text-[10px] font-mono tabular-nums font-bold text-rose-400">
                  +{item.attackBonus} to hit
                </span>
              )}
              {item.damageDice && (
                <>
                  <span className="text-surface-600">·</span>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-rose-400">
                    {item.damageDice}
                  </span>
                </>
              )}
              {item.damageType && (
                <span className="text-[8px] uppercase tracking-wider text-rose-500/70">
                  {item.damageType}
                </span>
              )}
            </div>
          )}

          {/* AC bonus — only if armor/shield */}
          {item.acBonus && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
              <span className="text-[10px] font-mono tabular-nums font-bold text-cyan-400">
                +{item.acBonus} AC
              </span>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[11px] text-surface-400 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {onToggleEquip && (
              <button
                onClick={onToggleEquip}
                className={`flex-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all duration-150 active:scale-95 ${
                  item.isEquipped
                    ? "bg-gradient-to-r from-amber-500/15 to-amber-600/10 text-amber-400 border border-amber-500/20 hover:from-amber-500/20"
                    : "bg-gradient-to-r from-gold-500/10 to-amber-500/5 text-gold-400 border border-gold/15 hover:from-gold-500/15"
                }`}
              >
                {item.isEquipped ? "✕ Unequip" : "✓ Equip"}
              </button>
            )}
            {isConsumable && onUseConsumable && (
              <button
                onClick={onUseConsumable}
                className="flex-1 px-3 py-2 rounded-xl text-[10px] font-bold bg-gradient-to-r from-emerald-500/15 to-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:from-emerald-500/25 active:scale-95 transition-all duration-150"
              >
                🧪 Use
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-[10px] font-bold bg-white/[0.03] text-surface-400 border border-white/[0.06] hover:text-white/70 hover:bg-white/[0.06] active:scale-95 transition-all duration-150"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
