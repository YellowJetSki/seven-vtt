/**
 * STᚱ VTT — Quick Actions (Premium Gold — Enhanced)
 *
 * Horizontal bar of quick-navigation buttons with gold accents.
 * Enhanced: richer layout, larger hit targets, gold gradient dividers,
 * improved label legibility.
 */

import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import LaunchTheatricButton from "./LaunchTheatricButton";

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
    <div className="glass-gold rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-2 sm:gap-3 flex-wrap shadow-gold">
      {/* Label with electric bolt icon */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[11px] text-gold-400/80">⚡</span>
        <span className="text-[10px] uppercase tracking-widest text-gold-400/70 font-black mr-0.5">
          Quick:
        </span>
      </div>

      {/* Action buttons */}
      {actions.map((action, i) => (
        <Button
          key={action.path}
          variant="secondary"
          size="sm"
          onClick={() => navigate(action.path)}
          className="hover:border-gold/20 hover:text-gold-300 border-gold/5 text-surface-400 text-[11px]"
        >
          <span className="mr-1">{action.icon}</span>
          {action.label}
        </Button>
      ))}

      {/* Gold gradient divider */}
      <div className="h-6 w-px bg-gradient-to-b from-transparent via-gold-500/20 to-transparent mx-1 shrink-0" />

      <LaunchTheatricButton />
    </div>
  );
}
