/* ── Login Page ────────────────────────────────────────────────
 * Dual-mode login screen supporting DM (username/password) and
 * Player (character name lookup) authentication with Firebase Auth.
 *
 * AUTH FLOW:
 *   1. App-level auth: validate against env/hardcoded DM credentials
 *      or campaign's player character list
 *   2. Firebase Auth: DM signs in with Anonymous Firebase Auth for
 *      Firestore write access; Player signs in anonymously for read
 *   3. On success: redirect to DM dashboard (/campaign/dashboard)
 *      or player dashboard (/player)
 * ─────────────────────────────────────────────────────────────── */

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { loginFirebaseDm, loginFirebasePlayer, logoutFirebase } from "@/lib/firebase";

type LoginMode = "select" | "dm" | "player";

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("select");
  const login = useAuthStore((s) => s.login);
  const loginAsPlayer = useAuthStore((s) => s.loginAsPlayer);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setFirebaseAuthLoading = useAuthStore((s) => s.setFirebaseAuthLoading);
  const showToast = useUiStore((s) => s.showToast);
  const navigate = useNavigate();

  /* DM Form State */
  const [dmUsername, setDmUsername] = useState("");
  const [dmPassword, setDmPassword] = useState("");
  const [dmError, setDmError] = useState("");
  const [dmLoading, setDmLoading] = useState(false);

  /* Player Form State */
  const [playerName, setPlayerName] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);

  /* ── DM Login ── */

  const handleDmLogin = async (e: FormEvent) => {
    e.preventDefault();
    setDmError("");
    setDmLoading(true);

    const result = login(dmUsername, dmPassword);
    if (!result.success) {
      setDmError(result.error ?? "Login failed.");
      setDmLoading(false);
      return;
    }

    // Authenticate with Firebase Auth for Firestore writes
    setFirebaseAuthLoading(true);
    const firebaseOk = await loginFirebaseDm();
    setFirebaseAuthLoading(false);

    if (!firebaseOk) {
      setFirebaseConnected(false);
      showToast({
        message: "Welcome back, Dungeon Master. (Cloud sync unavailable — check Firebase Auth config)",
        type: "warning",
        duration: 5000,
      });
    } else {
      setFirebaseConnected(true);
      showToast({
        message: "Welcome back, Dungeon Master. Cloud sync is active.",
        type: "success",
        duration: 3000,
      });
    }

    setDmLoading(false);

    // Navigate to DM dashboard
    navigate("/campaign/dashboard", { replace: true });
  };

  /* ── Player Login ── */

  const handlePlayerLogin = async (e: FormEvent) => {
    e.preventDefault();
    setPlayerError("");
    setPlayerLoading(true);

    const result = loginAsPlayer(playerName);
    if (!result.success) {
      setPlayerError(result.error ?? "Login failed.");
      setPlayerLoading(false);
      return;
    }

    const firebaseOk = await loginFirebasePlayer();
    if (firebaseOk) {
      setFirebaseConnected(true);
      showToast({
        message: `Welcome, ${playerName.trim()}! Character sheet synced.`,
        type: "success",
      });
    } else {
      setFirebaseConnected(false);
      showToast({
        message: "Welcome! (Cloud sync unavailable)",
        type: "warning",
      });
    }

    setPlayerLoading(false);

    // Navigate to player dashboard
    navigate("/player", { replace: true });
  };

  /* ── Render ── */

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface-950">
      {/* Background Glow Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-mage-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-surface-700/50 bg-surface-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Brand Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-accent-500/10 ring-1 ring-accent-500/20">
              <span className="text-3xl font-bold text-accent-400">Sᚱ</span>
            </div>
            <h1 className="text-xl font-bold text-surface-100">STᚱ VTT</h1>
            <p className="mt-1 text-sm text-surface-500">Virtual Tabletop · Sign In</p>
          </div>

          {/* Role Selection */}
          {mode === "select" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-surface-400">Who are you?</p>

              <button onClick={() => setMode("dm")}
                className="w-full rounded-xl border border-surface-700 bg-surface-800 px-6 py-4 text-left transition-all hover:border-accent-500/50 hover:bg-surface-700 group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-lg group-hover:bg-accent-500/20">👑</span>
                  <div>
                    <p className="font-semibold text-surface-100">Dungeon Master</p>
                    <p className="text-xs text-surface-500">Access the DM Command Center</p>
                  </div>
                </div>
              </button>

              <button onClick={() => setMode("player")}
                className="w-full rounded-xl border border-surface-700 bg-surface-800 px-6 py-4 text-left transition-all hover:border-rogue-500/50 hover:bg-surface-700 group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rogue-500/10 text-lg group-hover:bg-rogue-500/20">⚔</span>
                  <div>
                    <p className="font-semibold text-surface-100">Player</p>
                    <p className="text-xs text-surface-500">View your character sheet</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* DM Sign In Form */}
          {mode === "dm" && (
            <form onSubmit={handleDmLogin} className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => { setMode("select"); setDmError(""); }}
                  className="rounded-lg p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-200 transition-colors"
                >← Back</button>
                <p className="text-sm font-medium text-surface-200">DM Sign In</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Username</label>
                <input
                  value={dmUsername}
                  onChange={(e) => setDmUsername(e.target.value)}
                  placeholder="Enter your DM username"
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Password</label>
                <input
                  type="password"
                  value={dmPassword}
                  onChange={(e) => setDmPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {dmError && (
                <p className="text-xs font-medium text-warrior-400">{dmError}</p>
              )}

              <button
                type="submit"
                disabled={!dmUsername.trim() || !dmPassword.trim() || dmLoading}
                className="w-full rounded-lg bg-accent-600 py-2.5 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-40 transition-colors"
              >
                {dmLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Player Sign In */}
          {mode === "player" && (
            <form onSubmit={handlePlayerLogin} className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => { setMode("select"); setPlayerError(""); }}
                  className="rounded-lg p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-200 transition-colors"
                >← Back</button>
                <p className="text-sm font-medium text-surface-200">Player Sign In</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Your Character Name</label>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your character's name"
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
                />
              </div>

              {playerError && (
                <p className="text-xs font-medium text-warrior-400">{playerError}</p>
              )}

              <button
                type="submit"
                disabled={!playerName.trim() || playerLoading}
                className="w-full rounded-lg bg-rogue-600 py-2.5 text-sm font-medium text-white hover:bg-rogue-500 disabled:opacity-40 transition-colors"
              >
                {playerLoading ? "Signing in..." : "Enter the Game"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-[11px] text-surface-600">STᚱ VTT · Virtual Tabletop</p>
        </div>
      </div>
    </div>
  );
}
