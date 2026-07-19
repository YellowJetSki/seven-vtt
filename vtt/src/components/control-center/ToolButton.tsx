/**
 * STᚱ VTT — Tool Button (Premium Gold)
 *
 * Reusable toggle/tool button for the DM toolbar.
 * Supports active state with gold accent glow.
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
    "bg-obsidian-mid/50 border-surface-700/20 text-surface-400 hover:bg-gold-500/8 hover:text-gold-300 hover:border-gold/20",
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
    ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-sm shadow-gold-500/10"
    : variantStyles[variant] ?? variantStyles.default;

  return (
    <button className={`${baseStyle} ${activeStyle} ${className}`} title={tooltip} {...props}>
      {children}
    </button>
  );
}
