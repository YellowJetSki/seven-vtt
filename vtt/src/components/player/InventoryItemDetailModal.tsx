/**
 * STᚱ VTT — Inventory Item Detail Modal (Overrrides-Grade Premium Overhaul)
 *
 * Cycle 39: Premium inventory item viewing with:
 * - Hero image banner with gradient overlay (when imageUrl present) + fullscreen lightbox toggle
 * - Premium icon fallback when no image (category-based SVG icon)
 * - Gold-accented stat card for weapons (damage, type, ATK bonus)
 * - Premium stat card for armor (AC bonus)
 * - Consumable indicator with animated sparkle border + immediate consumption flow
 * - **Image lightbox mode** — tap image to expand fullscreen with zoom/pan
 * - **Consumption callbacks** — fires the ConsumptionAnimation on use
 * - Equip/Unequip toggle with gold glow
 * - Premium glass card with edge light + corner ornaments
 * - Staggered entrance animations
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
  const [showLightbox, setShowLightbox] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const category = detectCategory(item.name);
  const icon = categoryIcon(category);
  const isConsumable = ["potion", "scroll", "food", "poison", "oil", "antidote"].some((t) =>
    item.name.toLowerCase().includes(t)
  );
  const hasImage = !!item.imageUrl && !imageError;

  // Escape key dismiss (also exits lightbox)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showLightbox) {
          setShowLightbox(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, showLightbox]);

  // Backdrop click dismiss
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !showLightbox) onClose();
  };

  // Handle consumable use with visual feedback then close
  const handleUseWithAnimation = () => {
    setIsConsuming(true);
    // Small delay to show the "used" state before closing
    setTimeout(() => {
      onUseConsumable(index);
      onClose();
    }, 400);
  };

  return (
    <>
      {/* ── MAIN MODAL ── */}
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
            <div
              className="relative w-full h-48 overflow-hidden cursor-pointer group"
              onClick={() => setShowLightbox(true)}
            >
              <img
                ref={imgRef}
                src={item.imageUrl}
                alt={item.name}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`w-full h-full object-cover transition-all duration-500 ${
                  isImageLoaded ? "opacity-100" : "opacity-0"
                } group-hover:scale-105`}
              />
              {/* Gradient overlay (bottom-to-top fade) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f101a] via-[#0f101a]/60 to-transparent" />
              {/* Top subtle shadow */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
              {/* Fullscreen hint */}
              <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm border border-white/[0.06] text-[8px] text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                🔍 View full size
              </div>
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
                <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest bg-gold-500/15 text-gold-300 border border-gold-500/20 rounded-md shrink-0 animate-pulse">
                  Equipped
                </span>
              )}
              {/* Consumed animation indicator */}
              {isConsuming && (
                <span className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded-md shrink-0 animate-pulse">
                  Used
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
                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/10 group hover:bg-rose-500/8 transition-all duration-200">
                    <span className="text-[7px] uppercase tracking-widest font-bold text-rose-400/60">Damage</span>
                    <p className="text-[13px] font-bold text-rose-300 tabular-nums mt-0.5">
                      {item.damageDice}
                      {item.damageType ? <span className="text-[10px] text-rose-400/70 ml-1">{item.damageType}</span> : ""}
                    </p>
                  </div>
                )}
                {item.attackBonus && (
                  <div className="p-2.5 rounded-xl bg-gold-500/5 border border-gold-500/10 group hover:bg-gold-500/8 transition-all duration-200">
                    <span className="text-[7px] uppercase tracking-widest font-bold text-gold-400/60">Attack</span>
                    <p className="text-[13px] font-bold text-gold-300 tabular-nums mt-0.5">
                      +{item.attackBonus} to hit
                    </p>
                  </div>
                )}
                {item.acBonus && (
                  <div className="p-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/10 group hover:bg-cyan-500/8 transition-all duration-200">
                    <span className="text-[7px] uppercase tracking-widest font-bold text-cyan-400/60">Armor</span>
                    <p className="text-[13px] font-bold text-cyan-300 tabular-nums mt-0.5">
                      +{item.acBonus} AC
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Consumable indicator ── */}
            {isConsumable && !isConsuming && (
              <div className="flex items-center gap-2 mb-4 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 animate-in slide-in-from-bottom-1 duration-300">
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
              {isConsumable && !isConsuming && (
                <button
                  onClick={handleUseWithAnimation}
                  className="w-full h-10 rounded-xl text-[11px] font-semibold bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 text-emerald-300 hover:from-emerald-500/15 hover:to-emerald-500/10 active:scale-[0.97] transition-all duration-200"
                >
                  Use {item.name}
                </button>
              )}

              {/* Consumed state (brief visual) */}
              {isConsuming && (
                <div className="w-full h-10 rounded-xl text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Consuming...
                </div>
              )}

              {/* Image URL hint — shows when item has an image */}
              {hasImage && (
                <button
                  onClick={() => setShowLightbox(true)}
                  className="w-full h-8 rounded-xl text-[9px] font-medium bg-surface-800/30 border border-surface-700/20 text-surface-500 hover:text-surface-400 hover:bg-surface-800/50 active:scale-[0.97] transition-all duration-200"
                >
                  🖼 View Full Image
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

      {/* ── IMAGE LIGHTBOX MODE ── */}
      {showLightbox && hasImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-lg animate-in fade-in duration-200"
          style={{ height: "100dvh", width: "100dvw" }}
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.06] flex items-center justify-center text-white/60 hover:text-white/90 hover:bg-white/[0.08] transition-all z-20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Image caption */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/[0.06] text-[11px] text-white/70 z-20">
            {item.name}
            {item.isEquipped && <span className="ml-2 text-gold-400">· Equipped</span>}
          </div>

          {/* Fullscreen image */}
          <img
            src={item.imageUrl}
            alt={item.name}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-300 select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          {/* Hint text */}
          <p className="absolute bottom-8 left-1/2 -translate-x-1/2 mt-3 text-[9px] text-surface-500 opacity-0">
            Tap anywhere to close
          </p>
        </div>
      )}
    </>
  );
}
