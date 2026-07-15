import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { LoginPage } from "@/pages/LoginPage";
import { DmDashboard } from "@/pages/DmDashboard";
import { PlayerCards } from "@/pages/PlayerCards";
import { HomebrewPanel } from "@/pages/HomebrewPanel";
import { Encounters } from "@/pages/Encounters";
import { BattleMaps } from "@/pages/BattleMaps";
import { DmJournal } from "@/pages/DmJournal";
import { CampaignSettings } from "@/pages/CampaignSettings";
import { PlayerDashboard } from "@/pages/PlayerDashboard";
import { createDemoCampaign, DEMO_PLAYER_FIRST_NAMES } from "@/data/demoCampaign";

export default function App() {
  const state = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const setPlayerCharacterNames = useAuthStore((s) => s.setPlayerCharacterNames);
  const initialize = useAuthStore((s) => s.initialize);

  // On mount, ensure auth state is consistent
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Seed the campaign with demo data once on first mount if no campaign exists
  useEffect(() => {
    if (!campaign) {
      const demo = createDemoCampaign();
      setCampaign(demo);
    }
  }, [campaign, setCampaign]);

  // Sync character names to auth store for player login lookup
  useEffect(() => {
    if (campaign) {
      const firstNames = campaign.playerCharacters.map(
        (c) => c.name.split(" ")[0],
      );
      setPlayerCharacterNames(firstNames);
    } else {
      // Fallback: use demo names if campaign not yet loaded
      setPlayerCharacterNames(DEMO_PLAYER_FIRST_NAMES);
    }
  }, [campaign, setPlayerCharacterNames]);

  // Global loading state (auth persistence check)
  if (state === "loading") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl text-accent-400 animate-pulse">Sᚱ</span>
          <p className="text-sm text-surface-500">Loading...</p>
        </div>
      </div>
    );
  }

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

      {/* DM Routes (wrapped in AppShell with Sidebar) */}
      <Route
        element={
          <AuthGuard requiredRole="dm">
            <AppShell />
          </AuthGuard>
        }
      >
        <Route path="/dashboard" element={<DmDashboard />} />
        <Route path="/players" element={<PlayerCards />} />
        <Route path="/homebrew" element={<HomebrewPanel />} />
        <Route path="/encounters" element={<Encounters />} />
        <Route path="/maps" element={<BattleMaps />} />
        <Route path="/journal" element={<DmJournal />} />
        <Route path="/settings" element={<CampaignSettings />} />
      </Route>

      {/* Player Route (no sidebar, just the character sheet) */}
      <Route
        path="/player"
        element={
          <AuthGuard requiredRole="player">
            <PlayerDashboard />
          </AuthGuard>
        }
      />

      {/* Catch-all redirect */}
      <Route
        path="*"
        element={
          state === "authenticated" ? (
            role === "dm" ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/player" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
