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
      } flex-shrink-0 glass-arcane border-r border-accent-500/8 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-700/20">
        <span className="text-2xl float-arcane select-none" aria-hidden="true">ᚱ</span>
        {sidebarOpen && (
          <span className="font-black text-gradient-arcane text-lg whitespace-nowrap tracking-tight">
            STᚱ VTT
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-accent-600/12 text-accent-300 border-l-[3px] border-accent-500 shadow-sm shadow-accent-500/5"
                  : "text-surface-500 hover:text-surface-200 hover:bg-surface-800/30 border-l-[3px] border-transparent"
              }`
            }
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {sidebarOpen && (
              <span className="text-sm font-semibold whitespace-nowrap tracking-wide">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-surface-700/20">
          <p className="text-[10px] text-surface-600 uppercase tracking-widest text-center">
            Arkla Campaign
          </p>
        </div>
      )}
    </aside>
  );
}
