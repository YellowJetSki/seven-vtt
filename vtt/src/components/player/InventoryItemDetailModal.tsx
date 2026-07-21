/**
 * STᚱ VTT — Inventory Item Detail Modal (Premium Visual)
 *
 * Premium modal for viewing item details with image support.
 * When an item has an imageUrl, displays a full-width hero image
 * with gradient overlays akin to Spotify album art.
 * Supports: potion animations, weapon stat cards, armor display.
 *
 * Features:
 * - Hero image banner with gradient overlay (when imageUrl present)
 * - Premium icon fallback when no image (category-based SVG icon)
 * - Gold-accented stat card for weapons (damage, type, ATK bonus)
 * - Premium stat card for armor (AC bonus)
 * - Consumable indicator with animated sparkle border
 * - Use consumable button with confirmation
 * - Equip/Unequip toggle with gold glow
 * - Premium glass card with edge light + corner ornaments
 * - Staggered entrance animation for all elements
 * - Escape key + backdrop click to dismiss
 *
 * Campaign: Arkla — Wendy Swiftfoot, Kehrfuffle Ironheart
 */

import { useEffect, useRef, useState } from "react";
import type { InventoryItem } from "@/types";
import { detectCategory, categoryIcon } from "@/lib/inventory-utils";

interface InventoryItemDetailModalProps {
  item: InventoryItem;
  index: number;
  onClose: () => void;
  onToggleEquip: (index: number) => void;
  onUseConsumable: (index: number) => void;
  onDelete: (index: number) => void;
}

export default function InventoryItemDetailModal({
  item,
  index,
  onClose,
  onToggleEquip,
  onUseConsumable,
  onDelete,
}: InventoryItemDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const category = detectCategory(item.name);
  const icon = categoryIcon(category);
  const isConsumable = ["potion", "scroll", "food", "poison", "oil", "antidote"].some((t) =>
    item.name.toLowerCase().includes(t)
  );
  const hasImage = !!item.imageUrl && !imageError;

  // Escape key dismiss
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Backdrop click dismiss
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ height: "100dvh", width: "100dvw" }}
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className="relative w-[360px] max-w-[calc(100vw-2rem)] max-h-[85dvh] overflow-y-auto bg-gradient-to-b from-[#14151f]/[0.97] to-[#0f101a]/[0.98] backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] animate-in zoom-in-95 duration-200 scrollbar-gold"
      >
        {/* Gold edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none z-10" />
        {/* Right edge light */}
        <div className="absolute right-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-gold-500/10 to-transparent pointer-events-none" />
        {/* Corner ornaments */}
        <div className="absolute top-3 left-3 w-2 h-2 border-t border-l border-gold-500/20 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-3 right-3 w-2 h-2 border-t border-r border-gold-500/20 rounded-tr-sm pointer-events-none" />

        {/* ── Image Hero Banner ── */}
        {hasImage ? (
          <div className="relative w-full h-48 overflow-hidden">
            <img
              ref={imgRef}
              src={item.imageUrl}
              alt={item.name}
              onLoad={() => setIsImageLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover transition-all duration-500 ${
                isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* Gradient overlay (bottom-to-top fade) */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f101a] via-[#0f101a]/60 to-transparent" />
            {/* Top subtle shadow */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="relative w-full h-36 flex items-center justify-center bg-gradient-to-br from-surface-900/60 to-surface-950/80">
            {/* Ambient glow */}
            <div className="absolute w-24 h-24 bg-gold-500/5 rounded-full blur-[40px]" />
            <span className="text-5xl opacity-40">{icon}</span>
          </div>
        )}

        {/* ── Content Area ── */}
        <div className="px-5 pb-5 -mt-8 relative z-10">
          {/* Name + Equipped badge */}
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[15px] font-bold text-white/90 font-display tracking-tight truncate">
              {item.name}
            </h3>
            {item.isEquipped && (
              <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest bg-gold-500/15 text-gold-300 border border-gold-500/20 rounded-md shrink-0">
                Equipped
              </span>
            )}
          </div>

          {/* Category + weight + quantity */}
          <div className="flex items-center gap-2 text-[9px] text-surface-500 mb-3">
            <span>{icon} {category}</span>
            <span className="text-surface-700">·</span>
            <span className="tabular-nums">{item.weight} lb</span>
            {item.quantity > 1 && (
              <>
                <span className="text-surface-700">·</span>
                <span className="tabular-nums">×{item.quantity}</span>
              </>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-[11px] text-surface-400 leading-relaxed mb-4 italic border-l-2 border-gold/20 pl-3">
              {item.description}
            </p>
          )}

          {/* ── Weapon/Armor Stats ── */}
          {(item.damageDice || item.attackBonus || item.acBonus) && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {item.damageDice && (
                <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <span className="text-[7px] uppercase tracking-widest font-bold text-rose-400/60">Damage</span>
                  <p className="text-[13px] font-bold text-rose-300 tabular-nums mt-0.5">
                    {item.damageDice}
                    {item.damageType ? ` ${item.damageType}` : ""}
                  </p>
                </div>
              )}
              {item.attackBonus && (
                <div className="p-2.5 rounded-xl bg-gold-500/5 border border-gold-500/10">
                  <span className="text-[7px] uppercase tracking-widest font-bold text-gold-400/60">Attack</span>
                  <p className="text-[13px] font-bold text-gold-300 tabular-nums mt-0.5">
                    +{item.attackBonus} to hit
                  </p>
                </div>
              )}
              {item.acBonus && (
                <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10">
                  <span className="text-[7px] uppercase tracking-widest font-bold text-cyan-400/60">Armor</span>
                  <p className="text-[13px] font-bold text-cyan-300 tabular-nums mt-0.5">
                    +{item.acBonus} AC
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Consumable indicator ── */}
          {isConsumable && (
            <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <span className="text-lg animate-pulse">🧪</span>
              <div>
                <p className="text-[10px] font-semibold text-emerald-400">Consumable</p>
                <p className="text-[8px] text-emerald-400/50">
                  Use this item to consume one charge
                </p>
              </div>
            </div>
          )}

          {/* ── Action Buttons ── */}
          <div className="flex flex-col gap-2">
            {/* Equip/Unequip */}
            <button
              onClick={() => { onToggleEquip(index); onClose(); }}
              className={`w-full h-10 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-[0.97] ${
                item.isEquipped
                  ? "bg-gradient-to-r from-surface-800/60 to-surface-900/60 border border-surface-600/30 text-surface-400 hover:bg-surface-800/80"
                  : "bg-gradient-to-r from-gold-500/10 to-amber-500/8 border border-gold/15 text-gold-300 hover:from-gold-500/15 hover:to-amber-500/12"
              }`}
            >
              {item.isEquipped ? "Unequip" : "Equip"}
            </button>

            {/* Use consumable */}
            {isConsumable && (
              <button
                onClick={() => { onUseConsumable(index); onClose(); }}
                className="w-full h-10 rounded-xl text-[11px] font-semibold bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 text-emerald-300 hover:from-emerald-500/15 hover:to-emerald-500/10 active:scale-[0.97] transition-all duration-200"
              >
                Use {item.name}
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => { onDelete(index); onClose(); }}
              className="w-full h-9 rounded-xl text-[10px] font-medium bg-rose-500/5 border border-rose-500/10 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/15 active:scale-[0.97] transition-all duration-200"
            >
              Remove from Inventory
            </button>

            {/* Cancel */}
            <button
              onClick={onClose}
              className="text-[9px] text-surface-600 hover:text-surface-400 transition-colors duration-200 py-1.5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
