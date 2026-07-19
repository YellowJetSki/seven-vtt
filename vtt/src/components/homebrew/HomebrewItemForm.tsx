import { Check, X } from "lucide-react";
import { useCallback } from "react";
import type { HomebrewItem } from "@/types/homebrew";

type ItemFormData = Omit<HomebrewItem, "id" | "createdAt" | "updatedAt">;

interface HomebrewItemFormProps {
  form: ItemFormData;
  onChange: (data: ItemFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
  isEdit: boolean;
}

const CATEGORIES = ["weapon", "armor", "potion", "scroll", "wand", "ring", "wondrous", "tool", "ammunition", "food", "poison", "other"];
const RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"];

export default function HomebrewItemForm({ form, onChange, onSubmit, onClose, isEdit }: HomebrewItemFormProps) {
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit();
  }, [form.name, onSubmit]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full sm:max-w-lg bg-surface-900 border border-surface-700/30 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-gold-500/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20">
          <span className="text-sm font-bold text-gold">{isEdit ? "Edit Item" : "New Item"}</span>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 active:scale-90 transition-all duration-150 group">
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Name</label>
            <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Item name" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Category</label>
              <select value={form.category} onChange={(e) => onChange({ ...form, category: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Rarity</label>
              <select value={form.rarity} onChange={(e) => onChange({ ...form, rarity: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-20" placeholder="Item description" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Weight (lb)</label>
              <input type="number" value={form.weight} onChange={(e) => onChange({ ...form, weight: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Value (gp)</label>
              <input type="number" value={form.value} onChange={(e) => onChange({ ...form, value: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.requiresAttunement} onChange={(e) => onChange({ ...form, requiresAttunement: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
            <span className="text-xs text-surface-300">Requires Attunement</span>
          </label>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gold-500/10 border border-gold/25 text-gold-400 text-sm font-semibold active:scale-[0.97] transition-all duration-200 hover:bg-gold-500/15 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {isEdit ? "Update Item" : "Create Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
