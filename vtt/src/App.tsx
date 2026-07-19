import { Routes, Route, Navigate } from "react-router-dom";
import { useFirestoreSync } from "@/hooks/useFirestoreSync";
import { useFirestoreCombatSync } from "@/hooks/useFirestoreCombatSync";
import { useAuthStore } from "@/stores/authStore";
import { hasValidConfig } from "@/lib/firebase";
import LoginPage from "./pages/LoginPage";
import PlayerLoginPage from "./pages/PlayerLoginPage";
import PlayerSheetPage from "./pages/PlayerSheetPage";
import DmDashboard from "./pages/DmDashboard";
import PlayerCards from "./pages/PlayerCards";
import HomebrewPanel from "./pages/HomebrewPanel";
import Encounters from "./pages/Encounters";
import BattleMaps from "./pages/BattleMaps";
import DmJournal from "./pages/DmJournal";
import CampaignSettings from "./pages/CampaignSettings";
import TheatricPage from "./pages/TheatricPage";
import AuthGuard from "@/components/auth/AuthGuard";

function FirestoreSyncGate() {
  const isAuthed = useAuthStore((s) => s.state === "authenticated");
  const configValid = hasValidConfig();
  if (isAuthed && configValid) {
    useFirestoreSync();
    useFirestoreCombatSync();
  }
  return null;
}

export default function App() {
  return (
    <>
      <FirestoreSyncGate />

    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/theatric" element={<TheatricPage />} />
      <Route path="/player" element={<PlayerLoginPage />} />

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
      <Route path="/campaign/encounters" element={<AuthGuard requiredRole="dm"><Encounters /></AuthGuard>} />
      <Route path="/campaign/maps" element={<AuthGuard requiredRole="dm"><BattleMaps /></AuthGuard>} />
      <Route path="/campaign/journal" element={<AuthGuard requiredRole="dm"><DmJournal /></AuthGuard>} />
      <Route path="/campaign/settings" element={<AuthGuard requiredRole="dm"><CampaignSettings /></AuthGuard>} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </>
  );
}
