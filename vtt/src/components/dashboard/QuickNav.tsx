/**
 * STᚱ VTT — Quick Nav (Overrrides-Grade Premium Tile Grid)
 *
 * Premium DM navigation tiles with architectural depth:
 * - Each tile has a 3-layer glass composition (bg → glow pocket → border)
 * - Hover: elevation lift, directional glow sweep, icon scale
 * - Press: active scale feedback
 * - Staggered entrance with slide-in-up
 * - Per-tile accent colors (gold/emerald/amber/sky/rose)
 * - Keyboard shortcut badges in precision-mono
 *
 * Inspired by Overrrides' spatial card design and Spotify's
 * playlist tile grid with hover depth transitions.
 */

import { useNavigate } from "react-router-dom";

interface NavTile {
  icon: string;
  label: string;
  description: string;
  path: string;
  shortcut?: string;
  /** Main accent color class */
  accent: string;
  /** Glow color for hover shadow */
  glow: string;
}

const NAV_TILES: NavTile[] = [
  {
    icon: "🗺",
    label: "Battle Maps",
    description: "DM control center with tokens, fog, and initiative",
    path: "/campaign/battle-maps",
    shortcut: "B",
    accent: "gold",
    glow: "rgba(234,179,8,0.06)",
  },
  {
    icon: "👥",
    label: "Player Cards",
    description: "Character sheets, HP, stats, and conditions",
    path: "/campaign/player-cards",
    shortcut: "P",
    accent: "emerald",
    glow: "rgba(52,211,153,0.06)",
  },
  {
    icon: "⚔",
    label: "Encounters",
    description: "Build and manage combat encounters",
    path: "/campaign/encounters",
    shortcut: "E",
    accent: "amber",
    glow: "rgba(251,191,36,0.06)",
  },
  {
    icon: "⚗️",
    label: "Homebrew",
    description: "Items, spells, and feats creator",
    path: "/campaign/homebrew",
    shortcut: "H",
    accent: "amber",
    glow: "rgba(251,191,36,0.06)",
  },
  {
    icon: "📖",
    label: "Journal",
    description: "Session notes, lore, and quest tracking",
    path: "/campaign/journal",
    shortcut: "J",
    accent: "sky",
    glow: "rgba(56,189,248,0.06)",
  },
  {
    icon: "🖥",
    label: "Theatric Display",
    description: "Player-facing cinematic map view",
    path: "/campaign/theatric",
    shortcut: "T",
    accent: "gold",
    glow: "rgba(234,179,8,0.06)",
  },
];

const ACCENT_CLASSES: Record<string, { text: string; border: string; bg: string }> = {
  gold: {
    text: "group-hover/tile:text-gold-400",
    border: "group-hover/tile:border-gold-500/20",
    bg: "group-hover/tile:bg-gold-500/[0.03]",
  },
  emerald: {
    text: "group-hover/tile:text-emerald-400",
    border: "group-hover/tile:border-emerald-500/20",
    bg: "group-hover/tile:bg-emerald-500/[0.03]",
  },
  amber: {
    text: "group-hover/tile:text-amber-400",
    border: "group-hover/tile:border-amber-500/20",
    bg: "group-hover/tile:bg-amber-500/[0.03]",
  },
  sky: {
    text: "group-hover/tile:text-sky-400",
    border: "group-hover/tile:border-sky-500/20",
    bg: "group-hover/tile:bg-sky-500/[0.03]",
  },
};

export default function QuickNav() {
  const navigate = useNavigate();

  return (
    <div className="relative group/panel">
      {/* Glass gradient background */}
      <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              Quick Navigation
            </span>
          </div>
          <span className="text-[9px] text-surface-600 font-mono">
            {NAV_TILES.length} shortcuts
          </span>
        </div>

        {/* Nav grid — 6 premium tiles */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {NAV_TILES.map((tile, idx) => {
              const classes = ACCENT_CLASSES[tile.accent] || ACCENT_CLASSES.gold;

              return (
                <button
                  key={tile.path}
                  onClick={() => navigate(tile.path)}
                  className={`
                    group/tile relative flex items-start gap-2.5 p-3 rounded-xl text-left
                    bg-[#0c0d15] border border-white/[0.04] overflow-hidden
                    transition-all duration-200 ease-out
                    hover:-translate-y-0.5 hover:shadow-[0_4px_16px_${tile.glow}]
                    active:scale-[0.97]
                    ${classes.border} ${classes.bg}
                  `}
                  style={{
                    animation: `slideInUp 0.3s ease-out ${idx * 50}ms both`,
                  }}
                >
                  {/* Directional hover glow sweep */}
                  <div className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent ${classes.bg.replace("group-hover/tile:", "")} opacity-0 group-hover/tile:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                  {/* Top edge light on hover */}
                  <div className={`absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover/tile:via-white/[0.03] transition-all duration-300`} />

                  {/* Icon */}
                  <span className="relative z-10 text-base mt-0.5 transition-transform duration-200 group-hover/tile:scale-110">
                    {tile.icon}
                  </span>

                  {/* Text content */}
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-bold text-white/70 transition-colors truncate ${classes.text}`}>
                        {tile.label}
                      </p>
                      {tile.shortcut && (
                        <span className="text-[8px] font-mono tracking-wide px-1 py-0.5 rounded bg-white/[0.04] text-surface-600 border border-white/[0.03] shrink-0">
                          {tile.shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-surface-500 mt-0.5 leading-relaxed line-clamp-2">
                      {tile.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
