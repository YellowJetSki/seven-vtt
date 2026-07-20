/**
 * STᚱ VTT — Compendium Drop Target (Premium Lusion Edition v3)
 *
 * Reusable drop zone wrapper for character sheet sections.
 * When a CompendiumCard is dragged over, it glows gold with a
 * premium "Drop to add" indicator.
 *
 * Features:
 * - Gold ring glow on drag-over with offset rings
 * - Floating glass "Drop to add" label with backdrop-blur
 * - Smooth transitions with 200ms easing
 * - Edge light accent on active state
 * - Consistent glass gradient with design system
 * - Lusion-grade ambient glow on active state
 */

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
    if (!isDraggingOver) setIsDraggingOver(true);
  }, [isDraggingOver]);

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
      className={`relative transition-all duration-200 rounded-xl ${
        isDraggingOver
          ? "ring-2 ring-gold-500/50 ring-offset-2 ring-offset-obsidian bg-gold-500/5 shadow-[0_0_40px_rgba(234,179,8,0.06)]"
          : ""
      }`}
    >
      {/* Edge light active state */}
      {isDraggingOver && (
        <>
          <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent z-10" />
          <div className="absolute bottom-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent z-10" />
          <div className="absolute left-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-gold-500/20 to-transparent z-10" />
          <div className="absolute right-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-gold-500/20 to-transparent z-10" />
        </>
      )}

      {isDraggingOver && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-xl px-5 py-2.5 text-sm font-semibold shadow-xl border backdrop-blur-xl bg-gradient-to-b from-gold-500/10 to-amber-500/5 border-gold/20 text-gold-300"
            style={{ boxShadow: "0 8px 32px rgba(234,179,8,0.12)" }}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">✦</span>
              Drop to add
              <span className="text-base">✦</span>
            </span>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
