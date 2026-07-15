import type { InputHTMLAttributes, ReactNode } from "react";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  onClear?: () => void;
  icon?: ReactNode;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  icon,
  placeholder = "Search...",
  ...props
}: SearchInputProps) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
          {icon}
        </span>
      )}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-surface-700 bg-surface-800 py-2 text-sm text-surface-100 placeholder:text-surface-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none ${
          icon ? "pl-9 pr-9" : "px-3"
        }`}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-surface-500 hover:bg-surface-700 hover:text-surface-300"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
