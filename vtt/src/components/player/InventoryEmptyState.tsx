/**
 * STᚱ VTT — InventoryEmptyState
 *
 * Contextual empty state for the inventory list. Shows different
 * messages depending on whether filters are active or the inventory
 * is genuinely empty.
 *
 * Extracted from PlayerSheetInventoryTab.tsx monolith (Sprint 8 refactor).
 */

interface InventoryEmptyStateProps {
  showEquippedOnly: boolean;
  categoryFilter: string;
  searchQuery: string;
  onAddItem: () => void;
}

export default function InventoryEmptyState({
  showEquippedOnly,
  categoryFilter,
  searchQuery,
  onAddItem,
}: InventoryEmptyStateProps) {
  const message = showEquippedOnly
    ? "No items equipped"
    : categoryFilter !== "all"
      ? "No items match this filter"
      : searchQuery
        ? "No items match your search"
        : "No items in inventory";

  return (
    <div className="text-center py-6">
      <p className="text-surface-500 text-xs">{message}</p>
      {!showEquippedOnly && categoryFilter === "all" && !searchQuery && (
        <button
          onClick={onAddItem}
          className="mt-2 px-3 py-1.5 rounded-lg text-[10px] bg-gold-500/8 border border-gold/10 text-gold-500/70 hover:bg-gold-500/15 active:scale-95 transition-all"
        >
          + Add your first item
        </button>
      )}
    </div>
  );
}
