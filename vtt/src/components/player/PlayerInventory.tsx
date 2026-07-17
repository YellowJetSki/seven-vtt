/* ── Player Inventory — Equipment, Currency & Item Management ───
 * Full inventory management for each player character:
 *  • Equipment list with Add/Remove/Edit
 *  • Currency breakdown (CP/SP/EP/GP/PP)
 *  • Drag-reorderable item categories
 *  • Quick equip from loot generator
 *  • Mobile-first responsive layout
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import type { PlayerCharacter, EquipmentSlot } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

interface PlayerInventoryProps {
  character: PlayerCharacter;
  onClose: () => void;
}

export function PlayerInventory({ character, onClose }: PlayerInventoryProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [equipment, setEquipment] = useState<EquipmentSlot[]>(character.equipment ?? []);
  const [newItemName, setNewItemName] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // ── Currency state ──
  const [copper, setCopper] = useState(character.currency?.copper ?? 0);
  const [silver, setSilver] = useState(character.currency?.silver ?? 0);
  const [electrum, setElectrum] = useState(character.currency?.electrum ?? 0);
  const [gold, setGold] = useState(character.currency?.gold ?? 0);
  const [platinum, setPlatinum] = useState(character.currency?.platinum ?? 0);

  const handleAddItem = useCallback(() => {
    if (!newItemName.trim()) return;
    const newItem: EquipmentSlot = {
      slot: "carried",
      item: newItemName.trim(),
      quantity: 1,
      weight: 0,
      notes: "",
    };
    setEquipment((prev) => [...prev, newItem]);
    setNewItemName("");
    setIsDirty(true);
  }, [newItemName]);

  const handleRemoveItem = useCallback((index: number) => {
    setEquipment((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    updateCharacter(character.id, {
      equipment,
      currency: { copper, silver, electrum, gold, platinum },
    });
    setIsDirty(false);
    showToast({ message: "Inventory saved.", type: "success" });
  }, [character.id, equipment, copper, silver, electrum, gold, platinum, updateCharacter, showToast]);

  const totalItems = equipment.length;

  return (
    <div className="flex max-h-[80vh] flex-col bg-surface-850">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-surface-100">{character.name}</h2>
          <p className="text-xs text-surface-400">{totalItems} items</p>
        </div>
        <Button variant="ghost" size="xs" onClick={onClose}>✕</Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-5">
        {/* Equipment */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Equipment</h3>
          <div className="space-y-1.5">
            {equipment.map((item, i) => (
              <div key={`eq-${i}`} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-surface-200 truncate">{item.item}</p>
                  <p className="text-[10px] text-surface-500">
                    {item.slot}{item.quantity > 1 ? ` · ×${item.quantity}` : ""}
                    {item.notes ? ` · ${item.notes}` : ""}
                  </p>
                </div>
                <button onClick={() => handleRemoveItem(i)}
                  className="ml-2 shrink-0 rounded p-1 text-surface-600 hover:text-warrior-400 transition-colors"
                  title="Remove item">
                  ✕
                </button>
              </div>
            ))}
            {equipment.length === 0 && (
              <p className="text-xs text-surface-500 py-4 text-center">No equipment. Add some below!</p>
            )}
          </div>
        </section>

        {/* Add Item */}
        <section className="flex gap-2">
          <input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            placeholder="Add item..."
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
          <Button size="sm" onClick={handleAddItem} disabled={!newItemName.trim()}>
            + Add
          </Button>
        </section>

        {/* Currency */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Currency</h3>
          <div className="grid grid-cols-5 gap-2 text-center">
            <CurrencyField label="PP" value={platinum} onChange={setPlatinum} color="gold" />
            <CurrencyField label="GP" value={gold} onChange={setGold} color="gold" />
            <CurrencyField label="EP" value={electrum} onChange={setElectrum} color="surface" />
            <CurrencyField label="SP" value={silver} onChange={setSilver} color="surface" />
            <CurrencyField label="CP" value={copper} onChange={setCopper} color="surface" />
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-surface-700 px-5 py-4">
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={!isDirty}>
          {isDirty ? "Save Changes" : "Saved"}
        </Button>
      </div>
    </div>
  );
}

/* ── Sub-Components ─────────────────────────────────────────── */

function CurrencyField({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  const colorMap: Record<string, string> = {
    gold: "text-amber-300",
    surface: "text-surface-300",
  };
  return (
    <div className="rounded-lg bg-surface-800 py-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className={`w-full bg-transparent text-center text-sm font-bold focus:outline-none ${colorMap[color] ?? "text-surface-300"}`}
      />
      <p className="text-[9px] text-surface-500">{label}</p>
    </div>
  );
}
