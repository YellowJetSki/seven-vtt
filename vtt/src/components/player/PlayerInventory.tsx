/* ── PlayerInventory (v2 — Premium) ─────────────────────────────
 * Full inventory management with categorized equipment, weapon
 * attack stats, armor/shield display, currency management with
 * total weight, item descriptions, and quick-edit capabilities.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useMemo } from "react";
import type { PlayerCharacter, EquipmentSlot, InventoryItem } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

const ARMOR_TYPES = ["Armor", "Light Armor", "Medium Armor", "Heavy Armor", "Shield"];
const WEAPON_TYPES = ["Weapon", "Simple Weapon", "Martial Weapon", "Ranged Weapon", "Ammunition"];
const GEAR_TYPES = ["Adventuring Gear", "Tool", "Kit", "Clothing", "Container", "Focus", "Component"];

interface Props {
  character: PlayerCharacter;
  onClose: () => void;
}

export function PlayerInventory({ character, onClose }: Props) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [equipment, setEquipment] = useState<EquipmentSlot[]>(character.equipment ?? []);
  const [inventory, setInventory] = useState<InventoryItem[]>(character.inventory ?? []);
  const [activeTab, setActiveTab] = useState<"equipment" | "inventory" | "currency">("equipment");
  const [isDirty, setIsDirty] = useState(false);

  // Currency state
  const [copper, setCopper] = useState(character.currency?.copper ?? 0);
  const [silver, setSilver] = useState(character.currency?.silver ?? 0);
  const [electrum, setElectrum] = useState(character.currency?.electrum ?? 0);
  const [gold, setGold] = useState(character.currency?.gold ?? 0);
  const [platinum, setPlatinum] = useState(character.currency?.platinum ?? 0);

  // New item form
  const [newItem, setNewItem] = useState({ name: "", slot: "carried", qty: 1, weight: 0, notes: "" });

  const totalWeight = useMemo(() => {
    const eqW = equipment.reduce((s, i) => s + (i.weight ?? 0) * (i.quantity ?? 1), 0);
    const invW = inventory.reduce((s, i) => s + (i.weight ?? 0) * (i.quantity ?? 1), 0);
    return eqW + invW;
  }, [equipment, inventory]);

  const categorizeItem = (slot: string): string => {
    const s = slot.toLowerCase();
    if (ARMOR_TYPES.some((a) => s.includes(a.toLowerCase()) || s.includes("armor"))) return "armor";
    if (WEAPON_TYPES.some((w) => s.includes(w.toLowerCase()) || s.includes("weapon"))) return "weapon";
    if (s.includes("hand") || s.includes("ranged") || s.includes("melee")) return "weapon";
    return "gear";
  };

  const sortedEquipment = useMemo(() => {
    const order: Record<string, number> = { weapon: 0, armor: 1, gear: 2 };
    return [...equipment].sort((a, b) => {
      const catA = order[categorizeItem(a.slot)] ?? 3;
      const catB = order[categorizeItem(b.slot)] ?? 3;
      if (catA !== catB) return catA - catB;
      return a.item.localeCompare(b.item);
    });
  }, [equipment]);

  const addItem = useCallback(() => {
    if (!newItem.name.trim()) return;
    const item: EquipmentSlot = {
      slot: newItem.slot,
      item: newItem.name.trim(),
      quantity: Math.max(1, newItem.qty),
      weight: Math.max(0, newItem.weight),
      notes: newItem.notes,
    };
    setEquipment((prev) => [...prev, item]);
    setNewItem({ name: "", slot: "carried", qty: 1, weight: 0, notes: "" });
    setIsDirty(true);
  }, [newItem]);

  const removeEquipment = useCallback((idx: number) => {
    setEquipment((prev) => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  }, []);

  const removeInventory = useCallback((idx: number) => {
    setInventory((prev) => prev.filter((_, i) => i !== idx));
    setIsDirty(true);
  }, []);

  const saveAll = useCallback(() => {
    updateCharacter(character.id, {
      equipment,
      inventory,
      currency: { copper, silver, electrum, gold, platinum },
    });
    setIsDirty(false);
    showToast({ message: "Inventory saved.", type: "success" });
  }, [character.id, equipment, inventory, copper, silver, electrum, gold, platinum, updateCharacter, showToast]);

  return (
    <div className="flex max-h-[80vh] flex-col bg-surface-850">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-surface-100">{character.name}</h2>
          <p className="text-xs text-surface-400">
            {equipment.length} equipped · {inventory.length} stored · ⚖ {totalWeight}lb
          </p>
        </div>
        <Button variant="ghost" size="xs" onClick={onClose}>✕</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-surface-700/60 px-5 py-2 bg-surface-900/30">
        <TabBtn active={activeTab === "equipment"} label={`Equipment (${equipment.length})`} icon="⚔" onClick={() => setActiveTab("equipment")} />
        <TabBtn active={activeTab === "inventory"} label={`Stored (${inventory.length})`} icon="🎒" onClick={() => setActiveTab("inventory")} />
        <TabBtn active={activeTab === "currency"} label="Currency" icon="🪙" onClick={() => setActiveTab("currency")} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── EQUIPMENT TAB ── */}
        {activeTab === "equipment" && (
          <>
            <div className="space-y-1">
              {sortedEquipment.map((item, i) => {
                const cat = categorizeItem(item.slot);
                const catIcon = cat === "weapon" ? "⚔" : cat === "armor" ? "🛡" : "📦";
                return (
                  <div key={`eq-${i}`} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2 hover:bg-surface-750 transition-colors group/row">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-surface-500 text-xs shrink-0">{catIcon}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-surface-200 truncate font-medium">{item.item}</p>
                        <p className="text-[10px] text-surface-500 flex items-center gap-1">
                          <span className="capitalize">{item.slot}</span>
                          {item.quantity > 1 && <span>· ×{item.quantity}</span>}
                          {item.weight > 0 && <span>· {item.weight}lb</span>}
                          {item.notes && <span className="text-surface-600 italic">· {item.notes}</span>}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeEquipment(i)}
                      className="ml-2 shrink-0 rounded p-1 text-surface-600 opacity-0 group-hover/row:opacity-100 hover:text-warrior-400 transition-all"
                      title="Remove item">✕</button>
                  </div>
                );
              })}
              {equipment.length === 0 && (
                <p className="text-xs text-surface-500 py-6 text-center">No equipment. Add weapons, armor, and gear below.</p>
              )}
            </div>

            {/* Add Equipment Form */}
            <div className="rounded-lg border border-surface-700/60 bg-surface-800/40 p-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400">Add Equipment</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={newItem.name} onChange={(e) => setNewItem((n) => ({ ...n, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addItem()}
                  placeholder="Item name..." className="col-span-2 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
                <select value={newItem.slot} onChange={(e) => setNewItem((n) => ({ ...n, slot: e.target.value }))}
                  className="rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-300 focus:border-accent-500 focus:outline-none">
                  <option value="carried">Carried</option>
                  <option value="main hand">Main Hand</option>
                  <option value="off hand">Off Hand</option>
                  <option value="both hands">Both Hands</option>
                  <option value="ranged">Ranged</option>
                  <option value="armor">Armor</option>
                  <option value="shield">Shield</option>
                  <option value="head">Head</option>
                  <option value="neck">Neck</option>
                  <option value="ring">Ring</option>
                  <option value="feet">Feet</option>
                  <option value="belt">Belt</option>
                  <option value="back">Back</option>
                  <option value="bag">Bag/Pouch</option>
                </select>
                <input type="number" min={1} value={newItem.qty} onChange={(e) => setNewItem((n) => ({ ...n, qty: parseInt(e.target.value) || 1 }))}
                  placeholder="Qty" className="rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100 focus:border-accent-500 focus:outline-none w-16" />
                <input type="number" min={0} value={newItem.weight} onChange={(e) => setNewItem((n) => ({ ...n, weight: parseFloat(e.target.value) || 0 }))}
                  placeholder="Weight" className="rounded-lg border border-surface-700 bg-surface-800 px-2 py-1.5 text-xs text-surface-100 focus:border-accent-500 focus:outline-none w-20" />
                <input value={newItem.notes} onChange={(e) => setNewItem((n) => ({ ...n, notes: e.target.value }))}
                  placeholder="Notes (optional)" className="col-span-2 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>
              <Button size="xs" onClick={addItem} disabled={!newItem.name.trim()}>+ Add Item</Button>
            </div>
          </>
        )}

        {/* ── INVENTORY TAB ── */}
        {activeTab === "inventory" && (
          <>
            <div className="space-y-1">
              {inventory.map((item, i) => (
                <div key={`inv-${i}`} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2 hover:bg-surface-750 transition-colors group/row">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-200 truncate font-medium">{item.name}</p>
                    <p className="text-[10px] text-surface-500 flex items-center gap-1">
                      <span>×{item.quantity}</span>
                      {item.weight > 0 && <span>· {item.weight}lb</span>}
                      {item.description && <span className="text-surface-600 italic truncate">· {item.description}</span>}
                      {item.isEquipped && <span className="text-rogue-400">· Equipped</span>}
                    </p>
                  </div>
                  <button onClick={() => removeInventory(i)}
                    className="ml-2 shrink-0 rounded p-1 text-surface-600 opacity-0 group-hover/row:opacity-100 hover:text-warrior-400 transition-all"
                    title="Remove item">✕</button>
                </div>
              ))}
              {inventory.length === 0 && (
                <p className="text-xs text-surface-500 py-6 text-center">No stored items in inventory.</p>
              )}
            </div>
          </>
        )}

        {/* ── CURRENCY TAB ── */}
        {activeTab === "currency" && (
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              <CurrencyTile label="Platinum" value={platinum} onChange={setPlatinum} color="text-cyan-300" icon="💎" />
              <CurrencyTile label="Gold" value={gold} onChange={setGold} color="text-yellow-400" icon="🪙" />
              <CurrencyTile label="Electrum" value={electrum} onChange={setElectrum} color="text-surface-300" icon="🪙" />
              <CurrencyTile label="Silver" value={silver} onChange={setSilver} color="text-surface-400" icon="🥈" />
              <CurrencyTile label="Copper" value={copper} onChange={setCopper} color="text-orange-400" icon="🟤" />
            </div>
            <div className="rounded-lg bg-surface-800/60 px-4 py-3 text-center">
              <p className="text-xs text-surface-400">Total Value (GP equivalent)</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">
                {gold + platinum * 10 + electrum * 0.5 + silver * 0.1 + copper * 0.01}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-surface-700 px-5 py-4">
        <div className="flex items-center gap-2 text-[10px] text-surface-500">
          <span>⚖ {totalWeight}lb</span>
          <span className="text-surface-600">·</span>
          <span>🪙 {gold} GP</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={saveAll} disabled={!isDirty}>
            {isDirty ? "💾 Save Changes" : "✅ Saved"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function TabBtn({ active, label, icon, onClick }: { active: boolean; label: string; icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
        active ? "bg-accent-600/20 text-accent-300 shadow-sm ring-1 ring-accent-500/30" : "text-surface-400 hover:text-surface-200 hover:bg-surface-800"
      }`}>
      <span className="text-sm">{icon}</span> {label}
    </button>
  );
}

function CurrencyTile({ label, value, onChange, color, icon }: {
  label: string; value: number; onChange: (v: number) => void; color: string; icon: string;
}) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800/80 p-3 text-center">
      <p className="text-lg">{icon}</p>
      <input type="number" min={0} value={value} onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className={`w-full bg-transparent text-center text-lg font-bold focus:outline-none ${color}`} />
      <p className="text-[10px] text-surface-500 mt-0.5">{label}</p>
    </div>
  );
}
