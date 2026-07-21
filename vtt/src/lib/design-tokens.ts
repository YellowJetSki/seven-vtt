/**
 * STᚱ VTT — Global Design Tokens (Overrrides/Lusion-Grade)
 *
 * Programmatic access to the @theme CSS custom properties defined in index.css.
 * Use these values in component logic, imperative animations, and JSX inline styles
 * to remain consistent with the premium design system.
 *
 * All values sync with the `--*` custom properties in @theme. Update both together.
 */

// ── Easing Functions ──
export const ease = {
  premium: "cubic-bezier(0.16, 1, 0.3, 1)" as const,
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)" as const,
  glass: "cubic-bezier(0.22, 1, 0.36, 1)" as const,
  out: "ease-out" as const,
  inOut: "ease-in-out" as const,
} as const;

// ── Duration Tokens ──
export const duration = {
  instant: 100,
  fast: 150,
  normal: 200,
  slow: 300,
  entrance: 350,
  glass: 400,
} as const satisfies Record<string, number>;

// ── Spacing Tokens ──
export const spacing = {
  section: "1.5rem",
  cardGap: "0.75rem",
  panelInset: "1.25rem",
  elementGap: "0.5rem",
  iconBox: "2rem",
} as const;

// ── Radius Tokens ──
export const radius = {
  card: "1rem",
  panel: "0.75rem",
  button: "0.625rem",
  pill: "9999px",
  icon: "0.5rem",
} as const;

// ── Shadow Tokens ──
export const shadows = {
  glassSm: "0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.03) inset",
  glass: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02) inset",
  glassLg: "0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.02) inset",
  glowGold: "0 0 12px rgba(234,179,8,0.08), 0 0 0 1px rgba(234,179,8,0.06) inset",
  glowAmber: "0 0 12px rgba(245,158,11,0.08), 0 0 0 1px rgba(245,158,11,0.06) inset",
  glowEmerald: "0 0 12px rgba(34,197,94,0.08), 0 0 0 1px rgba(34,197,94,0.06) inset",
  glowRose: "0 0 12px rgba(244,63,94,0.08), 0 0 0 1px rgba(244,63,94,0.06) inset",
  cardHover: "0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,215,0,0.03) inset",
} as const;

// ── Gold Opacity Presets ──
export const gold = {
  glow: "rgba(234,179,8,0.08)",
  border: "rgba(234,179,8,0.25)",
  fill: "rgba(234,179,8,0.1)",
  edge: "rgba(234,179,8,0.15)",
  surface: "rgba(234,179,8,0.04)",
} as const;

// ── Glass Gradient Presets ──
export const glass = {
  card: "from-[#14151f]/90 to-[#0f1019]/95" as const,
  cardHover: "from-[#14151f]/95 to-[#0f1019]/98" as const,
  panel: "from-[#141520]/80 to-[#0f1019]/85" as const,
  modal: "from-[#181a2a]/95 to-[#0f1019]/95" as const,
  toolbar: "from-[#14151f]/[0.85] to-[#0f1019]/[0.90]" as const,
  input: "bg-[#07080d]/70" as const,
  surfaceLight: "from-white/[0.03] to-transparent" as const,
} as const;

// ── Gold Edge Light pattern (returns full className) ──
export const goldEdgeLight = "absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent";
export const goldEdgeLightBottom = "absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/[0.08] to-transparent";

// ── Corner Ornaments pattern ──
export const goldCorner = (position: "top-left" | "top-right" | "bottom-left" | "bottom-right"): string => {
  const map = {
    "top-left": "top-0 left-0 border-l border-t rounded-tl",
    "top-right": "top-0 right-0 border-r border-t rounded-tr",
    "bottom-left": "bottom-0 left-0 border-l border-b rounded-bl",
    "bottom-right": "bottom-0 right-0 border-r border-b rounded-br",
  };
  return `absolute ${map[position]} w-3 h-3 border-gold-500/20 pointer-events-none`;
};

// ── Staggered Entrance Animation Helper ──
/**
 * Returns inline animation style for a staggered entrance.
 * Usage: <div style={staggerEntrance(index, 50)}>...</div>
 */
export const staggerEntrance = (index: number, baseDelay: number = 50): React.CSSProperties => ({
  animation: `slide-in-up ${duration.entrance}ms cubic-bezier(0.16,1,0.3,1) ${baseDelay + index * 50}ms forwards`,
  opacity: 0,
});

/**
 * Base entrance with custom delay.
 */
export const entrance = (delay: number = 0): React.CSSProperties => ({
  animation: `slide-in-up ${duration.entrance}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms forwards`,
  opacity: 0,
});

// ── Premium Glass Gradient Helper ──
/**
 * Returns the full className string for a glass card with top edge light.
 */
export const glassCardWithEdge = (variant: keyof typeof glass = "card"): string =>
  `relative bg-gradient-to-b ${glass[variant]} border border-white/[0.06] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.02)_inset] overflow-hidden`;

// ── Button Variant Tokens ──
export const buttonVariant = {
  gold: "bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all",
  emerald: "bg-gradient-to-br from-emerald-500/12 to-green-500/8 border border-emerald-500/20 text-emerald-400 hover:from-emerald-500/20 hover:to-green-500/12 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all",
  rose: "bg-gradient-to-br from-rose-500/12 to-red-500/8 border border-rose-500/20 text-rose-400 hover:from-rose-500/20 hover:to-red-500/12 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all",
  danger: "bg-gradient-to-br from-red-500/15 to-rose-500/10 border border-red-500/25 text-red-400 hover:from-red-500/25 hover:to-rose-500/15 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all",
  ghost: "bg-white/[0.02] border border-white/[0.04] text-surface-400 hover:text-surface-200 hover:border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all",
} as const;

// ── Focus Ring Tokens ──
export const focusRingGold = "focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15";
export const focusRingAmber = "focus:outline-none focus:border-amber-500/25 focus:ring-1 focus:ring-amber-500/15";
