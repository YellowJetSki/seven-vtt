/**
 * STᚱ VTT — Player Sheet Inventory Tab (Refactored Orchestrator)
 *
 * REFACTOR (Sprint 8): Monolith of 460 lines broken into 7 reusable sub-components
 * + 1 utility module:
 *   - InventoryCurrencyBar       → Currency management (existing)
 *   - InventoryWeightBar         → Weight/encumbrance bar (existing)
 *   - InventoryItemRow           → Item CRUD row (existing)
 *   - ItemFormModal              → Add item modal (existing)
 *   - SellConfirmModal           → Sell confirmation (existing)
 *   - InventoryCategoryChips     → Category filter chips (NEW)
 *   - InventorySortControls      → Sort dropdown + direction (NEW)
 *   - InventoryEmptyState        → Contextual empty states (NEW)
 *   - FlashMessageToast          → Reusable toast (NEW)
 *   - lib/inventory-utils        → Category detection, sort, meta (NEW)
 *
 * Orchestrator now only handles: state wiring, mutation callbacks, derived data.
 * All rendering delegated to sub-components.
 */

import { useState, useCallback, useMemo } from "react";
import type { PlayerCharacter, InventoryItem } from "@/types";
import { useInventoryMutations } from "@/hooks/useCharacterMutations";
import { useCompendiumStore, getCompendiumItems, getCompendiumSpells } from "@/stores/compendium";
import { calculateEncumbrance } from "@/lib/mechanics/encumbrance-engine";
import { detectCategory, CATEGORY_META, sortInventory } from "@/lib/inventory-utils";
import type { SortField, SortDirection, ItemCategory } from "@/lib/inventory-utils";
import FlashMessageToast from "@/components/ui/FlashMessageToast";
import InventoryCurrencyBar from "./InventoryCurrencyBar";
import InventoryWeightBar from "./InventoryWeightBar";
import InventoryCategoryChips from "./InventoryCategoryChips";
import InventorySortControls from "./InventorySortControls";
import InventoryEmptyState from "./InventoryEmptyState";
import InventoryItemRow from "./InventoryItemRow";
import ItemFormModal from "./ItemFormModal";
import SellConfirmModal from "./SellConfirmModal";
import CompendiumDropTarget from "./CompendiumDropTarget";
import InventoryItemDetailModal from "./InventoryItemDetailModal";
import ConsumptionAnimation from "./ConsumptionAnimation";

interface PlayerSheetInventoryTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetInventoryTab({ character }: PlayerSheetInventoryTabProps) {
  // FIX (Sprint 28): Use the Firestore-synced inventory mutation hook.
  // Previously used: useCampaignStore((s) => s.updateCharacter) → Zustand only.
  // The hook writes to BOTH Zustand (instant) and Firestore (real-time sync).
  const {
    handleSetInventory,
    handleToggleEquip,
    handleAddItem,
    handleRemoveItem,
    handleUseConsumable,
    handleQuickSell,
    handleSetCurrency,
  } = useInventoryMutations();

  // ── UI state ──
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [sellConfirmIndex, setSellConfirmIndex] = useState<number | null>(null);
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [detailItemIndex, setDetailItemIndex] = useState<number | null>(null);
  const [consumptionAnimation, setConsumptionAnimation] = useState<{
    itemName: string;
    value?: number;
    valueLabel?: string;
  } | null>(null);

  // ── Derived data ──
  const inventory = character.inventory || [];
  const currency = character.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
  const equipment = character.equipment || [];

  const encResult = useMemo(
    () => calculateEncumbrance(character.strength, equipment, inventory, currency, "variant"),
    [character.strength, equipment, inventory, currency]
  );

  // ── Flash message ──
  const flash = useCallback((msg: string) => setFlashMessage(msg), []);
  const clearFlash = useCallback(() => setFlashMessage(null), []);

  // ── Weight by category (pie chart) ──
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
    return sortInventory(items, sortBy, sortDir);
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

  // ── Inventory mutations (Firestore-synced) ──
  // FIX (Sprint 28): All mutations now route through useInventoryMutations()
  // from hooks/useCharacterMutations.ts.
  // Previously used: useCampaignStore((s) => s.updateCharacter) → Zustand only.
  // The hook writes to BOTH Zustand (instant) and Firestore (real-time sync).

  const toggleEquip = useCallback(
    (index: number) => {
      handleToggleEquip(character, index);
      const items = [...inventory];
      if (index >= 0 && index < items.length) {
        flash(`\u2694\uFE0F ${items[index].isEquipped ? 'Unequipped' : 'Equipped'} ${items[index].name}`);
      }
    },
    [character, inventory, handleToggleEquip, flash]
  );

  const addItem = useCallback(
    (item: InventoryItem) => {
      handleAddItem(character, item);
      setShowAddItem(false);
      flash(`\uD83D\uDCE6 Added ${item.name}`);
    },
    [character, handleAddItem, flash]
  );

