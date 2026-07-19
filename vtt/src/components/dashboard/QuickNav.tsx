/**
 * STᚱ VTT — Quick Nav (DM War Room)
 *
 * Purpose-built DM navigation tiles replacing the generic QuickActions.
 * Each tile is larger, shows descriptive text, and includes
 * a keyboard-hint for power users.
 *
 * Navigation items are ordered by DM workflow priority:
 * 1. Battle Maps (combat)
 * 2. Player Cards (party management)
 * 3. Encounters (encounter prep)
 * 4. Homebrew (content creation)
 * 5. Journal (session notes)
 * 6. Theatric Display (player-facing)
 */

import { useNavigate } from "react-router-dom";

interface NavTile {
  icon: string;
  label: string;
  description: string;
  path: string;
  shortcut?: string;
  accent: string;
}

const NAV_TILES: NavTile[] = [
  {
    icon: "🗺",
    label: "Battle Maps",
    description: "DM control center with tokens, fog, and initiative",
    path: "/campaign/battle-maps",
    shortcut: "B",
    accent: "hover:border-red-500/20 hover:bg-red-500/5",
  },
  {
    icon: "👥",
    label: "Player Cards",
    description: "Character sheets, HP, stats, and conditions",
    path: "/campaign/player-cards",
    shortcut: "P",
    accent: "hover:border-sky-500/20 hover:bg-sky-500/5",
  },
  {
    icon: "⚔",
    label: "Encounters",
    description: "Build and manage combat encounters",
    path: "/campaign/encounters",
    shortcut: "E",
    accent: "hover:border-amber-500/20 hover:bg-amber-500/5",
  },
  {
    icon: "⚗️",
    label: "Homebrew",
    description: "Items, spells, and feats creator",
    path: "/campaign/homebrew",
    shortcut: "H",
    accent: "hover:border-violet-500/20 hover:bg-violet-500/5",
  },
  {
    icon: "📖",
    label: "Journal",
    description: "Session notes, lore, and quest tracking",
    path: "/campaign/journal",
    shortcut: "J",
    accent: "hover:border-emerald-500/20 hover:bg-emerald-500/5",
  },
  {
    icon: "🖥",
    label: "Theatric Display",
    description: "Player-facing cinematic map view",
    path: "/campaign/theatric",
    shortcut: "T",
    accent: "hover:border-gold-500/20 hover:bg-gold-500/5",
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

      {/* Nav grid */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          {NAV_TILES.map((tile) => (
            <button
              key={tile.path}
              onClick={() => navigate(tile.path)}
              className={`
                flex items-start gap-2.5 p-3 rounded-xl text-left
                bg-[#0c0d15] border border-white/[0.04]
                ${tile.accent}
                transition-all duration-200 active:scale-[0.98] group
              `}
            >
              <span className="text-base mt-0.5">{tile.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white/70 group-hover:text-white/90 transition-colors truncate">
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
