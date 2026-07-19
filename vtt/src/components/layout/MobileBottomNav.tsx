import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/campaign/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/campaign/player-cards", label: "PCs", icon: "👥" },
  { path: "/campaign/encounters", label: "Fight", icon: "⚔" },
  { path: "/campaign/maps", label: "Map", icon: "🗺" },
  { path: "/campaign/settings", label: "Setup", icon: "⚙" },
];

export default function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-obsidian border-t border-gold/10 sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? "text-gold-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.08)]"
                  : "text-surface-500 hover:text-surface-300"
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
