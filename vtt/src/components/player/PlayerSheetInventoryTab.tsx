/**
 * STᚱ VTT — Interactive Inventory Tab (Refactored)
 *
 * Full inventory management hub for the Player Character Sheet.
 * Refactored from a monolithic 30K file into an orchestrator + sub-components.
 *
 * Features:
 *   - Currency editor with denominations + quick-add presets
 *   - Equipment slots display (read-only equipped gear)
 *   - Inventory list with search, category filter, equip/unequip
 *   - Consumable quick-use (potions, scrolls, food, oils, antidotes)
 *   - Quick-sell modal (50% value, auto-remove + GP)
 *   - Weight tracker with encumbrance color-coding
 *   - Add/Edit/Delete item modals
 *   - Auto-detect item category icons
 */

import { useState, useCallback, useMemo } from "react";
import type { PlayerCharacter, InventoryItem } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { calculateEncumbrance } from "@/lib/mechanics/encumbrance-engine";
import InventoryCurrencyBar from "./InventoryCurrencyBar";
import InventoryWeightBar from "./InventoryWeightBar";
import InventoryItemRow from "./InventoryItemRow";
import ItemFormModal from "./ItemFormModal";
import SellConfirmModal from "./SellConfirmModal";

interface PlayerSheetInventoryTabProps {
  character: PlayerCharacter;
}

// ── Item category auto-detect ──
export function detectCategory(name: string): "weapon" | "armor" | "potion" | "scroll" | "ring" | "wand" | "food" | "tool" | "other" {
  const low = name.toLowerCase();
  if (["potion", "elixir", "tincture", "philter", "draught"].some((k) => low.includes(k))) return "potion";
  if (["scroll", "spell scroll", "parchment"].some((k) => low.includes(k))) return "scroll";
  if (["ring", "band", "circlet"].some((k) => low.includes(k))) return "ring";
  if (["wand", "rod", "scepter"].some((k) => low.includes(k))) return "wand";
  if (["food", "ration", "bread", "meat", "fruit", "wine", "ale"].some((k) => low.includes(k))) return "food";
  if (["sword", "axe", "bow", "dagger", "hammer", "mace", "spear", "staff", "blade", "greatsword", "longsword", "rapier", "shortsword", "scimitar", "whip", "flail", "lance", "pike", "halberd", "glaive", "trident", "club", "quarterstaff", "javelin", "dart", "sling", "crossbow", "longbow", "shortbow"].some((k) => low.includes(k))) return "weapon";
  if (["armor", "plate", "chain", "leather", "scale", "shield", "helm", "helmet", "bracers", "greaves", "boots", "cloak", "robe", "gloves", "barding"].some((k) => low.includes(k))) return "armor";
  if (["tool", "kit", "pick", "shovel", "crowbar", "hammer", "lantern", "rope", "lockpick", "thieves"].some((k) => low.includes(k))) return "tool";
  return "other";
}

export function categoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    weapon: "⚔️", armor: "🛡️", potion: "🧪", scroll: "📜",
    ring: "💍", wand: "🪄", food: "🍞", tool: "🔧", other: "📦",
  };
  return icons[cat] || "📦";
}

