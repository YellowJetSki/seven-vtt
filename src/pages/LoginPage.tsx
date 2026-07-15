import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

type LoginMode = "select" | "dm" | "player";

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("select");
  const login = useAuthStore((s) => s.login);
  const loginAsPlayer = useAuthStore((s) => s.loginAsPlayer);
  const showToast = useUiStore((s) => s.showToast);
  /* ── DM Form State ── */
  const [dmUsername, setDmUsername] = useState("");
  const [dmPassword, setDmPassword] = useState("");
  const [dmError, setDmError] = useState("");
  const [dmLoading, setDmLoading] = useState(false);

  /* ── Player Form State ── */
  const [playerName, setPlayerName] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);

  /* ── Handlers ── */

  const handleDmLogin = async (e: FormEvent) => {
    e.preventDefault();
    setDmError("");
    setDmLoading(true);

    try {
      const result = await login(dmUsername, dmPassword);
      if (!result.success) {
        setDmError(result.error ?? "Login failed.");
      } else {
        showToast({ message: "Welcome back, Dungeon Master.", type: "success" });
      }
    } catch {
      setDmError("An unexpected error occurred. Please try again.");
    } finally {
      setDmLoading(false);
    }
  };

  const handlePlayerLogin = (e: FormEvent) => {
    e.preventDefault();
    setPlayerError("");
    setPlayerLoading(true);

    setTimeout(() => {
      const result = loginAsPlayer(playerName);
      setPlayerLoading(false);
      if (!result.success) {
        setPlayerError(result.error ?? "Login failed.");
      } else {
        showToast({
          message: `Welcome, ${result.characterId}!`,
          type: "success",
        });
      }
    }, 400);
  };

  const handleBack = () => {
    setMode("select");
    setDmError("");
    setPlayerError("");
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface-950">
      {/* Ambient Glow Effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-mage-500/10 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-surface-700/50 bg-surface-900/80 p-8 shadow-2xl backdrop-blur-xl">
          {/* Brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-accent-500/10 ring-1 ring-accent-500/20">
              <span className="text-3xl font-bold text-accent-400">Sᚱ</span>
            </div>
            <h1 className="text-xl font-bold text-surface-100">STᚱ VTT</h1>
            <p className="mt-1 text-sm text-surface-500">
              Arkla Campaign · Sign In
            </p>
          </div>

          {/* ── Mode Selector ── */}
          {mode === "select" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-surface-400">
                Who are you?
              </p>
              <button
                onClick={() => setMode("dm")}
                className="w-full rounded-xl border border-surface-700 bg-surface-800 px-6 py-4 text-left transition-all hover:border-accent-500/50 hover:bg-surface-700 group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-lg group-hover:bg-accent-500/20">
                    👑
                  </span>
                  <div>
                    <p className="font-semibold text-surface-100">Dungeon Master</p>
                    <p className="text-xs text-surface-500">
                      Access the DM Command Center
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMode("player")}
                className="w-full rounded-xl border border-surface-700 bg-surface-800 px-6 py-4 text-left transition-all hover:border-rogue-500/50 hover:bg-surface-700 group"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-rogue-500/10 text-lg group-hover:bg-rogue-500/20">
                    ⚔
                  </span>
                  <div>
                    <p className="font-semibold text-surface-100">Player</p>
                    <p className="text-xs text-surface-500">
                      View your character sheet
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* ── DM Login Form ── */}
          {mode === "dm" && (
            <form onSubmit={handleDmLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="dm-username"
                  className="mb-1.5 block text-xs font-medium text-surface-400"
                >
                  Username
                </label>
                <input
                  id="dm-username"
                  type="text"
                  value={dmUsername}
                  onChange={(e) => setDmUsername(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                  autoFocus
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="dm-password"
                  className="mb-1.5 block text-xs font-medium text-surface-400"
                >
                  Password
                </label>
                <input
                  id="dm-password"
                  type="password"
                  value={dmPassword}
                  onChange={(e) => setDmPassword(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 transition-colors focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
                />
              </div>

              {dmError && (
                <p className="rounded-lg bg-warrior-500/10 px-3 py-2 text-xs text-warrior-400">
                  {dmError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={dmLoading}
                  className="flex-1 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {dmLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In as DM"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ── Player Login Form ── */}
          {mode === "player" && (
            <form onSubmit={handlePlayerLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="player-name"
                  className="mb-1.5 block text-xs font-medium text-surface-400"
                >
                  Your Character's First Name
                </label>
                <input
                  id="player-name"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="e.g. Wendy, Strider, Toern"
                  autoFocus
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3.5 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 transition-colors focus:border-rogue-500 focus:ring-1 focus:ring-rogue-500 focus:outline-none"
                />
                <p className="mt-1.5 text-[11px] text-surface-500">
                  Enter the first name of your character (case-insensitive).
                </p>
              </div>

              {playerError && (
                <p className="rounded-lg bg-warrior-500/10 px-3 py-2 text-xs text-warrior-400">
                  {playerError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={playerLoading}
                  className="flex-1 rounded-lg bg-rogue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rogue-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  {playerLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Checking...
                    </span>
                  ) : (
                    "Enter as Player"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-surface-600">
            STᚱ VTT · Powered by the Arkla Campaign
          </p>
        </div>
      </div>
    </div>
  );
}
