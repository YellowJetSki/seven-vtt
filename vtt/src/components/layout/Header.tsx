/**
 * STᚱ VTT — Header (Premium Persistent Navigation)
 *
 * Top navigation bar with architectural-level details.
 *
 * Key behavior:
 *   Desktop (lg+): Hamburger toggles sidebar between w-64 (full) and w-16 (collapsed).
 *     The sidebar NEVER disappears on desktop — it's a persistent side-rail.
 *   Mobile (< lg): Hamburger toggles the sidebar drawer overlay.
 *     The sidebar slides in/out with a backdrop.
 *
 * Architecture:
 *   - Multi-layer glass depth with subtle edge lighting
 *   - Sophisticated campaign identity with wordmark hierarchy
 *   - Tactile hamburger with animated bars
 *   - Premium user badge with glass inset
 */

import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import { useResponsive } from "@/hooks/useResponsive";
import CompendiumDrawer from "./CompendiumDrawer";

/** Tiny connection dot for the Header — visual at-a-glance sync status */
function ConnectionDot() {
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  return (
    <div className="flex items-center gap-1.5 px-1.5" title={firebaseConnected ? "Synced" : "Connecting..."}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          firebaseConnected
            ? "bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]"
            : "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)] animate-pulse"
        }`}
      />
      <span className={`hidden sm:block text-[8px] uppercase tracking-[0.15em] font-medium ${
        firebaseConnected ? "text-emerald-500/50" : "text-amber-500/50"
      }`}>
        {firebaseConnected ? "Live" : "Sync"}
      </span>
    </div>
  );
}

export default function Header() {
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const { isMobile, isDesktop } = useResponsive();

  // Tooltip text changes based on context
  const hamburgerLabel = isDesktop
    ? sidebarOpen
      ? "Collapse sidebar"
      : "Expand sidebar"
    : sidebarOpen
      ? "Close menu"
      : "Open menu";

  return (
    <header className="relative z-10 shrink-0">
      {/* ── Header Body ── */}
      <div
        className="h-14 sm:h-16 flex items-center justify-between
          bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f101a]/[0.95]
          backdrop-blur-2xl border-b border-white/[0.06]
          shadow-[0_4px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,215,0,0.03)]"
        style={{ padding: "0 0.75rem" }}
      >
        {/* Gold edge light */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── LEFT GROUP ── */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Hamburger — hidden on mobile (bottom nav handles navigation) */}
          <button
            onClick={toggleSidebar}
            className="relative items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl hover:bg-white/[0.04] text-surface-400 hover:text-gold-400 transition-all duration-200 active:scale-90 group"
            style={{ display: isDesktop ? 'flex' : 'none' }}
            aria-label={hamburgerLabel}
            title={hamburgerLabel}
          >
            <div className="flex flex-col items-center justify-center w-5 h-5 gap-[3px]">
              {/* Top bar — rotates 45° when open */}
              <span
                className={`block w-5 h-px bg-current transition-all duration-300 ease-in-out origin-center ${
                  sidebarOpen ? "rotate-45 translate-y-[3.5px]" : ""
                }`}
              />
              {/* Middle bar — fades when open */}
              <span
                className={`block w-5 h-px bg-current transition-all duration-200 ease-in-out ${
                  sidebarOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              {/* Bottom bar — rotates -45° when open */}
              <span
                className={`block w-5 h-px bg-current transition-all duration-300 ease-in-out origin-center ${
                  sidebarOpen ? "-rotate-45 -translate-y-[3.5px]" : ""
                }`}
              />
            </div>
          </button>

          {/* Vertical divider */}
          <div className="w-px h-5 bg-white/[0.06] shrink-0" />

          {/* Campaign identity — icon + stacked wordmark */}
          <div className="flex items-center gap-2.5 pl-1">
            {/* App Icon — brand mark */}
            <img
              src="/AppIcon.png"
              alt="STᚱ VTT"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0 drop-shadow-[0_0_8px_rgba(234,179,8,0.15)]"
            />
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

          {/* Firebase connection status */}
          <ConnectionDot />

          {/* Role badge — glass inset */}
          <div
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg
              bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          >
            <span className="text-[11px] sm:text-xs leading-none">{role === "dm" ? "👑" : "⚔"}</span>
            <span className="hidden sm:block text-[10px] font-semibold text-gold-400/70 uppercase tracking-[0.08em] leading-none">
              {role === "dm" ? "DM" : "Player"}
            </span>
            <div className="w-px h-3.5 bg-white/[0.06] shrink-0" />
            <span className="text-[11px] sm:text-[12px] text-surface-200 font-semibold truncate max-w-[90px] sm:max-w-[120px] leading-none">
              {username}
            </span>
          </div>

          {/* Exit button */}
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
