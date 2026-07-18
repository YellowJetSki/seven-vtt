import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";

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
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] uppercase tracking-widest text-surface-500 font-black mr-1">Quick Actions:</span>
      {actions.map((action) => (
        <Button
          key={action.path}
          variant="secondary"
          size="sm"
          onClick={() => navigate(action.path)}
          className="hover-lift"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
