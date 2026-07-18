import { NavLink } from "react-router-dom";
import { useUIStore } from "@/stores/uiStore";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/campaign/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/campaign/player-cards", label: "Player Cards", icon: "👥" },
  { path: "/campaign/homebrew", label: "Homebrew", icon: "⚗️" },
  { path: "/campaign/encounters", label: "Encounters", icon: "⚔" },
  { path: "/campaign/maps", label: "Battle Maps", icon: "🗺" },
  { path: "/campaign/journal", label: "Journal", icon: "📖" },
  { path: "/campaign/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={`${
        sidebarOpen ? "w-64" : "w-16"
      } flex-shrink-0 glass-strong border-r border-surface-700/50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-700/50">
        <span className="text-2xl">ᚱ</span>
        {sidebarOpen && (
          <span className="font-bold text-white text-lg whitespace-nowrap">
            STᚱ VTT
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-accent-600/15 text-accent-300 border-l-2 border-accent-500"
                  : "text-surface-400 hover:text-surface-200 hover:bg-surface-800/40 border-l-2 border-transparent"
              }`
            }
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {sidebarOpen && (
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