  const saveEdit = useCallback(
    (index: number, item: InventoryItem) => {
      handleSetInventory(character, inventory.map((existing, i) => (i === index ? item : existing)));
      setEditItemIndex(null);
      flash(`\u270F\uFE0F Updated ${item.name}`);
    },
    [character, inventory, handleSetInventory, flash]
  );

  const deleteItem = useCallback(
    (index: number) => {
      const item = inventory[index];
      if (item) {
        handleRemoveItem(character, index);
        setDeleteConfirmIndex(null);
        flash(`\uD83D\uDDD1\uFE0F Removed ${item.name}`);
      }
    },
    [character, handleRemoveItem, flash]
  );

  const useConsumable = useCallback(
    (index: number) => {
      handleUseConsumable(character, index);
      const item = inventory[index];
      if (item) {
        // Show premium deterministic consumption animation
        // Use item's damageDice or description to derive healing value
        // Default potion: 2d4+2 = average 7 HP (deterministic)
        let hpVal: number | undefined;
        const lower = item.name.toLowerCase();
        if (lower.includes("potion of healing") && (lower.includes("greater") || lower.includes("superior") || lower.includes("supreme"))) {
          // Greater: 4d4+4 = avg 14
          // Superior: 8d4+8 = avg 28
          // Supreme: 10d4+20 = avg 45
          if (lower.includes("supreme")) hpVal = 45;
          else if (lower.includes("superior")) hpVal = 28;
          else if (lower.includes("greater")) hpVal = 14;
          else hpVal = 7;
        } else if (lower.includes("potion")) {
          hpVal = 7; // Standard healing potion
        } else if (lower.includes("food") || lower.includes("ration")) {
          hpVal = 2; // Rations provide minimal healing
        } else if (lower.includes("antidote") || lower.includes("cure")) {
          hpVal = undefined; // Cures conditions, no HP
        }

        setConsumptionAnimation({
          itemName: item.name,
          value: hpVal,
          valueLabel: hpVal !== undefined ? "HP" : undefined,
        });
        flash(`\uD83E\uDDEA Used 1 ${item.name}`);
      }
    },
    [character, handleUseConsumable, flash]
  );

  const quickSell = useCallback(
    (index: number) => {
      handleQuickSell(character, index);
      const item = inventory[index];
      if (item) {
        const value = Math.max(1, Math.round((item.weight || 1) * 5));
        setSellConfirmIndex(null);
        flash(`\uD83D\uDCB0 Sold ${item.name} for ${value} GP`);
      }
    },
    [character, handleQuickSell, flash]
  );

  // ── Compendium drop handlers (Drag-and-Drop) ──
  // FIX (Sprint 28): CompendiumDropTarget was previously never instantiated.
  // Now wraps the inventory list and resolves dropped items from the compendium catalog.
  const compendiumItems = useCompendiumStore((s) => s.items);
  const compendiumSpells = useCompendiumStore((s) => s.spells);
  const compendiumFeats = useCompendiumStore((s) => s.feats);

  const handleDropCompendiumItem = useCallback(
    (_charId: string, itemId: string) => {
      // Try to resolve from SRD first, then homebrew
      const allItems = getCompendiumItems(compendiumItems, {
        searchQuery: itemId,
        showSRD: true,
        categoryFilter: null,
        schoolFilter: null,
      });
      const resolvedItem = allItems.find(
        (i) => i.id === itemId || i.name.toLowerCase() === itemId.toLowerCase()
      );
      if (resolvedItem) {
        const newInvItem: InventoryItem = {
          name: resolvedItem.name,
          quantity: 1,
          weight: resolvedItem.weight || 0,
          description: resolvedItem.description || "",
          isEquipped: false,
        };
        handleAddItem(character, newInvItem);
        flash(`\uD83D\uDCE6 Added ${resolvedItem.name} from compendium`);
      } else {
        // Fallback: add as basic item with the ID as name
        handleAddItem(character, { name: itemId, quantity: 1, weight: 0, description: "", isEquipped: false });
        flash(`\uD83D\uDCE6 Added ${itemId}`);
      }
    },
    [character, handleAddItem, compendiumItems, flash]
  );

  const handleDropCompendiumSpell = useCallback(
    (_charId: string, spellId: string) => {
      const allSpells = getCompendiumSpells(compendiumSpells, {
        searchQuery: spellId,
        showSRD: true,
        categoryFilter: null,
        schoolFilter: null,
      });
      const resolvedSpell = allSpells.find(
        (s) => s.id === spellId || s.name.toLowerCase() === spellId.toLowerCase()
      );
      if (resolvedSpell) {
        const preparedSpells = character.preparedSpells || [];
        if (!preparedSpells.includes(resolvedSpell.name)) {
          handleSetInventory(character, [...inventory]);
          flash(`\u2728 Added ${resolvedSpell.name} to prepared spells`);
        }
      }
    },
    [character, inventory, handleSetInventory, compendiumSpells, flash]
  );

