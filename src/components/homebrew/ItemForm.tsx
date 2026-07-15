import { useState, useRef, type FormEvent } from "react";
import type {
  HomebrewItem,
  ItemCategory,
  Rarity,
  WeaponType,
  DamageType,
  WeaponProperty,
  ArmorType,
} from "@/types/homebrew";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/stores/uiStore";

/* ── Constants ──────────────────────────────────────────────── */

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "weapon", label: "Weapon" },
  { value: "armor", label: "Armor" },
  { value: "potion", label: "Potion" },
  { value: "scroll", label: "Scroll" },
  { value: "wand", label: "Wand" },
  { value: "ring", label: "Ring" },
  { value: "wondrous", label: "Wondrous Item" },
  { value: "tool", label: "Tool" },
  { value: "ammunition", label: "Ammunition" },
  { value: "food", label: "Food / Drink" },
  { value: "poison", label: "Poison" },
  { value: "other", label: "Other" },
];

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies"];

const WEAPON_TYPES: WeaponType[] = ["simple melee", "simple ranged", "martial melee", "martial ranged"];

const DAMAGE_TYPES: { value: DamageType; label: string }[] = [
  { value: "bludgeoning", label: "Bludgeoning" },
  { value: "piercing", label: "Piercing" },
  { value: "slashing", label: "Slashing" },
  { value: "acid", label: "Acid" },
  { value: "cold", label: "Cold" },
  { value: "fire", label: "Fire" },
  { value: "force", label: "Force" },
  { value: "lightning", label: "Lightning" },
  { value: "necrotic", label: "Necrotic" },
  { value: "poison", label: "Poison" },
  { value: "psychic", label: "Psychic" },
  { value: "radiant", label: "Radiant" },
  { value: "thunder", label: "Thunder" },
];

const WEAPON_PROPERTIES: { value: WeaponProperty; label: string }[] = [
  { value: "ammunition", label: "Ammunition" },
  { value: "finesse", label: "Finesse" },
  { value: "heavy", label: "Heavy" },
  { value: "light", label: "Light" },
  { value: "loading", label: "Loading" },
  { value: "range", label: "Range" },
  { value: "reach", label: "Reach" },
  { value: "special", label: "Special" },
  { value: "thrown", label: "Thrown" },
  { value: "two-handed", label: "Two-Handed" },
  { value: "versatile", label: "Versatile" },
  { value: "silvered", label: "Silvered" },
  { value: "magical", label: "Magical" },
];

const ARMOR_TYPES: { value: ArmorType; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
  { value: "shield", label: "Shield" },
];

/* ── Props ──────────────────────────────────────────────────── */

interface ItemFormProps {
  onSubmit: (item: HomebrewItem) => void;
  onCancel: () => void;
  initialData?: HomebrewItem;
}

/* ── Utility ────────────────────────────────────────────────── */

