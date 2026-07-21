import { useEffect, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";
import { useFirestoreCombatSync } from "@/hooks/useFirestoreCombatSync";
import { useFirestoreEntitySync } from "@/hooks/useFirestoreEntitySync";
import { useAuthStore } from "@/stores/authStore";
import { onFirebaseAuthChanged, hasValidConfig } from "@/lib/firebase";
import ConnectionBanner from "@/components/ui/ConnectionBanner";
import LoginPage from "./pages/LoginPage";
import PlayerLoginPage from "./pages/PlayerLoginPage";
import PlayerJoinPage from "./pages/PlayerJoinPage";
import PlayerSheetPage from "./pages/PlayerSheetPage";
import DmDashboard from "./pages/DmDashboard";
import PlayerCards from "./pages/PlayerCards";
import HomebrewPanel from "./pages/HomebrewPanel";
import UnifiedEncounterHub from "./pages/UnifiedEncounterHub";
import BattleMaps from "./pages/BattleMaps";
import DmJournal from "./pages/DmJournal";
import CampaignSettings from "./pages/CampaignSettings";
import TheatricPage from "./pages/TheatricPage";
import AssetGallery from "./pages/AssetGallery";
import AuthGuard from "@/components/auth/AuthGuard";

function FirestoreSyncGate() {
  // Always call hooks unconditionally — the hooks themselves guard internally
  useFirestoreSync();
  useFirestoreCombatSync();
  useFirestoreEntitySync();
  return null;
}

function FirebaseAuthGate() {
  const login = useAuthStore((s) => s.login);
  const loginRef = useRef(login);
  loginRef.current = login;

  // Firebase Auth state listener — restores session on page refresh
  // Uses refs to avoid stale closures and re-subscription loops
  useEffect(() => {
    if (!hasValidConfig()) return;

    const unsub = onFirebaseAuthChanged((user) => {
      if (user) {
        // Firebase restored a user session — restore Zustand auth state
        // by setting the store directly. The Zustand login() function
        // checks a hardcoded password, so we bypass it here since
        // Firebase Auth has already validated the user.
        const state = useAuthStore.getState();
        if (state.state === "unauthenticated") {
          const emailName = user.email?.split("@")[0] || "DM";
          state.login(emailName, "Jello1");
        }
        state.setFirebaseConnected(true);
      }
    });

    return unsub;
  }, []); // Register once on mount — refs prevent stale closures

  return null;
}

export default function App() {
  return (
    <>
      <FirestoreSyncGate />
      <FirebaseAuthGate />
      <ConnectionBanner />

    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/theatric" element={<TheatricPage />} />
      <Route path="/player" element={<PlayerLoginPage />} />
      <Route path="/player/join" element={<PlayerJoinPage />} />

      {/* Player Sheet — no role guard needed, auth via characterId */}
      <Route
        path="/player/sheet"
        element={
          <AuthGuard requiredRole="player">
            <PlayerSheetPage />
          </AuthGuard>
        }
      />

      {/* DM Campaign Routes — Auth Guarded */}
      <Route path="/campaign/dashboard" element={<AuthGuard requiredRole="dm"><DmDashboard /></AuthGuard>} />
      <Route path="/campaign/player-cards" element={<AuthGuard requiredRole="dm"><PlayerCards /></AuthGuard>} />
      <Route path="/campaign/homebrew" element={<AuthGuard requiredRole="dm"><HomebrewPanel /></AuthGuard>} />
      <Route path="/campaign/encounters" element={<AuthGuard requiredRole="dm"><UnifiedEncounterHub /></AuthGuard>} />
      <Route path="/campaign/enemies" element={<Navigate to="/campaign/encounters" replace />} />
      <Route path="/campaign/maps" element={<AuthGuard requiredRole="dm"><BattleMaps /></AuthGuard>} />
      <Route path="/campaign/journal" element={<AuthGuard requiredRole="dm"><DmJournal /></AuthGuard>} />
      <Route path="/campaign/settings" element={<AuthGuard requiredRole="dm"><CampaignSettings /></AuthGuard>} />
      <Route path="/campaign/assets" element={<AuthGuard requiredRole="dm"><AssetGallery /></AuthGuard>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}
