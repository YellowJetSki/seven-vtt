/**
 * STᚱ VTT — Loot Deposit Panel (Real-Play D&D Mechanics, Sprint 14)
 *
 * A DM-facing loot distribution tool for the Player Cards page.
 * Allows the DM to quickly deposit items (potions, gold, weapons, quest items)
 * into specific characters' inventories during live sessions.
 *
 * Features:
 * - Pre-built loot presets for common scenarios (Healing Potions, Gold, etc.)
 * - Custom loot entry (name, quantity, weight, description)
 * - Character target picker with avatars (click to target)
 * - Thumbnail-style deposit button per character-card
 * - Recent deposits log (last 3 deposits with undo capability)
 * - Floating panel with glass card styling
 * - Staggered entrance animations
 * - Premium Lusion-grade design
 *
 * Architecture:
 * - Reads characters from campaignStore
 * - Writes inventory changes via campaignStore.updateCharacter()
 * - Self-contained: no external dependencies beyond stores and types
 * - Mounted on PlayerCards page via PlayerList
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter, InventoryItem } from "@/types";

// ── Type Definitions ──

interface LootDepositPanelProps {
  /** Optional className for positioning */
  className?: string;
}

interface LootPreset {
  label: string;
  icon: string;
  item: Omit<InventoryItem, "isEquipped">;
  /** If set, adds to currency instead of inventory */
  currency?: Partial<{
    copper: number;
    silver: number;
    electrum: number;
    gold: number;
    platinum: number;
  }>;
}

interface DepositLogEntry {
  charName: string;
  itemName: string;
  quantity: number;
  timestamp: number;
}

// ── Loot Presets ──

const LOOT_PRESETS: LootPreset[] = [
  {
    label: "Healing Potion",
    icon: "\uD83E\uDDEA",
    item: {
      name: "Potion of Healing",
      quantity: 1,
      weight: 0.5,
      description: "Regains 2d4+2 hit points. Standard adventuring gear.",
    },
  },
  {
    label: "Gold (10)",
    icon: "\uD83E\uDE99",
    item: { name: "Gold Coins", quantity: 10, weight: 0.2, description: "" },
    currency: { gold: 10 },
  },
  {
    label: "Gold (50)",
    icon: "\uD83D\uDCB0",
    item: { name: "Gold Coins", quantity: 50, weight: 1.0, description: "" },
    currency: { gold: 50 },
  },
  {
    label: "Gold (100)",
    icon: "\uD83D\uDCB5",
    item: { name: "Gold Coins", quantity: 100, weight: 2.0, description: "" },
    currency: { gold: 100 },
  },
  {
    label: "Torch",
    icon: "\uD83D\uDD25",
    item: {
      name: "Torch",
      quantity: 1,
      weight: 1.0,
      description: "Sheds bright light in a 20-foot radius for 1 hour.",
    },
  },
  {
    label: "Rations (1d)",
    icon: "\uD83C\uDF5E",
    item: {
      name: "Rations (1 day)",
      quantity: 1,
      weight: 2.0,
      description: "Sustenance for one day. Essential for long journeys.",
    },
  },
  {
    label: "Rope (50ft)",
    icon: "\uD83E\uDEA3",
    item: {
      name: "Hempen Rope (50 ft.)",
      quantity: 1,
      weight: 10.0,
      description: "50 feet of sturdy hempen rope. Climbing, tying, and creative problem-solving.",
    },
  },
  {
    label: "Arrows (20)",
    icon: "\uD83C\uDFF9",
    item: {
      name: "Arrows (20)",
      quantity: 1,
      weight: 1.0,
      description: "A quiver of 20 arrows. Standard ammunition.",
    },
  },
  {
    label: "Magic Item",
    icon: "\u2728",
    item: {
      name: "Common Magic Item",
      quantity: 1,
      weight: 0.5,
      description: "A minor magical oddity. DM to describe specific effects.",
    },
  },
];

// ── Helper: Check if a string looks like a consumable ──

function isConsumable(name: string): boolean {
  const low = name.toLowerCase();
  return ["potion", "scroll", "food", "ration", "arrow", "torch", "oil", "poison", "antidote"].some(
    (k) => low.includes(k)
  );
}

// ── Main Component ──

