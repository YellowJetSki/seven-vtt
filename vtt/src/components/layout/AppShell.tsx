/* ── App Shell ─────────────────────────────────────────────────
 * Root layout for all DM routes. Wraps the sidebar, header,
 * outlet (page content), toast container, and global overlays.
 *
 * ── Global Features ──────────────────────────────────────────
 * • Firebase real-time sync (for DM)
 * • Firebase connection health monitor with auto-reconnect
 * • Keyboard shortcuts overlay (Ctrl+/)
 * • Command palette (Cmd/Ctrl+K)
 * • Floating scratch pad (Ctrl+Shift+N)
 * • Toast notifications
 * • Error boundary — catches render crashes gracefully
 * ─────────────────────────────────────────────────────────────── */

import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { KeyboardShortcutsOverlay } from "@/components/ui/KeyboardShortcutsOverlay";
import { CampaignScratchPad } from "./CampaignScratchPad";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";
import { useFirebaseMonitor } from "@/hooks/useFirebaseMonitor";
import { useSaveShortcut } from "@/hooks/useSaveShortcut";
import { useCampaignStore } from "@/stores/campaignStore";
import { useAuthStore } from "@/stores/authStore";

export function AppShell() {
  // Start Firebase real-time sync for campaign, combat, and homebrew data
  useFirebaseSync();

  // Start Firebase connection health monitor with auto-reconnect
  useFirebaseMonitor();

  // Track route for ErrorBoundary reset key
  const location = useLocation();

  // Ctrl+S save shortcut
  useSaveShortcut();

  // Sync player identifiers from campaign to auth store on mount/rehydrate
  const campaign = useCampaignStore((s) => s.campaign);
  const setPlayerIdentifiers = useAuthStore((s) => s.setPlayerIdentifiers);
  const playerIdentifiers = useAuthStore((s) => s.playerIdentifiers);

  useEffect(() => {
    if (campaign?.playerCharacters && campaign.playerCharacters.length > 0 && playerIdentifiers.length === 0) {
      const identifiers = campaign.playerCharacters.map((pc) => ({
        label: pc.name,
        characterId: pc.id,
      }));
      setPlayerIdentifiers(identifiers);
    }
  }, [campaign, setPlayerIdentifiers, playerIdentifiers]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <CampaignScratchPad />
      <ToastContainer />
      <KeyboardShortcutsOverlay />
      {/* Global command palette: Cmd/Ctrl+K */}
      <CommandPalette />
    </div>
  );
}
