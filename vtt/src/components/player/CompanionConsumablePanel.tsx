/**
 * STᚱ VTT — Companion Consumable Quick-Use Panel (Overrrides-Grade Premium)
 *
 * Cycle 44: Compact, premium consumable quick-use panel for the companion
 * encounter view. During the player's turn, any potions, scrolls, or
 * healing items in their inventory appear here as one-click use buttons.
 *
 * Features:
 *   - Scans character inventory for consumable items
 *   - Shows up to 3 most relevant items (potions first, then scrolls, then food)
 *   - One-click Use button with consumption animation
 *   - Expands to "Show all X items" for more than 3
 *   - Staggered entrance with per-item delay
 *   - Premium emerald/gold/violet glass buttons
 *   - Auto-decrements quantity on use
 *
 * Design: Overrrides/Ventriloc — compact glass buttons, gold-edge lights,
 *   per-type color coding, staggered entrance.
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useCallback, useMemo } from "react";
import type { PlayerCharacter, InventoryItem } from "@/types";
import { useInventoryMutations } from "@/hooks/useCharacterMutations";
import ConsumptionAnimation, { getConsumableType } from "./ConsumptionAnimation";

interface CompanionConsumablePanelProps {
  character: PlayerCharacter;
}

/** Check if an item is consumable */
function isConsumableItem(name: string): boolean {
  return ["potion", "scroll", "food", "poison", "oil", "antidote"].some((t) =>
    name.toLowerCase().includes(t)
  );
}

