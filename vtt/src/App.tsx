import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DmDashboard from "./pages/DmDashboard";
import TheatricPage from "./pages/TheatricPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/campaign/dashboard" element={<DmDashboard />} />
      <Route path="/theatric" element={<TheatricPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
