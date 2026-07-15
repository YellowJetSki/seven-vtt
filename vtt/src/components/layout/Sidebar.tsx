/* ── Sidebar Navigation ────────────────────────────────────────
 * Premium DM sidebar with:
 *  • Collapsible (desktop) / slide-out (mobile)
 *  • Active route highlighting with accent glow
 *  • Dynamic badges (player count, encounters)
 *  • Campaign branding
 *  • Spotify player mini-bar
 *  • User profile + logout
 *  • Glass-morphism design
 * ─────────────────────────────────────────────────────────────── */

import { NavLink } from "react-router-dom";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { SpotifyPlayer } from "@/components/layout/SpotifyPlayer";

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: number | string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/campaign/dashboard", icon: "◈" },
  { label: "Players", path: "/campaign/player-cards", icon: "⚔" },
  { label: "Homebrew", path: "/campaign/homebrew", icon: "⚗" },
  { label: "Encounters", path: "/campaign/encounters", icon: "⚡" },
  { label: "Battle Maps", path: "/campaign/maps", icon: "🗺" },
  { label: "Journal", path: "/campaign/journal", icon: "📖" },
  { label: "Settings", path: "/campaign/settings", icon: "⚙" },
];

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const campaign = useCampaignStore((s) => s.campaign);
  const liveSession = useCombatStore((s) => s.liveSession);

  const playerCount = campaign?.playerCharacters.length ?? 0;
  const encounterCount = campaign?.encounters.length ?? 0;
  const sessionActive = liveSession.sessionStartedAt !== null;

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const navItemsWithBadges = NAV_ITEMS.map((item) => {
    if (item.path === "/campaign/player-cards" && playerCount > 0) {
      return { ...item, badge: playerCount };
    }
    if (item.path === "/campaign/encounters" && encounterCount > 0) {
      return { ...item, badge: encounterCount };
    }
    return item;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 flex h-full flex-col border-r border-surface-700/60 glass-strong transition-all duration-300 ease-out md:static md:z-auto ${
          sidebarOpen
            ? "w-64 translate-x-0 shadow-2xl"
            : "w-0 -translate-x-full md:w-16 md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-surface-700/60 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500/15 ring-1 ring-accent-500/20 overflow-hidden">
            <img src="/AppIcon.png" alt="App Icon" className="h-8 w-8 object-cover" />
          </div>
          {sidebarOpen && (
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold tracking-wide text-surface-100">
                {campaign?.name ?? "STᚱ VTT"}
              </span>
              {campaign && (
                <p className="truncate text-[10px] leading-tight text-surface-500">
                  {campaign.settings.experienceSystem === "xp" ? "XP" : "Milestone"}
                  {campaign.playerCharacters.length > 0 && ` · ${campaign.playerCharacters.length} PC${campaign.playerCharacters.length !== 1 ? "s" : ""}`}
                </p>
              )}
            </div>
          )}
          {sessionActive && !sidebarOpen && (
            <span className="absolute right-2 top-3 h-2 w-2 animate-pulse rounded-full bg-accent-400" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {navItemsWithBadges.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/campaign/dashboard"}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent-500/12 text-accent-300 shadow-sm card-glow before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-0.5 before:rounded-full before:bg-accent-400 animate-border-pulse"
                    : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                }`
              }
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base">
                {item.icon}
              </span>
              {sidebarOpen && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {sidebarOpen && item.badge !== undefined && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500/20 px-1.5 text-[10px] font-bold text-accent-400">
                  {item.badge}
                </span>
              )}
              {!sidebarOpen && item.badge !== undefined && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-500 px-1 text-[9px] font-bold text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Session Active Indicator */}
        {sidebarOpen && sessionActive && (
          <div className="px-3 py-1">
            <div className="flex items-center gap-2 rounded-lg bg-accent-500/10 px-3 py-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent-400" />
              <span className="text-xs font-medium text-accent-400">Session Active</span>
            </div>
          </div>
        )}

        {/* Spotify Player */}
        <SpotifyPlayer />

        {/* User Info + Logout */}
        <div className="shrink-0 border-t border-surface-700/80">
          {sidebarOpen && username && (
            <div className="px-3 py-2">
              <div className="flex items-center gap-2 rounded-lg bg-surface-800/80 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500/20 text-sm text-accent-400">👑</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-surface-200">{username}</p>
                  <p className="text-[10px] text-surface-500">Dungeon Master</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-surface-400 transition-colors hover:bg-surface-800 hover:text-warrior-400 ${
              !sidebarOpen ? "justify-center" : ""
            }`}
            title="Sign Out"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base">⟐</span>
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop) */}
        <button
          onClick={toggleSidebar}
          className="hidden shrink-0 items-center justify-center border-t border-surface-700/80 p-3 text-surface-500 transition-colors hover:text-surface-300 md:flex"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span className={`text-xs transition-transform duration-200 ${sidebarOpen ? "" : "rotate-180"}`}>◀</span>
        </button>
      </aside>
    </>
  );
}
