import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-surface-400"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none ${
          error ? "border-warrior-500" : "border-surface-700"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-warrior-400">{error}</p>}
    </div>
  );
}
