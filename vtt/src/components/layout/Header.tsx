/**
 * STᚱ VTT — Header (Premium Gold)
 *
 * Top navigation bar with gold-accented glassmorphism.
 * Shows campaign name, role badge, and user controls.
 */

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import CompendiumDrawer from "./CompendiumDrawer";

export default function Header() {
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header className="h-14 sm:h-16 glass-gold border-b border-gold flex items-center justify-between px-3 sm:px-4 relative z-10 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger menu */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all duration-200"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="h-5 w-px bg-gold-500/10" />
        {/* Campaign name */}
        <span className="text-sm text-gold-400 font-bold tracking-wide">Arkla</span>
        <span className="text-[9px] text-surface-600 uppercase tracking-[0.15em] font-semibold hidden sm:block">Campaign</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <CompendiumDrawer />
        {/* Role badge */}
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-obsidian-mid/80 border border-gold/10">
          <span className="text-xs">{role === "dm" ? "👑" : "⚔"}</span>
          <span className="text-[11px] sm:text-xs text-surface-400 font-medium hidden sm:block">{role === "dm" ? "DM" : "Player"}</span>
          <div className="h-4 w-px bg-surface-700/30" />
          <span className="text-xs sm:text-sm text-surface-200 font-semibold">{username}</span>
        </div>
        {/* Logout */}
        <button
          onClick={logout}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm text-surface-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
