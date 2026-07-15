/* ── STᚱ VTT — App Root ────────────────────────────────────────
 * Main routing tree with auth guard, theme detection, and Firebase sync.
 *
 * ROUTING ARCHITECTURE:
 *   /login          → Player/DM login
 *   /theatric       → Fullscreen battle map (no auth, no shell)
 *   /campaign/*     → Authenticated DM routes (wrapped in AppShell)
 *   /player         → Player-facing dashboard (anonymously authenticated)
 *   *               → Redirect to /login
 *
 * THEME & UI:
 *   - Theme is detected from system preference via CSS media query
 *   - Dark mode enforced for VTT immersion (all UI baked dark)
 *   - Tailwind CSS with custom design system tokens
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { DmDashboard } from "@/pages/DmDashboard";
import { PlayerCards } from "@/pages/PlayerCards";
import { HomebrewPanel } from "@/pages/HomebrewPanel";
import { DmJournal } from "@/pages/DmJournal";
import { CampaignSettings } from "@/pages/CampaignSettings";
import { PlayerDashboard } from "@/pages/PlayerDashboard";
import { TheatricPage } from "@/pages/TheatricPage";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useFirebaseMonitor } from "@/hooks/useFirebaseMonitor";

// Lazy-loaded pages
const Encounters = lazy(() => import("@/pages/Encounters").then(m => ({ default: m.Encounters })));
const BattleMaps = lazy(() => import("@/pages/BattleMaps").then(m => ({ default: m.BattleMaps })));

function SuspenseFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
    </div>
  );
}

export default function App() {
  // Monitor Firebase connection health (shows indicator, auto-reconnect)
  useFirebaseMonitor();

  // Run legacy data migration once on mount
  useEffect(() => {
    import("@/lib/migrate-legacy-data").then((mod) => {
      mod.runMigrationIfNeeded();
    });
  }, []);

  return (
    <Routes>
      {/* Public: Login (no shell) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Public: Theatric View — no auth, no sidebar, just fullscreen map */}
      <Route path="/theatric" element={<TheatricPage />} />

      {/* Authenticated DM routes (with sidebar shell) */}
      <Route
        path="/campaign"
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DmDashboard />} />
        <Route path="player-cards" element={<PlayerCards />} />
        <Route path="homebrew" element={<HomebrewPanel />} />
        <Route path="encounters" element={
          <Suspense fallback={<SuspenseFallback />}>
            <Encounters />
          </Suspense>
        } />
        <Route path="maps" element={
          <Suspense fallback={<SuspenseFallback />}>
            <BattleMaps />
          </Suspense>
        } />
        <Route path="journal" element={<DmJournal />} />
        <Route path="settings" element={<CampaignSettings />} />
      </Route>

      {/* Player-facing route (anonymous auth) */}
      <Route path="/player" element={<PlayerDashboard />} />

      {/* Default: redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
