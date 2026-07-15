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

import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { KeyboardShortcutsOverlay } from "@/components/ui/KeyboardShortcutsOverlay";
import { CampaignScratchPad } from "./CampaignScratchPad";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";
import { useFirebaseMonitor } from "@/hooks/useFirebaseMonitor";

export function AppShell() {
  // Start Firebase real-time sync for campaign, combat, and homebrew data
  useFirebaseSync();

  // Start Firebase connection health monitor with auto-reconnect
  useFirebaseMonitor();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ErrorBoundary>
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
