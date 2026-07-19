/**
 * STᚱ VTT — Homebrew Search Bar
 *
 * Search input with add button for the Homebrew Manager.
 */

import { Search, Plus } from "lucide-react";

interface HomebrewSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  placeholder?: string;
}

export default function HomebrewSearchBar({
  search,
  onSearchChange,
  onAdd,
  placeholder = "Search...",
}: HomebrewSearchBarProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="input-arcane w-full pl-9 pr-4 py-2 text-xs"
        />
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold-500/10 border border-gold/25 text-gold-400 text-xs font-semibold active:scale-95 transition-all duration-200 hover:bg-gold-500/15"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add</span>
      </button>
    </div>
  );
}
