import { useAuthStore } from "@/stores/authStore";
import { useUIStore } from "@/stores/uiStore";

export default function Header() {
  const username = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <header className="h-16 glass border-b border-surface-700/50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-surface-800/60 text-surface-400 transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="h-6 w-px bg-surface-700/50" />
        <span className="text-sm text-surface-300 font-medium">Arkla</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-800/50 border border-surface-700/30">
          <span className="text-xs text-surface-400">
            {role === "dm" ? "👑 DM" : "⚔ Player"}
          </span>
          <span className="text-sm text-surface-200 font-medium">{username}</span>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg text-sm text-surface-400 hover:text-warrior-400 hover:bg-warrior-500/10 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