export default function LootDepositPanel({ className = "" }: LootDepositPanelProps) {
  const characters = useCampaignStore((s) => s.characters);
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const [targetCharId, setTargetCharId] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customQty, setCustomQty] = useState(1);
  const [customWeight, setCustomWeight] = useState(0.5);
  const [customDesc, setCustomDesc] = useState("");
  const [recentDeposits, setRecentDeposits] = useState<DepositLogEntry[]>([]);
  const [flashMessage, setFlashMessage] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((text: string, type: "success" | "info" | "warning" = "success") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFlashMessage({ text, type });
    timeoutRef.current = setTimeout(() => setFlashMessage(null), 2000);
  }, []);

  // ── Find target character ──
  const targetChar = useMemo(
    () => characters.find((c) => c.id === targetCharId) ?? null,
    [characters, targetCharId]
  );

  // ── Deposit a preset loot item ──
  const handleDepositPreset = useCallback(
    (preset: LootPreset) => {
      if (!targetCharId || !targetChar) return;

      if (preset.currency) {
        // Currency deposit
        const updatedCurrency = { ...targetChar.currency };
        if (preset.currency.copper) updatedCurrency.copper += preset.currency.copper;
        if (preset.currency.silver) updatedCurrency.silver += preset.currency.silver;
        if (preset.currency.electrum) updatedCurrency.electrum += preset.currency.electrum;
        if (preset.currency.gold) updatedCurrency.gold += preset.currency.gold;
        if (preset.currency.platinum) updatedCurrency.platinum += preset.currency.platinum;
        updateCharacter(targetCharId, { currency: updatedCurrency });

        const goldAmount = preset.currency.gold ?? 0;
        setRecentDeposits((prev) =>
          [
            { charName: targetChar.name, itemName: `${goldAmount} GP`, quantity: 1, timestamp: Date.now() },
            ...prev,
          ].slice(0, 3)
        );
        showFlash(`\uD83E\uDE99 Added ${goldAmount} GP to ${targetChar.name.split(" ")[0]}`, "info");
        return;
      }

      // Inventory deposit
      const newItem: InventoryItem = {
        ...preset.item,
        isEquipped: false,
      };

      // If the item is a stackable consumable that already exists, increment quantity
      const existingIdx = targetChar.inventory.findIndex(
        (i) => i.name.toLowerCase() === newItem.name.toLowerCase() && !i.isEquipped
      );
      const updatedInventory = [...targetChar.inventory];

      if (existingIdx >= 0 && isConsumable(newItem.name)) {
        updatedInventory[existingIdx] = {
          ...updatedInventory[existingIdx],
          quantity: updatedInventory[existingIdx].quantity + newItem.quantity,
        };
      } else {
        updatedInventory.push(newItem);
      }

      updateCharacter(targetCharId, { inventory: updatedInventory });

      setRecentDeposits((prev) =>
        [
          {
            charName: targetChar.name,
            itemName: newItem.name,
            quantity: newItem.quantity,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 3)
      );
      showFlash(
        `\uD83D\uDCE6 ${preset.icon} ${newItem.name} \u2192 ${targetChar.name.split(" ")[0]}`,
        "success"
      );
    },
    [targetCharId, targetChar, updateCharacter, showFlash]
  );

  // ── Deposit custom loot item ──
  const handleDepositCustom = useCallback(() => {
    if (!targetCharId || !targetChar || !customName.trim()) return;

    const newItem: InventoryItem = {
      name: customName.trim(),
      quantity: Math.max(1, customQty),
      weight: Math.max(0, customWeight),
      description: customDesc.trim() || "No description.",
      isEquipped: false,
    };

    const updatedInventory = [...targetChar.inventory, newItem];
    updateCharacter(targetCharId, { inventory: updatedInventory });

    setRecentDeposits((prev) =>
      [
        {
          charName: targetChar.name,
          itemName: newItem.name,
          quantity: newItem.quantity,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, 3)
    );
    showFlash(`\u2728 Deposited ${newItem.name} to ${targetChar.name.split(" ")[0]}`, "success");

    // Reset custom fields but keep panel open
    setCustomName("");
    setCustomQty(1);
    setCustomWeight(0.5);
    setCustomDesc("");
  }, [targetCharId, targetChar, customName, customQty, customWeight, customDesc, updateCharacter, showFlash]);

  // ── Undo last deposit ──
  const handleUndo = useCallback(
    (idx: number) => {
      const entry = recentDeposits[idx];
      if (!entry) return;

      const char = characters.find((c) => c.name === entry.charName);
      if (!char) return;

      // Find and remove the last matching item from inventory
      const invCopy = [...char.inventory];
      const itemIdx = (() => {
        for (let idx = invCopy.length - 1; idx >= 0; idx--) {
          if (invCopy[idx].name === entry.itemName) return idx;
        }
        return -1;
      })();
      if (itemIdx >= 0) {
        if (invCopy[itemIdx].quantity > entry.quantity && isConsumable(invCopy[itemIdx].name)) {
          invCopy[itemIdx] = {
            ...invCopy[itemIdx],
            quantity: invCopy[itemIdx].quantity - entry.quantity,
          };
        } else {
          invCopy.splice(itemIdx, 1);
        }
        updateCharacter(char.id, { inventory: invCopy });
      }

      setRecentDeposits((prev) => prev.filter((_, i) => i !== idx));
      showFlash(`\u21A9 Undid deposit: ${entry.itemName}`, "warning");
    },
    [characters, updateCharacter, recentDeposits, showFlash]
  );

  // ── Gold to any character (quick deposit from PlayerCardCompact) ──
  const handleQuickGold = useCallback(
    (charId: string, amount: number) => {
      const char = characters.find((c) => c.id === charId);
      if (!char) return;
      const updatedCurrency = { ...char.currency, gold: char.currency.gold + amount };
      updateCharacter(charId, { currency: updatedCurrency });
      setRecentDeposits((prev) =>
        [
          { charName: char.name, itemName: `${amount} GP`, quantity: 1, timestamp: Date.now() },
          ...prev,
        ].slice(0, 3)
      );
      showFlash(`\uD83E\uDE99 Added ${amount} GP to ${char.name.split(" ")[0]}`, "info");
    },
    [characters, updateCharacter, showFlash]
  );

  // ── No characters → hide entirely ──
  if (characters.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Flash Message ── */}
      {flashMessage && (
        <div
          className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
            flashMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : flashMessage.type === "info"
                ? "bg-gold-500/10 border-gold-500/20 text-gold-400"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
          }`}
          style={{ animation: "slide-in-up 0.2s ease-out both" }}
        >
          <span className="flex items-center gap-2">
            {flashMessage.text}
            <button
              onClick={() => setFlashMessage(null)}
              className="ml-auto text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}

      {/* ── Character Target Picker ── */}
      <div className="relative bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] rounded-xl overflow-hidden">
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

        <div className="relative z-[1] p-3 sm:p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm" aria-hidden="true">\uD83D\uDCE6</span>
              <h3 className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                Loot Deposit
              </h3>
              <span className="text-[8px] text-surface-600 bg-[#0c0d15] border border-white/[0.04] px-1.5 py-0.5 rounded-full">
                {characters.length} targets
              </span>
            </div>

            {/* Custom mode toggle */}
            <button
              onClick={() => setCustomMode((prev) => !prev)}
              className={`px-2 py-1 rounded-lg text-[9px] font-semibold border transition-all duration-150 active:scale-90 ${
                customMode
                  ? "bg-gold-500/12 border-gold-500/20 text-gold-400"
                  : "bg-white/[0.03] border-white/[0.06] text-surface-400 hover:text-surface-200 hover:border-white/[0.10]"
              }`}
            >
              {customMode ? "\u270E Custom" : "\u2795 Custom"}
            </button>
          </div>

          {/* ── Character select grid ── */}
          <div
            className="flex flex-wrap gap-1.5 mb-3"
            style={{ animation: "slide-in-up 0.2s ease-out both" }}
          >
            {characters.map((c, idx) => {
              const isSelected = targetCharId === c.id;
              const hpRatio =
                c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;

              return (
                <button
                  key={c.id}
                  onClick={() => setTargetCharId(isSelected ? null : c.id)}
                  className={`relative px-2.5 py-1.5 rounded-xl text-[10px] font-medium border transition-all duration-150 active:scale-90 ${
                    isSelected
                      ? "bg-gold-500/12 border-gold-500/25 text-gold-300 shadow-[0_0_10px_rgba(234,179,8,0.05)]"
                      : "bg-[#0c0d15]/60 border-white/[0.04] text-surface-400 hover:text-surface-200 hover:border-white/[0.08]"
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* HP indicator dot */}
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${
                      hpRatio <= 0.25
                        ? "bg-red-500"
                        : hpRatio <= 0.5
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                  />
                  {c.name.split(" ")[0]}
                  {isSelected && (
                    <span className="ml-1 text-[9px] text-gold-500/60">\u2713</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Preset Loot Buttons ── */}
          {targetCharId && !customMode && (
            <div
              className="space-y-2"
              style={{ animation: "slide-in-up 0.2s ease-out 0.05s both" }}
            >
              <p className="text-[9px] text-surface-600 uppercase tracking-wider font-medium">
                Deposit to{" "}
                <span className="text-gold-400">
                  {characters.find((c) => c.id === targetCharId)?.name.split(" ")[0]}
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {LOOT_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.label}
                    onClick={() => handleDepositPreset(preset)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-medium bg-[#0c0d15]/70 border border-white/[0.04] text-surface-300 hover:bg-gold-500/8 hover:border-gold-500/15 hover:text-gold-300 active:scale-90 transition-all duration-150"
                    title={preset.item.description || preset.label}
                    style={{ animationDelay: `${(idx + 1) * 20}ms` }}
                  >
                    <span className="text-[11px]" aria-hidden="true">{preset.icon}</span>
                    {preset.label}
                    {preset.currency && (
                      <span className="ml-0.5 text-[8px] text-gold-500/60">+{preset.currency.gold ?? 0}G</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Custom Item Form ── */}
          {targetCharId && customMode && (
            <div
              className="space-y-2.5"
              style={{ animation: "slide-in-up 0.2s ease-out 0.05s both" }}
            >
              <p className="text-[9px] text-surface-600 uppercase tracking-wider font-medium">
                Custom item to{" "}
                <span className="text-gold-400">
                  {characters.find((c) => c.id === targetCharId)?.name.split(" ")[0]}
                </span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {/* Item name */}
                <div className="sm:col-span-2">
                  <label className="block text-[8px] uppercase tracking-wider text-surface-600 mb-1">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., Wand of Magic Missiles"
                    className="w-full bg-[#0c0d15] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-surface-600 mb-1">
                    Qty
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                      className="w-7 h-7 rounded-lg bg-[#0c0d15] border border-white/[0.04] text-surface-400 hover:text-surface-200 active:scale-90 transition-all duration-100 text-xs flex items-center justify-center"
                    >
                      \u2212
                    </button>
                    <span className="w-8 text-center text-xs font-mono tabular-nums text-surface-200">
                      {customQty}
                    </span>
                    <button
                      onClick={() => setCustomQty(Math.min(999, customQty + 1))}
                      className="w-7 h-7 rounded-lg bg-[#0c0d15] border border-white/[0.04] text-surface-400 hover:text-surface-200 active:scale-90 transition-all duration-100 text-xs flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-surface-600 mb-1">
                    Wt (lb)
                  </label>
                  <input
                    type="number"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                    min={0}
                    step={0.1}
                    className="w-full bg-[#0c0d15] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 text-center font-mono focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-surface-600 mb-1">
                  Description
                </label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Describe the item's appearance, magical effects, or notable features..."
                  rows={2}
                  className="w-full bg-[#0c0d15] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-300 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDepositCustom}
                  disabled={!customName.trim()}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-semibold bg-gold-500/12 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 active:scale-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  \uD83D\uDCE6 Deposit "{customName.trim() || "..."}"
                </button>
                <button
                  onClick={() => {
                    setCustomMode(false);
                    setCustomName("");
                    setCustomQty(1);
                    setCustomWeight(0.5);
                    setCustomDesc("");
                  }}
                  className="px-2 py-1.5 rounded-xl text-[10px] text-surface-500 hover:text-surface-300 border border-transparent hover:border-white/[0.06] active:scale-90 transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── No target selected state ── */}
          {!targetCharId && (
            <div className="text-center py-2">
              <p className="text-[10px] text-surface-600 italic">
                Select a character above to deposit loot
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Deposits Log ── */}
      {recentDeposits.length > 0 && (
        <div
          className="relative bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] rounded-xl overflow-hidden"
          style={{ animation: "slide-in-up 0.25s ease-out 0.1s both" }}
        >
          {/* Edge light */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent pointer-events-none" />

          <div className="relative z-[1] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-wider font-medium text-surface-600">
                Recent Deposits
              </span>
              <span className="text-[8px] text-surface-700">
                Tap to undo
              </span>
            </div>
            <div className="space-y-1">
              {recentDeposits.map((entry, idx) => (
                <div
                  key={`${entry.timestamp}-${idx}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-[#0c0d15]/50 border border-white/[0.02] group/deposit"
                  style={{ animation: `slide-in-up 0.2s ease-out ${idx * 40}ms both` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[9px] text-surface-500 font-mono shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] text-surface-300 truncate">
                      {entry.itemName}
                    </span>
                    {entry.quantity > 1 && (
                      <span className="text-[8px] text-surface-600 shrink-0">
                        \u00D7{entry.quantity}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[8px] text-gold-500/60 truncate max-w-[60px]">
                      \u2192 {entry.charName.split(" ")[0]}
                    </span>
                    <button
                      onClick={() => handleUndo(idx)}
                      className="opacity-0 group-hover/deposit:opacity-100 px-1.5 py-0.5 rounded text-[8px] text-amber-400 bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/15 active:scale-90 transition-all duration-150"
                      title={`Undo deposit: ${entry.itemName}`}
                    >
                      Undo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
