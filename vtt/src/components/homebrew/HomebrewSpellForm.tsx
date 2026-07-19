import { Check, X } from "lucide-react";
import { useCallback } from "react";
import type { HomebrewSpell } from "@/types/homebrew";

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const COMPONENTS = ["V", "S", "M"];

type SpellFormData = Omit<HomebrewSpell, "id" | "createdAt" | "updatedAt">;

interface HomebrewSpellFormProps {
  form: SpellFormData;
  onChange: (data: SpellFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
  isEdit: boolean;
}

export default function HomebrewSpellForm({ form, onChange, onSubmit, onClose, isEdit }: HomebrewSpellFormProps) {
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit();
  }, [form.name, onSubmit]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full sm:max-w-lg bg-surface-900 border border-surface-700/30 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-accent-500/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20">
          <span className="text-sm font-bold text-gradient-arcane">{isEdit ? "Edit Spell" : "New Spell"}</span>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 active:scale-90 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Name</label>
            <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Spell name" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Level</label>
              <input type="number" min={0} max={9} value={form.level} onChange={(e) => onChange({ ...form, level: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">School</label>
              <select value={form.school} onChange={(e) => onChange({ ...form, school: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-20" placeholder="Spell description" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Casting Time</label>
              <input value={form.castingTime} onChange={(e) => onChange({ ...form, castingTime: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="1 action" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Range</label>
              <input value={form.range} onChange={(e) => onChange({ ...form, range: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="60 feet" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Duration</label>
              <input value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Instantaneous" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Components</label>
              <div className="flex gap-1 mt-1">
                {COMPONENTS.map((c) => (
                  <button key={c} type="button" onClick={() => onChange({ ...form, components: form.components.includes(c) ? form.components.filter((x) => x !== c) : [...form.components, c] })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${form.components.includes(c) ? "bg-accent-600/20 border-accent-500/30 text-accent-300" : "bg-surface-800/30 border-surface-700/20 text-surface-400"}`}
                  >{c}</button>
                ))}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.concentration} onChange={(e) => onChange({ ...form, concentration: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-accent-500" />
            <span className="text-xs text-surface-300">Requires Concentration</span>
          </label>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-accent-600/20 border border-accent-500/20 text-accent-300 text-sm font-semibold active:scale-[0.97] transition-all flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {isEdit ? "Update Spell" : "Create Spell"}
          </button>
        </div>
      </form>
    </div>
  );
}
