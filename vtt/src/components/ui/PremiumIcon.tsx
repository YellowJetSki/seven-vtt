/**
 * STᚱ VTT — Premium Icon Component
 *
 * Ultra-premium inline SVG icons for the DM popover headers,
 * condition badges, nav items, and interactive controls.
 * Every icon is designed to match the Overrrides/Lusion/Ventriloc-grade
 * glassmorphism design system with gold/amber/emerald accents.
 *
 * Usage:
 *   <PremiumIcon name="quickActions" className="w-8 h-8" />
 */

import type { SVGProps } from "react";

type IconName =
  | "quickActions"
  | "conditions"
  | "encounterComplete"
  | "restRecovery"
  | "npcs"
  | "battlemap"
  | "homebrew"
  | "journal"
  | "settings"
  | "player"
  | "rollInitiative"
  | "attack"
  | "aoe"
  | "share"
  | "hud"
  | "loot"
  | "search"
  | "close"
  | "chevronRight"
  | "chevronDown"
  | "check"
  | "plus"
  | "minus"
  | "edit"
  | "delete"
  | "copy"
  | "heart"
  | "shield"
  | "sword"
  | "sparkles";

interface PremiumIconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
}

function IconBase({ children, size = 24, ...props }: { children: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      {...props}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
}

export default function PremiumIcon({ name, size = 24, className = "", ...props }: PremiumIconProps) {
  const svgContent = ICON_MAP[name];

  if (!svgContent) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        width={size}
        height={size}
        className={className}
        {...props}
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      className={className}
      {...props}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// ─── Premium SVG Icon Paths ───────────────────────────────────
// Designed for 24×24 viewBox with 1.5px stroke weight.
// Gold theme: stroke="currentColor" allows CSS color control.

const ICON_MAP: Record<string, string> = {
  // ⚡ Quick Actions — Lightning bolt with arcane particles
  quickActions: `
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <circle cx="8" cy="16" r="1" fill="currentColor" opacity="0.4"/>
    <circle cx="16" cy="10" r="1" fill="currentColor" opacity="0.3"/>
    <circle cx="18" cy="18" r="0.8" fill="currentColor" opacity="0.2"/>
  `,

  // ⚔️ Conditions — Crossed swords with shield
  conditions: `
    <path d="M8 6L6 8l4 4-2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M16 6l2 2-4 4 2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M5 14h14v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <circle cx="12" cy="10" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
  `,

  // 🏆 Encounter Complete — Trophy with star
  encounterComplete: `
    <path d="M6 9h1a3 3 0 003-3V5a1 1 0 00-1-1H5a1 1 0 00-1 1v1a3 3 0 003 3z" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M18 9h-1a3 3 0 01-3-3V5a1 1 0 011-1h4a1 1 0 011 1v1a3 3 0 01-3 3z" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M12 15v3M10 21h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M8 12c0 2 1.5 4 4 4s4-2 4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M12 8l1 2 2.2.3-1.6 1.5.4 2.2L12 13l-2 1 .4-2.2-1.6-1.5L11 10l1-2z" fill="currentColor" opacity="0.3"/>
  `,

  // 😴 Rest & Recovery — Crescent moon with bed
  restRecovery: `
    <path d="M21 12.5A9 9 0 0111.5 3 9 9 0 0012 21a9 9 0 009-8.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M7 12h.01M10 10h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
    <path d="M3 15h7l-1 3H4l-1-3z" stroke="currentColor" stroke-width="1.5" fill="none"/>
  `,

  // 👹 NPC — Goblinoid silhouette  
  npcs: `
    <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M5 22c0-4 3-8 7-8s7 4 7 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M9 8l1-2 2-1 2 1 1 2" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none" opacity="0.6"/>
    <circle cx="10" cy="7" r="1" fill="currentColor" opacity="0.4"/>
    <circle cx="14" cy="7" r="1" fill="currentColor" opacity="0.4"/>
    <path d="M11 10a1 1 0 002 0" stroke="currentColor" stroke-width="1" stroke-linecap="round" fill="none"/>
  `,

  // 🗺️ Battlemap — Hex grid
  battlemap: `
    <path d="M12 3l7 4v8l-7 4-7-4V7l7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M12 7l4 2.5v5L12 17l-4-2.5v-5L12 7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none" opacity="0.5"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.3"/>
  `,

  // ⚒️ Homebrew — Anvil & hammer
  homebrew: `
    <path d="M7 10l-4 4 3 3 4-4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M10 7l4-4 3 3-4 4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M14 3l7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <rect x="6" y="14" width="12" height="3" rx="1" stroke="currentColor" stroke-width="1" fill="none" opacity="0.5"/>
  `,

  // 📜 Journal — Scroll
  journal: `
    <path d="M6 4h12v14a2 2 0 01-2 2H8a2 2 0 01-2-2V4z" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M6 4a2 2 0 012-2h8a2 2 0 012 2" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M9 8h6M9 12h6M9 16h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M8 2v2" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
    <path d="M16 2v2" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
  `,

  // ⚙️ Settings — Gear
  settings: `
    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5" fill="none"/>
  `,

  // 🧙 Player — Wizard hat silhouette
  player: `
    <path d="M12 3l7 4 1 5H4l1-5 7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M4 12h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M8 12v4l4 2 4-2v-4" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <circle cx="12" cy="7" r="1" fill="currentColor" opacity="0.5"/>
  `,

  // 🎲 Initiative — Dice d20
  rollInitiative: `
    <path d="M12 2l7 4v8l-7 4-7-4V6l7-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M12 6l2 3-2 3-2-3 2-3z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none" opacity="0.6"/>
    <text x="12" y="20" text-anchor="middle" font-size="5" font-weight="bold" fill="currentColor" opacity="0.4">20</text>
  `,

  // ⚔ Attack — Crossed swords
  attack: `
    <path d="M14.5 17.5L3 6l3-3 11.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M13.5 6.5L17 3l4 4-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M3 6l11.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
    <path d="M12 12l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
  `,

  // 💥 AoE — Explosion
  aoe: `
    <circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.3"/>
  `,

  // 📤 Share — Upload arrow
  share: `
    <path d="M12 3v12M8 7l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M4 13v4a2 2 0 002 2h12a2 2 0 002-2v-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <circle cx="12" cy="5" r="1" fill="currentColor" opacity="0.5"/>
  `,

  // 📊 HUD — Bars/chart
  hud: `
    <path d="M4 18V8M10 18V5M16 18v-6M20 18v-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M4 20h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  `,

  // 📦 Loot — Chest
  loot: `
    <path d="M5 8h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M5 8V6a2 2 0 012-2h10a2 2 0 012 2v2" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M12 12v4M10 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
    <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity="0.2"/>
  `,

  // 🔍 Search — Magnifying glass
  search: `
    <circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M15 15l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  `,

  // ✕ Close
  close: `
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // ❯ Chevron Right
  chevronRight: `
    <path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // ❯ Chevron Down
  chevronDown: `
    <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // ✓ Check
  check: `
    <path d="M5 12l5 5 9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // + Plus
  plus: `
    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
  `,

  // − Minus
  minus: `
    <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
  `,

  // ✏ Edit
  edit: `
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // 🗑 Delete — Trash
  delete: `
    <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  `,

  // 📋 Copy
  copy: `
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="1.5" fill="none"/>
  `,

  // ❤️ Heart (for HP/health)
  heart: `
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  `,

  // 🛡️ Shield (for AC/defense)
  shield: `
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.6"/>
  `,

  // ⚔️ Sword (for weapon attacks)  
  sword: `
    <path d="M14.5 17.5L3 6l3-3 11.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M13.5 6.5L17 3l4 4-3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
    <path d="M3 6l11.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
  `,

  // ✨ Sparkles (for magic/effects)
  sparkles: `
    <path d="M12 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" fill="currentColor" opacity="0.6"/>
    <path d="M19 8l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" fill="currentColor" opacity="0.4"/>
    <path d="M5 16l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1z" fill="currentColor" opacity="0.4"/>
    <path d="M8 5l1.5.5L10 7l.5-1.5L12 5l-1.5-.5L10 3l-.5 1.5L8 5z" fill="currentColor" opacity="0.3"/>
  `,
};

export { type IconName };
