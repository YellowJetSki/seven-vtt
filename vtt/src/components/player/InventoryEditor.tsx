/* ── InventoryEditor ───────────────────────────────────────────
 * Modal for editing a character's equipment/inventory.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface EquipmentItem {
  item: string;
  quantity: number;
}

interface Props {
  equipment: EquipmentItem[];
  onSave: (equipment: EquipmentItem[]) => void;
  onClose: () => void;
}

export function InventoryEditor({ equipment: initial, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<EquipmentItem[]>(
    initial.length > 0 ? initial.map(e => ({ item: e.item, quantity: e.quantity })) : []
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-sm font-semibold text-surface-100">Edit Inventory</h3>
          <Button size="xs" variant="ghost" onClick={() => setDraft([...draft, { item: "", quantity: 1 }])}>+ Add Item</Button>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1">
          {draft.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 rounded-lg bg-surface-800 p-2">
              <input value={item.item} onChange={(e) => {
                const next = [...draft];
                next[idx] = { ...next[idx], item: e.target.value };
                setDraft(next);
              }} placeholder="Item name"
                className="flex-1 rounded border border-surface-700 bg-surface-900 px-2 py-1 text-xs text-surface-100 focus:border-accent-500 focus:outline-none" />
              <input type="number" value={item.quantity} onChange={(e) => {
                const next = [...draft];
                next[idx] = { ...next[idx], quantity: parseInt(e.target.value) || 1 };
                setDraft(next);
              }} min={1} className="w-14 rounded border border-surface-700 bg-surface-900 px-1 py-1 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
              <button onClick={() => setDraft(prev => prev.filter((_, i) => i !== idx))}
                className="text-warrior-400 hover:text-warrior-300 text-xs shrink-0">🗑️</button>
            </div>
          ))}
          {draft.length === 0 && <p className="text-xs text-surface-500 text-center py-4">No items. Click "+ Add Item" to start.</p>}
        </div>
        <div className="flex justify-end gap-2 mt-3 shrink-0 border-t border-surface-700 pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(draft.filter(e => e.item.trim()))}>Save Inventory</Button>
        </div>
      </div>
    </div>
  );
}
