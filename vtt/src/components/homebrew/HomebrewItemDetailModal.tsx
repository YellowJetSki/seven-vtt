/**
 * STᚱ VTT — Homebrew Item Detail Modal (Cycle 22)
 *
 * Premium Lusion-grade glass popover that displays the FULL statblock
 * for a homebrew item, including weapon/armor/potion stats, charges,
 * tags, and all mechanical fields from the expanded HomebrewItem type.
 */

import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { HomebrewItem } from "@/types/homebrew";

interface HomebrewItemDetailModalProps {
  item: HomebrewItem;
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-surface-400 border-surface-500/30",
  uncommon: "text-amber-400 border-amber-500/30",
  rare: "text-gold-400 border-gold-500/30",
  "very rare": "text-rose-400 border-rose-500/30",
  legendary: "text-violet-400 border-violet-500/30",
  artifact: "text-emerald-400 border-emerald-500/30",
};

const DAMAGE_TYPES_EMOJI: Record<string, string> = {
  acid: "🧪", bludgeoning: "🔨", cold: "❄️", fire: "🔥", force: "💫",
  lightning: "⚡", necrotic: "💀", piercing: "🗡️", poison: "🫗",
  psychic: "🧠", radiant: "☀️", slashing: "⚔️", thunder: "💥",
};

export default function HomebrewItemDetailModal({ item, isOpen, onClose }: HomebrewItemDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isWeapon = item.category === "weapon";
  const isArmor = item.category === "armor";
  const isPotion = item.category === "potion";
  const hasCharges = item.charges !== undefined && item.chargesMax !== undefined;
  const rarityClass = RARITY_COLORS[item.rarity] || "text-surface-400";

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-[#14151f] to-[#0f101a] border border-gold/10 rounded-2xl shadow-2xl shadow-gold-500/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner ornaments */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-gold-500/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gold-500/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gold-500/20 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-gold-500/20 rounded-br-2xl pointer-events-none" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold/15 flex items-center justify-center text-sm">
              {isWeapon ? "⚔️" : isArmor ? "🛡️" : isPotion ? "🧪" : "📦"}
            </div>
            <div>
              <h2 className="text-base font-bold text-gold drop-shadow-[0_0_6px_rgba(234,179,8,0.1)]">{item.name}</h2>
              <p className="text-[9px] text-surface-500 mt-0.5 capitalize">{item.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-gold">
          {/* Rarity + Attunement */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${rarityClass}`}>
              {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
            </span>
            {item.requiresAttunement && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400">
                Requires Attunement{item.attunementDetails ? `: ${item.attunementDetails}` : ""}
              </span>
            )}
            {item.isCursed && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                Cursed{item.curseDetails ? `: ${item.curseDetails}` : ""}
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Description</h3>
              <p className="text-[11px] text-surface-300 leading-relaxed">{item.description}</p>
            </div>
          )}
          {item.flavorText && (
            <p className="text-[10px] text-gold-400/60 italic leading-relaxed">"{item.flavorText}"</p>
          )}

          {/* Weapon Stats */}
          {isWeapon && (
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-4 space-y-3">
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50">⚔ Weapon Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {item.damageDice && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Damage</span>
                    <span className="text-sm font-bold text-rose-400 tabular-nums">
                      {DAMAGE_TYPES_EMOJI[item.damageType || ""] || ""} {item.damageDice}
                      {item.damageType ? ` ${item.damageType.charAt(0).toUpperCase() + item.damageType.slice(1)}` : ""}
                    </span>
                  </div>
                )}
                {item.attackBonus !== undefined && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Attack Bonus</span>
                    <span className="text-sm font-bold text-amber-400 tabular-nums">+{item.attackBonus}</span>
                  </div>
                )}
              </div>
              {item.weaponProperties && item.weaponProperties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.weaponProperties.map((prop) => (
                    <span key={prop} className="text-[8px] px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-400">
                      {prop}
                    </span>
                  ))}
                </div>
              )}
              {item.versatileDamage && (
                <div className="text-[9px] text-surface-500">
                  Versatile: <span className="text-gold-400">{item.versatileDamage}</span> (two hands)
                </div>
              )}
            </div>
          )}

          {/* Armor Stats */}
          {isArmor && (
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-4 space-y-3">
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50">🛡 Armor Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {item.armorType && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Type</span>
                    <span className="text-sm font-bold text-cyan-400 capitalize">{item.armorType}</span>
                  </div>
                )}
                {item.acBonus !== undefined && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">AC Bonus</span>
                    <span className="text-sm font-bold text-cyan-400 tabular-nums">{item.acBonus}</span>
                  </div>
                )}
              </div>
              {item.dexCap !== undefined && item.dexCap < 99 && (
                <div className="text-[9px] text-surface-500">DEX max: <span className="text-gold-400">{item.dexCap}</span></div>
              )}
              {item.strengthRequirement && (
                <div className="text-[9px] text-surface-500">STR requirement: <span className="text-amber-400">{item.strengthRequirement}</span></div>
              )}
              {item.stealthDisadvantage && (
                <div className="text-[9px] text-rose-400">Disadvantage on Stealth checks</div>
              )}
            </div>
          )}

          {/* Potion Stats */}
          {isPotion && (item.healingDice || item.temporaryHp) && (
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-4 space-y-3">
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50">🧪 Potion Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {item.healingDice && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Healing</span>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">❤ {item.healingDice}</span>
                  </div>
                )}
                {item.temporaryHp && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Temp HP</span>
                    <span className="text-sm font-bold text-amber-400 tabular-nums">🛡 {item.temporaryHp}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charges */}
          {hasCharges && (
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-4 space-y-3">
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50">⚡ Charges</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Current</span>
                  <span className="text-sm font-bold text-gold-400 tabular-nums">{item.charges}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Maximum</span>
                  <span className="text-sm font-bold text-gold-400 tabular-nums">{item.chargesMax}</span>
                </div>
                {item.chargesRecharge && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Recharge</span>
                    <span className="text-sm font-bold text-gold-400">{item.chargesRecharge}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag, i) => (
                <span key={i} className="text-[8px] px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Weight & Value */}
          <div className="grid grid-cols-2 gap-3 text-[9px] text-surface-500">
            {item.weight > 0 && <span>Weight: <span className="text-surface-300">{item.weight} lb</span></span>}
            {item.value > 0 && <span>Value: <span className="text-gold-400">{item.value}</span> gp</span>}
          </div>

          {/* Source + Timestamps */}
          <div className="text-[8px] text-surface-600 pt-2 border-t border-white/[0.04]">
            {item.source && <span>Source: {item.source} · </span>}
            {item.isHomebrew && <span>Homebrew · </span>}
            {item.visibleToPlayers ? "Visible to players" : "DM only"}
          </div>
        </div>
      </div>
    </div>
  );
}
