import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { normalizedSync } from "@/lib/normalized-firebase-service";
import { isFirebaseAvailable } from "@/lib/firebase";
import { migrateLegacyCampaignData } from "@/lib/migrate-legacy-data";

import { LoginPage } from "@/pages/LoginPage";
import { DmDashboard } from "@/pages/DmDashboard";
import { PlayerCards } from "@/pages/PlayerCards";
import { HomebrewPanel } from "@/pages/HomebrewPanel";
import { Encounters } from "@/pages/Encounters";
import { BattleMaps } from "@/pages/BattleMaps";
import { DmJournal } from "@/pages/DmJournal";
import { CampaignSettings } from "@/pages/CampaignSettings";
import { PlayerDashboard } from "@/pages/PlayerDashboard";
import { TheatricPage } from "@/pages/TheatricPage";

import { AppShell } from "@/components/layout/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";

const CAMPAIGN_ID = "arkla";

export default function App() {
  const state = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);

  /* ── Migrate legacy localStorage data on first boot ──────────
   * This runs once to convert the old monolithic campaign storage
   * format to the new normalized format. Idempotent — safe on every load.
   */
  useEffect(() => {
    migrateLegacyCampaignData();
  }, []);

  /* ── Initialize Firebase sync listeners on mount ───────────
   * Uses the normalized subcollection-based syncManager.
   * Subscribes to campaign, session, and homebrew Firestore documents
   * via onSnapshot, hydrating all Zustand stores in real-time.
   */
  useEffect(() => {
    if (!isFirebaseAvailable()) return;

    // Start listening to all Firestore subcollections for the Arkla campaign
    normalizedSync.start(CAMPAIGN_ID);

    return () => {
      normalizedSync.stop(CAMPAIGN_ID);
    };
  }, []);

  return (
    <Routes>
      {/* Public: Login */}
      <Route
        path="/login"
        element={
          state === "authenticated" ? (
            role === "dm" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/player" replace />
            )
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Public: Theatric View — no auth, no sidebar, just fullscreen map */}
      <Route path="/theatric" element={<TheatricPage />} />

      {/* Authenticated DM routes (with sidebar shell) */}
      <Route
        element={
          <AuthGuard requiredRole="dm">
            <AppShell />
          </AuthGuard>
        }
      >
        <Route path="/dashboard" element={<DmDashboard />} />
        <Route path="/characters" element={<PlayerCards />} />
        <Route path="/homebrew" element={<HomebrewPanel />} />
        <Route path="/encounters" element={<Encounters />} />
        <Route path="/maps" element={<BattleMaps />} />
        <Route path="/journal" element={<DmJournal />} />
        <Route path="/settings" element={<CampaignSettings />} />
      </Route>

      {/* Authenticated Player route (no sidebar shell) */}
      <Route
        path="/player"
        element={
          <AuthGuard requiredRole="player">
            <PlayerDashboard />
          </AuthGuard>
        }
      />

      {/* Catch-all: redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
