import { useLocation } from "react-router-dom";
import { useUiStore } from "@/stores/uiStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAuthStore } from "@/stores/authStore";
import { LiveSessionTimer } from "@/components/combat/LiveSessionTimer";
import { isFirebaseAvailable } from "@/lib/firebase";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "Command Center",
  "/players": "Player Cards",
  "/homebrew": "Homebrew Library",
  "/encounters": "Combat Center",
  "/maps": "Battle Maps",
  "/journal": "DM Journal",
  "/settings": "Campaign Settings",
};

export function Header() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const campaign = useCampaignStore((s) => s.campaign);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const location = useLocation();

  const currentPage = ROUTE_LABELS[location.pathname] ?? "Dashboard";
  const playerCount = campaign?.playerCharacters.length ?? 0;
  const fbAvailable = isFirebaseAvailable();

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-700 bg-surface-850 px-4 md:px-6">
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-surface-400 hover:bg-surface-700 hover:text-surface-200 md:hidden"
          aria-label="Toggle sidebar"
        >
          <span className={`transition-transform duration-200 ${sidebarOpen ? "rotate-90" : ""}`}>
            ☰
          </span>
        </button>
        <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
          <span className="hidden sm:inline text-surface-500 truncate">
            {campaign?.name ?? "Arkla"}
          </span>
          <span className="hidden sm:inline text-surface-600">/</span>
          <span className="font-semibold text-surface-100 truncate">
            {currentPage}
          </span>
        </nav>
      </div>

      {/* Right: Firebase Status + Player Count + DM Mode */}
      <div className="flex items-center gap-2 shrink-0">
        <LiveSessionTimer />

        {/* Firebase Sync Indicator */}
        {fbAvailable && (
          <span
            className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors ${
              firebaseConnected
                ? "bg-divine-500/10 text-divine-400"
                : "bg-surface-800 text-surface-500"
            }`}
            title={
              firebaseConnected
                ? "Firebase sync active — data is backed up in real-time"
                : "Firebase connected — authenticating..."
            }
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                firebaseConnected ? "bg-divine-400 animate-pulse" : "bg-surface-500"
              }`}
            />
            Sync
          </span>
        )}

        {/* Player Count */}
        {playerCount > 0 && (
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-surface-800 px-3 py-1 text-xs text-surface-400">
            <span className="h-2 w-2 rounded-full bg-rogue-500" />
            {playerCount} {playerCount === 1 ? "player" : "players"}
          </span>
        )}

        {/* DM Mode Badge */}
        <span className="flex items-center gap-1.5 rounded-full bg-surface-800 px-3 py-1 text-xs text-surface-400">
          <span className="h-2 w-2 rounded-full bg-warrior-500 animate-pulse" />
          DM Mode
        </span>
      </div>
    </header>
  );
}
