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
import type { PlayerIdentifier } from "@/stores/authStore";

export default function App() {
  const state = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const campaign = useCampaignStore((s) => s.campaign);
  const setCampaign = useCampaignStore((s) => s.setCampaign);
  const setPlayerIdentifiers = useAuthStore((s) => s.setPlayerIdentifiers);

  // Ensure a campaign exists in the store.
  // If no campaign has been created yet (fresh visit), the store's
  // default state will be used; DM actions will prompt campaign creation.
  useEffect(() => {
    if (!campaign) {
      // The campaign store will handle seeding from localStorage persist.
      // If nothing is persisted, the DM can create a campaign on first login.
      return;
    }
  }, [campaign, setCampaign]);

  // Sync character identifiers (first name + alias) to auth store for player lookup
  useEffect(() => {
    if (campaign) {
      const identifiers: PlayerIdentifier[] = [];

      for (const pc of campaign.playerCharacters) {
        // First word of the character's name
        const firstName = pc.name.split(" ")[0];
        identifiers.push({ label: firstName, characterId: pc.id });

        // Optional alias (e.g., "Strider" from "Edmund 'Strider' Tudul")
        if (pc.alias && pc.alias.trim()) {
          identifiers.push({ label: pc.alias.trim(), characterId: pc.id });
        }
      }

      setPlayerIdentifiers(identifiers);
    } else {
      setPlayerIdentifiers([]);
    }
  }, [campaign, setPlayerIdentifiers]);

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
