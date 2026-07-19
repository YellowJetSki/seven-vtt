/**
 * STᚱ VTT — Quick Nav (DM War Room — Premium Refactor)
 *
 * Purpose-built DM navigation tiles for at-a-glance access.
 * Each tile has icon, label, description, and keyboard shortcut.
 * Staggered entrance animation. Premium gold glass styling.
 *
 * Navigation items ordered by DM workflow priority:
 * Battle Maps → Player Cards → Encounters → Homebrew → Journal → Theatric
 *
 * Sprint 2: Staggered entrance, premium hover glow, adjusted accent colors
 * to use gold/amber/emerald/rose/sky (no purple/violet tokens).
 */

import { useNavigate } from "react-router-dom";

interface NavTile {
  icon: string;
  label: string;
  description: string;
  path: string;
  shortcut?: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

const NAV_TILES: NavTile[] = [
  {
    icon: "🗺",
    label: "Battle Maps",
    description: "DM control center with tokens, fog, and initiative",
    path: "/campaign/battle-maps",
    shortcut: "B",
    accentBg: "hover:bg-gold-500/5",
    accentBorder: "hover:border-gold-500/20",
    accentText: "hover:text-gold-400",
  },
  {
    icon: "👥",
    label: "Player Cards",
    description: "Character sheets, HP, stats, and conditions",
    path: "/campaign/player-cards",
    shortcut: "P",
    accentBg: "hover:bg-emerald-500/5",
    accentBorder: "hover:border-emerald-500/20",
    accentText: "hover:text-emerald-400",
  },
  {
    icon: "⚔",
    label: "Encounters",
    description: "Build and manage combat encounters",
    path: "/campaign/encounters",
    shortcut: "E",
    accentBg: "hover:bg-amber-500/5",
    accentBorder: "hover:border-amber-500/20",
    accentText: "hover:text-amber-400",
  },
  {
    icon: "⚗️",
    label: "Homebrew",
    description: "Items, spells, and feats creator",
    path: "/campaign/homebrew",
    shortcut: "H",
    accentBg: "hover:bg-amber-500/5",
    accentBorder: "hover:border-amber-500/20",
    accentText: "hover:text-amber-400",
  },
  {
    icon: "📖",
    label: "Journal",
    description: "Session notes, lore, and quest tracking",
    path: "/campaign/journal",
    shortcut: "J",
    accentBg: "hover:bg-sky-500/5",
    accentBorder: "hover:border-sky-500/20",
    accentText: "hover:text-sky-400",
  },
  {
    icon: "🖥",
    label: "Theatric Display",
    description: "Player-facing cinematic map view",
    path: "/campaign/theatric",
    shortcut: "T",
    accentBg: "hover:bg-gold-500/5",
    accentBorder: "hover:border-gold-500/20",
    accentText: "hover:text-gold-400",
  },
];

export default function QuickNav() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
            Quick Navigation
          </span>
        </div>
      </div>

      {/* Nav grid — 6 tiles */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {NAV_TILES.map((tile, idx) => (
            <button
              key={tile.path}
              onClick={() => navigate(tile.path)}
              className={`
                flex items-start gap-2.5 p-3 rounded-xl text-left
                bg-[#0c0d15] border border-white/[0.04]
                ${tile.accentBorder} ${tile.accentBg}
                transition-all duration-200 active:scale-[0.98] group
                animate-in fade-in slide-in-from-bottom-2
              `}
              style={{ animationDuration: '300ms', animationDelay: `${idx * 50}ms` }}
            >
              <span className="text-base mt-0.5">{tile.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold text-white/70 group-hover:text-white/90 transition-colors truncate ${tile.accentText}`}>
                    {tile.label}
                  </p>
                  {tile.shortcut && (
                    <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-white/[0.04] text-surface-600 group-hover:text-surface-500 transition-colors shrink-0">
                      {tile.shortcut}
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-surface-500 mt-0.5 leading-relaxed line-clamp-2">
                  {tile.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
