/**
 * STᚱ VTT — App Shell (Premium)
 *
 * Master layout shell with h-screen w-screen overflow-hidden flex.
 * Uses bg-obsidian-radial for deep fantasy atmosphere.
 * Sidebar has rigid min-w boundaries. Canvas gets flex-grow.
 */

import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import ToastContainer from "@/components/ui/ToastContainer";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen w-screen overflow-hidden flex bg-obsidian-radial">
      {/* Atmospheric depth ring */}
      <div className="depth-ring fixed inset-0 pointer-events-none z-0" />
      {/* Ambient particle overlay */}
      <div className="fixed inset-0 bg-particle opacity-40 pointer-events-none z-0" />

      {/* Desktop sidebar — hidden on mobile, rigid min-w/max-w */}
      <div className="hidden sm:block shrink-0 min-w-0">
        <Sidebar />
      </div>

      {/* Main content area — flex-grow with min-h-0 to prevent overflow collapse */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6 scrollbar-gold">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
      <ToastContainer />
    </div>
  );
}
