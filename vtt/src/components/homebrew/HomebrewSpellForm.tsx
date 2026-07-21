/**
 * STᚱ VTT — Homebrew Spell Form (v2.0)
 *
 * Enhanced with VTT AoE shape/size, damage/healing dice,
 * spell save DC / attack bonus, ritual toggle, and visible-to-players.
 */

import { Check, X } from "lucide-react";
import { useCallback, useState } from "react";
import type { HomebrewSpell } from "@/types/homebrew";

const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const COMPONENTS = ["V", "S", "M"];
const SHAPES = ["circle", "cone", "cube", "sphere", "line", "cylinder"] as const;
const DAMAGE_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];

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
      <form onSubmit={handleSubmit} className="w-full sm:max-w-xl bg-gradient-to-b from-[#14151f]/95 to-surface-900/95 border border-gold/10 rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-gold-500/5 backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-gold-500 rounded-full" />
            <span className="text-base font-bold text-gold drop-shadow-[0_0_6px_rgba(234,179,8,0.1)]">
              {isEdit ? "Edit Spell" : "New Spell"}
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
            <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder="Spell name" />
          </div>

          {/* Level & School */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Level</label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={9} value={form.level} onChange={(e) => onChange({ ...form, level: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
                {form.level === 0 && <span className="text-[10px] text-surface-500">Cantrip</span>}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">School</label>
              <select value={form.school} onChange={(e) => onChange({ ...form, school: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-24" placeholder="Full spell description including effects and flavor..." />
          </div>

          {/* Flavor Text */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Flavor Text <span className="text-surface-600">(optional)</span></label>
            <input value={form.flavorText || ""} onChange={(e) => onChange({ ...form, flavorText: e.target.value || undefined })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder='"A blazing sphere of fire..."' />
          </div>

          {/* Casting Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Casting Time</label>
              <input value={form.castingTime} onChange={(e) => onChange({ ...form, castingTime: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="1 action" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Range</label>
              <input value={form.range} onChange={(e) => onChange({ ...form, range: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="60 feet" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Duration</label>
              <input value={form.duration} onChange={(e) => onChange({ ...form, duration: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Instantaneous" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Components</label>
              <div className="flex gap-1 mt-1">
                {COMPONENTS.map((c) => (
                  <button key={c} type="button" onClick={() => onChange({ ...form, components: form.components.includes(c) ? form.components.filter((x) => x !== c) : [...form.components, c] })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all duration-200 active:scale-95 ${form.components.includes(c) ? "bg-gold-500/10 border-gold/25 text-gold-400" : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:border-gold/15"}`}
                  >{c}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Toggle Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.concentration} onChange={(e) => onChange({ ...form, concentration: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
              <span className="text-xs text-surface-300">Concentration</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.ritual} onChange={(e) => onChange({ ...form, ritual: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
              <span className="text-xs text-surface-300">Ritual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.visibleToPlayers} onChange={(e) => onChange({ ...form, visibleToPlayers: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
              <span className="text-xs text-surface-300">Visible to Players</span>
            </label>
          </div>

          {/* VTT Area of Effect */}
          <div className="glass-dark rounded-xl p-4 space-y-3 border border-gold/10">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block">🗺 Area of Effect</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Shape</label>
                <select value={form.shape ?? ""} onChange={(e) => onChange({ ...form, shape: (e.target.value || undefined) as HomebrewSpell["shape"] })} className="input-arcane w-full py-1.5 px-2 text-xs">
                  <option value="">— None —</option>
                  {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Size (ft)</label>
                <input type="number" min={0} value={form.areaSize ?? ""} onChange={(e) => onChange({ ...form, areaSize: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="20" />
              </div>
            </div>
          </div>

          {/* Damage / Healing */}
          <div className="glass-dark rounded-xl p-4 space-y-3 border border-gold/10">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block">⚔ Damage & Healing</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Damage Dice</label>
                <input value={form.damageDice ?? ""} onChange={(e) => onChange({ ...form, damageDice: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="8d6" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Damage Type</label>
                <select value={form.damageType ?? ""} onChange={(e) => onChange({ ...form, damageType: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs">
                  <option value="">—</option>
                  {DAMAGE_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Healing Dice</label>
                <input value={form.healDice ?? ""} onChange={(e) => onChange({ ...form, healDice: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="1d8" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Save DC</label>
                <input type="number" value={form.saveDC ?? ""} onChange={(e) => onChange({ ...form, saveDC: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="14" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Save Ability</label>
                <select value={form.saveAbility ?? ""} onChange={(e) => onChange({ ...form, saveAbility: (e.target.value || undefined) as HomebrewSpell["saveAbility"] })} className="input-arcane w-full py-1.5 px-2 text-xs">
                  <option value="">— None —</option>
                  <option value="strength">STR</option>
                  <option value="dexterity">DEX</option>
                  <option value="constitution">CON</option>
                  <option value="intelligence">INT</option>
                  <option value="wisdom">WIS</option>
                  <option value="charisma">CHA</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Spell Attack Bonus</label>
                <input type="number" value={form.spellAttackBonus ?? ""} onChange={(e) => onChange({ ...form, spellAttackBonus: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="+6" />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Material Component</label>
                <input value={form.materialComponent ?? ""} onChange={(e) => onChange({ ...form, materialComponent: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="a pinch of guano" />
              </div>
            </div>
          </div>

          {/* At Higher Levels */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">At Higher Levels</label>
            <textarea value={form.atHigherLevels ?? ""} onChange={(e) => onChange({ ...form, atHigherLevels: e.target.value || undefined })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-16" placeholder="+1d6 per slot level above 3rd..." />
          </div>

          {/* Classes */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Classes</label>
            <ClassInput classes={form.classes} onChange={(classes) => onChange({ ...form, classes })} />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Tags <span className="text-surface-600">(comma-separated)</span></label>
            <input value={form.tags?.join(", ") || ""} onChange={(e) => onChange({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder="fire, damage, evocation" />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Image URL <span className="text-surface-600">(optional)</span></label>
            <div className="flex gap-2">
              <input
                value={(form as unknown as Record<string, string>).imageUrl || ""}
                onChange={(e) => onChange({ ...form, imageUrl: e.target.value || undefined } as unknown as HomebrewSpell)}
                className="input-arcane flex-1 py-2 px-3 text-sm"
                placeholder="https://example.com/spell-art.png"
              />
              {(form as unknown as Record<string, string>).imageUrl && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gold/10 shrink-0">
                  <img
                    src={(form as unknown as Record<string, string>).imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Source</label>
            <input value={form.source || ""} onChange={(e) => onChange({ ...form, source: e.target.value })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder="homebrew" />
          </div>

          {/* Submit */}
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600/80 via-gold-500/80 to-amber-500/80 hover:from-gold-500 hover:via-gold-400 hover:to-amber-400 text-[#0a0b12] text-sm font-bold active:scale-[0.97] transition-all duration-200 shadow-lg shadow-gold-500/15 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {isEdit ? "Update Spell" : "Create Spell"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Comma-separated class tag input */
function ClassInput({ classes, onChange }: { classes: string[]; onChange: (c: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-1">
      {classes.map((cls, i) => (
        <span key={i} className="flex items-center gap-1 bg-gold-500/10 border border-gold-500/20 text-gold-400 text-[10px] px-2 py-0.5 rounded-full">
          {cls}
          <button type="button" onClick={() => onChange(classes.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors">&times;</button>
        </span>
      ))}
      <ClassInputField onAdd={(c) => { if (c && !classes.includes(c)) onChange([...classes, c]); }} />
    </div>
  );
}

function ClassInputField({ onAdd }: { onAdd: (c: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onAdd(val.trim());
          setVal("");
        }
      }}
      className="input-arcane w-24 py-0.5 px-1.5 text-[10px]"
      placeholder="+ class"
    />
  );
}
