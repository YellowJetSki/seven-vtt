/* ── ResourceEditor ────────────────────────────────────────────
 * Modal for editing custom resources (e.g. Bardic Inspiration, Kol points).
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface Resource {
  id: string; name: string; current: number; max: number; recharge: string;
}

interface Props {
  resources: Resource[];
  onSave: (resources: Resource[]) => void;
  onClose: () => void;
}

export function ResourceEditor({ resources: initial, onSave, onClose }: Props) {
  const [resources, setResources] = useState<Resource[]>(initial.length > 0 ? [...initial] : []);

  const addResource = useCallback(() => {
    setResources(prev => [...prev, { id: `res_${Date.now()}`, name: "", current: 0, max: 0, recharge: "long" }]);
  }, []);

  const updateResource = useCallback((index: number, field: string, value: any) => {
    setResources(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }, []);

  const removeResource = useCallback((index: number) => {
    setResources(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-surface-100">Edit Resources</h3>
          <Button size="xs" variant="ghost" onClick={addResource}>+ Add</Button>
        </div>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {resources.map((res, index) => (
            <div key={res.id} className="rounded-lg border border-surface-700 bg-surface-800 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={res.name} onChange={(e) => updateResource(index, "name", e.target.value)}
                  placeholder="Resource name..."
                  className="flex-1 rounded border border-surface-700 bg-surface-900 px-2 py-1 text-xs text-surface-100 focus:border-accent-500 focus:outline-none" />
                <button onClick={() => removeResource(index)} className="text-warrior-400 hover:text-warrior-300 text-xs">🗑️</button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-surface-400">Current</span>
                  <input type="number" value={res.current} onChange={(e) => updateResource(index, "current", parseInt(e.target.value) || 0)}
                    min={0} className="w-14 rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                </div>
                <span className="text-surface-600">/</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-surface-400">Max</span>
                  <input type="number" value={res.max} onChange={(e) => updateResource(index, "max", parseInt(e.target.value) || 0)}
                    min={0} className="w-14 rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-xs text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                </div>
                <select value={res.recharge} onChange={(e) => updateResource(index, "recharge", e.target.value)}
                  className="rounded border border-surface-700 bg-surface-900 px-1 py-0.5 text-[10px] text-surface-100 focus:border-accent-500 focus:outline-none">
                  <option value="long">Long Rest</option>
                  <option value="short">Short Rest</option>
                  <option value="none">No Recharge</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(resources.filter(r => r.name.trim()))}>Save Resources</Button>
        </div>
      </div>
    </div>
  );
}
