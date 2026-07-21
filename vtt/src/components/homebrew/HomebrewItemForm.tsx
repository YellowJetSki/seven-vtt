/**
 * STᚱ VTT — Homebrew Item Form (v2.0)
 *
 * Enhanced with weapon/armor stat fields, custom categories,
 * visible-to-players toggle, and premium gold glass styling.
 */

import { Check, X, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
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
const DAMAGE_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
const WEAPON_PROPERTIES = ["Finesse", "Heavy", "Light", "Loading", "Range", "Reach", "Special", "Thrown", "Two-Handed", "Versatile", "Ammunition", "Silvered", "Adamantine"];

export default function HomebrewItemForm({ form, onChange, onSubmit, onClose, isEdit }: HomebrewItemFormProps) {
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit();
  }, [form.name, onSubmit]);

  const isWeapon = form.category === "weapon";
  const isArmor = form.category === "armor";
  const isConsumable = ["potion", "poison", "food", "scroll"].includes(form.category);
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const handleCategoryChange = (val: string) => {
    if (val === "__custom__") {
      setUseCustomCategory(true);
      onChange({ ...form, category: customCategory || "other" });
    } else {
      setUseCustomCategory(false);
      onChange({ ...form, category: val });
    }
  };

  const applyCustomCategory = () => {
    const trimmed = customCategory.trim().toLowerCase().replace(/\s+/g, "_");
    if (trimmed) {
      onChange({ ...form, category: trimmed });
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
              {isEdit ? "Edit Item" : "New Item"}
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
            <input value={form.name} onChange={(e) => onChange({ ...form, name: e.target.value })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder="Item name" />
          </div>

          {/* Category & Rarity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Category</label>
              {useCustomCategory ? (
                <div className="flex gap-1">
                  <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} onBlur={applyCustomCategory} className="input-arcane flex-1 py-2 px-3 text-sm" placeholder="custom category" autoFocus />
                  <button type="button" onClick={() => setUseCustomCategory(false)} className="p-2 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)} className="input-arcane w-full py-2 px-3 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__custom__">✨ Custom...</option>
                </select>
              )}
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Rarity</label>
              <select value={form.rarity} onChange={(e) => onChange({ ...form, rarity: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => onChange({ ...form, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-24" placeholder="Item description, magical effects, and any special properties..." />
          </div>

          {/* Flavor Text */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Flavor Text <span className="text-surface-600">(optional)</span></label>
            <input value={form.flavorText || ""} onChange={(e) => onChange({ ...form, flavorText: e.target.value || undefined })} className="input-arcane w-full py-2.5 px-3 text-sm" placeholder='"A sword fit for a king..."' />
          </div>

          {/* Weapon Stats */}
          {isWeapon && (
            <div className="glass-dark rounded-xl p-4 space-y-3 border border-gold/10">
              <span className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block">⚔ Weapon Stats</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Damage Dice</label>
                  <input value={form.damageDice ?? ""} onChange={(e) => onChange({ ...form, damageDice: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="1d8" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Damage Type</label>
                  <select value={form.damageType ?? ""} onChange={(e) => onChange({ ...form, damageType: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs">
                    <option value="">—</option>
                    {DAMAGE_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Attack Bonus</label>
                  <input type="number" value={form.attackBonus ?? 0} onChange={(e) => onChange({ ...form, attackBonus: Number(e.target.value) || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" />
                </div>
              </div>
              {/* Weapon Properties */}
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1.5">Properties</label>
                <div className="flex flex-wrap gap-1">
                  {WEAPON_PROPERTIES.map((prop) => (
                    <button
                      key={prop}
                      type="button"
                      onClick={() => {
                        const current = form.weaponProperties ?? [];
                        onChange({
                          ...form,
                          weaponProperties: current.includes(prop)
                            ? current.filter((p) => p !== prop)
                            : [...current, prop],
                        });
                      }}
                      className={`px-2 py-1 text-[9px] font-semibold rounded-lg border transition-all duration-200 active:scale-95 ${
                        (form.weaponProperties ?? []).includes(prop)
                          ? "bg-gold-500/10 border-gold/25 text-gold-400"
                          : "bg-surface-800/40 border-surface-700/20 text-surface-400 hover:border-gold/15"
                      }`}
                    >
                      {prop}
                    </button>
                  ))}
                </div>
              </div>
              {/* Versatile damage dice */}
              {(form.weaponProperties ?? []).includes("Versatile") && (
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Versatile Damage Dice</label>
                  <input value={form.versatileDamage ?? ""} onChange={(e) => onChange({ ...form, versatileDamage: e.target.value || undefined })} className="input-arcane w-24 py-1.5 px-2 text-xs" placeholder="1d10" />
                </div>
              )}
            </div>
          )}

          {/* Armor Stats */}
          {isArmor && (
            <div className="glass-dark rounded-xl p-4 space-y-3 border border-gold/10">
              <span className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block">🛡 Armor Stats</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">AC Bonus</label>
                  <input type="number" value={form.acBonus ?? 0} onChange={(e) => onChange({ ...form, acBonus: Number(e.target.value) || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="e.g. 18" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Armor Type</label>
                  <select value={form.armorType ?? ""} onChange={(e) => onChange({ ...form, armorType: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs">
                    <option value="">—</option>
                    <option value="light">Light</option>
                    <option value="medium">Medium</option>
                    <option value="heavy">Heavy</option>
                    <option value="shield">Shield</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">DEX Cap</label>
                  <input type="number" min={0} max={2} value={form.dexCap ?? ""} onChange={(e) => onChange({ ...form, dexCap: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="2" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">STR Required</label>
                  <input type="number" min={0} value={form.strengthRequirement ?? ""} onChange={(e) => onChange({ ...form, strengthRequirement: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="15" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.stealthDisadvantage || false} onChange={(e) => onChange({ ...form, stealthDisadvantage: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-rose-500" />
                    <span className="text-[9px] text-rose-300">Stealth⬇</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Potion / Consumable Stats */}
          {isConsumable && (
            <div className="glass-dark rounded-xl p-4 space-y-3 border border-emerald-500/10">
              <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400/70 block">🧪 Consumable Stats</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Healing Dice</label>
                  <input value={form.healingDice ?? ""} onChange={(e) => onChange({ ...form, healingDice: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="4d4+4" />
                </div>
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Temp HP</label>
                  <input type="number" min={0} value={form.temporaryHp ?? ""} onChange={(e) => onChange({ ...form, temporaryHp: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="10" />
                </div>
              </div>
            </div>
          )}

          {/* Weight & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Weight (lb)</label>
              <input type="number" min={0} step={0.1} value={form.weight} onChange={(e) => onChange({ ...form, weight: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Value (gp)</label>
              <input type="number" min={0} value={form.value} onChange={(e) => onChange({ ...form, value: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
            </div>
          </div>

          {/* Charge Tracking */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Charges</label>
              <input type="number" min={0} value={form.charges ?? ""} onChange={(e) => onChange({ ...form, charges: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="7" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Max</label>
              <input type="number" min={0} value={form.chargesMax ?? ""} onChange={(e) => onChange({ ...form, chargesMax: e.target.value ? Number(e.target.value) : undefined })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="7" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Recharge</label>
              <input value={form.chargesRecharge ?? ""} onChange={(e) => onChange({ ...form, chargesRecharge: e.target.value || undefined })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="dawn" />
            </div>
          </div>

          {/* Toggle Row */}
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requiresAttunement} onChange={(e) => onChange({ ...form, requiresAttunement: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
                <span className="text-xs text-surface-300">Requires Attunement</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.visibleToPlayers} onChange={(e) => onChange({ ...form, visibleToPlayers: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
                <span className="text-xs text-surface-300">Visible to Players</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isCursed} onChange={(e) => onChange({ ...form, isCursed: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-red-500" />
                <span className="text-xs text-rose-300">Cursed</span>
              </label>
            </div>
            {form.requiresAttunement && (
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Attunement Details <span className="text-surface-600">(optional)</span></label>
                <input value={form.attunementDetails || ""} onChange={(e) => onChange({ ...form, attunementDetails: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="e.g. by a ranger" />
              </div>
            )}
            {form.isCursed && (
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 block mb-1">Curse Details <span className="text-surface-600">(optional)</span></label>
                <input value={form.curseDetails || ""} onChange={(e) => onChange({ ...form, curseDetails: e.target.value || undefined })} className="input-arcane w-full py-1.5 px-2 text-xs" placeholder="e.g. cannot be removed by any means" />
              </div>
            )}
          </div>

          {/* Image URL */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Image URL <span className="text-surface-600">(optional)</span></label>
            <div className="flex gap-2">
              <input
                value={form.imageUrl || ""}
                onChange={(e) => onChange({ ...form, imageUrl: e.target.value || undefined })}
                className="input-arcane flex-1 py-2 px-3 text-sm"
                placeholder="https://example.com/item-portrait.png"
              />
              {form.imageUrl && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gold/10 shrink-0">
                  <img
                    src={form.imageUrl}
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

          {/* Tags */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-black text-gold-400/70 block mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 bg-gold-500/10 border border-gold/15 text-gold-400 text-[10px] px-2 py-0.5 rounded-full">
                  {tag}
                  <button type="button" onClick={() => onChange({ ...form, tags: form.tags.filter((_, j) => j !== i) })} className="hover:text-red-400 transition-colors">&times;</button>
                </span>
              ))}
            </div>
            <TagInput onAdd={(tag) => { if (tag && !form.tags.includes(tag)) onChange({ ...form, tags: [...form.tags, tag] }); }} />
          </div>

          {/* Submit */}
          <button type="submit" className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600/80 via-gold-500/80 to-amber-500/80 hover:from-gold-500 hover:via-gold-400 hover:to-amber-400 text-[#0a0b12] text-sm font-bold active:scale-[0.97] transition-all duration-200 shadow-lg shadow-gold-500/15 flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {isEdit ? "Update Item" : "Create Item"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Inline tag input with Enter key */
function TagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <input
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onAdd(val.trim().toLowerCase());
          setVal("");
        }
      }}
      className="input-arcane w-32 py-1 px-2 text-[10px]"
      placeholder="+ add tag..."
    />
  );
}