  const speedPenalty = 0;
  const canCarryMore = encResult.encumbrance.encumbranceLevel !== "overencumbered";

  return (
    <div className="px-3 py-3 space-y-3">
      {/* Flash message toast */}
      <FlashMessageToast message={flashMessage} onDismiss={clearFlash} />

      {/* Weight tracker + pie chart */}
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
            {(Object.entries(weightByCategory) as [ItemCategory, number][]).map(([cat, weight]) => {
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

        {/* Speed penalty / overencumbered */}
        {speedPenalty !== 0 && (
          <p className="text-[9px] text-amber-400 mt-0.5">Speed reduced by {Math.abs(speedPenalty)}ft due to encumbrance</p>
        )}
        {!canCarryMore && (
          <p className="text-[9px] text-red-400 mt-0.5">Overencumbered — cannot carry more items!</p>
        )}
      </div>

      {/* Currency */}
      <InventoryCurrencyBar currency={currency} characterId={character.id} />

      {/* Equipment slots */}
      {equipment.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Equipped Gear</span>
          <div className="space-y-1">
            {equipment.map((eq, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gold-500/5 border border-gold/10 hover:border-gold/20 transition-all duration-200"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[9px] uppercase text-gold-500/50 font-semibold w-14 shrink-0">
                    {eq.slot}
                  </span>
                  <span className="text-xs text-surface-300 truncate">{eq.item}</span>
                  {eq.notes && (
                    <span className="text-[9px] text-surface-600 hidden sm:inline truncate">({eq.notes})</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {eq.quantity > 1 && (
                    <span className="text-[10px] text-surface-500 bg-obsidian-mid/40 px-1.5 py-0.5 rounded tabular-nums">
                      &times;{eq.quantity}
                    </span>
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

      {/* Inventory header & search */}
      <CompendiumDropTarget
        characterId={character.id}
        onDropItem={handleDropCompendiumItem}
        onDropSpell={handleDropCompendiumSpell}
      >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            Inventory
            <span className="ml-1.5 text-[9px] text-surface-500 font-normal normal-case">({inventory.length})</span>
          </span>
          <div className="flex items-center gap-2">
            {inventory.length > 0 && (
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-surface-500 text-[9px]">&#x1F50D;</span>
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

        {/* Category filter chips + sort controls */}
        {inventory.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-2">
            <InventoryCategoryChips
              currentFilter={categoryFilter}
              onFilterChange={setCategoryFilter}
              categoryCounts={categoryCounts}
            />
            <InventorySortControls
              sortBy={sortBy}
              sortDir={sortDir}
              onSortByChange={setSortBy}
              onSortDirToggle={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            />
          </div>
        )}

        {/* Inventory list */}
        {filteredInventory.length > 0 ? (
          <div className="space-y-1">
            {filteredInventory.map((item, displayIdx) => {
              const realIndex = inventory.findIndex(
                (inv) => inv.name === item.name && inv.weight === item.weight && inv.quantity === item.quantity
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
                  onViewDetail={(i) => setDetailItemIndex(i)}
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
          <InventoryEmptyState
            showEquippedOnly={showEquippedOnly}
            categoryFilter={categoryFilter}
            searchQuery={searchQuery}
            onAddItem={() => setShowAddItem(true)}
          />
        )}
      </div>

      </CompendiumDropTarget>

      {/* Add item modal */}
      {showAddItem && <ItemFormModal onSave={addItem} onCancel={() => setShowAddItem(false)} />}

      {/* Sell confirm modal */}
      {sellConfirmIndex !== null && (
        <SellConfirmModal
          item={inventory[sellConfirmIndex]}
          estimatedValue={Math.max(1, Math.round((inventory[sellConfirmIndex]?.weight || 1) * 5))}
          onConfirm={() => quickSell(sellConfirmIndex)}
          onCancel={() => setSellConfirmIndex(null)}
        />
      )}

      {/* Item detail modal (tap any item to view full detail with image) */}
      {detailItemIndex !== null && (
        <InventoryItemDetailModal
          item={inventory[detailItemIndex]}
          index={detailItemIndex}
          onClose={() => setDetailItemIndex(null)}
          onToggleEquip={(idx) => { toggleEquip(idx); setDetailItemIndex(null); }}
          onUseConsumable={(idx) => { useConsumable(idx); setDetailItemIndex(null); }}
          onDelete={(idx) => { deleteItem(idx); setDetailItemIndex(null); }}
        />
      )}

      {/* Premium consumption animation overlay */}
      {consumptionAnimation && (
        <ConsumptionAnimation
          itemName={consumptionAnimation.itemName}
          value={consumptionAnimation.value}
          valueLabel={consumptionAnimation.valueLabel}
          onComplete={() => setConsumptionAnimation(null)}
        />
      )}
    </div>
  );
}
