/**
 * STᚱ VTT — Quick Actions (Premium Gold)
 *
 * Horizontal bar of quick-navigation buttons with gold accents.
 */

import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import LaunchTheatricButton from "./LaunchTheatricButton";

const actions = [
  { path: "/campaign/player-cards", label: "👥 Player Cards" },
  { path: "/campaign/encounters", label: "⚔ Encounters" },
  { path: "/campaign/maps", label: "🗺 Battle Maps" },
  { path: "/campaign/journal", label: "📖 Journal" },
  { path: "/campaign/homebrew", label: "⚗️ Homebrew" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="glass-dark rounded-xl px-4 py-3 flex items-center gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-widest text-gold-400 font-black mr-1">Quick Actions:</span>
      {actions.map((action) => (
        <Button
          key={action.path}
          variant="secondary"
          size="sm"
          onClick={() => navigate(action.path)}
          className="hover:border-gold/20 hover:text-gold-300"
        >
          {action.label}
        </Button>
      ))}
      <div className="h-5 w-px bg-gold-500/10 mx-1" />
      <LaunchTheatricButton />
    </div>
  );
}
