import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DmDashboard from "./pages/DmDashboard";
import PlayerCards from "./pages/PlayerCards";
import HomebrewPanel from "./pages/HomebrewPanel";
import Encounters from "./pages/Encounters";
import BattleMaps from "./pages/BattleMaps";
import DmJournal from "./pages/DmJournal";
import CampaignSettings from "./pages/CampaignSettings";
import TheatricPage from "./pages/TheatricPage";
import AuthGuard from "@/components/auth/AuthGuard";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/theatric" element={<TheatricPage />} />
      <Route path="/player" element={<LoginPage />} />

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
  );
}
