/**
 * STᚱ VTT — Interactive Inventory Tab
 *
 * Full interactive inventory management for the Player Character Sheet.
 * Players can add, edit, delete, equip/unequip items, adjust currency,
 * track weight against encumbrance, and use consumables.
 *
 * Features:
 *   - Currency editor (tap to adjust with roll-up denominations)
 *   - Equipment slots (read-only equipped items)
 *   - Inventory list with equip/unequip toggle
 *   - Add Item modal (name, qty, weight, desc, equipped)
 *   - Weight tracker with encumbrance color-coding
 *   - Consumable quick-use (potions, scrolls, food)
 *   - Edit/delete inline actions
 *   - Equipped-only filter
 */

import { useState, useCallback, useMemo } from "react";
import type { PlayerCharacter, InventoryItem } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";

interface PlayerSheetInventoryTabProps {
  character: PlayerCharacter;
}

// ── Helper: Total weight ──
function getTotalWeight(items: InventoryItem[]): number {
  return items.reduce((sum, item) => sum + item.weight * item.quantity, 0);
}

// ── Helper: Encumbrance level ──
function getEncumbranceLevel(totalWeight: number, strScore: number): { label: string; color: string; pct: number } {
  const capacity = strScore * 15;
  const pct = capacity > 0 ? (totalWeight / capacity) * 100 : 0;
  if (pct === 0) return { label: "Empty", color: "text-surface-500", pct: 0 };
  if (pct <= 33) return { label: "Light", color: "text-emerald-400", pct };
  if (pct <= 66) return { label: "Moderate", color: "text-amber-400", pct };
  if (pct <= 100) return { label: "Encumbered", color: "text-rose-400", pct };
  return { label: "Overloaded", color: "text-red-400", pct };
}

// ── Currency labels with denominations ──
interface CoinDef {
  label: string;
  key: keyof PlayerCharacter["currency"];
  color: string;
  icon: string;
  valueToNext: number; // how many of this = 1 of next higher
  nextKey: keyof PlayerCharacter["currency"] | null;
}
const COINS: CoinDef[] = [
  { label: "PP", key: "platinum", color: "text-cyan-300", icon: "💎", valueToNext: 0, nextKey: null },
  { label: "GP", key: "gold", color: "text-amber-400", icon: "🪙", valueToNext: 10, nextKey: "platinum" },
  { label: "EP", key: "electrum", color: "text-purple-400", icon: "💠", valueToNext: 2, nextKey: "gold" },
  { label: "SP", key: "silver", color: "text-surface-300", icon: "🥈", valueToNext: 10, nextKey: "electrum" },
  { label: "CP", key: "copper", color: "text-amber-600", icon: "🟤", valueToNext: 10, nextKey: "silver" },
];

