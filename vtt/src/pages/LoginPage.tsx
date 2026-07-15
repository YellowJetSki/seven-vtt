import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

type LoginMode = "select" | "dm" | "player";

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("select");
  const login = useAuthStore((s) => s.login);
  const loginAsPlayer = useAuthStore((s) => s.loginAsPlayer);
  const showToast = useUiStore((s) => s.showToast);
  /* DM Form State */
  const [dmUsername, setDmUsername] = useState("");
  const [dmPassword, setDmPassword] = useState("");
  const [dmError, setDmError] = useState("");
  const [dmLoading, setDmLoading] = useState(false);

  /* Player Form State */
  const [playerName, setPlayerName] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [playerLoading, setPlayerLoading] = useState(false);

  /* Handlers */

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
              Virtual Tabletop · Sign In
            </p>
          </div>

          {/* Mode Selector */}
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

          {/* DM Login Form */}
          {mode === "dm" && (
            <form onSubmit={handleDmLogin} className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleBack} className="rounded-lg p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-200 transition-colors">
                  ← Back
                </button>
                <p className="text-sm font-medium text-surface-200">DM Sign In</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Username</label>
                <input value={dmUsername} onChange={(e) => setDmUsername(e.target.value)} placeholder="Enter your DM username" required
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Password</label>
                <input type="password" value={dmPassword} onChange={(e) => setDmPassword(e.target.value)} placeholder="Enter your password" required
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>

              {dmError && (
                <div className="rounded-lg bg-warrior-500/10 px-3 py-2 text-xs text-warrior-400">{dmError}</div>
              )}

              <button type="submit" disabled={dmLoading || !dmUsername || !dmPassword}
                className="w-full rounded-lg bg-accent-600 py-2.5 text-sm font-medium text-white hover:bg-accent-500 disabled:opacity-40 transition-colors">
                {dmLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Player Login Form */}
          {mode === "player" && (
            <form onSubmit={handlePlayerLogin} className="space-y-5">
              <div className="flex items-center gap-3">
                <button type="button" onClick={handleBack} className="rounded-lg p-1 text-surface-500 hover:bg-surface-800 hover:text-surface-200 transition-colors">
                  ← Back
                </button>
                <p className="text-sm font-medium text-surface-200">Player Sign In</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-surface-400">Your Name</label>
                <input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Enter your character name" required
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-rogue-500 focus:outline-none" />
              </div>

              {playerError && (
                <div className="rounded-lg bg-warrior-500/10 px-3 py-2 text-xs text-warrior-400">{playerError}</div>
              )}

              <button type="submit" disabled={playerLoading || !playerName.trim()}
                className="w-full rounded-lg bg-rogue-600 py-2.5 text-sm font-medium text-white hover:bg-rogue-500 disabled:opacity-40 transition-colors">
                {playerLoading ? "Entering..." : "Enter Game"}
              </button>

              <p className="text-center text-xs text-surface-500">
                Sign in with the name your DM used for your character.
              </p>
            </form>
          )}

          {/* Footer */}
          <p className="mt-6 text-center text-[11px] text-surface-600">
            STᚱ VTT · Virtual Tabletop
          </p>
        </div>
      </div>
    </div>
  );
}
