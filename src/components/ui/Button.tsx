import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
}

const VARIANTS = {
  primary:
    "bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 shadow-sm",
  secondary:
    "bg-surface-700 text-surface-200 hover:bg-surface-600 active:bg-surface-500 border border-surface-600",
  ghost:
    "text-surface-400 hover:bg-surface-800 hover:text-surface-200",
  danger:
    "bg-warrior-500/10 text-warrior-400 border border-warrior-500/30 hover:bg-warrior-500/20",
};

const SIZES = {
  xs: "px-2 py-1 text-[11px] rounded-md gap-1",
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-base rounded-lg gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  isLoading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all focus-visible:outline-2 focus-visible:outline-accent-500 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
