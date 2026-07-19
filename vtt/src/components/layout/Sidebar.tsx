/**
 * STᚱ VTT — Sidebar (Premium Gold — Enhanced)
 *
 * Navigation sidebar with gold-accented glassmorphism.
 * Collapsible between icon-only (w-16) and full-width (w-64).
 * Enhanced: gold-gradient brand bar, rune glow, curved active states,
 * soft hover glow, improved collapsed-state identity.
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
      } h-full glass-gold border-r border-gold/15 flex flex-col transition-all duration-300 ease-in-out overflow-hidden relative shrink-0`}
    >
      {/* Brand bar — gold gradient accent on bottom */}
      <div className="flex items-center gap-3 px-4 h-14 sm:h-16 border-b border-gold/10 shrink-0 relative">
        {/* Gold accent strip */}
        <div className="absolute bottom-0 left-4 right-4 h-[1.5px] bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

        {/* Rune with gold glow */}
        <span
          className={`text-2xl font-serif select-none transition-all duration-300 ${
            sidebarOpen
              ? "text-gold-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.25)]"
              : "text-gold-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.2)] mx-auto"
          }`}
          aria-hidden="true"
        >
          ᚱ
        </span>

        {sidebarOpen && (
          <span className="font-black text-gold text-lg whitespace-nowrap tracking-tight drop-shadow-[0_0_8px_rgba(234,179,8,0.15)]">
            STᚱ VTT
          </span>
        )}
      </div>

      {/* Navigation — scrollable with gold scrollbar */}
      <nav className="flex-1 min-h-0 py-3 space-y-0.5 px-2 overflow-y-auto scrollbar-gold">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ padding: sidebarOpen ? '0.625rem 0.75rem' : '0.625rem 0' }}
            className={({ isActive }) =>
              `flex items-center ${
                sidebarOpen ? "gap-3" : "justify-center"
              } min-h-[44px] rounded-xl transition-all duration-200 active:scale-95 relative group ${
                isActive
                  ? "bg-gold-500/10 text-gold-400 shadow-sm shadow-gold-500/10"
                  : "text-surface-500 hover:text-surface-200"
              }`}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator — gold pill on left */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gold-500 shadow-[0_0_6px_rgba(234,179,8,0.3)]" />
                )}

                {/* Hover glow background */}
                <span
                  className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "opacity-0"
                      : "opacity-0 group-hover:opacity-100 bg-gradient-to-r from-gold-500/[0.03] to-transparent"
                  }`}
                />

                <span className="text-lg flex-shrink-0 relative z-10">{item.icon}</span>
                {sidebarOpen && (
                  <span className={`text-sm font-semibold whitespace-nowrap tracking-wide truncate relative z-10 ${
                    isActive ? "text-gold-400" : ""
                  }`}>
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-gold/10 shrink-0">
          <div className="flex items-center gap-2 text-[8px] text-gold-500/30 uppercase tracking-[0.2em] justify-center">
            <span className="w-8 h-px bg-gradient-to-r from-transparent to-gold-500/20" />
            <span className="font-mono">✦ ᚱ ✦</span>
            <span className="w-8 h-px bg-gradient-to-l from-transparent to-gold-500/20" />
          </div>
        </div>
      )}
    </aside>
  );
}
