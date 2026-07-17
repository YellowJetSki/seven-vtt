/* ── ItemForm ───────────────────────────────────────────────────
 * Orchestrator component for creating/editing homebrew items.
 * Delegates to sub-components for each category-specific section.
 * ─────────────────────────────────────────────────────────────── */

import { useState, type FormEvent } from "react";
import type { HomebrewItem, ItemCategory, Rarity, WeaponType, DamageType, WeaponProperty, ArmorType } from "@/types/homebrew";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/stores/uiStore";
import { CATEGORIES, RARITIES, generateItemId } from "./ItemFormConstants";
import { ItemFormImageUpload } from "./ItemFormImageUpload";
import { ItemFormWeaponFields } from "./ItemFormWeaponFields";
import { ItemFormArmorFields } from "./ItemFormArmorFields";
import { ItemFormPotionFields } from "./ItemFormPotionFields";
import { ItemFormScrollFields } from "./ItemFormScrollFields";

interface ItemFormProps {
  onSubmit: (item: HomebrewItem) => void;
  onCancel: () => void;
  initialData?: HomebrewItem;
}

export function ItemForm({ onSubmit, onCancel, initialData }: ItemFormProps) {
  const showToast = useUiStore((s) => s.showToast);

  /* ── Basic Fields ── */
  const [category, setCategory] = useState<ItemCategory>(initialData?.category ?? "other");
  const [name, setName] = useState(initialData?.name ?? "");
  const [rarity, setRarity] = useState<Rarity>(initialData?.rarity ?? "common");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [flavorText, setFlavorText] = useState(initialData?.flavorText ?? "");
  const [weight, setWeight] = useState(initialData?.weight ?? 0);
  const [value, setValue] = useState(initialData?.value ?? 0);
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [source, setSource] = useState(initialData?.source ?? "Homebrew");
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl ?? null);

  /* ── Attunement & Charges ── */
  const [requiresAttunement, setRequiresAttunement] = useState(initialData?.requiresAttunement ?? false);
  const [attunementDetails, setAttunementDetails] = useState(initialData?.attunementDetails ?? "");
  const [charges, setCharges] = useState(initialData?.charges ?? 0);
  const [chargesMax, setChargesMax] = useState(initialData?.chargesMax ?? 0);
  const [chargesRecharge, setChargesRecharge] = useState(initialData?.chargesRecharge ?? "");

  /* ── Curse ── */
  const [isCursed, setIsCursed] = useState(initialData?.isCursed ?? false);
  const [curseDetails, setCurseDetails] = useState(initialData?.curseDetails ?? "");

  /* ── Weapon Fields ── */
  const [weaponType, setWeaponType] = useState<WeaponType>(initialData?.weaponData?.weaponType ?? "simple melee");
  const [damageDice, setDamageDice] = useState(initialData?.weaponData?.damageDice ?? "1d6");
  const [damageType, setDamageType] = useState<DamageType>(initialData?.weaponData?.damageType ?? "slashing");
  const [weaponProperties, setWeaponProperties] = useState<WeaponProperty[]>(initialData?.weaponData?.properties ?? []);
  const [rangeNormal, setRangeNormal] = useState(initialData?.weaponData?.rangeNormal ?? 0);
  const [rangeMax, setRangeMax] = useState(initialData?.weaponData?.rangeMax ?? 0);
  const [versatileDice, setVersatileDice] = useState(initialData?.weaponData?.versatileDice ?? "");
  const [attackBonus, setAttackBonus] = useState(initialData?.weaponData?.attackBonus ?? 0);
  const [damageBonus, setDamageBonus] = useState(initialData?.weaponData?.damageBonus ?? 0);

  /* ── Armor Fields ── */
  const [armorType, setArmorType] = useState<ArmorType>(initialData?.armorData?.armorType ?? "light");
  const [baseAC, setBaseAC] = useState(initialData?.armorData?.baseAC ?? 10);
  const [dexBonusOption, setDexBonusOption] = useState<string>(initialData?.armorData?.dexBonus ?? "full");
  const [stealthDisadvantage, setStealthDisadvantage] = useState(initialData?.armorData?.stealthDisadvantage ?? false);
  const [strengthRequirement, setStrengthRequirement] = useState(initialData?.armorData?.strengthRequirement ?? 0);
  const [isShield, setIsShield] = useState(initialData?.armorData?.isShield ?? false);
  const [shieldACBonus, setShieldACBonus] = useState(initialData?.armorData?.shieldACBonus ?? 2);

  /* ── Potion Fields ── */
  const [potionEffect, setPotionEffect] = useState(initialData?.potionData?.effect ?? "");
  const [potionDuration, setPotionDuration] = useState(initialData?.potionData?.duration ?? "");
  const [potionLevel, setPotionLevel] = useState(initialData?.potionData?.level ?? 0);

  /* ── Scroll Fields ── */
  const [scrollSpellName, setScrollSpellName] = useState(initialData?.scrollData?.spellName ?? "");
  const [scrollSpellLevel, setScrollSpellLevel] = useState(initialData?.scrollData?.spellLevel ?? 1);
  const [scrollSpellSchool, setScrollSpellSchool] = useState(initialData?.scrollData?.spellSchool ?? "");

  /* ── Validation ── */
  const validate = (): boolean => {
    if (!name.trim()) {
      showToast({ message: "Item name is required.", type: "error" });
      return false;
    }
    return true;
  };

  /* ── Build payload ── */
  const buildItem = (): HomebrewItem => {
    const item: HomebrewItem = {
      id: initialData?.id ?? generateItemId(),
      name: name.trim(),
      category,
      rarity,
      description: description.trim(),
      flavorText: flavorText.trim() || undefined,
      requiresAttunement,
      attunementDetails: attunementDetails.trim() || undefined,
      charges: charges || undefined,
      chargesMax: chargesMax || undefined,
      chargesRecharge: chargesRecharge.trim() || undefined,
      weight,
      value,
      isCursed,
      curseDetails: curseDetails.trim() || undefined,
      imageUrl: imagePreview ?? undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      source: source.trim() || "Homebrew",
      isHomebrew: true as const,
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    if (category === "weapon") {
      item.weaponData = {
        weaponType,
        damageDice,
        damageType,
        properties: weaponProperties,
        rangeNormal,
        rangeMax: rangeMax || undefined,
        versatileDice: versatileDice.trim() || undefined,
        attackBonus: attackBonus || undefined,
        damageBonus: damageBonus || undefined,
      };
    }

    if (category === "armor") {
      item.armorData = {
        armorType: isShield ? "shield" : armorType,
        baseAC: isShield ? shieldACBonus : baseAC,
        dexBonus: isShield ? "none" : (dexBonusOption as "full" | "up to 2" | "none"),
        stealthDisadvantage: isShield ? false : stealthDisadvantage,
        strengthRequirement: isShield ? undefined : (strengthRequirement || undefined),
        isShield,
        shieldACBonus: isShield ? shieldACBonus : undefined,
      };
    }

    if (category === "potion") {
      item.potionData = {
        effect: potionEffect.trim(),
        duration: potionDuration.trim() || undefined,
        level: potionLevel || undefined,
        requiresAttunement,
      };
    }

    if (category === "scroll") {
      item.scrollData = {
        spellName: scrollSpellName.trim(),
        spellLevel: scrollSpellLevel,
        spellSchool: scrollSpellSchool.trim(),
        requiresAttunement,
      };
    }

    return item;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(buildItem());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
      {/* Basic Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Item Name *"
            placeholder="e.g. Strider's Longsword"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Category *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Rarity</label>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as Rarity)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Weight (lbs)"
            type="number"
            min={0}
            step={0.1}
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div>
          <Input
            label="Value (gp)"
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the item's appearance and function..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">Flavor Text</label>
        <textarea
          value={flavorText}
          onChange={(e) => setFlavorText(e.target.value)}
          rows={2}
          placeholder="Optional atmospheric description..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-400 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y"
        />
      </div>

      {/* Category-specific fields */}
      {category === "weapon" && (
        <ItemFormWeaponFields
          data={{ weaponType, damageDice, damageType, properties: weaponProperties, rangeNormal, rangeMax, versatileDice, attackBonus, damageBonus }}
          onChange={(d) => {
            if (d.weaponType !== undefined) setWeaponType(d.weaponType);
            if (d.damageDice !== undefined) setDamageDice(d.damageDice);
            if (d.damageType !== undefined) setDamageType(d.damageType);
            if (d.properties !== undefined) setWeaponProperties(d.properties);
            if (d.rangeNormal !== undefined) setRangeNormal(d.rangeNormal);
            if (d.rangeMax !== undefined) setRangeMax(d.rangeMax);
            if (d.versatileDice !== undefined) setVersatileDice(d.versatileDice);
            if (d.attackBonus !== undefined) setAttackBonus(d.attackBonus);
            if (d.damageBonus !== undefined) setDamageBonus(d.damageBonus);
          }}
        />
      )}

      {category === "armor" && (
        <ItemFormArmorFields
          data={{ armorType, baseAC, dexBonusOption, stealthDisadvantage, strengthRequirement, isShield, shieldACBonus }}
          onChange={(d) => {
            if (d.armorType !== undefined) setArmorType(d.armorType);
            if (d.baseAC !== undefined) setBaseAC(d.baseAC);
            if (d.dexBonusOption !== undefined) setDexBonusOption(d.dexBonusOption);
            if (d.stealthDisadvantage !== undefined) setStealthDisadvantage(d.stealthDisadvantage);
            if (d.strengthRequirement !== undefined) setStrengthRequirement(d.strengthRequirement);
            if (d.isShield !== undefined) setIsShield(d.isShield);
            if (d.shieldACBonus !== undefined) setShieldACBonus(d.shieldACBonus);
          }}
        />
      )}

      {category === "potion" && (
        <ItemFormPotionFields
          data={{ effect: potionEffect, duration: potionDuration, level: potionLevel }}
          onChange={(d) => {
            if (d.effect !== undefined) setPotionEffect(d.effect);
            if (d.duration !== undefined) setPotionDuration(d.duration);
            if (d.level !== undefined) setPotionLevel(d.level);
          }}
        />
      )}

      {category === "scroll" && (
        <ItemFormScrollFields
          data={{ spellName: scrollSpellName, spellLevel: scrollSpellLevel, spellSchool: scrollSpellSchool }}
          onChange={(d) => {
            if (d.spellName !== undefined) setScrollSpellName(d.spellName);
            if (d.spellLevel !== undefined) setScrollSpellLevel(d.spellLevel);
            if (d.spellSchool !== undefined) setScrollSpellSchool(d.spellSchool);
          }}
        />
      )}

      {/* Attunement & Charges */}
      <div className="space-y-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-300">
          <input
            type="checkbox"
            checked={requiresAttunement}
            onChange={(e) => setRequiresAttunement(e.target.checked)}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
          />
          Requires Attunement
        </label>

        {requiresAttunement && (
          <Input
            label="Attunement Details"
            placeholder="e.g. Requires attunement by a spellcaster"
            value={attunementDetails}
            onChange={(e) => setAttunementDetails(e.target.value)}
          />
        )}

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Charges"
            type="number"
            min={0}
            value={charges}
            onChange={(e) => setCharges(parseInt(e.target.value) || 0)}
          />
          <Input
            label="Max Charges"
            type="number"
            min={0}
            value={chargesMax}
            onChange={(e) => setChargesMax(parseInt(e.target.value) || 0)}
          />
          <Input
            label="Recharge"
            placeholder="dawn, long rest..."
            value={chargesRecharge}
            onChange={(e) => setChargesRecharge(e.target.value)}
          />
        </div>
      </div>

      {/* Curse */}
      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-300">
          <input
            type="checkbox"
            checked={isCursed}
            onChange={(e) => setIsCursed(e.target.checked)}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-warrior-500"
          />
          This Item is Cursed
        </label>
        {isCursed && (
          <div className="mt-2">
            <label className="mb-1.5 block text-xs font-medium text-surface-400">Curse Details</label>
            <textarea
              value={curseDetails}
              onChange={(e) => setCurseDetails(e.target.value)}
              rows={2}
              placeholder="Describe the curse..."
              className="w-full rounded-lg border border-warrior-500/30 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-warrior-500 focus:ring-1 focus:ring-warrior-500 focus:outline-none resize-y"
            />
          </div>
        )}
      </div>

      {/* Tags & Source */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tags (comma-separated)"
          placeholder="magic, fire, weapon"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <Input
          label="Source"
          placeholder="Homebrew, Tasha's, etc."
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      {/* Image Upload */}
      <ItemFormImageUpload
        imagePreview={imagePreview}
        onImageChange={setImagePreview}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}
