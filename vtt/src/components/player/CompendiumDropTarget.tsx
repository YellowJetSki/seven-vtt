import { type ReactNode, useCallback, useState } from "react";
import { useCompendiumStore } from "@/stores/compendium";

interface CompendiumDropTargetProps {
  characterId: string;
  onDropItem?: (characterId: string, itemId: string) => void;
  onDropSpell?: (characterId: string, spellId: string) => void;
  onDropFeat?: (characterId: string, featId: string) => void;
  children: ReactNode;
}

export default function CompendiumDropTarget({
  characterId,
  onDropItem,
  onDropSpell,
  onDropFeat,
  children,
}: CompendiumDropTargetProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const clearDraggedItem = useCompendiumStore((s) => s.clearDraggedItem);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      try {
        const raw = e.dataTransfer.getData("text/plain");
        const parsed = JSON.parse(raw);
        if (parsed.type === "item" && onDropItem) onDropItem(characterId, parsed.id);
        else if (parsed.type === "spell" && onDropSpell) onDropSpell(characterId, parsed.id);
        else if (parsed.type === "feat" && onDropFeat) onDropFeat(characterId, parsed.id);
      } catch {
        // ignore malformed drops
      }
      clearDraggedItem();
    },
    [characterId, onDropItem, onDropSpell, onDropFeat, clearDraggedItem]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all duration-200 ${
        isDraggingOver
          ? "ring-2 ring-gold-500/50 ring-offset-2 ring-offset-obsidian rounded-xl bg-gold-500/5"
          : ""
      }`}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="glass-gold rounded-xl px-4 py-2 text-sm text-gold-300 font-semibold shadow-lg shadow-gold/10">
            ✦ Drop to add
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
