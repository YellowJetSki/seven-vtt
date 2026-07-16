/* ── Header ─────────────────────────────────────────────────────
 * Top navigation bar with:
 *  • Breadcrumb with page context
 *  • Live session timer
 *  • Firebase sync status indicator (green pulse)
 *  • Player count badge
 *  • DM mode indicator
 *  • Online/offline indicator (navigator.onLine)
 *  • Physical Dice indicator (no digital dice — real dice only)
 *  • Global Compendium quick-access button
 *  • Responsive: collapses on mobile
 *
 * UPGRADED:
 *  • Online/offline indicator
 *  • Pending sync count badge
 *  • Tooltips on all badges
 *  • Physical Dice companion badge
 *  • Keyboard shortcut indicator for compendium
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUiStore } from "@/stores/uiStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAuthStore } from "@/stores/authStore";
import { useCombatStore } from "@/stores/combatStore";
import { LiveSessionTimer } from "@/components/combat/LiveSessionTimer";
import { GlobalCompendium } from "@/components/ui/GlobalCompendium";
import { isFirebaseAvailable } from "@/lib/firebase";
import { getPendingSyncCount } from "@/hooks/useFirebaseSync";

const ROUTE_LABELS: Record<string, string> = {
  "/campaign/dashboard": "Command Center",
  "/campaign/player-cards": "Player Cards",
  "/campaign/homebrew": "Homebrew Library",
  "/campaign/encounters": "Combat Center",
  "/campaign/maps": "Battle Maps",
  "/campaign/journal": "DM Journal",
  "/campaign/settings": "Campaign Settings",
};

export function Header() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const campaign = useCampaignStore((s) => s.campaign);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const liveSession = useCombatStore((s) => s.liveSession);
  const location = useLocation();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Poll pending sync count
  useEffect(() => {
    const interval = setInterval(() => {
      setPendingSync(getPendingSyncCount());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentPage = ROUTE_LABELS[location.pathname] ?? "Dashboard";
  const playerCount = campaign?.playerCharacters.length ?? 0;
  const fbAvailable = isFirebaseAvailable();
  const sessionActive = liveSession.sessionStartedAt !== null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-700/80 bg-surface-850/95 px-4 backdrop-blur-md md:px-6">
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 md:hidden"
          aria-label="Toggle sidebar"
        >
          <span className={`transition-transform duration-200 ${sidebarOpen ? "rotate-90" : ""}`}>
            ☰
          </span>
        </button>
        <nav className="flex min-w-0 items-center gap-2 text-sm" aria-label="Breadcrumb">
          <span className="hidden max-w-[140px] truncate text-surface-500 sm:inline">
            {campaign?.name ?? "Arkla"}
          </span>
          <span className="hidden text-surface-600 sm:inline">/</span>
          <span className="truncate font-semibold text-surface-100">{currentPage}</span>
        </nav>
      </div>

      {/* Right: Status Indicators + Tools */}
      <div className="flex shrink-0 items-center gap-1.5">
        <LiveSessionTimer />

        {/* Physical Dice Companion Badge */}
        <span
          className="hidden items-center gap-1.5 rounded-full bg-mage-500/10 px-2.5 py-1 text-[11px] font-medium text-mage-400 sm:flex"
          title="STᚱ VTT uses real dice — roll physical dice alongside the app"
        >
          <span className="text-xs">🎲</span>
          <span className="hidden md:inline">Physical Dice</span>
        </span>

        {/* Global Compendium */}
        <GlobalCompendium />

        {/* Session Active Badge */}
        {sessionActive && (
          <span
            className="hidden items-center gap-1.5 rounded-full bg-accent-500/10 px-2.5 py-1 text-[11px] font-medium text-accent-400 sm:flex"
            title="Session is live — players can see updates"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
            Session Live
          </span>
        )}

        {/* Online/Offline Indicator */}
        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:flex ${
            isOnline
              ? "bg-rogue-500/10 text-rogue-400"
              : "bg-warrior-500/10 text-warrior-400"
          }`}
          title={isOnline ? "Connected to the internet" : "Working offline — changes saved locally"}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOnline ? "bg-rogue-400" : "bg-warrior-400"
            }`}
          />
          {isOnline ? "Online" : "Offline"}
        </span>

        {/* Pending Sync Badge */}
        {pendingSync > 0 && isOnline && (
          <span
            className="hidden items-center gap-1.5 rounded-full bg-divine-500/10 px-2.5 py-1 text-[11px] font-medium text-divine-400 sm:flex"
            title={`${pendingSync} pending change${pendingSync !== 1 ? "s" : ""} waiting to sync`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-divine-400" />
            {pendingSync}
          </span>
        )}

        {/* Firebase Sync Indicator */}
        {fbAvailable && (
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors sm:flex ${
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
                firebaseConnected ? "animate-pulse bg-divine-400" : "bg-surface-500"
              }`}
            />
            Sync
          </span>
        )}

        {/* Player Count */}
        {playerCount > 0 && (
          <span
            className="hidden items-center gap-1.5 rounded-full bg-rogue-500/10 px-3 py-1 text-xs font-medium text-rogue-400 sm:flex"
            title={`${playerCount} player character${playerCount !== 1 ? "s" : ""} in the party`}
          >
            <span className="h-2 w-2 rounded-full bg-rogue-500" />
            {playerCount} {playerCount === 1 ? "PC" : "PCs"}
          </span>
        )}

        {/* DM Mode Badge */}
        <span
          className="flex items-center gap-1.5 rounded-full bg-warrior-500/10 px-3 py-1 text-xs font-medium text-warrior-400"
          title="Dungeon Master mode"
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-warrior-500" />
          <span className="hidden sm:inline">DM</span>
        </span>
      </div>
    </header>
  );
}
