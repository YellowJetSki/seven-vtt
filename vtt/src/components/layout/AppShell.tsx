/**
 * STᚱ VTT — App Shell (Premium Persistent Layout)
 *
 * Master layout shell with h-screen w-screen overflow-hidden flex.
 *
 * Architecture:
 *   Desktop (lg+):
 *     [ Sidebar (persistent) | Main Content Area ]
 *     Sidebar is ALWAYS visible — never disappears.
 *     Transitions between w-64 (full) and w-16 (collapsed icon-only).
 *     Hamburger triggers collapse/expand, NOT hide/show.
 *
 *   Mobile (< lg):
 *     [ Main Content Area (full width) ]
 *     Sidebar is a sliding overlay triggered by hamburger.
 *     MobileBottomNav provides persistent bottom navigation.
 *
 * Fixed padding via inline to avoid Tailwind v4 JIT scanning issues.
 * Atmospheric depth ring and particle overlay for premium feel.
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

      {/* ── SIDEBAR ──
          Desktop: persistent side-rail, always visible
          Mobile: drawer overlay handled by Sidebar component */}
      <div className="shrink-0 min-w-0">
        <Sidebar />
      </div>

      {/* ── MAIN CONTENT ──
          Flex-grow with min-h-0 to prevent overflow collapse.
          No conditional margins — sidebar handles its own width via flex shrink-0 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto scrollbar-gold">
          <div
            className="h-full"
            style={{ padding: "1.5rem 1.5rem 5rem" }}
          >
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation — only visible on < lg screens */}
      <MobileBottomNav />
      <ToastContainer />
    </div>
  );
}
