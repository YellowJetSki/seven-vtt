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
import PremiumIcon from "@/components/ui/PremiumIcon";
import { useUIStore } from "@/stores/uiStore";
import { useResponsive } from "@/hooks/useResponsive";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import SidebarBrand from "./SidebarBrand";
import SidebarNavLink from "./SidebarNavLink";
import SidebarFooter from "./SidebarFooter";
import SyncHealthPanel from "@/components/ui/SyncHealthPanel";
import ConnectedPlayersPanel from "@/components/ui/ConnectedPlayersPanel";

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

        {/* ── DM TOOLS SEPARATOR ──
            Only visible when sidebar is open (expanded mode).
            Separates navigation links from DM combat tools. */}
        {sidebarOpen && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-gold-500/15 to-transparent" />
              <span className="text-[7px] uppercase tracking-[0.15em] font-bold text-gold-500/40">Tools</span>
              <div className="h-px flex-1 bg-gradient-to-l from-gold-500/15 to-transparent" />
            </div>
          </div>
        )}

        {/* ── DM SKILL CHECK TOGGLE (Sprint 31) ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-skill-check"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-amber-500/8 hover:border-amber-500/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="Skill Check — Call party skill checks & view passive scores"
            aria-label="Toggle Skill Check"
          >
            <PremiumIcon name="rollInitiative" className="w-3.5 h-3.5 text-gold-400" />
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-gold-400 transition-colors truncate">
                Skill Check
              </span>
            )}
          </button>
        </div>

        {/* ── DM TREASURE GENERATOR TOGGLE (Sprint 33) ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-treasure-generator"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-amber-500/8 hover:border-amber-500/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="Treasure & Loot Generator — DMG treasure tables for individual parcels & hoards"
            aria-label="Toggle Treasure Generator"
          >
            <PremiumIcon name="loot" className="w-3.5 h-3.5 text-amber-400" />
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-amber-400 transition-colors truncate">
                Treasure
              </span>
            )}
          </button>
        </div>

        {/* ── DM SOCIAL INTERACTION & MONSTER KNOWLEDGE TOGGLE (Sprint 32) ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-social-interaction"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-violet-500/8 hover:border-violet-500/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="Social Interaction & Monster Knowledge — DMG social rules + creature lore checks"
            aria-label="Toggle Social Interaction"
          >
            <span className="w-3.5 h-3.5 flex items-center justify-center text-[11px]">💬</span>
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-violet-400 transition-colors truncate">
                Social & Knowledge
              </span>
            )}
          </button>
        </div>

        {/* ── DM COMBAT CONDITIONS TOGGLE ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-combat-conditions"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-amber-500/8 hover:border-amber-500/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="Combat Conditions"
            aria-label="Toggle Combat Conditions"
          >
            <PremiumIcon name="conditions" className="w-3.5 h-3.5 text-amber-400" />
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-amber-400 transition-colors truncate">
                Conditions
              </span>
            )}
          </button>
        </div>

        {/* ── DM QUICK ACTIONS TOGGLE (Sprint 27) ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-quick-actions"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-rose-500/8 hover:border-rose-500/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="Quick Actions — Damage, Heal, Temp HP, Gold"
            aria-label="Toggle Quick Actions"
          >
            <PremiumIcon name="quickActions" className="w-3.5 h-3.5 text-rose-400" />
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-rose-400 transition-colors truncate">
                Quick Actions
              </span>
            )}
          </button>
        </div>

        {/* ── DM NPC QUICK CREATE TOGGLE (Sprint 28) ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-npc-quick-create"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-emerald-500/8 hover:border-emerald-500/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="NPC Quick Create — Build a monster & add to combat instantly"
            aria-label="Toggle NPC Quick Create"
          >
            <PremiumIcon name="npcs" className="w-3.5 h-3.5 text-emerald-400" />
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-emerald-400 transition-colors truncate">
                NPC Quick Create
              </span>
            )}
          </button>
        </div>

        {/* ── DM PARTY REST TOGGLE ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-party-rest"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-emerald-500/8 hover:border-emerald-500/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="Party Rest & Recovery"
            aria-label="Toggle Party Rest"
          >
            <PremiumIcon name="restRecovery" className="w-3.5 h-3.5 text-emerald-400" />
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-emerald-400 transition-colors truncate">
                Party Rest
              </span>
            )}
          </button>
        </div>

        {/* ── DM COMBAT WRAP-UP TOGGLE (Sprint 29) ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("toggle-dm-combat-wrapup"));
            }}
            className={`flex items-center gap-2 rounded-lg transition-all duration-200 active:scale-95 hover:bg-gold-500/8 hover:border-gold/10 ${
              sidebarOpen
                ? "w-full px-2.5 py-1.5 border border-white/[0.04]"
                : "w-9 h-9 justify-center border border-white/[0.04] mx-auto"
            }`}
            title="Combat Wrap-Up — XP, Loot, Condition Clearing"
            aria-label="Toggle Combat Wrap-Up"
          >
            <PremiumIcon name="encounterComplete" className="w-3.5 h-3.5 text-gold-400" />
            {sidebarOpen && (
              <span className="text-[9px] text-surface-400 hover:text-gold-400 transition-colors truncate">
                Combat Wrap-Up
              </span>
            )}
          </button>
        </div>

        {/* ── CONNECTED PLAYERS ── */}
        {sidebarOpen && (
          <div className="px-3 pb-2">
            <div className="border-t border-white/[0.04] pt-2">
              <ConnectedPlayersPanel compact />
            </div>
          </div>
        )}

        {/* ── SYNC HEALTH ── */}
        <div className={`px-2 pb-1 ${!sidebarOpen ? "flex justify-center" : ""}`}>
          {sidebarOpen ? (
            <SyncHealthPanel />
          ) : (
            <button
              onClick={() => {
                const event = new CustomEvent("toggle-sync-health");
                window.dispatchEvent(event);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.04] hover:bg-white/[0.03] active:scale-95 transition-all duration-200"
              title="System Status"
              aria-label="Toggle System Status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]" />
            </button>
          )}
        </div>

        {/* ── FOOTER ANCHOR ── */}
        <SidebarFooter isOpen={sidebarOpen} />
      </aside>
    </>
  );
}
