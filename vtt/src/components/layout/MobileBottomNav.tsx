/**
 * STᚱ VTT — Mobile Bottom Nav (Premium Gold — Enhanced)
 *
 * Mobile bottom navigation with gold-accented active states.
 * Enhanced: active indicator line, gold gradient border,
 * improved visual hierarchy with icon prominence.
 */

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-obsidian/95 backdrop-blur-lg border-t border-gold/10 sm:hidden safe-area-bottom">
      {/* Gold gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />

      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95 relative ${
                isActive
                  ? "text-gold-400"
                  : "text-surface-500 hover:text-surface-300"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator — tiny gold dot above icon */}
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-500 shadow-[0_0_4px_rgba(234,179,8,0.4)]" />
                )}

                <span className={`text-xl ${isActive ? "drop-shadow-[0_0_6px_rgba(234,179,8,0.15)]" : ""}`}>{item.icon}</span>
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${
                  isActive ? "text-gold-400/80" : ""
                }`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
