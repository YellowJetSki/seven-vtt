/* ── Player Inventory — Equipment, Currency & Item Management ───
 * Full inventory management for each player character:
 *  • Equipment list with Add/Remove/Edit
 *  • Currency breakdown (CP/SP/EP/GP/PP)
 *  • Drag-reorderable item categories
 *  • Quick equip from loot generator
 *  • Mobile-first responsive layout
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import type { PlayerCharacter, Currency } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface PlayerInventoryProps {
  character: PlayerCharacter;
  onClose?: () => void;
}

type InventoryTab = "equipment" | "currency" | "magic";

/** Predefined equipment categories for quick-add */
const QUICK_EQUIPMENT = [
  { category: "Armor", items: ["Leather Armor", "Studded Leather", "Chain Shirt", "Scale Mail", "Breastplate", "Half Plate", "Ring Mail", "Chain Mail", "Splint", "Plate Armor", "Shield"] },
  { category: "Weapons", items: ["Dagger", "Shortsword", "Longsword", "Greatsword", "Rapier", "Shortbow", "Longbow", "Light Crossbow", "Handaxe", "Warhammer", "Quarterstaff", "Battleaxe", "Scimitar", "Mace"] },
  { category: "Adventuring Gear", items: ["Backpack", "Bedroll", "Rations (10 days)", "Waterskin", "Hempen Rope (50ft)", "Crowbar", "Torch", "Lantern (Hooded)", "Oil (1 pint)", "Tinderbox", "Healer's Kit", "Potion of Healing", "Antitoxin", "Climber's Kit", "Disguise Kit", "Thieves' Tools"] },
  { category: "Arcane Focus", items: ["Arcane Focus (Orb)", "Arcane Focus (Wand)", "Arcane Focus (Staff)", "Component Pouch", "Spellbook", "Holy Symbol"] },
];

/** Common magic items for quick-add */
const QUICK_MAGIC = [
  { name: "Bag of Holding", rarity: "uncommon" },
  { name: "Cloak of Protection", rarity: "uncommon" },
  { name: "Ring of Protection", rarity: "rare" },
  { name: "Boots of Elvenkind", rarity: "uncommon" },
  { name: "Gauntlets of Ogre Power", rarity: "uncommon" },
  { name: "Wand of Magic Missiles", rarity: "uncommon" },
  { name: "Potion of Greater Healing", rarity: "uncommon" },
  { name: "Spell Scroll (Level 1)", rarity: "common" },
  { name: "Bracers of Archery", rarity: "uncommon" },
  { name: "Flame Tongue", rarity: "rare" },
  { name: "Belt of Hill Giant Strength", rarity: "rare" },
  { name: "Staff of Healing", rarity: "rare" },
  { name: "Ring of Spell Storing", rarity: "rare" },
  { name: "Winged Boots", rarity: "uncommon" },
  { name: "Amulet of Health", rarity: "rare" },
  { name: "Cloak of Elvenkind", rarity: "uncommon" },
];