export default function PlayerSheetInventoryTab({ character }: PlayerSheetInventoryTabProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  // ── UI state ──
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [sellConfirmIndex, setSellConfirmIndex] = useState<number | null>(null);
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  // ── Derived data ──
  const inventory = character.inventory || [];
  const currency = character.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
  const equipment = character.equipment || [];

  // Encumbrance calculation
  const encResult = useMemo(
    () => calculateEncumbrance(character.strength, equipment, inventory, currency, "variant"),
    [character.strength, equipment, inventory, currency]
  );

  // ── Flash message helper ──
  const flash = useCallback((msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 1500);
  }, []);

  // ── Filtered & searched inventory ──
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (showEquippedOnly && !item.isEquipped) return false;
      if (categoryFilter !== "all" && detectCategory(item.name) !== categoryFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [inventory, showEquippedOnly, categoryFilter, searchQuery]);

  // ── Category counts ──
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: inventory.length };
    inventory.forEach((item) => {
      const cat = detectCategory(item.name);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [inventory]);

  // ── Inventory mutations ──
  const setInventory = useCallback(
    (items: InventoryItem[]) => updateCharacter(character.id, { inventory: items }),
    [character, updateCharacter]
  );

  const toggleEquip = useCallback(
    (index: number) => {
      const items = [...inventory];
      items[index] = { ...items[index], isEquipped: !items[index].isEquipped };
      setInventory(items);
      flash(items[index].isEquipped ? `⚔️ Equipped ${items[index].name}` : `📦 Unequipped ${items[index].name}`);
    },
    [inventory, setInventory, flash]
  );

  const addItem = useCallback(
    (item: InventoryItem) => {
      setInventory([...inventory, item]);
      setShowAddItem(false);
      flash(`📦 Added ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const saveEdit = useCallback(
    (index: number, item: InventoryItem) => {
      const items = [...inventory];
      items[index] = item;
      setInventory(items);
      setEditItemIndex(null);
      flash(`✏️ Updated ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const deleteItem = useCallback(
    (index: number) => {
      const item = inventory[index];
      const items = inventory.filter((_, i) => i !== index);
      setInventory(items);
      setDeleteConfirmIndex(null);
      flash(`🗑️ Removed ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const useConsumable = useCallback(
    (index: number) => {
      const items = [...inventory];
      const item = items[index];
      if (item.quantity <= 1) {
        items.splice(index, 1);
      } else {
        items[index] = { ...item, quantity: item.quantity - 1 };
      }
      setInventory(items);
      flash(`🧪 Used 1 ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const quickSell = useCallback(
    (index: number) => {
      const item = inventory[index];
      const value = Math.max(1, Math.round(item.weight * 5)); // 5gp per lb estimate
      const updatedCurrency = { ...currency, gold: currency.gold + value };
      updateCharacter(character.id, { currency: updatedCurrency });

      const items = inventory.filter((_, i) => i !== index);
      setInventory(items);
      setSellConfirmIndex(null);
      flash(`💰 Sold ${item.name} for ${value} GP`);
    },
    [inventory, currency, setInventory, updateCharacter, flash]
  );

  // ── Categories for filter chips ──
  const categories = [
    { key: "all", icon: "📦", label: "All" },
    { key: "weapon", icon: "⚔️", label: "Weapons" },
    { key: "armor", icon: "🛡️", label: "Armor" },
    { key: "potion", icon: "🧪", label: "Potions" },
    { key: "scroll", icon: "📜", label: "Scrolls" },
    { key: "ring", icon: "💍", label: "Rings" },
    { key: "wand", icon: "🪄", label: "Wands" },
    { key: "food", icon: "🍞", label: "Food" },
    { key: "tool", icon: "🔧", label: "Tools" },
  ];

  return (
    <div className="px-3 py-3 space-y-3">
      {/* ── Flash message toast ── */}
      {flashMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-xl bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold shadow-xl shadow-gold-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-150">
          {flashMessage}
        </div>
      )}

      {/* ── Weight Tracker ── */}
      <InventoryWeightBar
        totalWeight={encResult.weight.total}
        carryingCapacity={encResult.encumbrance.carryingCapacity}
        encumbranceLevel={encResult.encumbrance.encumbranceLevel}
        itemCount={inventory.length}
      />

      {/* ── Currency ── */}
      <InventoryCurrencyBar
        currency={currency}
        characterId={character.id}
      />

      {/* ── Equipment Slots ── */}
      {equipment.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Equipped Gear</span>
          <div className="space-y-1">
            {equipment.map((eq, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gold-500/5 border border-gold/10 hover:border-gold/20 transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase text-gold-500/50 font-semibold w-14 shrink-0">{eq.slot}</span>
                  <span className="text-xs text-surface-300">{eq.item}</span>
                  {eq.notes && (
                    <span className="text-[9px] text-surface-600 hidden sm:inline">({eq.notes})</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {eq.quantity > 1 && (
                    <span className="text-[10px] text-surface-500 bg-obsidian-mid/40 px-1.5 py-0.5 rounded tabular-nums">×{eq.quantity}</span>
                  )}
                  {eq.weight > 0 && (
                    <span className="text-[9px] text-surface-600 tabular-nums">{eq.weight} lb</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Inventory Header ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            Inventory
            <span className="ml-1.5 text-[9px] text-surface-500 font-normal normal-case">({inventory.length})</span>
          </span>
          <div className="flex items-center gap-2">
            {inventory.length > 0 && (
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-500 text-[9px]">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-24 pl-6 pr-1.5 py-1 text-[9px] bg-obsidian-mid/50 border border-surface-700/30 rounded-lg text-surface-300 placeholder:text-surface-600 focus:outline-none focus:border-gold/20 transition-all"
                />
              </div>
            )}
            <label className="flex items-center gap-1 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={showEquippedOnly}
                onChange={(e) => setShowEquippedOnly(e.target.checked)}
                className="w-3 h-3 rounded border-surface-600 bg-surface-800 accent-gold-500"
              />
              <span className="text-[8px] text-surface-500 uppercase tracking-wider">Equipped</span>
            </label>
            <button
              onClick={() => setShowAddItem(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gold-500/10 border border-gold/15 text-gold-400 text-[10px] font-semibold hover:bg-gold-500/15 active:scale-95 transition-all"
            >
              <span>+</span>
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Category filter chips */}
        {inventory.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            {categories.map((cat) => {
              const count = categoryCounts[cat.key] || 0;
              if (count === 0 && cat.key !== "all") return null;
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(categoryFilter === cat.key ? "all" : cat.key)}
                  className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold transition-all duration-200 ${
                    categoryFilter === cat.key
                      ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                      : "text-surface-500 border border-surface-700/30 hover:border-surface-600/40"
                  }`}
                >
                  {cat.icon} {cat.label}
                  {count > 0 && (
                    <span className="ml-1 text-[7px] text-surface-500 font-mono">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Inventory List ── */}
        {filteredInventory.length > 0 ? (
          <div className="space-y-1">
            {filteredInventory.map((item, displayIdx) => {
              // Find actual index in original inventory
              const realIndex = inventory.findIndex(
                (inv, i) => i >= 0 && inv.name === item.name && inv.weight === item.weight && inv.quantity === item.quantity
              );
              const idx = realIndex >= 0 ? realIndex : displayIdx;

              return (
                <InventoryItemRow
                  key={`${idx}-${item.name}-${item.quantity}`}
                  item={item}
                  index={idx}
                  isEditing={editItemIndex === idx}
                  isDeleteConfirm={deleteConfirmIndex === idx}
                  isSellConfirm={sellConfirmIndex === idx}
                  encumbranceLevel={encResult.encumbrance.encumbranceLevel}
                  onToggleEquip={toggleEquip}
                  onUseConsumable={useConsumable}
                  onEdit={() => setEditItemIndex(idx)}
                  onDelete={() => setDeleteConfirmIndex(idx)}
                  onSell={() => setSellConfirmIndex(idx)}
                  onCancelDelete={() => setDeleteConfirmIndex(null)}
                  onCancelSell={() => setSellConfirmIndex(null)}
                  onConfirmSell={() => quickSell(idx)}
                  onConfirmDelete={() => deleteItem(idx)}
                  onSaveEdit={(updated) => saveEdit(idx, updated)}
                  onCancelEdit={() => setEditItemIndex(null)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-surface-500 text-xs">
              {showEquippedOnly ? "No items equipped" : categoryFilter !== "all" ? "No items match this filter" : "No items in inventory"}
            </p>
            {!showEquippedOnly && (
              <button
                onClick={() => setShowAddItem(true)}
                className="mt-2 px-3 py-1.5 rounded-lg text-[10px] bg-gold-500/8 border border-gold/10 text-gold-500/70 hover:bg-gold-500/15 active:scale-95 transition-all"
              >
                + Add your first item
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Add Item Modal ── */}
      {showAddItem && (
        <ItemFormModal
          onSave={addItem}
          onCancel={() => setShowAddItem(false)}
        />
      )}

      {/* ── Sell Confirm Modal ── */}
      {sellConfirmIndex !== null && (
        <SellConfirmModal
          item={inventory[sellConfirmIndex]}
          estimatedValue={Math.max(1, Math.round((inventory[sellConfirmIndex]?.weight || 1) * 5))}
          onConfirm={() => quickSell(sellConfirmIndex)}
          onCancel={() => setSellConfirmIndex(null)}
        />
      )}
    </div>
  );
}
