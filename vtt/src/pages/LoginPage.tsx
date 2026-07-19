/**
 * STᚱ VTT — Login Page (Premium Professional Redesign)
 *
 * Full-screen immersive login experience with:
 * - Animated aurora gradient background
 * - Two-panel layout (brand hero + unified login form)
 * - Floating label inputs with icon prefixes
 * - Staggered fade-in animations
 * - Single unified login — no multi-step role selection
 * - DM credentials: MikeJello / Jello1
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"username" | "password" | null>(null);

  useEffect(() => {
    if (authState === "authenticated" && role === "dm") {
      navigate("/campaign/dashboard", { replace: true });
    }
  }, [authState, role, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsSubmitting(true);

    // Brief simulated delay for UX polish
    await new Promise((r) => setTimeout(r, 400));

    const success = login(username, password);
    if (!success) {
      setError("Invalid credentials. Please try again.");
      setIsSubmitting(false);
      return;
    }

    navigate("/campaign/dashboard", { replace: true });
  };

  const isFloating = (field: "username" | "password") =>
    focusedField === field || (field === "username" ? username : password).length > 0;

  return (
    <div className="h-screen w-screen overflow-hidden flex relative bg-[#07080d]">
      {/* ── Animated Aurora Background ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base dark void */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#07080d] via-[#0a0b14] to-[#0d0e18]" />

        {/* Aurora wave 1 — slow gold */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(234,179,8,0.12) 0%, transparent 70%)",
            animation: "aurora-drift 12s ease-in-out infinite alternate",
          }}
        />

        {/* Aurora wave 2 — amber */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-25"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 70% 60%, rgba(245,158,11,0.1) 0%, transparent 70%)",
            animation: "aurora-drift 16s ease-in-out 2s infinite alternate",
          }}
        />

        {/* Aurora wave 3 — warm glow */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(251,191,36,0.06) 0%, transparent 70%)",
            animation: "aurora-drift 20s ease-in-out 4s infinite alternate",
          }}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 bg-particle opacity-30" />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 flex w-full h-full">
        {/* ── LEFT PANEL: Brand Hero (hidden on mobile) ── */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative">
          {/* Ambient glow behind the logo */}
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gold-500/6 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDuration: "6s" }} />

          <div className="relative">
            {/* Logo + Brand */}
            <div
              className="animate-slide-in-up opacity-0"
              style={{ animation: "slide-in-up 0.6s ease-out 0.1s forwards" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl text-gold-400 drop-shadow-[0_0_16px_rgba(234,179,8,0.3)] select-none">ᚱ</span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-white">
                    ST<span className="text-gold-400">ᚱ</span> VTT
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-surface-500 font-medium">
                    Virtual Tabletop
                  </p>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div
              className="animate-slide-in-up opacity-0"
              style={{ animation: "slide-in-up 0.6s ease-out 0.3s forwards" }}
            >
              <p className="text-3xl sm:text-4xl font-light text-white/90 leading-tight max-w-md">
                Forge your
                <span className="text-gold-400 font-semibold"> legend</span>.
              </p>
              <p className="text-base text-surface-500 mt-4 leading-relaxed max-w-sm">
                A premium virtual tabletop for Dungeon Masters and adventurers. 
                Build worlds, command encounters, and tell epic stories.
              </p>
            </div>

            {/* Feature highlights */}
            <div
              className="mt-10 space-y-4 animate-slide-in-up opacity-0"
              style={{ animation: "slide-in-up 0.6s ease-out 0.5s forwards" }}
            >
              {[
                { icon: "🗺", text: "Interactive battle maps with dynamic lighting" },
                { icon: "📜", text: "Full character management & compendium" },
                { icon: "🖥", text: "Dual-screen theatric display for players" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{item.icon}</span>
                  <span className="text-sm text-surface-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div
            className="animate-slide-in-up opacity-0"
            style={{ animation: "slide-in-up 0.6s ease-out 0.7s forwards" }}
          >
            <div className="rune-gold w-full">✦ ✦ ✦</div>
            <p className="text-[10px] text-surface-700 uppercase tracking-[0.15em] mt-3 font-medium">
              Arkla Campaign &mdash; Premium Virtual Tabletop
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: Login Form ── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-sm">
            {/* Mobile brand header (visible only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div className="text-5xl text-gold-400 drop-shadow-[0_0_16px_rgba(234,179,8,0.3)] mb-3 select-none">ᚱ</div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                ST<span className="text-gold-400">ᚱ</span> VTT
              </h1>
              <p className="text-surface-500 text-xs mt-1 uppercase tracking-widest">Premium Virtual Tabletop</p>
              <div className="rune-gold justify-center mt-3">✦</div>
            </div>

            {/* Login Card */}
            <div
              className="animate-slide-in-up opacity-0"
              style={{ animation: "slide-in-up 0.6s ease-out 0.2s forwards" }}
            >
              <div className="bg-gradient-to-b from-[#14151f]/90 to-[#0f101a]/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 sm:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.02)_inset]">
                {/* Card Header */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-sm text-surface-500 mt-1">
                    Sign in to your campaign
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Username Field */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none z-10">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full h-12 pl-10 pr-4 pt-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-transparent focus:outline-none focus:border-gold-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_1px_rgba(234,179,8,0.15),0_0_20px_rgba(234,179,8,0.03)] transition-all duration-200"
                      placeholder="Username"
                      autoComplete="username"
                    />
                    <label
                      htmlFor="login-username"
                      className={`absolute left-10 top-1/2 -translate-y-1/2 text-surface-500 text-sm pointer-events-none transition-all duration-200 ${
                        isFloating("username")
                          ? "top-3 text-[10px] text-gold-400/70"
                          : ""
                      }`}
                    >
                      {isFloating("username") ? "Username" : "Username"}
                    </label>
                  </div>

                  {/* Password Field */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none z-10">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full h-12 pl-10 pr-4 pt-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-transparent focus:outline-none focus:border-gold-500/40 focus:bg-white/[0.06] focus:shadow-[0_0_0_1px_rgba(234,179,8,0.15),0_0_20px_rgba(234,179,8,0.03)] transition-all duration-200"
                      placeholder="Password"
                      autoComplete="current-password"
                    />
                    <label
                      htmlFor="login-password"
                      className={`absolute left-10 top-1/2 -translate-y-1/2 text-surface-500 text-sm pointer-events-none transition-all duration-200 ${
                        isFloating("password")
                          ? "top-3 text-[10px] text-gold-400/70"
                          : ""
                      }`}
                    >
                      {isFloating("password") ? "Password" : "Password"}
                    </label>
                  </div>

                  {/* Error Banner */}
                  {error && (
                    <div
                      className="flex items-center gap-2.5 text-amber-400 text-sm bg-amber-500/8 border border-amber-500/12 rounded-xl px-4 py-3 animate-slide-in-up"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 overflow-hidden group
                      bg-gradient-to-r from-gold-600/90 via-gold-500/90 to-amber-500/90
                      hover:from-gold-500 hover:via-gold-400 hover:to-amber-400
                      text-[#0a0b12] shadow-lg shadow-gold-500/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-[0.98]"
                  >
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Signing in...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                          </svg>
                          Sign In as Dungeon Master
                        </>
                      )}
                    </span>
                  </button>

                  {/* Footer hint */}
                  <p className="text-center text-[10px] text-surface-600 uppercase tracking-wider mt-6">
                    DM access &middot; Arkla Campaign
                  </p>
                </form>
              </div>
            </div>

            {/* Footer link on mobile */}
            <p className="text-center mt-6 text-surface-700 text-[10px] uppercase tracking-widest lg:hidden">
              Premium Virtual Tabletop &mdash; Arkla Campaign
            </p>
          </div>
        </div>
      </div>

      {/* ── Aurora Animation Keyframes (injected via style tag) ── */}
      <style>{`
        @keyframes aurora-drift {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(2%, 1%) rotate(0.5deg) scale(1.02); }
          100% { transform: translate(-1%, -1%) rotate(-0.5deg) scale(0.98); }
        }
      `}</style>
    </div>
  );
}
