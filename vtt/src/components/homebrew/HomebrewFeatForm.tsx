/**
 * STᚱ VTT — Homebrew Feat Form (v2.0)
 *
 * Enhanced with ability score increases, skill proficiencies,
 * structured prerequisites, and visible-to-players toggle.
 */

import { Check, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { HomebrewFeat, FeatPrerequisite } from "@/types/homebrew";

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

const ABILITIES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
const SKILLS = [
  "acrobatics", "animal_handling", "arcana", "athletics", "deception",
  "history", "insight", "intimidation", "investigation", "medicine",
  "nature", "perception", "performance", "persuasion", "religion",
  "sleight_of_hand", "stealth", "survival",
];

export default function HomebrewFeatForm({ form, benefitsInput, onBenefitsChange, onChange, onSubmit, onClose, isEdit }: HomebrewFeatFormProps) {
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit();
  }, [form.name, onSubmit]);

  const [prereqAbility, setPrereqAbility] = useState("strength");
  const [prereqValue, setPrereqValue] = useState(13);
  const [prereqDesc, setPrereqDesc] = useState("");

  const addPrerequisite = () => {
    if (!prereqDesc.trim()) return;
    const newPrereq: FeatPrerequisite = {
      type: "ability",
      description: prereqDesc.trim(),
      ability: prereqAbility,
      minimumValue: prereqValue,
    };
    onChange({ ...form, prerequisites: [...form.prerequisites, newPrereq] });
    setPrereqDesc("");
  };

  const removePrerequisite = (index: number) => {
    onChange({ ...form, prerequisites: form.prerequisites.filter((_, i) => i !== index) });
  };

  const toggleAbilityIncrease = (ability: string) => {
    const current = form.abilityScoreIncrease ? form.abilityScoreIncrease.split(",").filter(Boolean) : [];
    const idx = current.indexOf(ability);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(ability);
    }
    onChange({ ...form, abilityScoreIncrease: current.length > 0 ? current.join(",") : undefined });
  };

  const toggleSkill = (skill: string) => {
    const current = form.skillProficiencies ?? [];
    const idx = current.indexOf(skill);
    if (idx >= 0) {
      onChange({ ...form, skillProficiencies: current.filter((s) => s !== skill) });
    } else {
      onChange({ ...form, skillProficiencies: [...current, skill] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full sm:max-w-xl bg-gradient-to-b from-[#14151f]/95 to-surface-900/95 border border-gold/10 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-gold-500/5 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gold-500 rounded-full" />
            <span className="text-base font-bold text-gold drop-shadow-[0_0_6px_rgba(234,179,8,0.1)]">
              {isEdit ? "Edit Feat" : "New Feat"}
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 active:scale-90 transition-all duration-150 group">
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder="Feat name" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-20" placeholder="Feat description and mechanics..." />
          </div>

          {/* Flavor Text */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Flavor Text <span className="text-surface-600">(optional)</span></label>
            <input value={form.flavorText || ""} onChange={(e) => onChange({ ...form, flavorText: e.target.value || undefined })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder='"You are what you do, not what you say."' />
          </div>

          {/* Ability Score Increase */}
          <div className="glass-dark rounded-xl p-4 space-y-2 border border-gold/10">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block">⬆ Ability Score Increase</span>
            <div className="flex flex-wrap gap-1.5">
              {ABILITIES.map((ab) => (
                <button
                  key={ab}
                  type="button"
                  onClick={() => toggleAbilityIncrease(ab)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all duration-200 active:scale-95 ${
                    form.abilityScoreIncrease?.includes(ab)
                      ? "bg-gold-500/10 border-gold/25 text-gold-400"
                      : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:border-gold/15"
                  }`}
                >
                  {ab.slice(0, 3).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Proficiencies */}
          <div className="glass-dark rounded-xl p-4 space-y-2 border border-gold/10">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block">🎯 Skill Proficiencies</span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {SKILLS.map((sk) => (
                <button
                  key={sk}
                  type="button"
                  onClick={() => toggleSkill(sk)}
                  className={`px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all duration-200 active:scale-95 ${
                    form.skillProficiencies?.includes(sk)
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:border-gold/15"
                  }`}
                >
                  {sk.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Benefits (one per line)</label>
            <textarea value={benefitsInput} onChange={(e) => onBenefitsChange(e.target.value)} className="input-arcane w-full py-2 px-3 text-sm resize-none h-24" placeholder="+1 to Strength&#10;Proficiency in Athletics&#10;Advantage on Perception checks..." />
          </div>

          {/* Prerequisites */}
          <div className="glass-dark rounded-xl p-4 space-y-3 border border-gold/10">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block">📋 Prerequisites</span>
            {form.prerequisites.length > 0 && (
              <div className="space-y-1.5">
                {form.prerequisites.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-surface-800/50 rounded-lg px-3 py-2 border border-surface-700/20">
                    {p.ability && <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">{p.ability.slice(0, 3)} {p.minimumValue}+</span>}
                    <span className="text-xs text-surface-300 flex-1">{p.description}</span>
                    <button type="button" onClick={() => removePrerequisite(i)} className="text-surface-500 hover:text-red-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-[1fr_60px_auto] gap-2 items-end">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-0.5">Requirement</label>
                <input value={prereqDesc} onChange={(e) => setPrereqDesc(e.target.value)} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="e.g. Strength 13" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-0.5">Min</label>
                <input type="number" value={prereqValue} onChange={(e) => setPrereqValue(Number(e.target.value))} className="input-arcane w-full py-1.5 px-2 text-xs" />
              </div>
              <button type="button" onClick={addPrerequisite} className="py-1.5 px-3 rounded-lg bg-gold-500/10 border border-gold/25 text-gold-400 text-[10px] font-semibold active:scale-95 transition-all hover:bg-gold-500/15">
                Add
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Tags <span className="text-surface-600">(comma-separated)</span></label>
            <input value={form.tags?.join(", ") || ""} onChange={(e) => onChange({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder="combat, social, investigation" />
          </div>

          {/* Source */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Source</label>
            <input value={form.source || ""} onChange={(e) => onChange({ ...form, source: e.target.value })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder="homebrew" />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.repeatable} onChange={(e) => onChange({ ...form, repeatable: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
              <span className="text-xs text-surface-300">Repeatable</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.visibleToPlayers} onChange={(e) => onChange({ ...form, visibleToPlayers: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
              <span className="text-xs text-surface-300">Visible to Players</span>
            </label>
          </div>

          {/* Submit */}
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600/80 via-gold-500/80 to-amber-500/80 hover:from-gold-500 hover:via-gold-400 hover:to-amber-400 text-[#0a0b12] text-sm font-bold active:scale-[0.97] transition-all duration-200 shadow-lg shadow-gold-500/15 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {isEdit ? "Update Feat" : "Create Feat"}
          </button>
        </div>
      </form>
    </div>
  );
}
