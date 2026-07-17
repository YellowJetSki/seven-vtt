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
import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useFirebaseMonitor } from "@/hooks/useFirebaseMonitor";

// Lazy-loaded pages (larger pages deferred for faster initial load)
const Encounters = lazy(() => import("@/pages/Encounters").then(m => ({ default: m.Encounters })));
const BattleMaps = lazy(() => import("@/pages/BattleMaps").then(m => ({ default: m.BattleMaps })));
const DmJournal = lazy(() => import("@/pages/DmJournal").then(m => ({ default: m.DmJournal })));
const HomebrewPanel = lazy(() => import("@/pages/HomebrewPanel").then(m => ({ default: m.HomebrewPanel })));
const CampaignSettings = lazy(() => import("@/pages/CampaignSettings").then(m => ({ default: m.CampaignSettings })));
const PlayerDashboard = lazy(() => import("@/pages/PlayerDashboard").then(m => ({ default: m.PlayerDashboard })));
const TheatricPage = lazy(() => import("@/pages/TheatricPage").then(m => ({ default: m.TheatricPage })));
const LoginPage = lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })));

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
      <Route path="/login" element={<Suspense fallback={<SuspenseFallback />}><LoginPage /></Suspense>} />

      {/* Public: Theatric View — no auth, no sidebar, just fullscreen map */}
      <Route path="/theatric" element={<Suspense fallback={<SuspenseFallback />}><TheatricPage /></Suspense>} />

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
        <Route path="dashboard" element={<ErrorBoundary><DmDashboard /></ErrorBoundary>} />
        <Route path="player-cards" element={<ErrorBoundary><PlayerCards /></ErrorBoundary>} />
        <Route path="homebrew" element={<Suspense fallback={<SuspenseFallback />}><ErrorBoundary><HomebrewPanel /></ErrorBoundary></Suspense>} />
        <Route path="encounters" element={<Suspense fallback={<SuspenseFallback />}><ErrorBoundary><Encounters /></ErrorBoundary></Suspense>} />
        <Route path="maps" element={<Suspense fallback={<SuspenseFallback />}><ErrorBoundary><BattleMaps /></ErrorBoundary></Suspense>} />
        <Route path="journal" element={<Suspense fallback={<SuspenseFallback />}><ErrorBoundary><DmJournal /></ErrorBoundary></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<SuspenseFallback />}><ErrorBoundary><CampaignSettings /></ErrorBoundary></Suspense>} />
      </Route>

      {/* Player-facing route (anonymous auth) */}
      <Route path="/player" element={<Suspense fallback={<SuspenseFallback />}><ErrorBoundary><PlayerDashboard /></ErrorBoundary></Suspense>} />

      {/* Default: redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