function generateId(): string {
  return `hb-item-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/* ── Component ──────────────────────────────────────────────── */

export function ItemForm({ onSubmit, onCancel, initialData }: ItemFormProps) {
  const showToast = useUiStore((s) => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Form State ── */
  const [category, setCategory] = useState<ItemCategory>(initialData?.category ?? "other");
  const [name, setName] = useState(initialData?.name ?? "");
  const [rarity, setRarity] = useState<Rarity>(initialData?.rarity ?? "common");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [flavorText, setFlavorText] = useState(initialData?.flavorText ?? "");
  const [requiresAttunement, setRequiresAttunement] = useState(initialData?.requiresAttunement ?? false);
  const [attunementDetails, setAttunementDetails] = useState(initialData?.attunementDetails ?? "");
  const [weight, setWeight] = useState(initialData?.weight ?? 0);
  const [value, setValue] = useState(initialData?.value ?? 0);
  const [isCursed, setIsCursed] = useState(initialData?.isCursed ?? false);
  const [curseDetails, setCurseDetails] = useState(initialData?.curseDetails ?? "");
  const [charges, setCharges] = useState(initialData?.charges ?? 0);
  const [chargesMax, setChargesMax] = useState(initialData?.chargesMax ?? 0);
  const [chargesRecharge, setChargesRecharge] = useState(initialData?.chargesRecharge ?? "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [source, setSource] = useState(initialData?.source ?? "Homebrew");
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl ?? null);

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

  /* ── Image Upload Handler ── */
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith("image/")) {
      showToast({ message: "Please select a valid image file.", type: "error" });
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast({ message: "Image must be under 5MB.", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      setImagePreview(evt.target?.result as string);
      showToast({ message: "Image uploaded successfully.", type: "success" });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ── Weapon Property Toggle ── */
  const toggleWeaponProperty = (prop: WeaponProperty) => {
    setWeaponProperties((prev) =>
      prev.includes(prop) ? prev.filter((p) => p !== prop) : [...prev, prop],
    );
  };

  /* ── Submit ── */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast({ message: "Item name is required.", type: "error" });
      return;
    }

    const item: HomebrewItem = {
      id: initialData?.id ?? generateId(),
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
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      source: source.trim() || "Homebrew",
      isHomebrew: true as const,
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    /* Add category-specific data */
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
        requiresAttunement: requiresAttunement,
      };
    }

    if (category === "scroll") {
      item.scrollData = {
        spellName: scrollSpellName.trim(),
        spellLevel: scrollSpellLevel,
        spellSchool: scrollSpellSchool.trim(),
        requiresAttunement: requiresAttunement,
      };
    }

    onSubmit(item);
  };

  /* ── Render ── */
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

      {/* ── Weapon Fields ── */}
      {category === "weapon" && (
        <div className="rounded-lg border border-mage-500/20 bg-mage-500/5 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-mage-400 uppercase tracking-wider">Weapon Properties</h4>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-400">Weapon Type</label>
              <select
                value={weaponType}
                onChange={(e) => setWeaponType(e.target.value as WeaponType)}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
              >
                {WEAPON_TYPES.map((wt) => (
                  <option key={wt} value={wt}>{wt.charAt(0).toUpperCase() + wt.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-400">Damage Dice</label>
              <Input
                placeholder="e.g. 1d8"
                value={damageDice}
                onChange={(e) => setDamageDice(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-400">Damage Type</label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value as DamageType)}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
              >
                {DAMAGE_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Versatile Dice (if any)"
                placeholder="e.g. 1d10"
                value={versatileDice}
                onChange={(e) => setVersatileDice(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Range Normal (ft)"
                type="number"
                min={0}
                value={rangeNormal}
                onChange={(e) => setRangeNormal(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Input
                label="Range Max (ft)"
                type="number"
                min={0}
                value={rangeMax}
                onChange={(e) => setRangeMax(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Input
                label="Attack Bonus"
                type="number"
                value={attackBonus}
                onChange={(e) => setAttackBonus(parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Input
                label="Damage Bonus"
                type="number"
                value={damageBonus}
                onChange={(e) => setDamageBonus(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Weapon Properties Checkboxes */}
          <div>
            <label className="mb-2 block text-xs font-medium text-surface-400">Properties</label>
            <div className="flex flex-wrap gap-2">
              {WEAPON_PROPERTIES.map((prop) => (
                <label
                  key={prop.value}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                    weaponProperties.includes(prop.value)
                      ? "border-mage-500/50 bg-mage-500/20 text-mage-300"
                      : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={weaponProperties.includes(prop.value)}
                    onChange={() => toggleWeaponProperty(prop.value)}
                    className="sr-only"
                  />
                  {prop.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Armor Fields ── */}
      {category === "armor" && (
        <div className="rounded-lg border border-warrior-500/20 bg-warrior-500/5 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-warrior-400 uppercase tracking-wider">Armor Properties</h4>

          <div className="flex items-center gap-3 mb-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-200">
              <input
                type="checkbox"
                checked={isShield}
                onChange={(e) => setIsShield(e.target.checked)}
                className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
              />
              This is a Shield
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {!isShield && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-surface-400">Armor Type</label>
                  <select
                    value={armorType}
                    onChange={(e) => setArmorType(e.target.value as ArmorType)}
                    className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
                  >
                    {ARMOR_TYPES.filter((a) => a.value !== "shield").map((at) => (
                      <option key={at.value} value={at.value}>{at.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Base AC"
                    type="number"
                    min={10}
                    max={25}
                    value={baseAC}
                    onChange={(e) => setBaseAC(parseInt(e.target.value) || 10)}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-surface-400">Dexterity Bonus</label>
                  <select
                    value={dexBonusOption}
                    onChange={(e) => setDexBonusOption(e.target.value)}
                    className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
                  >
                    <option value="full">Full Dex Bonus</option>
                    <option value="up to 2">Up to +2 (Medium)</option>
                    <option value="none">No Dex Bonus (Heavy)</option>
                  </select>
                </div>

                <div>
                  <Input
                    label="Strength Requirement"
                    type="number"
                    min={0}
                    value={strengthRequirement}
                    onChange={(e) => setStrengthRequirement(parseInt(e.target.value) || 0)}
                    placeholder="0 for none"
                  />
                </div>
              </>
            )}

            {isShield && (
              <div>
                <Input
                  label="Shield AC Bonus"
                  type="number"
                  min={1}
                  max={5}
                  value={shieldACBonus}
                  onChange={(e) => setShieldACBonus(parseInt(e.target.value) || 2)}
                />
              </div>
            )}
          </div>

          {!isShield && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-300">
              <input
                type="checkbox"
                checked={stealthDisadvantage}
                onChange={(e) => setStealthDisadvantage(e.target.checked)}
                className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
              />
              Stealth Disadvantage
            </label>
          )}
        </div>
      )}

      {/* ── Potion Fields ── */}
      {category === "potion" && (
        <div className="rounded-lg border border-rogue-500/20 bg-rogue-500/5 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-rogue-400 uppercase tracking-wider">Potion Effects</h4>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-surface-400">Effect *</label>
            <textarea
              value={potionEffect}
              onChange={(e) => setPotionEffect(e.target.value)}
              rows={3}
              placeholder="Describe what this potion does..."
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duration (optional)"
              placeholder="e.g. 1 hour"
              value={potionDuration}
              onChange={(e) => setPotionDuration(e.target.value)}
            />
            <Input
              label="Spell Level (if mimicking a spell)"
              type="number"
              min={0}
              max={9}
              value={potionLevel}
              onChange={(e) => setPotionLevel(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      )}

      {/* ── Scroll Fields ── */}
      {category === "scroll" && (
        <div className="rounded-lg border border-divine-500/20 bg-divine-500/5 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-divine-400 uppercase tracking-wider">Scroll Details</h4>
          <Input
            label="Spell Name *"
            placeholder="e.g. Fireball"
            value={scrollSpellName}
            onChange={(e) => setScrollSpellName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Spell Level"
              type="number"
              min={0}
              max={9}
              value={scrollSpellLevel}
              onChange={(e) => setScrollSpellLevel(parseInt(e.target.value) || 1)}
            />
            <Input
              label="Spell School"
              placeholder="e.g. Evocation"
              value={scrollSpellSchool}
              onChange={(e) => setScrollSpellSchool(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Attunement & Charges ── */}
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

      {/* ── Curse ── */}
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

      {/* ── Tags & Source ── */}
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

      {/* ── Image Upload ── */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">Item Image</label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Item preview"
              className="max-h-48 rounded-lg border border-surface-700 object-contain"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface-900/80 text-xs text-surface-300 hover:bg-surface-800"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleImageUpload}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-700 bg-surface-800/50 px-4 py-6 text-sm text-surface-500 hover:border-surface-600 hover:text-surface-400 transition-colors"
          >
            <span className="text-lg">📷</span>
            Click to Upload Image
            <span className="text-xs text-surface-600">(max 5MB)</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {/* ── Buttons ── */}
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
