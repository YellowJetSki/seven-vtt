/**
 * STᚱ VTT — Header (Premium Gold — Enhanced)
 *
 * Top navigation bar with gold-accented glassmorphism.
 * Enhanced: brand presence, gold gradient strip at bottom,
 * Campaign label now uses gold accent, improved user badge styling.
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
      {/* Gold accent strip at bottom of header */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-500/30 to-transparent pointer-events-none" />

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Hamburger menu — large 44px+ touch target */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all duration-200 active:scale-90"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <div className="h-5 w-px bg-gold-500/10 shrink-0" />

        {/* Brand section — enhanced campaign identity */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gold-400 font-bold tracking-wide drop-shadow-[0_0_4px_rgba(234,179,8,0.1)]">
            Arkla
          </span>
          <span className="text-[9px] text-surface-400 uppercase tracking-[0.15em] font-semibold hidden sm:block opacity-60">
            Campaign
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <CompendiumDrawer />

        {/* Role badge — enhanced with gold accents */}
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-obsidian-mid/80 to-obsidian-mid/60 border border-gold/10 shadow-sm shadow-gold-500/5">
          <span className="text-xs">{role === "dm" ? "👑" : "⚔"}</span>
          <span className="text-[11px] sm:text-xs text-gold-400/70 font-semibold uppercase tracking-wider hidden sm:block">
            {role === "dm" ? "DM" : "Player"}
          </span>
          <div className="h-4 w-px bg-gold-500/10 shrink-0" />
          <span className="text-xs sm:text-sm text-surface-200 font-semibold truncate max-w-[100px]">{username}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm text-surface-400 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all duration-200 active:scale-95"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
