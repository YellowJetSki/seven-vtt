/* ── Combatant Drag-and-Drop Sort ──────────────────────────────
 * A lightweight, accessible drag-and-drop reorder component
 * for combatant initiative lists. Uses native HTML5 DnD API
 * (no external library dependency).
 *
 * ── Props ────────────────────────────────────────────────────
 * reorderCombatants: (combatantIds: string[]) => void
 *   Called when a drag ends with the IDs in the new order
 *   Parent should call useCombatStore.getState().reorderCombatants()
 *
 * ── Usage ────────────────────────────────────────────────────
 *   <CombatantDragSort reorderCombatants={(ids) => reorder(ids)}>
 *     {combatants.map(c => <CombatantRow key={c.id} ... />)}
 *   </CombatantDragSort>
 * ─────────────────────────────────────────────────────────────── */

import { useState, useRef, useCallback, type ReactNode, type DragEvent, type KeyboardEvent } from "react";

interface DragSortProps {
  children: ReactNode[];
  reorderCombatants: (combatantIds: string[]) => void;
  /** Optional class for the container */
  className?: string;
}

export function CombatantDragSort({ children, reorderCombatants, className }: DragSortProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract combatant IDs from the children key props
  const ids = children.map((child) => {
    if (typeof child === "object" && child !== null && "key" in child) {
      return child.key as string;
    }
    return "";
  });

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      // Slight delay for visual feedback
      requestAnimationFrame(() => {
        (e.target as HTMLElement).classList.add("opacity-40");
      });
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragIndex !== null && dragIndex !== index) {
        setOverIndex(index);
      }
    },
    [dragIndex],
  );

  const handleDragEnd = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      (e.target as HTMLElement).classList.remove("opacity-40");
      if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
        const newIds = [...ids];
        const [moved] = newIds.splice(dragIndex, 1);
        newIds.splice(overIndex, 0, moved);
        reorderCombatants(newIds);
      }
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, overIndex, ids, reorderCombatants],
  );

  const handleDragLeave = useCallback(() => {
    setOverIndex(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>, index: number) => {
      const validIds = ids.filter(Boolean);
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        const newIds = [...validIds];
        const [moved] = newIds.splice(index, 1);
        newIds.splice(index - 1, 0, moved);
        reorderCombatants(newIds);
      } else if (e.key === "ArrowDown" && index < validIds.length - 1) {
        e.preventDefault();
        const newIds = [...validIds];
        const [moved] = newIds.splice(index, 1);
        newIds.splice(index + 1, 0, moved);
        reorderCombatants(newIds);
      }
    },
    [ids, reorderCombatants],
  );

  // Filter out falsy IDs (empty keys)
  const validIds = ids.filter(Boolean);

  return (
    <div ref={containerRef} className={className}>
      {children.map((child, index) => {
        // Skip rendering if no valid id
        if (!validIds[index]) return child;

        const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;

        return (
          <div
            key={validIds[index]}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            onDragLeave={handleDragLeave}
            onKeyDown={(e) => handleKeyDown(e, index)}
            tabIndex={0}
            role="button"
            aria-roledescription="sortable combatant. Press arrow up or down to reorder"
            className={`relative transition-all duration-150 ${
              isOver
                ? "scale-[1.02] ring-2 ring-accent-400 ring-offset-2 ring-offset-surface-850 rounded-xl"
                : ""
            } ${dragIndex === index ? "cursor-grabbing" : "cursor-grab"}`}
          >
            {/* Drag handle indicator */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-surface-500 text-xs select-none">⠿</span>
            </div>
            {child}
          </div>
        );
      })}
    </div>
  );
}
