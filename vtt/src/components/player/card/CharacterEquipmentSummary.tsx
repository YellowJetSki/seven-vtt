/* ── CharacterEquipmentSummary ──────────────────────────────────
 * Compact equipment & inventory quick-view: equipped items list,
 * inventory count, currency breakdown, and armor display.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";
import { useState } from "react";
import { formatCurrency } from "@/lib/character-export";

/** Armor/heavy equipment slot names */
const ARMOR_SLOTS = ["armor", "chest", "body", "shield", "helmet", "head"];
const EQUIPPED_SLOTS = ["main hand", "off hand", "both hands", "ranged", "armor", "shield", "helmet", "head", "neck", "ring", "wrist", "feet", "belt", "back", "cloak"];

function isEquipped(item: { slot: string }): boolean {
  const s = item.slot.toLowerCase();
  return EQUIPPED_SLOTS.some((slot) => s.includes(slot));
}

function isArmor(item: { slot: string }): boolean {
  const s = item.slot.toLowerCase();
  return ARMOR_SLOTS.some((slot) => s.includes(slot));
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterEquipmentSummary({ character }: Props) {
  const [showAll, setShowAll] = useState(false);

  const eq = character.equipment ?? [];
  const inv = character.inventory ?? [];
  const equipped = eq.filter((item) => isEquipped(item));
  const armorItems = eq.filter((item) => isArmor(item));
  const otherItems = eq.filter((item) => !isEquipped(item) && !isArmor(item));

  const totalItems = eq.length + inv.length + (character.currency ? 1 : 0);
  const totalWeight = eq.reduce((sum, item) => sum + (item.weight ?? 0) * (item.quantity ?? 1), 0) +
    inv.reduce((sum, item) => sum + (item.weight ?? 0) * (item.quantity ?? 1), 0);

  const gold = formatCurrency(character, "gp");

  return (
    <div className="space-y-1">
      {/* Currency + Weight summary */}
      <div className="flex items-center justify-between">
        <p className="text-[8px] font-semibold uppercase tracking-wider text-surface-500">🎒 Equipment</p>
        <div className="flex items-center gap-2 text-[9px] text-surface-500">
          <span title="Total weight">⚖ {totalWeight}lb</span>
          <span className="text-surface-600">·</span>
          <span title="Gold pieces" className="text-yellow-400 font-medium">🪙 {gold}</span>
        </div>
      </div>

      {/* Equipped items quick-view */}
      <div className="space-y-0.5">
        {armorItems.slice(0, 2).map((item, i) => (
          <div key={`armor-${i}`} className="flex items-center gap-1.5 text-[10px] text-surface-300">
            <span className="text-surface-500">🛡</span>
            <span className="truncate font-medium">{item.item}</span>
            {item.quantity > 1 && <span className="text-surface-500">×{item.quantity}</span>}
          </div>
        ))}
        {equipped.filter((e) => !isArmor(e)).slice(0, 3).map((item, i) => (
          <div key={`eq-${i}`} className="flex items-center gap-1.5 text-[10px] text-surface-300">
            <span className="text-surface-500">◆</span>
            <span className="truncate font-medium">{item.item}</span>
            {item.quantity > 1 && <span className="text-surface-500">×{item.quantity}</span>}
            {item.notes && <span className="text-surface-600 italic">({item.notes})</span>}
          </div>
        ))}
        {equipped.length + armorItems.length > 5 && !showAll && (
          <button onClick={() => setShowAll(true)}
            className="text-[9px] text-accent-500 hover:text-accent-400 transition-colors">
            +{equipped.length + armorItems.length - 5} more equipped
          </button>
        )}
        {showAll && equipped.filter((e) => !isArmor(e)).slice(3).map((item, i) => (
          <div key={`eq-all-${i}`} className="flex items-center gap-1.5 text-[10px] text-surface-300">
            <span className="text-surface-500">◆</span>
            <span className="truncate font-medium">{item.item}</span>
            {item.quantity > 1 && <span className="text-surface-500">×{item.quantity}</span>}
          </div>
        ))}
      </div>

      {/* Item counts footer */}
      <div className="flex items-center gap-2 text-[9px] text-surface-500 pt-0.5 border-t border-surface-700/30">
        <span className="flex items-center gap-1">
          <span>🎒</span>
          {equipped.length} equipped
        </span>
        {otherItems.length > 0 && (
          <>
            <span className="text-surface-600">·</span>
            <span>{otherItems.length} carried</span>
          </>
        )}
        {inv.length > 0 && (
          <>
            <span className="text-surface-600">·</span>
            <span className="text-mage-400">{inv.length} stored</span>
          </>
        )}
        {/* Currency quick-view */}
        <span className="ml-auto flex items-center gap-1 text-[9px]">
          <span className="text-yellow-400">GP</span>
          <span className="text-surface-300 font-mono">{gold}</span>
          <span className="text-surface-600 mx-0.5">·</span>
          <span className="text-cyan-300">PP</span>
          <span className="text-surface-300 font-mono">{formatCurrency(character, "pp")}</span>
        </span>
      </div>
    </div>
  );
}
