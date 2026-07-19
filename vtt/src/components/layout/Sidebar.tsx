/**
 * STᚱ VTT — Sidebar (Premium Gold)
 *
 * Navigation sidebar with gold-accented glassmorphism.
 * Collapsible between icon-only and full-width.
 * Uses rigid min-w (w-16) and max-w (w-64) boundaries.
 */

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
        sidebarOpen ? "w-64 min-w-[16rem] max-w-[16rem]" : "w-16 min-w-[4rem] max-w-[4rem]"
      } h-full glass-gold border-r border-gold/15 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative`}
    >
      {/* Brand with ᚱ rune */}
      <div className="flex items-center gap-3 px-4 h-14 sm:h-16 border-b border-gold/10">
        <span className="text-2xl float-arcane select-none text-gold-400" aria-hidden="true">ᚱ</span>
        {sidebarOpen && (
          <span className="font-black text-gold text-lg whitespace-nowrap tracking-tight drop-shadow-[0_0_8px_rgba(234,179,8,0.15)]">
            STᚱ VTT
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gold-500/10 text-gold-400 border-l-[3px] border-gold-500/40 shadow-sm shadow-gold-500/5"
                  : "text-surface-500 hover:text-surface-200 hover:bg-surface-800/30 border-l-[3px] border-transparent"
              }`
            }
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {sidebarOpen && (
              <span className="text-sm font-semibold whitespace-nowrap tracking-wide">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-gold/10">
          <div className="rune-gold justify-center text-[8px]">✦ ᚱ ✦</div>
        </div>
      )}
    </aside>
  );
}
