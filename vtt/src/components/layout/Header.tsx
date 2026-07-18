import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";
import CompendiumDrawer from "./CompendiumDrawer";

export default function Header() {
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header className="h-16 glass-crystal border-b border-surface-700/20 flex items-center justify-between px-4 relative z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl hover:bg-surface-800/50 text-surface-400 hover:text-accent-300 transition-all duration-200"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="h-6 w-px bg-surface-600/30" />
        <span className="text-sm text-surface-300 font-semibold tracking-wide">Arkla</span>
      </div>

      <div className="flex items-center gap-3">
        <CompendiumDrawer />
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800/50 border border-surface-700/20 hover:border-accent-500/15 transition-all duration-200">
          <span className="text-xs">
            {role === "dm" ? "👑" : "⚔"}
          </span>
          <span className="text-xs text-surface-400 font-medium">{role === "dm" ? "DM" : "Player"}</span>
          <div className="h-4 w-px bg-surface-700/30" />
          <span className="text-sm text-surface-200 font-semibold">{username}</span>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-xl text-sm text-surface-400 hover:text-warrior-400 hover:bg-warrior-500/10 border border-transparent hover:border-warrior-500/20 transition-all duration-200"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