export default function PlayerSheetInventoryTab({ character }: PlayerSheetInventoryTabProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [currencyEditKey, setCurrencyEditKey] = useState<string | null>(null);
  const [currencyInput, setCurrencyInput] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);
  const [equipMessage, setEquipMessage] = useState<string | null>(null);

  const inventory = character.inventory || [];
  const currency = character.currency || { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
  const equipment = character.equipment || [];

  const totalWeight = useMemo(() => getTotalWeight(inventory), [inventory]);
  const encumbrance = useMemo(() => getEncumbranceLevel(totalWeight, character.strength), [totalWeight, character.strength]);

  const filteredInventory = useMemo(() => {
    if (!showEquippedOnly) return inventory;
    return inventory.filter((item) => item.isEquipped);
  }, [inventory, showEquippedOnly]);

  // ── Flash message helper ──
  const flash = useCallback((msg: string) => {
    setEquipMessage(msg);
    setTimeout(() => setEquipMessage(null), 1500);
  }, []);

  // ── Currency mutation ──
  const updateCurrency = useCallback(
    (key: keyof PlayerCharacter["currency"], value: number) => {
      const updated = { ...character.currency, [key]: Math.max(0, value) };
      updateCharacter(character.id, { currency: updated });
    },
    [character, updateCharacter]
  );

  // ── Add currency (with roll-up) ──
  const addCurrency = useCallback(
    (key: keyof PlayerCharacter["currency"], amount: number) => {
      const current = (character.currency || {})[key] || 0;
      if (amount > 0) {
        updateCurrency(key, current + amount);
      } else {
        const absAmount = Math.abs(amount);
        if (current >= absAmount) {
          updateCurrency(key, current - absAmount);
        } else {
          // Need to break a higher coin — find the next higher denomination
          const coinDef = COINS.find((c) => c.key === key);
          if (coinDef?.nextKey) {
            const higherAmount = character.currency[coinDef.nextKey] || 0;
            if (higherAmount >= 1) {
              updateCurrency(coinDef.nextKey, higherAmount - 1);
              updateCurrency(key, current + coinDef.valueToNext - absAmount);
            }
          }
        }
      }
    },
    [character, updateCurrency]
  );

  // ── Inventory mutations ──
  const setInventory = useCallback(
    (items: InventoryItem[]) => {
      updateCharacter(character.id, { inventory: items });
    },
    [character, updateCharacter]
  );

  const toggleEquip = useCallback(
    (index: number) => {
      const items = [...inventory];
      items[index] = { ...items[index], isEquipped: !items[index].isEquipped };
      setInventory(items);
      flash(items[index].isEquipped ? "Equipped" : "Unequipped");
    },
    [inventory, setInventory, flash]
  );

  const deleteItem = useCallback(
    (index: number) => {
      const items = inventory.filter((_, i) => i !== index);
      setInventory(items);
      setDeleteConfirmIndex(null);
      flash("Item removed");
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
      flash(`Used 1 ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const addItem = useCallback(
    (item: InventoryItem) => {
      setInventory([...inventory, item]);
      setShowAddItem(false);
      flash(`Added ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  const saveEdit = useCallback(
    (index: number, item: InventoryItem) => {
      const items = [...inventory];
      items[index] = item;
      setInventory(items);
      setEditItemIndex(null);
      flash(`Updated ${item.name}`);
    },
    [inventory, setInventory, flash]
  );

  // ── Weight distribution for bar chart ──
  const capacity = character.strength * 15;

  return (
    <div className="px-3 py-3 space-y-4">
      {/* ── Flash message ── */}
      {equipMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-xl bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold shadow-xl shadow-gold-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-150">
          {equipMessage}
        </div>
      )}

      {/* ── Weight Tracker (Encumbrance Bar) ── */}
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/10 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">
            Encumbrance
          </span>
          <span className={`text-[10px] font-bold tabular-nums ${encumbrance.color}`}>
            {totalWeight.toFixed(1)} / {capacity} lb
          </span>
        </div>
        <div className="h-2 rounded-full bg-obsidian-mid/60 overflow-hidden border border-white/[0.04]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(encumbrance.pct, 100)}%`,
              background:
                encumbrance.pct <= 33
                  ? "linear-gradient(90deg, #34d399, #10b981)"
                  : encumbrance.pct <= 66
                  ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                  : encumbrance.pct <= 100
                  ? "linear-gradient(90deg, #f87171, #ef4444)"
                  : "linear-gradient(90deg, #ef4444, #dc2626)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[8px] text-surface-600">
          <span>0</span>
          <span className={encumbrance.pct > 33 ? "text-amber-500/50" : ""}>33%</span>
          <span className={encumbrance.pct > 66 ? "text-rose-500/50" : ""}>66%</span>
          <span>{capacity} lb</span>
        </div>
        <div className="text-[9px] text-surface-600 mt-1">{encumbrance.label} load</div>
      </div>

      {/* ── Currency ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Currency</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {COINS.map((coin) => (
            <div key={coin.key} className="relative">
              {currencyEditKey === coin.key ? (
                <div className="flex flex-col items-center bg-obsidian-mid/60 rounded-xl border border-gold/20 py-1.5">
                  <input
                    type="number"
                    value={currencyInput}
                    onChange={(e) => setCurrencyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = parseInt(currencyInput);
                        if (!isNaN(val) && val >= 0) {
                          updateCurrency(coin.key, val);
                        }
                        setCurrencyEditKey(null);
                      }
                      if (e.key === "Escape") setCurrencyEditKey(null);
                    }}
                    className="w-10 bg-transparent text-center text-xs font-bold text-surface-200 focus:outline-none"
                    autoFocus
                    min={0}
                  />
                  <div className="flex gap-1 mt-0.5">
                    <button
                      onClick={() => { addCurrency(coin.key, 1); setCurrencyInput(String((character.currency[coin.key] || 0) + 1)); }}
                      className="w-5 h-4 rounded text-[8px] bg-gold-500/10 text-gold-400 hover:bg-gold-500/20"
                    >
                      +
                    </button>
                    <button
                      onClick={() => { addCurrency(coin.key, -1); setCurrencyInput(String(Math.max(0, (character.currency[coin.key] || 0) - 1))); }}
                      className="w-5 h-4 rounded text-[8px] bg-surface-800/60 text-surface-400 hover:bg-surface-700/60"
                    >
                      −
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setCurrencyEditKey(coin.key); setCurrencyInput(String(currency[coin.key])); }}
                  className="w-full flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-2.5 hover:border-gold/15 hover:bg-gold-500/[0.02] active:scale-95 transition-all duration-150"
                >
                  <span className="text-[9px] uppercase font-black text-gold-500/50">{coin.label}</span>
                  <span className={`text-base font-bold tabular-nums ${coin.color}`}>{currency[coin.key]}</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1 mt-1.5 flex-wrap">
          {[5, 10, 25, 50, 100].map((amt) => (
            <button
              key={amt}
              onClick={() => {
                // Add GP
                addCurrency("gold", amt);
                flash(`+${amt} GP`);
              }}
              className="px-2 py-0.5 rounded text-[8px] bg-gold-500/8 border border-gold/10 text-gold-500/70 hover:bg-gold-500/15 active:scale-95 transition-all"
            >
              +{amt} GP
            </button>
          ))}
        </div>
      </div>

      {/* ── Equipment Slots ── */}
      {equipment.length > 0 && (
        <div>
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Equipped Gear</span>
          <div className="space-y-1">
            {equipment.map((eq, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-obsidian-mid/40 border border-gold/10 hover:border-gold/20 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] uppercase text-gold-500/50 font-semibold w-14 shrink-0">{eq.slot}</span>
                  <span className="text-xs text-surface-300">{eq.item}</span>
                  {eq.notes && (
                    <span className="text-[9px] text-surface-600 hidden sm:inline">({eq.notes})</span>
                  )}
                </div>
                {eq.quantity > 1 && (
                  <span className="text-[10px] text-surface-500 bg-obsidian-mid/40 px-1.5 py-0.5 rounded">
                    ×{eq.quantity}
                  </span>
                )}
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
            <span className="ml-1.5 text-[9px] text-surface-500 font-normal normal-case">
              ({filteredInventory.length})
            </span>
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
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

        {/* ── Inventory List ── */}
        {filteredInventory.length > 0 ? (
          <div className="space-y-1">
            {filteredInventory.map((item, rawIndex) => {
              const realIndex = inventory.findIndex(
                (inv) => inv.name === item.name && inv.weight === item.weight && inv.quantity === item.quantity
              );
              const idx = realIndex >= 0 ? realIndex : rawIndex;

              return (
                <div key={idx}>
                  {editItemIndex === idx ? (
                    <EditItemRow
                      item={item}
                      onSave={(updated) => saveEdit(idx, updated)}
                      onCancel={() => setEditItemIndex(null)}
                    />
                  ) : (
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/15 transition-all duration-200 group">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {/* Equip toggle */}
                        <button
                          onClick={() => toggleEquip(idx)}
                          title={item.isEquipped ? "Unequip" : "Equip"}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] transition-all shrink-0 ${
                            item.isEquipped
                              ? "bg-gold-500/15 text-gold-400 border border-gold/20"
                              : "bg-surface-800/40 text-surface-600 border border-transparent hover:border-surface-600/30"
                          }`}
                        >
                          {item.isEquipped ? "✓" : "○"}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs truncate ${
                                item.isEquipped ? "text-gold-400 font-semibold" : "text-surface-300"
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.isEquipped && (
                              <span className="text-[8px] uppercase bg-gold-500/10 text-gold-400 px-1 py-0.5 rounded border border-gold/15 shrink-0">
                                Equipped
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[9px] text-surface-600 mt-0.5 truncate max-w-[180px]">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-surface-500 tabular-nums">{item.weight}lb</span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-surface-500 bg-obsidian-mid/40 px-1.5 py-0.5 rounded tabular-nums">
                            ×{item.quantity}
                          </span>
                        )}

                        {/* Use consumable (potions, scrolls, food) */}
                        {["potion", "scroll", "food", "poison", "oil", "antidote"].some((t) =>
                          item.name.toLowerCase().includes(t)
                        ) && (
                          <button
                            onClick={() => useConsumable(idx)}
                            className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 hover:bg-emerald-500/20 active:scale-90 transition-all"
                          >
                            Use
                          </button>
                        )}

                        {/* Actions (visible on hover) */}
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditItemIndex(idx)}
                            className="w-5 h-5 flex items-center justify-center rounded text-[8px] text-surface-500 hover:text-gold-400 hover:bg-gold-500/10"
                          >
                            ✏
                          </button>
                          {deleteConfirmIndex === idx ? (
                            <div className="flex gap-0.5">
                              <button
                                onClick={() => deleteItem(idx)}
                                className="w-5 h-5 flex items-center justify-center rounded text-[8px] bg-red-500/15 text-red-400 hover:bg-red-500/25"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setDeleteConfirmIndex(null)}
                                className="w-5 h-5 flex items-center justify-center rounded text-[8px] text-surface-500 hover:text-surface-300"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmIndex(idx)}
                              className="w-5 h-5 flex items-center justify-center rounded text-[8px] text-surface-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-surface-500 text-xs">
              {showEquippedOnly ? "No items equipped" : "No items in inventory"}
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
    </div>
  );
}

// ── Add Item Modal ──
function ItemFormModal({
  onSave,
  onCancel,
}: {
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0.5);
  const [description, setDescription] = useState("");
  const [isEquipped, setIsEquipped] = useState(false);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), quantity, weight, description: description.trim(), isEquipped });
  }, [name, quantity, weight, description, isEquipped, onSave]);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="glass-gold rounded-2xl w-full max-w-sm mx-4 border border-gold/10 shadow-2xl shadow-gold-500/5 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
        <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-gold tracking-tight">Add Item</h3>
          <button onClick={onCancel} className="w-6 h-6 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all">✕</button>
        </div>

        <div className="space-y-2.5">
          <div>
            <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">Name <span className="text-rose-400">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Longsword, Potion of Healing..."
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">Quantity</label>
              <input
                type="number" value={quantity} min={1}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25"
              />
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">Weight (lb)</label>
              <input
                type="number" value={weight} min={0} step={0.1}
                onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[11px] text-surface-200 focus:outline-none focus:border-gold/25"
              />
            </div>
          </div>

          <div>
            <label className="block text-[8px] uppercase tracking-widest font-black text-gold-500/60 mb-0.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Item properties, notes..."
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={isEquipped}
              onChange={(e) => setIsEquipped(e.target.checked)}
              className="rounded border-surface-600 bg-surface-800 accent-gold-500 w-3.5 h-3.5"
            />
            <span className="text-[10px] text-surface-400">Equip this item</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gold/10">
          <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + Add to Inventory
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Item Row ──
function EditItemRow({
  item,
  onSave,
  onCancel,
}: {
  item: InventoryItem;
  onSave: (item: InventoryItem) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [weight, setWeight] = useState(item.weight);
  const [description, setDescription] = useState(item.description);
  const [isEquipped, setIsEquipped] = useState(item.isEquipped);

  return (
    <div className="px-2.5 py-2 rounded-lg bg-gold-500/5 border border-gold/15 space-y-1.5">
      <div className="grid grid-cols-[1fr_3rem_3rem] gap-1.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[10px] text-surface-200 focus:outline-none focus:border-gold/25"
          placeholder="Name"
        />
        <input
          type="number" value={quantity} min={1}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          className="bg-[#07080d]/70 border border-white/[0.06] rounded px-1 py-1 text-[10px] text-center text-surface-200 focus:outline-none focus:border-gold/25"
          title="Qty"
        />
        <input
          type="number" value={weight} min={0} step={0.1}
          onChange={(e) => setWeight(Math.max(0, parseFloat(e.target.value) || 0))}
          className="bg-[#07080d]/70 border border-white/[0.06] rounded px-1 py-1 text-[10px] text-center text-surface-200 focus:outline-none focus:border-gold/25"
          title="Weight"
        />
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[9px] text-surface-400 focus:outline-none focus:border-gold/25"
        placeholder="Description"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isEquipped}
            onChange={(e) => setIsEquipped(e.target.checked)}
            className="rounded border-surface-600 bg-surface-800 accent-gold-500 w-3 h-3"
          />
          <span className="text-[9px] text-surface-500">Equipped</span>
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => onSave({ name: name.trim() || item.name, quantity, weight, description: description.trim(), isEquipped })}
            className="px-2 py-0.5 rounded text-[9px] font-semibold bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 active:scale-95 transition-all"
          >
            💾 Save
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-0.5 rounded text-[9px] text-surface-500 hover:text-surface-300 active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
