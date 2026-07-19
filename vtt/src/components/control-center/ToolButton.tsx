/**
 * STᚱ VTT — Tool Button
 *
 * Reusable toggle/tool button for the DM toolbar.
 * Supports active state, custom styling, and optional dimension props.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "default" | "fog" | "dm";
  children: ReactNode;
  tooltip?: string;
}

const variantStyles: Record<string, string> = {
  default:
    "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40 hover:text-surface-200 hover:border-surface-600/30",
  fog: "bg-mage-600/20 border-mage-500/30 text-mage-300",
  dm: "bg-warrior-600/20 border-warrior-500/30 text-warrior-300",
};

export default function ToolButton({
  active = false,
  variant = "default",
  children,
  tooltip,
  className = "",
  ...props
}: ToolButtonProps) {
  const baseStyle =
    "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border";

  const activeStyle = active
    ? "bg-accent-600/20 border-accent-500/30 text-accent-300 shadow-sm shadow-accent-500/10"
    : variantStyles[variant] ?? variantStyles.default;

  return (
    <button
      className={`${baseStyle} ${activeStyle} ${className}`}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
}
