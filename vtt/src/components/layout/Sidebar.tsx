/**
 * STᚱ VTT — Sidebar (Premium Persistent Side-Rail)
 *
 * Desktop: ALWAYS visible as a persistent side-rail.
 * - sidebarOpen = true  → w-64 full-width (labels visible)
 * - sidebarOpen = false → w-16 collapsed (icons only)
 * - The sidebar NEVER fully disappears on desktop.
 *
 * Mobile: acts as a drawer overlay triggered by the hamburger.
 * - sidebarOpen = true  → overlay slides in from left with backdrop
 * - sidebarOpen = false → hidden off-screen
 * - MobileBottomNav provides persistent bottom navigation
 *
 * Architecture:
 *   - Responsive breakpoint: lg (1024px)
 *   - Uses useResponsive for accurate breakpoint detection
 *   - Body scroll lock on mobile when sidebar is open
 *   - All sub-components are reusable (SidebarBrand, SidebarNavLink, SidebarFooter)
 */

import { useEffect, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useResponsive } from "@/hooks/useResponsive";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import SidebarBrand from "./SidebarBrand";
import SidebarNavLink from "./SidebarNavLink";
import SidebarFooter from "./SidebarFooter";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/campaign/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/campaign/player-cards", label: "Player Cards", icon: "👥" },
  { path: "/campaign/homebrew", label: "Homebrew", icon: "⚗️" },
  { path: "/campaign/encounters", label: "Bestiary & Encounters", icon: "⚔" },
  { path: "/campaign/maps", label: "Battle Maps", icon: "🗺" },
  { path: "/campaign/journal", label: "Journal", icon: "📖" },
  { path: "/campaign/assets", label: "Asset Gallery", icon: "🎨" },
  { path: "/campaign/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const { isMobile, isDesktop } = useResponsive();

  // ── Mobile body scroll lock (extracted hook) ──
  useBodyScrollLock(sidebarOpen && isMobile);

  // ── Desktop: sidebar is ALWAYS visible ──
  // If somehow sidebar got closed on desktop (nav bug), re-open it
  const ensureDesktopVisible = useCallback(() => {
    if (isDesktop && !sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [isDesktop, sidebarOpen, setSidebarOpen]);

  useEffect(() => {
    ensureDesktopVisible();
  }, [ensureDesktopVisible]);

  // On desktop, always render — sidebar never disappears
  // On mobile, only render as overlay (shown/hidden by translate)
  return (
    <>
      {/* ── MOBILE OVERLAY BACKDROP ── */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          // ── PERMANENT DESKTOP VISIBILITY ──
          // Desktop: sidebar ALWAYS renders, never disappears
          // It transitions between w-64 (open) and w-16 (collapsed)
          lg:relative lg:shrink-0 lg:translate-x-0 lg:flex
          ${
            isDesktop
              ? sidebarOpen
                ? "lg:w-64 lg:min-w-[16rem] lg:max-w-[16rem]"
                : "lg:w-16 lg:min-w-[4rem] lg:max-w-[4rem]"
              : ""
          }

          // ── MOBILE OVERLAY ──
          ${
            isMobile
              ? sidebarOpen
                ? "translate-x-0 w-64 min-w-[16rem] max-w-[16rem]"
                : "-translate-x-full"
              : ""
          }

          // ── SHARED STYLING ──
          flex flex-col select-none
          bg-gradient-to-b from-[#14151f]/[0.95] to-[#0f101a]/[0.98]
          lg:bg-gradient-to-b from-[#14151f]/[0.88] to-[#0f101a]/[0.94]
          backdrop-blur-2xl border-r border-white/[0.06]
          shadow-[4px_0_32px_rgba(0,0,0,0.2)]
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          overflow-hidden
          ${isMobile ? "fixed top-0 left-0 z-50 h-full" : "h-full"}
        `}
      >
        {/* Gold edge light on right side */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-500/15 to-transparent pointer-events-none" />

        {/* ── BRAND BAR ── */}
        <SidebarBrand isOpen={sidebarOpen} />

        {/* ── NAVIGATION ── */}
        <nav className="flex-1 min-h-0 py-3 space-y-0.5 px-2 overflow-y-auto scrollbar-gold">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.path}
              path={item.path}
              label={item.label}
              icon={item.icon}
              isOpen={sidebarOpen}
            />
          ))}
        </nav>

        {/* ── FOOTER ANCHOR ── */}
        <SidebarFooter isOpen={sidebarOpen} />
      </aside>
    </>
  );
}
