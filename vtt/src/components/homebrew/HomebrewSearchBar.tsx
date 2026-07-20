/**
 * STᚱ VTT — Homebrew Search Bar (Premium Glass v3.1)
 *
 * Enhanced with gold gradient buttons, staggered entrance animations,
 * premium hover scale transitions, and consistent gold focus states.
 */

import { Search, Plus, Download, Upload, Trash2, Users } from "lucide-react";

interface HomebrewSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  placeholder?: string;
  bulkDeleteCount?: number;
  onBulkDelete?: () => void;
  isBulkMode?: boolean;
  onToggleBulkMode?: () => void;
}

export default function HomebrewSearchBar({
  search,
  onSearchChange,
  onAdd,
  onExport,
  onImport,
  placeholder = "Search...",
  bulkDeleteCount = 0,
  onBulkDelete,
  isBulkMode,
  onToggleBulkMode,
}: HomebrewSearchBarProps) {
  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onImport(file);
    };
    input.click();
  };

  return (
    <div
      className="space-y-2 mb-4"
      style={{ animation: "slide-in-up 0.35s ease-out 0.1s both" }}
    >
      {/* ── Search row ── */}
      <div className="flex items-center gap-2">
        {/* Premium search input */}
        <div className="relative flex-1 group/search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500 group-focus-within/search:text-gold-400/60 transition-colors duration-200" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 placeholder:text-surface-600 transition-all duration-200"
          />
        </div>

        {/* Add button */}
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 text-xs font-semibold active:scale-95 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 transition-all duration-150"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="p-2.5 rounded-xl text-surface-400 hover:text-gold-400 hover:bg-gold-500/10 border border-transparent hover:border-gold-500/20 active:scale-90 transition-all duration-150"
          title="Export all homebrew as JSON"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Import */}
        <button
          onClick={handleImportClick}
          className="p-2.5 rounded-xl text-surface-400 hover:text-gold-400 hover:bg-gold-500/10 border border-transparent hover:border-gold-500/20 active:scale-90 transition-all duration-150"
          title="Import homebrew from JSON"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Bulk mode toggle */}
        <button
          onClick={onToggleBulkMode}
          className={`p-2.5 rounded-xl border active:scale-90 transition-all duration-150 ${
            isBulkMode
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "text-surface-400 hover:text-gold-400 hover:bg-gold-500/10 border-transparent hover:border-gold-500/20"
          }`}
          title={isBulkMode ? "Exit bulk mode" : "Select multiple items"}
        >
          <Users className="w-4 h-4" />
        </button>
      </div>

      {/* ── Bulk delete toolbar ── */}
      {isBulkMode && bulkDeleteCount > 0 && (
        <div
          className="flex items-center justify-between bg-gradient-to-b from-red-950/50 to-red-950/30 border border-red-500/15 rounded-xl px-4 py-2 animate-in slide-in-from-top-1 duration-200"
          style={{ animation: "slide-in-up 0.25s ease-out both" }}
        >
          <span className="text-xs text-red-300 font-medium tabular-nums">{bulkDeleteCount} selected</span>
          <div className="flex items-center gap-2">
            {onToggleBulkMode && (
              <button
                onClick={onToggleBulkMode}
                className="text-[10px] text-surface-400 hover:text-surface-200 transition-colors px-2 py-1"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold active:scale-95 hover:bg-red-500/25 transition-all duration-150"
            >
              <Trash2 className="w-3 h-3" />
              Delete {bulkDeleteCount > 1 ? `all ${bulkDeleteCount}` : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
