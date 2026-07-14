import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { KeyboardShortcutsOverlay } from "@/components/ui/KeyboardShortcutsOverlay";
import { CampaignScratchPad } from "./CampaignScratchPad";

export function AppShell() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <CampaignScratchPad />
      <ToastContainer />
      <KeyboardShortcutsOverlay />
    </div>
  );
}
