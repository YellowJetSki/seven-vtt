import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";

const actions = [
  { path: "/campaign/player-cards", label: "👥 Player Cards" },
  { path: "/campaign/encounters", label: "⚔ Encounters" },
  { path: "/campaign/maps", label: "🗺 Battle Maps" },
  { path: "/campaign/journal", label: "📖 Journal" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {actions.map((action) => (
        <Button
          key={action.path}
          variant="secondary"
          size="sm"
          onClick={() => navigate(action.path)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
