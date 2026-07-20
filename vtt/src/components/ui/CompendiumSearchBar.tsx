/**
 * STᚱ VTT — CompendiumSearchBar (Premium)
 *
 * Premium search bar with:
 * - Focus state: gold border glow + subtle scale
 * - Animated placeholder that shifts up on focus
 * - Clear button with fade-in animation
 * - Search icon that shifts to gold on focus
 */

import { useRef, useState } from "react";

interface CompendiumSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function CompendiumSearchBar({
  value,
  onChange,
  placeholder = "Search items, spells, feats..."
}: CompendiumSearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`relative transition-all duration-200 ${
        focused ? "scale-[1.01]" : ""
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Search icon */}
      <svg
        className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-all duration-200 z-10 ${
          focused ? "text-gold-400" : "text-surface-500"
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-8 py-2.5 text-sm rounded-xl
          bg-white/[0.03] border text-white placeholder-surface-600
          transition-all duration-200 outline-none
          ${
            focused
              ? "border-gold-500/35 bg-white/[0.05] shadow-[0_0_0_1px_rgba(234,179,8,0.12),0_0_24px_rgba(234,179,8,0.03)]"
              : "border-white/[0.06] hover:border-white/[0.10]"
          }`}
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md
            text-surface-500 hover:text-surface-200 hover:bg-white/[0.04]
            transition-all duration-200 animate-slide-in-from-right"
          aria-label="Clear search"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
