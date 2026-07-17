/* ── Tag Manager — Journal Tag CRUD ─────────────────────────────
 * Displays all tags used across journal entries, allows adding
 * new ones, and provides filtering UI for the journal list.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

interface TagManagerProps {
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

const TAG_COLORS = [
  "bg-accent-500/15 text-accent-300",
  "bg-rogue-500/15 text-rogue-400",
  "bg-mage-500/15 text-mage-400",
  "bg-divine-500/15 text-divine-400",
  "bg-warrior-500/15 text-warrior-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-pink-500/15 text-pink-400",
  "bg-emerald-500/15 text-emerald-400",
];

export function TagManager({ selectedTags, onToggleTag, onClearTags }: TagManagerProps) {
  const journal = useCampaignStore((s) => s.journal);
  const showToast = useUiStore((s) => s.showToast);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTag, setNewTag] = useState("");

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    journal.forEach((entry) => entry.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [journal]);

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    if (allTags.includes(tag)) {
      showToast({ message: `Tag "${tag}" already exists.`, type: "warning" });
      return;
    }
    onToggleTag(tag);
    setNewTag("");
    setShowAddTag(false);
    showToast({ message: `Tag "${tag}" added.`, type: "success" });
  };

  if (allTags.length === 0 && !showAddTag) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-surface-500">No tags yet.</span>
        <Button size="xs" variant="ghost" onClick={() => setShowAddTag(true)}>+ Add Tag</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-surface-500 font-medium">Tags</span>
        <div className="flex gap-1">
          {selectedTags.size > 0 && (
            <button onClick={onClearTags} className="text-[10px] text-surface-500 hover:text-surface-300">Clear</button>
          )}
          {!showAddTag && (
            <button onClick={() => setShowAddTag(true)} className="text-[10px] text-accent-400 hover:text-accent-300">+ New</button>
          )}
        </div>
      </div>

      {showAddTag && (
        <div className="flex gap-1">
          <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Tag name..."
            className="flex-1 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()} />
          <Button size="xs" onClick={handleAddTag} disabled={!newTag.trim()}>Add</Button>
          <Button size="xs" variant="ghost" onClick={() => { setShowAddTag(false); setNewTag(""); }}>✕</Button>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {allTags.map((tag, index) => {
          const isSelected = selectedTags.has(tag);
          const colorClass = TAG_COLORS[index % TAG_COLORS.length];
          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                isSelected
                  ? `${colorClass} ring-1 ring-current`
                  : "bg-surface-800 text-surface-500 hover:bg-surface-700 hover:text-surface-300"
              }`}
            >
              {tag}
              {isSelected && <span className="ml-1">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
