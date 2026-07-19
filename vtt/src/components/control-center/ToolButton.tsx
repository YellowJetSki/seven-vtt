/**
 * STᚱ VTT — Tool Button (Premium Floating Glass)
 *
 * Reusable toggle/tool button for the floating DM toolbar.
 * Active: gold glow with subtle shadow.
 * Default: glass-dark with hover gold glow.
 * Variants: fog (emerald/cyan), dm (amber/orange).
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
    "text-surface-400 hover:text-gold-300 hover:border-gold-500/15 hover:bg-gold-500/6",
  fog:
    "text-surface-400 hover:text-emerald-300 hover:border-emerald-500/15 hover:bg-emerald-500/6",
  dm:
    "text-surface-400 hover:text-amber-300 hover:border-amber-500/15 hover:bg-amber-500/6",
};

const activeVariantStyles: Record<string, string> = {
  default:
    "bg-gold-500/10 border-gold-500/25 text-gold-400 shadow-[0_0_10px_rgba(234,179,8,0.06)]",
  fog:
    "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.06)]",
  dm:
    "bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.06)]",
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
    "px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200 border border-white/[0.04] bg-[#0c0d15]/60 backdrop-blur-sm";

  const stateStyle = active
    ? activeVariantStyles[variant] ?? activeVariantStyles.default
    : variantStyles[variant] ?? variantStyles.default;

  return (
    <button
      className={`${baseStyle} ${stateStyle} ${className}`}
      title={tooltip}
      {...props}
    >
      {children}
    </button>
  );
}