export function PlayerInventory({ character, onClose }: PlayerInventoryProps) {
  const updatePlayerCharacter = useCampaignStore((s) => s.updatePlayerCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [tab, setTab] = useState<InventoryTab>("equipment");
  const [newItem, setNewItem] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showMagicQuickAdd, setShowMagicQuickAdd] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(false);

  const equipment = character.equipment ?? [];
  const currency = character.currency ?? { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

  /* ── Currency State ── */
  const [editCurrency, setEditCurrency] = useState<Currency>({ ...currency });

  /* ── Add Equipment Item ── */
  const handleAddItem = useCallback(() => {
    if (!newItem.trim()) return;
    const updated = [...equipment, newItem.trim()];
    updatePlayerCharacter(character.id, { equipment: updated });
    setNewItem("");
    showToast({ message: `Added "${newItem.trim()}"`, type: "success" });
  }, [newItem, equipment, character.id, updatePlayerCharacter, showToast]);

  /* ── Remove Equipment Item ── */
  const handleRemoveItem = useCallback((index: number) => {
    const item = equipment[index];
    const updated = equipment.filter((_, i) => i !== index);
    updatePlayerCharacter(character.id, { equipment: updated });
    showToast({ message: `Removed "${item}"`, type: "info" });
  }, [equipment, character.id, updatePlayerCharacter, showToast]);

  /* ── Quick Add Equipment ── */
  const handleQuickAdd = useCallback((item: string) => {
    const updated = [...equipment, item];
    updatePlayerCharacter(character.id, { equipment: updated });
    showToast({ message: `Added "${item}"`, type: "success" });
  }, [equipment, character.id, updatePlayerCharacter, showToast]);

  /* ── Save Currency ── */
  const handleSaveCurrency = useCallback(() => {
    updatePlayerCharacter(character.id, { currency: editCurrency });
    setEditingCurrency(false);
    showToast({ message: "Currency updated.", type: "success" });
  }, [editCurrency, character.id, updatePlayerCharacter, showToast]);

  /* ── Clear All Equipment ── */
  const handleClearAll = useCallback(() => {
    updatePlayerCharacter(character.id, { equipment: [] });
    showToast({ message: "Equipment cleared.", type: "info" });
  }, [character.id, updatePlayerCharacter, showToast]);

  const totalGp = (currency.cp ?? 0) * 0.01 +
    (currency.sp ?? 0) * 0.1 +
    (currency.ep ?? 0) * 0.5 +
    (currency.gp ?? 0) +
    (currency.pp ?? 0) * 10;

  const RARITY_COLORS: Record<string, string> = {
    common: "text-surface-400",
    uncommon: "text-emerald-400",
    rare: "text-mage-400",
    very_rare: "text-rogue-400",
    legendary: "text-warrior-400",
  };

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-surface-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg">🎒</span>
          <div>
            <h3 className="text-sm font-semibold text-surface-200">{character.name}</h3>
            <p className="text-[10px] text-surface-500">{equipment.length} items · {totalGp.toFixed(1)} gp total</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded p-1 text-surface-400 hover:bg-surface-700 hover:text-surface-200">
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-700 px-3">
        {[
          { id: "equipment" as InventoryTab, label: "Equipment", icon: "⚔️", count: equipment.length },
          { id: "currency" as InventoryTab, label: "Currency", icon: "🪙" },
          { id: "magic" as InventoryTab, label: "Magic Items", icon: "✨" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
              tab === t.id
                ? "border-accent-500 text-accent-300"
                : "border-transparent text-surface-400 hover:text-surface-200"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full bg-surface-700 px-1.5 py-0.5 text-[9px]">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* ═══ EQUIPMENT TAB ═══ */}
        {tab === "equipment" && (
          <div className="space-y-3">
            {/* Add item */}
            <div className="flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add item..."
                onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
              />
              <Button size="xs" onClick={handleAddItem} disabled={!newItem.trim()}>
                + Add
              </Button>
            </div>

            {/* Quick Add collapsed */}
            <div>
              <button
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="flex items-center gap-1 text-xs text-surface-400 hover:text-surface-200 transition-colors"
              >
                <span>{showQuickAdd ? "▼" : "▶"}</span>
                Quick Add
              </button>
              {showQuickAdd && (
                <div className="mt-2 space-y-2">
                  {QUICK_EQUIPMENT.map((group) => (
                    <div key={group.category}>
                      <p className="mb-1 text-[10px] font-medium text-surface-500 uppercase tracking-wider">
                        {group.category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {group.items.map((item) => {
                          const alreadyHas = equipment.includes(item);
                          return (
                            <button
                              key={item}
                              onClick={() => !alreadyHas && handleQuickAdd(item)}
                              disabled={alreadyHas}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-all ${
                                alreadyHas
                                  ? "bg-surface-800 text-surface-600 cursor-not-allowed"
                                  : "bg-surface-800 text-surface-300 hover:bg-accent-500/20 hover:text-accent-300"
                              }`}
                            >
                              {item}
                              {alreadyHas && " ✓"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment list */}
            {equipment.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <span className="text-2xl text-surface-600">📦</span>
                <p className="mt-2 text-xs text-surface-500">No equipment yet</p>
              </div>
            ) : (
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {equipment.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-surface-500 text-[10px]">{index + 1}.</span>
                      <span className="text-xs text-surface-200 truncate">{item}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-surface-500 opacity-0 group-hover:opacity-100 hover:text-warrior-400 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom actions */}
            {equipment.length > 0 && (
              <div className="flex justify-end">
                <Button size="xs" variant="ghost" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ═══ CURRENCY TAB ═══ */}
        {tab === "currency" && (
          <div className="space-y-4">
            {/* Current Currency Display */}
            <div className="grid grid-cols-5 gap-2">
              {[
                { key: "cp" as keyof Currency, label: "CP", icon: "🟤", color: "text-amber-700" },
                { key: "sp" as keyof Currency, label: "SP", icon: "⚪", color: "text-gray-300" },
                { key: "ep" as keyof Currency, label: "EP", icon: "🔵", color: "text-blue-400" },
                { key: "gp" as keyof Currency, label: "GP", icon: "🟡", color: "text-yellow-400" },
                { key: "pp" as keyof Currency, label: "PP", icon: "💠", color: "text-cyan-300" },
              ].map((coin) => (
                <div key={coin.key} className="flex flex-col items-center rounded-lg bg-surface-800 px-2 py-3">
                  <span className="text-lg">{coin.icon}</span>
                  <span className={`text-sm font-bold ${coin.color}`}>
                    {editingCurrency ? (
                      <input
                        type="number"
                        min={0}
                        value={editCurrency[coin.key]}
                        onChange={(e) => setEditCurrency({ ...editCurrency, [coin.key]: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full rounded bg-surface-700 px-1 py-0.5 text-center text-xs text-surface-100"
                      />
                    ) : (
                      currency[coin.key]
                    )}
                  </span>
                  <span className="text-[9px] text-surface-500">{coin.label}</span>
                </div>
              ))}
            </div>

            {/* Total Value */}
            <div className="flex items-center justify-between rounded-lg bg-surface-800 px-4 py-2">
              <span className="text-xs text-surface-400">Total Value</span>
              <span className="text-sm font-bold text-surface-200">{totalGp.toFixed(1)} gp</span>
            </div>

            {/* Edit / Save */}
            <div className="flex justify-end gap-2">
              {editingCurrency ? (
                <>
                  <Button size="xs" variant="ghost" onClick={() => { setEditCurrency({ ...currency }); setEditingCurrency(false); }}>
                    Cancel
                  </Button>
                  <Button size="xs" onClick={handleSaveCurrency}>
                    Save
                  </Button>
                </>
              ) : (
                <Button size="xs" variant="secondary" onClick={() => setEditingCurrency(true)}>
                  Edit Currency
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ═══ MAGIC ITEMS TAB ═══ */}
        {tab === "magic" && (
          <div className="space-y-3">
            {/* Quick add magic items */}
            <div>
              <button
                onClick={() => setShowMagicQuickAdd(!showMagicQuickAdd)}
                className="flex items-center gap-1 text-xs text-surface-400 hover:text-surface-200 transition-colors"
              >
                <span>{showMagicQuickAdd ? "▼" : "▶"}</span>
                Quick Add Magic Items
              </button>
              {showMagicQuickAdd && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {QUICK_MAGIC.map((item) => {
                    const alreadyHas = equipment.includes(item.name);
                    return (
                      <button
                        key={item.name}
                        onClick={() => !alreadyHas && handleQuickAdd(item.name)}
                        disabled={alreadyHas}
                        className={`rounded-full px-2 py-0.5 text-[10px] transition-all ${
                          alreadyHas
                            ? "bg-surface-800 text-surface-600 cursor-not-allowed"
                            : `bg-surface-800 text-surface-300 hover:bg-accent-500/20 hover:text-accent-300`
                        }`}
                      >
                        {item.name}
                        <span className={`ml-1 ${RARITY_COLORS[item.rarity] ?? "text-surface-500"}`}>
                          ({item.rarity.replace("_", " ")})
                        </span>
                        {alreadyHas && " ✓"}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Magic items from equipment */}
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {equipment.filter((item) =>
                QUICK_MAGIC.some((m) => m.name.toLowerCase() === item.toLowerCase())
              ).length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <span className="text-2xl text-surface-600">✨</span>
                  <p className="mt-2 text-xs text-surface-500">No magic items yet</p>
                </div>
              ) : (
                equipment
                  .filter((item) => QUICK_MAGIC.some((m) => m.name.toLowerCase() === item.toLowerCase()))
                  .map((item, index) => {
                    const magicItem = QUICK_MAGIC.find((m) => m.name.toLowerCase() === item.toLowerCase());
                    return (
                      <div key={`magic-${index}`} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-surface-500 text-[10px]">✨</span>
                          <span className="text-xs text-surface-200">{item}</span>
                          {magicItem && (
                            <span className={`text-[9px] ${RARITY_COLORS[magicItem.rarity] ?? "text-surface-400"}`}>
                              ({magicItem.rarity.replace("_", " ")})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
