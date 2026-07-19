/**
 * STᚱ VTT — Character Stat Badge
 *
 * Reusable premium stat emblem for the player sheet header and DM card.
 * Used for AC, Initiative, Speed, PB display.
 *
 * Gold-accented compact badge with:
 * - Tiny uppercase label
 * - Large tabular value
 * - Optional hover highlight
 * - Optional tap-to-expand behavior
 */

import { type ReactNode } from "react";

interface CharacterStatBadgeProps {
  label: string;
  value: string | number;
  variant?: "gold" | "default" | "amber" | "emerald" | "rose";
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

const VARIANT_STYLES = {
  gold: {
    container: "bg-gold-500/10 border-gold/20 cursor-default",
    label: "text-gold-500/60",
    value: "text-gold-200 drop-shadow-[0_0_6px_rgba(234,179,8,0.08)]",
  },
  default: {
    container: "bg-surface-800/40 border-surface-700/20",
    label: "text-gold-500/50",
    value: "text-surface-200",
  },
  amber: {
    container: "bg-amber-500/10 border-amber/20",
    label: "text-amber-400/60",
    value: "text-amber-300",
  },
  emerald: {
    container: "bg-emerald-500/8 border-emerald/15",
    label: "text-emerald-400/60",
    value: "text-emerald-300",
  },
  rose: {
    container: "bg-rose-500/8 border-rose/15",
    label: "text-rose-400/60",
    value: "text-rose-300",
  },
} as const;

export default function CharacterStatBadge({
  label,
  value,
  variant = "default",
  onClick,
  className = "",
  children,
}: CharacterStatBadgeProps) {
  const styles = VARIANT_STYLES[variant];
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === "Enter") onClick?.(); } : undefined}
      className={`flex flex-col items-center justify-center rounded-xl border py-2 transition-all duration-150 ${
        isClickable ? "cursor-pointer active:scale-95" : ""
      } ${styles.container} ${className}`}
    >
      <span className={`text-[8px] uppercase tracking-widest font-black ${styles.label}`}>
        {label}
      </span>
      <span className={`text-xl font-black tabular-nums leading-none mt-0.5 ${styles.value}`}>
        {value}
      </span>
      {children}
    </div>
  );
}
