import { useState, type FormEvent } from "react";
import type { HomebrewFeat, FeatPrerequisite } from "@/types/homebrew";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUiStore } from "@/stores/uiStore";

/* ── Utility ── */
function generateId(): string {
  return `hb-feat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/* ── Props ── */
interface FeatFormProps {
  onSubmit: (feat: HomebrewFeat) => void;
  onCancel: () => void;
  initialData?: HomebrewFeat;
}

/* ── Component ── */
export function FeatForm({ onSubmit, onCancel, initialData }: FeatFormProps) {
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [flavorText, setFlavorText] = useState(initialData?.flavorText ?? "");
  const [benefitsText, setBenefitsText] = useState(
    initialData?.benefits?.join("\n") ?? "",
  );
  const [repeatable, setRepeatable] = useState(initialData?.repeatable ?? false);
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [source, setSource] = useState(initialData?.source ?? "Homebrew");

  /* Prerequisites */
  const [prereqs, setPrereqs] = useState<FeatPrerequisite[]>(
    initialData?.prerequisites ?? [],
  );

  const addPrereq = () => {
    setPrereqs([...prereqs, { type: "other", description: "" }]);
  };

  const updatePrereq = (index: number, updates: Partial<FeatPrerequisite>) => {
    setPrereqs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  };

  const removePrereq = (index: number) => {
    setPrereqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast({ message: "Feat name is required.", type: "error" });
      return;
    }

    const feat: HomebrewFeat = {
      id: initialData?.id ?? generateId(),
      name: name.trim(),
      description: description.trim(),
      flavorText: flavorText.trim() || undefined,
      prerequisites: prereqs.filter((p) => p.description.trim()),
      benefits: benefitsText
        .split("\n")
        .map((b) => b.trim())
        .filter(Boolean),
      repeatable,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      source: source.trim() || "Homebrew",
      isHomebrew: true as const,
      createdAt: initialData?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    onSubmit(feat);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
      {/* Basic Info */}
      <div className="md:col-span-2">
        <Input
          label="Feat Name *"
          placeholder="e.g. Arcane Marksman"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe what this feat does mechanically..."
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

      {/* Benefits */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">
          Benefits (one per line)
        </label>
        <textarea
          value={benefitsText}
          onChange={(e) => setBenefitsText(e.target.value)}
          rows={5}
          placeholder={"+2 to Dexterity\nGain proficiency with longbows\nOnce per turn, deal +1d6 damage when..."}
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y font-mono"
        />
        <p className="mt-1 text-[11px] text-surface-500">
          Each line becomes a bullet point on the feat card.
        </p>
      </div>

      {/* Prerequisites */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-surface-400">Prerequisites</label>
          <button
            type="button"
            onClick={addPrereq}
            className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
          >
            + Add Prerequisite
          </button>
        </div>

        {prereqs.length === 0 && (
          <p className="text-xs text-surface-500 italic">No prerequisites (anyone can take this feat).</p>
        )}

        <div className="space-y-2">
          {prereqs.map((prereq, index) => (
            <div key={index} className="flex items-start gap-2 rounded-lg bg-surface-800 p-3">
              <div className="flex-1 space-y-2">
                <select
                  value={prereq.type}
                  onChange={(e) => updatePrereq(index, { type: e.target.value as FeatPrerequisite["type"] })}
                  className="w-full rounded-lg border border-surface-700 bg-surface-850 px-2.5 py-1.5 text-xs text-surface-200 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
                >
                  <option value="ability">Ability Score</option>
                  <option value="class">Class</option>
                  <option value="race">Race</option>
                  <option value="spellcasting">Spellcasting</option>
                  <option value="level">Level</option>
                  <option value="proficiency">Proficiency</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  value={prereq.description}
                  onChange={(e) => updatePrereq(index, { description: e.target.value })}
                  placeholder="e.g. Strength 13 or Spellcasting feature"
                  className="w-full rounded-lg border border-surface-700 bg-surface-850 px-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removePrereq(index)}
                className="mt-1 text-warrior-400 hover:text-warrior-300 text-xs"
                aria-label="Remove prerequisite"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Repeatable */}
      <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-300">
        <input
          type="checkbox"
          checked={repeatable}
          onChange={(e) => setRepeatable(e.target.checked)}
          className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
        />
        This feat can be taken multiple times
      </label>

      {/* Tags & Source */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Tags (comma-separated)"
          placeholder="combat, archery, elf"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <Input
          label="Source"
          placeholder="Homebrew, PHB, etc."
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
          {initialData ? "Update Feat" : "Create Feat"}
        </Button>
      </div>
    </form>
  );
}
