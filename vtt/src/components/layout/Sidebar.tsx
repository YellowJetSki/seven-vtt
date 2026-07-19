/**
 * STᚱ VTT — Sidebar (Lusion-Grade Nav Architecture)
 *
 * Premium navigation sidebar with architectural depth transitions.
 * Collapses between icon-only (w-16) and full-width (w-64) with:
 * - Smooth morphing width transition (300ms cubic-bezier)
 * - Active state: gold pill indicator + subtle background glow
 * - Inactive state: gold-tinted hover glow only
 * - Footer is a deliberate design anchor with gradient dividers
 * - Icons scale and shift gracefully during collapse
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
  { path: "/campaign/enemies", label: "NPC Library", icon: "👾" },
  { path: "/campaign/maps", label: "Battle Maps", icon: "🗺" },
  { path: "/campaign/journal", label: "Journal", icon: "📖" },
  { path: "/campaign/assets", label: "Asset Gallery", icon: "🎨" },
  { path: "/campaign/settings", label: "Settings", icon: "⚙" },
];

export default function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <aside
      className={`${
        sidebarOpen ? "w-64 min-w-[16rem] max-w-[16rem]" : "w-16 min-w-[4rem] max-w-[4rem]"
      } h-full flex flex-col relative shrink-0 select-none
        bg-gradient-to-b from-[#14151f]/[0.88] to-[#0f101a]/[0.94]
        backdrop-blur-2xl border-r border-white/[0.06]
        shadow-[4px_0_32px_rgba(0,0,0,0.2)]
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden`}
    >
      {/* Gold edge light on right side */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-500/15 to-transparent pointer-events-none" />

      {/* ── BRAND BAR ── */}
      <div className="flex items-center gap-3 px-4 h-14 sm:h-16 shrink-0 relative border-b border-white/[0.04]">
        {/* Gold accent strip */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />

        {/* Ambient glow behind rune */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gold-500/5 rounded-full blur-[12px] pointer-events-none" />

        {/* Rune icon */}
        <span
          className={`font-serif select-none transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            sidebarOpen
              ? "text-xl text-gold-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.25)]"
              : "text-xl text-gold-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.2)] mx-auto"
          }`}
          aria-hidden="true"
        >
          ᚱ
        </span>

        {/* Brand name — fades/slides on collapse */}
        <span
          className={`font-black text-gold text-base sm:text-lg tracking-tight whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            sidebarOpen
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-4 absolute pointer-events-none"
          }`}
        >
          STᚱ VTT
        </span>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 min-h-0 py-3 space-y-0.5 px-2 overflow-y-auto scrollbar-gold">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex items-center min-h-[44px] rounded-xl transition-all duration-200 active:scale-[0.97] group ${
                sidebarOpen ? "gap-3" : "gap-0 justify-center"
              } ${
                isActive
                  ? "bg-gradient-to-r from-gold-500/10 to-gold-500/5 text-gold-400 shadow-[inset_0_1px_0_rgba(255,215,0,0.04)]"
                  : "text-surface-500 hover:text-surface-200"
              }`
            }
            style={{ padding: sidebarOpen ? '0.625rem 0.75rem' : '0.625rem 0' }}
          >
            {({ isActive }) => (
              <>
                {/* Active pill indicator */}
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                    isActive
                      ? "w-1 h-6 rounded-r-full bg-gold-500 shadow-[0_0_6px_rgba(234,179,8,0.3)]"
                      : "w-0 h-0"
                  }`}
                />

                {/* Hover glow (non-active only) */}
                <div
                  className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "opacity-0"
                      : "opacity-0 group-hover:opacity-100 bg-gradient-to-r from-gold-500/[0.03] to-transparent"
                  }`}
                />

                {/* Hover border glow (non-active only) */}
                <div
                  className={`absolute inset-x-1 top-0 bottom-0 rounded-[10px] transition-all duration-200 border pointer-events-none ${
                    isActive
                      ? "border-gold-500/8"
                      : "border-transparent group-hover:border-white/[0.04]"
                  }`}
                />

                {/* Icon */}
                <span className="relative z-10 text-lg flex-shrink-0 leading-none transition-transform duration-200 group-hover:scale-110">
                  {item.icon}
                </span>

                {/* Label */}
                {sidebarOpen && (
                  <span
                    className={`relative z-10 text-sm font-semibold whitespace-nowrap tracking-wide truncate transition-colors duration-200 ${
                      isActive ? "text-gold-400" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── FOOTER ANCHOR ── */}
      {sidebarOpen && (
        <div className="shrink-0 border-t border-white/[0.04] px-4 py-3">
          {/* Gradient dividers + rune */}
          <div className="flex items-center gap-2 text-[7px] text-gold-500/25 uppercase tracking-[0.15em] justify-center">
            <span className="w-6 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
            <span className="font-mono">✦ ᚱ ✦</span>
            <span className="w-6 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
          </div>
          <p className="text-[8px] text-surface-700 text-center mt-1.5 uppercase tracking-[0.12em] font-medium">
            Premium VTT
          </p>
        </div>
      )}
    </aside>
  );
}
