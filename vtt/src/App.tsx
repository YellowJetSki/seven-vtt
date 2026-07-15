import { useEffect, useState } from "react";
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
import { createDemoCampaign } from "@/data/demoCampaign";
import { importArklaJson } from "@/utils/importArklaCampaign";

const STORAGE_KEY = "str_vtt_campaign_loaded";

export default function App() {
  const state = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const setPlayerCharacterNames = useAuthStore((s) => s.setPlayerCharacterNames);
  const initialize = useAuthStore((s) => s.initialize);
  const [isArklaLoading, setIsArklaLoading] = useState(true);

  // On mount, ensure auth state is consistent
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Seed the campaign from Arkla.json on first mount if no campaign exists
  useEffect(() => {
    if (campaign) {
      setIsArklaLoading(false);
      return;
    }

    const alreadyLoaded = localStorage.getItem(STORAGE_KEY);
    if (alreadyLoaded) {
      // Already imported the Arkla campaign this session; use empty demo
      const demo = createDemoCampaign();
      setCampaign(demo);
      setIsArklaLoading(false);
      return;
    }

    // Try to load Arkla.json from the public folder
    const loadArkla = async () => {
      try {
        const response = await fetch("/Arkla.json");
        if (response.ok) {
          const text = await response.text();
          const arklaCampaign = importArklaJson(text);
          setCampaign(arklaCampaign);
          localStorage.setItem(STORAGE_KEY, "true");
          console.log(
            `[Arkla] Imported ${arklaCampaign.playerCharacters.length} characters from Arkla.json`,
          );
        } else {
          // Fall back to empty campaign if file not found
          const demo = createDemoCampaign();
          setCampaign(demo);
        }
      } catch {
        // Fallback on error
        const demo = createDemoCampaign();
        setCampaign(demo);
      } finally {
        setIsArklaLoading(false);
      }
    };

    loadArkla();
  }, [campaign, setCampaign]);

  // Sync character names to auth store for player login lookup
  useEffect(() => {
    if (campaign) {
      const firstNames = campaign.playerCharacters.map((c) =>
        c.name.split(" ")[0],
      );
      setPlayerCharacterNames(firstNames);
    } else {
      setPlayerCharacterNames([]);
    }
  }, [campaign, setPlayerCharacterNames]);

  // Global loading state (auth persistence check or Arkla.json loading)
  if (state === "loading" || isArklaLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-950">
        <div className="flex flex-col items-center gap-3">
          <span className="text-3xl text-accent-400 animate-pulse">Sᚱ</span>
          <p className="text-sm text-surface-500">
            {isArklaLoading ? "Loading campaign..." : "Loading..."}
          </p>
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
