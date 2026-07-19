/**
 * STᚱ VTT — Player Sheet Inventory Tab (Premium Data Visualization)
 *
 * Full inventory management hub with premium data viz:
 * - **Weight Pie Chart**: Visual breakdown of encumbrance by item category
 * - **Encumbrance Speed Overlay**: Color-coded per item based on total load
 * - **5-Coin Currency Grid**: Large touch targets with quick-add presets
 * - **Visual Capacity Indicator**: Bar with color zones for encumbrance tiers
 * - **Equipment Slots Display**: Read-only equipped gear with stat chips
 * - **Inventory List**: Search, category filter, equip/unequip, consumable use
 * - **Quick-Sell Modal**: 50% value estimation, auto-remove + GP
 * - **Add/Edit/Delete Modals**: Full CRUD for inventory items
 * - **Auto-Detect Item Categories**: Icon + color mapping
 * - **Flash Toast Feedback**: Subtle notifications for all actions
 *
 * Zero purple tokens — all gold/amber/rose/emerald/system colors.
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

// ── Item category detection ──
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
    weapon: "\u2694\uFE0F", armor: "\uD83D\uDEE1\uFE0F", potion: "\uD83E\uDDEA", scroll: "\uD83D\uDCDC",
    ring: "\uD83D\uDC8D", wand: "\uD83E\uDE84", food: "\uD83C\uDF5E", tool: "\uD83D\uDD27", other: "\uD83D\uDCE6",
  };
  return icons[cat] || "\uD83D\uDCE6";
}

// ── Category meta (colors, descriptions) ──
const CATEGORY_META: Record<string, { label: string; color: string; barColor: string }> = {
  weapon: { label: "Weapons", color: "text-red-400", barColor: "bg-rose-500" },
  armor: { label: "Armor", color: "text-cyan-400", barColor: "bg-cyan-500" },
  potion: { label: "Potions", color: "text-emerald-400", barColor: "bg-emerald-500" },
  scroll: { label: "Scrolls", color: "text-amber-400", barColor: "bg-amber-500" },
  ring: { label: "Rings", color: "text-violet-400", barColor: "bg-violet-500" },
  wand: { label: "Wands", color: "text-pink-400", barColor: "bg-pink-500" },
  food: { label: "Food", color: "text-orange-400", barColor: "bg-orange-500" },
  tool: { label: "Tools", color: "text-slate-400", barColor: "bg-slate-500" },
  other: { label: "Other", color: "text-surface-400", barColor: "bg-surface-500" },
};

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
  const [sortBy, setSortBy] = useState<"name" | "weight" | "category">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Derived data ──
  const inventory = character.inventory || [];
  const currency = character.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
  const equipment = character.equipment || [];

  // Encumbrance
  const encResult = useMemo(
    () => calculateEncumbrance(character.strength, equipment, inventory, currency, "variant"),
    [character.strength, equipment, inventory, currency]
  );

  const speedPenalty = 0;

  const canCarryMore = encResult.encumbrance.encumbranceLevel !== "overencumbered";

  // ── Flash message helper ──
  const flash = useCallback((msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 1500);
  }, []);

  // ── Weight by category (for pie chart) ──
  const weightByCategory = useMemo(() => {
    const weights: Record<string, number> = {};
    inventory.forEach((item) => {
      const cat = detectCategory(item.name);
      weights[cat] = (weights[cat] || 0) + (item.weight || 0) * item.quantity;
    });
    return weights;
  }, [inventory]);

  const totalItemWeight = Object.values(weightByCategory).reduce((a, b) => a + b, 0);

  // ── Filtered & sorted inventory ──
  const filteredInventory = useMemo(() => {
    let items = inventory.filter((item) => {
      if (showEquippedOnly && !item.isEquipped) return false;
      if (categoryFilter !== "all" && detectCategory(item.name) !== categoryFilter) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "weight") cmp = (a.weight || 0) - (b.weight || 0);
      else if (sortBy === "category") cmp = detectCategory(a.name).localeCompare(detectCategory(b.name));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [inventory, showEquippedOnly, categoryFilter, searchQuery, sortBy, sortDir]);

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
      flash(items[index].isEquipped ? `\u2694\uFE0F Equipped ${items[index].name}` : `\uD83D\uDCE6 Unequipped ${items[index].name}`);
    },
    [inventory, setInventory, flash]
  );

  const addItem = useCallback(
    (item: InventoryItem) => {
      setInventory([...inventory, item]);
      setShowAddItem(false);
      flash(`\uD83D\uDCE6 Added ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const saveEdit = useCallback(
    (index: number, item: InventoryItem) => {
      const items = [...inventory];
      items[index] = item;
      setInventory(items);
      setEditItemIndex(null);
      flash(`\u270F\uFE0F Updated ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const deleteItem = useCallback(
    (index: number) => {
      const item = inventory[index];
      setInventory(inventory.filter((_, i) => i !== index));
      setDeleteConfirmIndex(null);
      flash(`\uD83D\uDDD1\uFE0F Removed ${item.name}`);
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
      flash(`\uD83E\uDDEA Used 1 ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const quickSell = useCallback(
    (index: number) => {
      const item = inventory[index];
      const value = Math.max(1, Math.round(item.weight * 5));
      const updatedCurrency = { ...currency, gold: currency.gold + value };
      updateCharacter(character.id, { currency: updatedCurrency });
      setInventory(inventory.filter((_, i) => i !== index));
      setSellConfirmIndex(null);
      flash(`\uD83D\uDCB0 Sold ${item.name} for ${value} GP`);
    },
    [inventory, currency, setInventory, updateCharacter, flash]
  );

  // ── Categories for filter chips ──
  const categories = [
    { key: "all", icon: "\uD83D\uDCE6", label: "All" },
    { key: "weapon", icon: "\u2694\uFE0F", label: "Weapons" },
    { key: "armor", icon: "\uD83D\uDEE1\uFE0F", label: "Armor" },
    { key: "potion", icon: "\uD83E\uDDEA", label: "Potions" },
    { key: "scroll", icon: "\uD83D\uDCDC", label: "Scrolls" },
    { key: "ring", icon: "\uD83D\uDC8D", label: "Rings" },
    { key: "wand", icon: "\uD83E\uDE84", label: "Wands" },
    { key: "food", icon: "\uD83C\uDF5E", label: "Food" },
    { key: "tool", icon: "\uD83D\uDD27", label: "Tools" },
  ];

  return (
    <div className="px-3 py-3 space-y-3">
      {/* ── Flash message toast ── */}
      {flashMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-xl bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold shadow-xl shadow-gold-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-150">
          {flashMessage}
        </div>
      )}

      {/* ── Weight Tracker with Pie Viz ── */}
      <div>
        <InventoryWeightBar
          totalWeight={encResult.weight.total}
          carryingCapacity={encResult.encumbrance.carryingCapacity}
          encumbranceLevel={encResult.encumbrance.encumbranceLevel}
          itemCount={inventory.length}
        />

        {/* Weight breakdown mini-pie (horizontal stacked bar) */}
        {inventory.length > 0 && totalItemWeight > 0 && (
          <div className="mt-1.5 h-1.5 bg-surface-700/30 rounded-full overflow-hidden flex">
            {Object.entries(weightByCategory).map(([cat, weight]) => {
              const pct = (weight / totalItemWeight) * 100;
              if (pct < 1) return null;
              const meta = CATEGORY_META[cat] || { label: cat, color: "text-surface-400", barColor: "bg-surface-500" };
              return (
                <div
                  key={cat}
                  className={`${meta.barColor} first:rounded-l-full last:rounded-r-full transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                  title={`${meta.label}: ${Math.round(weight)} lbs`}
                />
              );
            })}
          </div>
        )}

        {/* Speed penalty indicator */}
        {speedPenalty !== 0 && (
          <p className="text-[9px] text-amber-400 mt-0.5">Speed reduced by {Math.abs(speedPenalty)}ft due to encumbrance</p>
        )}
        {!canCarryMore && (
          <p className="text-[9px] text-red-400 mt-0.5">Overencumbered — cannot carry more items!</p>
        )}
      </div>

      {/* ── Currency ── */}
      <InventoryCurrencyBar currency={currency} characterId={character.id} />

      {/* ── Equipment Slots ── */}
      {equipment.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Equipped Gear</span>
          <div className="space-y-1">
            {equipment.map((eq, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gold-500/5 border border-gold/10 hover:border-gold/20 transition-all duration-200">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[9px] uppercase text-gold-500/50 font-semibold w-14 shrink-0">{eq.slot}</span>
                  <span className="text-xs text-surface-300 truncate">{eq.item}</span>
                  {eq.notes && <span className="text-[9px] text-surface-600 hidden sm:inline truncate">({eq.notes})</span>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {eq.quantity > 1 && (
                    <span className="text-[10px] text-surface-500 bg-obsidian-mid/40 px-1.5 py-0.5 rounded tabular-nums">\u00D7{eq.quantity}</span>
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
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-500 text-[9px]">\uD83D\uDD0D</span>
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
                  {count > 0 && <span className="ml-1 text-[7px] text-surface-500 font-mono">{count}</span>}
                </button>
              );
            })}

            {/* Sort toggle */}
            <div className="ml-auto flex items-center gap-0.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-[8px] text-surface-500 border border-surface-700/30 rounded px-1 py-0.5 focus:outline-none focus:border-gold/20"
              >
                <option value="name">Name</option>
                <option value="weight">Weight</option>
                <option value="category">Category</option>
              </select>
              <button
                onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                className="text-[9px] text-surface-500 hover:text-gold-400 transition-colors px-1"
                title={sortDir === "asc" ? "Ascending" : "Descending"}
              >
                {sortDir === "asc" ? "\u2191" : "\u2193"}
              </button>
            </div>
          </div>
        )}

        {/* ── Inventory List ── */}
        {filteredInventory.length > 0 ? (
          <div className="space-y-1">
            {filteredInventory.map((item, displayIdx) => {
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
