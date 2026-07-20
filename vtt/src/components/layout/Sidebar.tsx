/**
 * STᚱ VTT — Sidebar (Modular Premium Architecture)
 *
 * Navigation sidebar with architectural depth transitions.
 * Collapses between icon-only (w-16) and full-width (w-64) with:
 * - Smooth morphing width transition (300ms cubic-bezier)
 * - Mobile: overlays content with backdrop blur, dismissable via backdrop click
 * - Desktop: pushes content alongside
 * - All elements extracted into reusable sub-components:
 *   SidebarBrand, SidebarNavLink, SidebarFooter
 *
 * Uses proper mobile-first responsive pattern:
 * - Mobile (< lg): sidebar is a fixed overlay with backdrop when open
 * - Desktop (lg+): sidebar pushes content alongside, collapses to w-16
 */

import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
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
  const isLargeScreen = typeof window !== "undefined" && window.innerWidth >= 1024;

  // On mobile: when sidebar opens, lock body scroll
  useEffect(() => {
    if (sidebarOpen && !isLargeScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* ── MOBILE OVERLAY BACKDROP ── */}
      {sidebarOpen && !isLargeScreen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          // Desktop behavior — pushes content, collapses to w-16
          lg:relative lg:shrink-0 lg:translate-x-0
          ${
            sidebarOpen
              ? "lg:w-64 lg:min-w-[16rem] lg:max-w-[16rem]"
              : "lg:w-16 lg:min-w-[4rem] lg:max-w-[4rem]"
          }

          // Mobile behavior — fixed overlay with slide-in
          fixed top-0 left-0 z-50 h-full
          ${
            sidebarOpen
              ? "translate-x-0 w-64 min-w-[16rem] max-w-[16rem]"
              : "-translate-x-full lg:translate-x-0"
          }

          // Shared styling
          flex flex-col select-none
          bg-gradient-to-b from-[#14151f]/[0.95] to-[#0f101a]/[0.98]
          lg:bg-gradient-to-b from-[#14151f]/[0.88] to-[#0f101a]/[0.94]
          backdrop-blur-2xl border-r border-white/[0.06]
          shadow-[4px_0_32px_rgba(0,0,0,0.2)]
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          overflow-hidden
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