/** Style config per consumable type */
function consumableButtonStyle(name: string): {
  gradient: string; border: string; text: string; icon: string; hover: string;
} {
  const low = name.toLowerCase();
  if (low.includes("potion") || low.includes("elixir"))
    return { gradient: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-500/15", text: "text-emerald-300", icon: "🧪", hover: "hover:from-emerald-500/15" };
  if (low.includes("scroll"))
    return { gradient: "from-violet-500/10 to-violet-500/5", border: "border-violet-500/15", text: "text-violet-300", icon: "📜", hover: "hover:from-violet-500/15" };
  if (low.includes("food") || low.includes("ration"))
    return { gradient: "from-amber-500/10 to-amber-500/5", border: "border-amber-500/15", text: "text-amber-300", icon: "🍖", hover: "hover:from-amber-500/15" };
  if (low.includes("oil"))
    return { gradient: "from-amber-600/10 to-amber-600/5", border: "border-amber-600/15", text: "text-amber-300", icon: "🫗", hover: "hover:from-amber-600/15" };
  if (low.includes("antidote"))
    return { gradient: "from-sky-500/10 to-sky-500/5", border: "border-sky-500/15", text: "text-sky-300", icon: "💊", hover: "hover:from-sky-500/15" };
  return { gradient: "from-gold-500/10 to-gold-500/5", border: "border-gold-500/15", text: "text-gold-300", icon: "✨", hover: "hover:from-gold-500/15" };
}

export default function CompanionConsumablePanel({ character }: CompanionConsumablePanelProps) {
  const { handleUseConsumable } = useInventoryMutations();
  const [showAll, setShowAll] = useState(false);
  const [consumingIndex, setConsumingIndex] = useState<number | null>(null);
  const [consumedName, setConsumedName] = useState<string | null>(null);
  const [consumedValue, setConsumedValue] = useState<number | undefined>(undefined);

  // Filter consumable items from inventory
  const consumables = useMemo(() => {
    return character.inventory
      .map((item, idx) => ({ item, idx }))
      .filter(({ item }) => isConsumableItem(item.name) && item.quantity > 0);
  }, [character.inventory]);

  // Prioritize potions first, then scrolls, then rest
  const sorted = useMemo(() => {
    return [...consumables].sort((a, b) => {
      const aIsPotion = a.item.name.toLowerCase().includes("potion") ? 0 : 1;
      const bIsPotion = b.item.name.toLowerCase().includes("potion") ? 0 : 1;
      if (aIsPotion !== bIsPotion) return aIsPotion - bIsPotion;
      const aIsScroll = a.item.name.toLowerCase().includes("scroll") ? 0 : 1;
      const bIsScroll = b.item.name.toLowerCase().includes("scroll") ? 0 : 1;
      return aIsScroll - bIsScroll;
    });
  }, [consumables]);

  const display = showAll ? sorted : sorted.slice(0, 3);

  const handleUse = useCallback((idx: number, name: string) => {
    setConsumingIndex(idx);
    setConsumedName(name);
    // Estimate healing value from item name
    const low = name.toLowerCase();
    let value: number | undefined = undefined;
    if (low.includes("healing") || low.includes("potion of healing")) {
      if (low.includes("supreme")) value = 45;
      else if (low.includes("superior")) value = 28;
      else if (low.includes("greater")) value = 14;
      else value = 7; // standard potion of healing
    }
    setConsumedValue(value);

    // Small delay for the consumption animation, then apply
    setTimeout(() => {
      handleUseConsumable(character, idx);
    }, 400);
  }, [character, handleUseConsumable]);

  const handleAnimationComplete = useCallback(() => {
    setConsumingIndex(null);
    setConsumedName(null);
    setConsumedValue(undefined);
  }, []);

  if (sorted.length === 0) return null;

  return (
    <>
      {/* Consumption animation overlay */}
      {consumedName && (
        <ConsumptionAnimation
          itemName={consumedName}
          itemType={getConsumableType(consumedName)}
          value={consumedValue}
          valueLabel="HP"
          duration={1800}
          onComplete={handleAnimationComplete}
        />
      )}

      <div className="px-3 py-2 border-b border-white/[0.03] bg-white/[0.005] space-y-1.5 animate-in slide-in-from-bottom-1 duration-200">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <span className="text-[7px] uppercase tracking-widest text-emerald-500/50 font-semibold">
            Quick Items
          </span>
          {sorted.length > 0 && (
            <span className="text-[7px] font-mono tabular-nums text-surface-500">
              {sorted.length} available
            </span>
          )}
        </div>

        {/* Consumable buttons */}
        <div className={showAll ? "space-y-1" : "grid grid-cols-3 gap-1.5"}>
          {display.map(({ item, idx }, displayIdx) => {
            const style = consumableButtonStyle(item.name);
            const isAnimating = consumingIndex === idx;

            return (
              <button
                key={`${idx}-${item.name}`}
                onClick={() => !isAnimating && handleUse(idx, item.name)}
                disabled={isAnimating}
                style={{ animationDelay: `${displayIdx * 50}ms` }}
                className={`
                  group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg
                  border transition-all duration-200 animate-in slide-in-from-bottom-1
                  active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed
                  ${isAnimating
                    ? "border-emerald-500/30 bg-emerald-500/15"
                    : `${style.gradient} ${style.border} ${style.hover}`
                  }
                  ${showAll ? "w-full" : "flex-col"}
                `}
              >
                {/* Edge light */}
                <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                {/* Icon */}
                <span className={`text-sm leading-none ${isAnimating ? "animate-bounce" : ""}`}>
                  {style.icon}
                </span>

                {/* Name + Quantity */}
                <div className={`flex items-center gap-1 ${showAll ? "min-w-0 flex-1" : "flex-col"}`}>
                  <span className={`text-[8px] font-semibold truncate max-w-[60px] ${style.text}`}>
                    {item.name}
                  </span>
                  {item.quantity > 1 && (
                    <span className="text-[7px] font-mono tabular-nums text-surface-500 shrink-0">
                      ×{item.quantity}
                    </span>
                  )}
                </div>

                {/* Consuming indicator */}
                {isAnimating && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-emerald-500/10 backdrop-blur-[2px]">
                    <span className="flex items-center gap-1 text-[7px] font-bold text-emerald-400 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Used
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* "Show all" toggle */}
        {sorted.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full text-[7px] uppercase tracking-wider text-surface-500 hover:text-surface-400 transition-colors duration-200 py-0.5"
          >
            {showAll ? "△ Show fewer" : `▽ Show all ${sorted.length} items`}
          </button>
        )}
      </div>
    </>
  );
}
