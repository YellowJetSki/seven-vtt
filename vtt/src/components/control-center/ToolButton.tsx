/**
 * STᚱ VTT — Tool Button (Premium Gold - Enhanced)
 *
 * Reusable toggle/tool button for the DM toolbar.
 * Active state: gold glow with shadow and border.
 * Default: subtle hover with gold tint.
 * Variants: fog (mage-purple), dm (warrior-orange).
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
    "bg-obsidian-mid/50 border-surface-700/20 text-surface-400 hover:bg-gold-500/8 hover:text-gold-300 hover:border-gold/20 hover:shadow-[0_0_8px_rgba(234,179,8,0.04)]",
  fog: "bg-mage-600/20 border-mage-500/30 text-mage-300 hover:bg-mage-500/25 hover:border-mage-400/40",
  dm: "bg-warrior-600/20 border-warrior-500/30 text-warrior-300 hover:bg-warrior-500/25 hover:border-warrior-400/40",
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
    "px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border";

  const activeStyle = active
    ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_10px_rgba(234,179,8,0.08)]"
    : variantStyles[variant] ?? variantStyles.default;

  return (
    <button className={`${baseStyle} ${activeStyle} ${className}`} title={tooltip} {...props}>
      {children}
    </button>
  );
}
