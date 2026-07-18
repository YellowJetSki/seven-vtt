/* ══════════════════════════════════════════════════════════════
   Character Theme System — Per-class color themes
   Inspired by pedal-sheet's THEMES object
   ══════════════════════════════════════════════════════════════ */

export type CharacterThemeId = "indigo" | "emerald" | "rose" | "amber" | "sky";

export interface CharacterTheme {
  id: CharacterThemeId;
  accent: string;       // tailwind text color e.g. "text-indigo-400"
  bg: string;           // tailwind bg color e.g. "bg-indigo-600"
  hoverBg: string;      // e.g. "hover:bg-indigo-600"
  border: string;       // e.g. "border-indigo-500/50"
  ring: string;         // e.g. "ring-indigo-500"
  shadow: string;       // e.g. "shadow-[0_0_15px_rgba(99,102,241,0.5)]"
  bgAccent: string;     // e.g. "bg-indigo-500/10"
  hexAccent: string;    // hex color for inline styles: "#818cf8"
  hexBg: string;        // hex button bg for inline styles: "#6366f1"
}

export const THEMES: Record<CharacterThemeId, CharacterTheme> = {
  indigo: {
    id: "indigo",
    accent: "text-indigo-400",
    bg: "bg-indigo-600",
    hoverBg: "hover:bg-indigo-600",
    border: "border-indigo-500/50",
    ring: "ring-indigo-500",
    shadow: "shadow-[0_0_15px_rgba(99,102,241,0.5)]",
    bgAccent: "bg-indigo-500/10",
    hexAccent: "#818cf8",
    hexBg: "#6366f1",
  },
  emerald: {
    id: "emerald",
    accent: "text-emerald-400",
    bg: "bg-emerald-600",
    hoverBg: "hover:bg-emerald-600",
    border: "border-emerald-500/50",
    ring: "ring-emerald-500",
    shadow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    bgAccent: "bg-emerald-500/10",
    hexAccent: "#34d399",
    hexBg: "#059669",
  },
  rose: {
    id: "rose",
    accent: "text-rose-400",
    bg: "bg-rose-600",
    hoverBg: "hover:bg-rose-600",
    border: "border-rose-500/50",
    ring: "ring-rose-500",
    shadow: "shadow-[0_0_15px_rgba(244,63,94,0.5)]",
    bgAccent: "bg-rose-500/10",
    hexAccent: "#fb7185",
    hexBg: "#e11d48",
  },
  amber: {
    id: "amber",
    accent: "text-amber-400",
    bg: "bg-amber-600",
    hoverBg: "hover:bg-amber-600",
    border: "border-amber-500/50",
    ring: "ring-amber-500",
    shadow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
    bgAccent: "bg-amber-500/10",
    hexAccent: "#fbbf24",
    hexBg: "#d97706",
  },
  sky: {
    id: "sky",
    accent: "text-sky-400",
    bg: "bg-sky-600",
    hoverBg: "hover:bg-sky-600",
    border: "border-sky-500/50",
    ring: "ring-sky-500",
    shadow: "shadow-[0_0_15px_rgba(14,165,233,0.5)]",
    bgAccent: "bg-sky-500/10",
    hexAccent: "#38bdf8",
    hexBg: "#0284c7",
  },
};

/** Maps a character class name to a theme ID */
const CLASS_THEME_MAP: Record<string, CharacterThemeId> = {
  barbarian: "rose",
  bard: "amber",
  cleric: "indigo",
  druid: "emerald",
  fighter: "rose",
  monk: "sky",
  paladin: "amber",
  ranger: "emerald",
  rogue: "sky",
  sorcerer: "indigo",
  warlock: "indigo",
  wizard: "indigo",
};

/** Resolves the theme for a character based on their class */
export function getThemeForClass(className: string): CharacterTheme {
  const key = className?.toLowerCase().trim() || "";
  const themeId = CLASS_THEME_MAP[key] || "indigo";
  return THEMES[themeId];
}
