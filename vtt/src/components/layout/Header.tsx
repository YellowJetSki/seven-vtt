/**
 * STᚱ VTT — Header (Lusion-Grade Premium Refresh)
 *
 * Top navigation bar with architectural-level details:
 * - Multi-layer glass depth with subtle edge lighting
 * - Sophisticated campaign identity with wordmark hierarchy
 * - Tactile nav toggle with animated bars
 * - Premium user badge with glass inset
 * - Smooth gold-accented micro-interactions throughout
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
    <header className="relative z-10 shrink-0">
      {/* ── Header Body ── */}
      <div className="h-14 sm:h-16 flex items-center justify-between px-2 sm:px-3 bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f101a]/[0.95] backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,215,0,0.03)]">
        {/* Gold edge light */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── LEFT GROUP ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Hamburger — tactile animated bars */}
          <button
            onClick={toggleSidebar}
            className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl hover:bg-white/[0.04] text-surface-400 hover:text-gold-400 transition-all duration-200 active:scale-90 group"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <div className="flex flex-col items-center justify-center w-5 h-5 gap-[3px]">
              <span className={`block w-5 h-px bg-current transition-all duration-300 ease-in-out origin-center ${
                sidebarOpen ? "rotate-45 translate-y-[3.5px]" : ""
              }`} />
              <span className={`block w-5 h-px bg-current transition-all duration-200 ease-in-out ${
                sidebarOpen ? "opacity-0 scale-x-0" : ""
              }`} />
              <span className={`block w-5 h-px bg-current transition-all duration-300 ease-in-out origin-center ${
                sidebarOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
              }`} />
            </div>
          </button>

          {/* Vertical divider */}
          <div className="w-px h-5 bg-white/[0.06] shrink-0" />

          {/* Campaign identity — stacked wordmark */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="flex flex-col">
              <span className="text-[13px] sm:text-sm font-bold text-white/90 tracking-tight leading-tight">
                Arkla
              </span>
              <span className="text-[8px] sm:text-[9px] text-surface-500 uppercase tracking-[0.15em] font-medium leading-tight">
                Campaign
              </span>
            </div>
          </div>
        </div>

        {/* ── RIGHT GROUP ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <CompendiumDrawer />

          {/* Role badge — glass inset */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <span className="text-[11px] sm:text-xs leading-none">{role === "dm" ? "👑" : "⚔"}</span>
            <span className="hidden sm:block text-[10px] font-semibold text-gold-400/70 uppercase tracking-[0.08em] leading-none">
              {role === "dm" ? "DM" : "Player"}
            </span>
            <div className="w-px h-3.5 bg-white/[0.06] shrink-0" />
            <span className="text-[11px] sm:text-[12px] text-surface-200 font-semibold truncate max-w-[90px] sm:max-w-[120px] leading-none">
              {username}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs text-surface-400 hover:text-amber-400 hover:bg-amber-500/8 border border-transparent hover:border-amber-500/15 transition-all duration-200 active:scale-95 font-medium"
          >
            Exit
          </button>
        </div>
      </div>
    </header>
  );
}
