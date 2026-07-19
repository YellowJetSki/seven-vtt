import { Check, X } from "lucide-react";
import { useCallback } from "react";
import type { HomebrewFeat } from "@/types/homebrew";

type FeatFormData = Omit<HomebrewFeat, "id" | "createdAt" | "updatedAt">;

interface HomebrewFeatFormProps {
  form: FeatFormData;
  benefitsInput: string;
  onBenefitsChange: (val: string) => void;
  onChange: (data: FeatFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
  isEdit: boolean;
}

export default function HomebrewFeatForm({ form, benefitsInput, onBenefitsChange, onChange, onSubmit, onClose, isEdit }: HomebrewFeatFormProps) {
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit();
  }, [form.name, onSubmit]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full sm:max-w-lg bg-surface-900 border border-surface-700/30 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-gold-500/5">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20">
          <span className="text-sm font-bold text-gold">{isEdit ? "Edit Feat" : "New Feat"}</span>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 active:scale-90 transition-all duration-150 group">
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Name</label>
            <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Feat name" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-16" placeholder="Feat description" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Benefits (one per line)</label>
            <textarea value={benefitsInput} onChange={(e) => onBenefitsChange(e.target.value)} className="input-arcane w-full py-2 px-3 text-sm resize-none h-20" placeholder="+1 to Strength&#10;Proficiency in Athletics&#10;..." />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Prerequisites (optional)</label>
            <input value={form.prerequisites?.[0]?.description || ""} onChange={(e) => onChange({ ...form, prerequisites: e.target.value ? [{ type: "other" as const, description: e.target.value }] : [] })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="e.g., Strength 13" />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-gold-500/10 border border-gold/25 text-gold-400 text-sm font-semibold active:scale-[0.97] transition-all duration-200 hover:bg-gold-500/15 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {isEdit ? "Update Feat" : "Create Feat"}
          </button>
        </div>
      </form>
    </div>
  );
}
