/**
 * STᚱ VTT — Quick Actions (Spotify Chip Bar)
 *
 * Horizontal pill-shaped action bar:
 * - Each action is a compact chip with icon + label
 * - Hover: gold border + subtle glow lift
 * - Active: scale feedback
 * - Divider is a vertical gradient line
 */

import { useNavigate } from "react-router-dom";
import LaunchTheatricButton from "./LaunchTheatricButton";

interface ActionChipProps {
  icon: string;
  label: string;
  onClick: () => void;
}

function ActionChip({ icon, label, onClick }: ActionChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-surface-400 hover:text-gold-300 hover:border-gold-500/20 hover:bg-gold-500/5 transition-all duration-200 active:scale-95 text-[11px] sm:text-xs font-semibold whitespace-nowrap"
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const actions = [
  { path: "/campaign/player-cards", label: "Player Cards", icon: "👥" },
  { path: "/campaign/encounters", label: "Encounters", icon: "⚔" },
  { path: "/campaign/maps", label: "Battle Maps", icon: "🗺" },
  { path: "/campaign/journal", label: "Journal", icon: "📖" },
  { path: "/campaign/homebrew", label: "Homebrew", icon: "⚗️" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap px-1">
      {/* Label */}
      <span className="text-[9px] uppercase tracking-[0.15em] text-gold-400/50 font-semibold mr-1 shrink-0">
        Jump to
      </span>

      {actions.map((action) => (
        <ActionChip
          key={action.path}
          icon={action.icon}
          label={action.label}
          onClick={() => navigate(action.path)}
        />
      ))}

      {/* Gradient divider */}
      <div className="h-5 w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent mx-1 shrink-0" />

      <LaunchTheatricButton />
    </div>
  );
}
