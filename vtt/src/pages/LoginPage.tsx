import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/ui/Button";

type LoginStep = "role" | "dm" | "player";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);

  const [step, setStep] = useState<LoginStep>("role");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (authState === "authenticated") {
    if (role === "dm") {
      navigate("/campaign/dashboard", { replace: true });
    }
  }

  const handleDmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    const success = login(username, password);
    if (success) {
      navigate("/campaign/dashboard", { replace: true });
    } else {
      setError("Invalid credentials. Try MikeJello / Jello1");
    }
  };

  const handleBack = () => {
    setStep("role");
    setUsername("");
    setPassword("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-mage-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="glass rounded-2xl p-8 border border-surface-700/30 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">ᚱ</div>
            <h1 className="text-2xl font-bold text-white">STᚱ VTT</h1>
            <p className="text-surface-400 text-sm mt-1">The Obelisks of Arkla</p>
          </div>

          {step === "role" && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("dm")}
                className="w-full p-4 rounded-xl border border-surface-700/50 hover:border-accent-500/50 bg-surface-800/30 hover:bg-accent-600/10 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">👑</span>
                  <div className="text-left">
                    <div className="font-bold text-white group-hover:text-accent-300 transition-colors">
                      Dungeon Master
                    </div>
                    <div className="text-sm text-surface-400">Campaign management & controls</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep("player")}
                className="w-full p-4 rounded-xl border border-surface-700/50 hover:border-rogue-500/50 bg-surface-800/30 hover:bg-rogue-500/10 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">⚔</span>
                  <div className="text-left">
                    <div className="font-bold text-white group-hover:text-rogue-300 transition-colors">
                      Player
                    </div>
                    <div className="text-sm text-surface-400">Character sheet & session view</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {step === "dm" && (
            <form onSubmit={handleDmLogin} className="space-y-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-surface-400 hover:text-surface-200 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter DM username"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-600/50 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-600/50 text-white placeholder-surface-500 focus:outline-none focus:border-accent-500/50 focus:ring-1 focus:ring-accent-500/30 transition-colors"
                />
              </div>

              {error && (
                <p className="text-warrior-400 text-sm bg-warrior-500/10 border border-warrior-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" className="w-full">
                Sign In
              </Button>
            </form>
          )}

          {step === "player" && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleBack}
                className="text-sm text-surface-400 hover:text-surface-200 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="p-6 rounded-xl border border-rogue-500/20 bg-rogue-500/5">
                <p className="text-surface-300 text-sm text-center">
                  Player sign-in will be available once characters are created by the DM.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-surface-500 text-xs">
          STᚱ VTT — Premium Virtual Tabletop for the Arkla Campaign
        </p>
      </div>
    </div>
  );
}
