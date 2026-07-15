import type { ReactNode } from "react";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "xs" | "sm";
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-surface-700 text-surface-300",
  accent: "bg-accent-500/15 text-accent-400",
  success: "bg-rogue-500/15 text-rogue-400",
  warning: "bg-divine-500/15 text-divine-400",
  danger: "bg-warrior-500/15 text-warrior-400",
  info: "bg-mage-500/15 text-mage-400",
  neutral: "bg-surface-800 text-surface-400",
};

const SIZE_CLASSES = {
  xs: "px-1.5 py-0.5 text-[10px]",
  sm: "px-2 py-0.5 text-[11px]",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium leading-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </span>
  );
}
