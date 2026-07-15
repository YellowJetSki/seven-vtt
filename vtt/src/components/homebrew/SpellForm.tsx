import { useState, type FormEvent } from "react";
import type {
  HomebrewSpell,
  SpellSchool,
  SpellCastingTime,
  SpellComponent,
  SpellClass,
} from "@/types/homebrew";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/stores/uiStore";

/* ── Constants ──────────────────────────────────────────────── */

const SCHOOLS: SpellSchool[] = [
  "abjuration", "conjuration", "divination", "enchantment",
  "evocation", "illusion", "necromancy", "transmutation",
];

const CASTING_TIMES: SpellCastingTime[] = [
  "action", "bonus action", "reaction", "minute", "hour", "special",
];

const COMPONENTS: SpellComponent[] = ["V", "S", "M"];

const CLASSES: SpellClass[] = [
  "artificer", "bard", "cleric", "druid", "paladin",
  "ranger", "sorcerer", "warlock", "wizard",
];

/* ── Utility ── */
function generateId(): string {
  return `hb-spell-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/* ── Props ── */
interface SpellFormProps {
  onSubmit: (spell: HomebrewSpell) => void;
  onCancel: () => void;
  initialData?: HomebrewSpell;
}

/* ── Component ── */
export function SpellForm({ onSubmit, onCancel, initialData }: SpellFormProps) {
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState(initialData?.name ?? "");
  const [level, setLevel] = useState(initialData?.level ?? 1);
  const [school, setSchool] = useState<SpellSchool>(initialData?.school ?? "evocation");
  const [castingTime, setCastingTime] = useState<SpellCastingTime>(initialData?.castingTime ?? "action");
  const [ritual, setRitual] = useState(initialData?.ritual ?? false);
  const [concentration, setConcentration] = useState(initialData?.concentration ?? false);
  const [components, setComponents] = useState<SpellComponent[]>(initialData?.components ?? ["V", "S"]);
  const [materialComponent, setMaterialComponent] = useState(initialData?.materialComponent ?? "");
  const [duration, setDuration] = useState(initialData?.duration ?? "instantaneous");
  const [range, setRange] = useState(initialData?.range ?? "60 feet");
  const [area, setArea] = useState(initialData?.area ?? "");
  const [classes, setSpellClasses] = useState<SpellClass[]>(initialData?.classes ?? []);
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [atHigherLevels, setAtHigherLevels] = useState(initialData?.atHigherLevels ?? "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [source, setSource] = useState(initialData?.source ?? "Homebrew");

  /* Toggle helpers */
  const toggleComponent = (comp: SpellComponent) => {
    setComponents((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp],
    );
  };

  const toggleClass = (cls: SpellClass) => {
    setSpellClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls],
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast({ message: "Spell name is required.", type: "error" });
      return;
    }

    const spell: HomebrewSpell = {
      id: initialData?.id ?? generateId(),
      name: name.trim(),
      level,
      school,
      castingTime,
      ritual,
      components,
      materialComponent: components.includes("M") ? materialComponent.trim() || undefined : undefined,
      concentration,
      duration,
      range,
      area: area.trim() || undefined,
      classes,
      description: description.trim(),
      atHigherLevels: atHigherLevels.trim() || undefined,
      isHomebrew: true as const,
      source: source.trim() || "Homebrew",
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    onSubmit(spell);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
      {/* Name & Level */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Input
            label="Spell Name *"
            placeholder="e.g. Arkla's Arcane Surge"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          >
            <option value={0}>Cantrip</option>
            {Array.from({ length: 9 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Level {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* School & Casting Time */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">School *</label>
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value as SpellSchool)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          >
            {SCHOOLS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Casting Time *</label>
          <select
            value={castingTime}
            onChange={(e) => setCastingTime(e.target.value as SpellCastingTime)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          >
            {CASTING_TIMES.map((ct) => (
              <option key={ct} value={ct}>{ct.charAt(0).toUpperCase() + ct.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Components */}
      <div>
        <label className="mb-2 block text-xs font-medium text-surface-400">Components</label>
        <div className="flex flex-wrap gap-2">
          {COMPONENTS.map((comp) => (
            <label
              key={comp}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                components.includes(comp)
                  ? "border-accent-500/50 bg-accent-500/20 text-accent-300 font-semibold"
                  : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600"
              }`}
            >
              <input
                type="checkbox"
                checked={components.includes(comp)}
                onChange={() => toggleComponent(comp)}
                className="sr-only"
              />
              {comp === "V" ? "Verbal" : comp === "S" ? "Somatic" : "Material"}
            </label>
          ))}
        </div>

        {components.includes("M") && (
          <div className="mt-3">
            <Input
              label="Material Component"
              placeholder="e.g. a tiny ball of bat guano and sulfur"
              value={materialComponent}
              onChange={(e) => setMaterialComponent(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Ritual & Concentration */}
      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-300">
          <input
            type="checkbox"
            checked={ritual}
            onChange={(e) => setRitual(e.target.checked)}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
          />
          Ritual
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-300">
          <input
            type="checkbox"
            checked={concentration}
            onChange={(e) => setConcentration(e.target.checked)}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
          />
          Requires Concentration
        </label>
      </div>

      {/* Duration & Range */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Duration *"
          placeholder="instantaneous, 1 minute, etc."
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Input
          label="Range *"
          placeholder="self, touch, 60 feet, etc."
          value={range}
          onChange={(e) => setRange(e.target.value)}
        />
      </div>

      {/* Area */}
      <Input
        label="Area of Effect (optional)"
        placeholder="e.g. 20-foot-radius sphere, 60-foot cone"
        value={area}
        onChange={(e) => setArea(e.target.value)}
      />

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          placeholder="Describe the spell's effect in detail..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y"
        />
      </div>

      {/* At Higher Levels */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">At Higher Levels</label>
        <textarea
          value={atHigherLevels}
          onChange={(e) => setAtHigherLevels(e.target.value)}
          rows={2}
          placeholder="e.g. When you cast this spell using a spell slot of 4th level or higher..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-400 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y"
        />
      </div>

      {/* Spell Classes */}
      <div>
        <label className="mb-2 block text-xs font-medium text-surface-400">Available to Classes *</label>
        <div className="flex flex-wrap gap-2">
          {CLASSES.map((cls) => (
            <label
              key={cls}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                classes.includes(cls)
                  ? "border-mage-500/50 bg-mage-500/20 text-mage-300 font-semibold"
                  : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600"
              }`}
            >
              <input
                type="checkbox"
                checked={classes.includes(cls)}
                onChange={() => toggleClass(cls)}
                className="sr-only"
              />
              {cls.charAt(0).toUpperCase() + cls.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {/* Tags & Source */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tags (comma-separated)"
          placeholder="fire, damage, aoE"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <Input
          label="Source"
          placeholder="Homebrew, XGE, etc."
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? "Update Spell" : "Create Spell"}
        </Button>
      </div>
    </form>
  );
}
