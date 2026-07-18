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
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden sm:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 sm:pb-6">
          {children}
        </main>
      </div>
      {/* Mobile bottom navigation */}
      <MobileBottomNav />
      <ToastContainer />
    </div>
  );
}
