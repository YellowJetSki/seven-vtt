/**
 * STᚱ VTT — Login Page (Premium Lusion-Grade Redesign)
 *
 * Full-screen immersive login with layered depth, parallax aurora,
 * sophisticated typography hierarchy, and tactile glassmorphism.
 *
 * Key premium concepts:
 * - 3-layer depth: background → ambient glow → card surface
 * - Typographic hierarchy with deliberate tracking/weight contrasts
 * - Edge-lit glass card with inner shadow depth
 * - Pulsing ambient rune in the background
 * - Responsive: brand hero sidecar on desktop, stacked on mobile
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
    <div className="h-screen w-screen overflow-hidden flex relative bg-[#07080d] select-none">
      {/* ═══════════════════════════════════════════════════════
           LAYER 1: Deep Background
           ═══════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Base void */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#07080d] via-[#0a0b14] to-[#0d0e18]" />

        {/* Aurora wave 1 — slow drift gold */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.18]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(234,179,8,0.15) 0%, transparent 70%)",
            animation: "aurora-drift 14s ease-in-out infinite alternate",
          }}
        />

        {/* Aurora wave 2 — amber accent */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 70% 60%, rgba(245,158,11,0.12) 0%, transparent 70%)",
            animation: "aurora-drift 18s ease-in-out 2s infinite alternate",
          }}
        />

        {/* Aurora wave 3 — warm gold */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.08]"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(251,191,36,0.08) 0%, transparent 70%)",
            animation: "aurora-drift 22s ease-in-out 4s infinite alternate",
          }}
        />

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.012]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Floating particle overlay */}
        <div className="absolute inset-0 bg-particle opacity-[0.15]" />
      </div>

      {/* ═══════════════════════════════════════════════════════
           LAYER 2: Ambient Rune Glow (center-right)
           ═══════════════════════════════════════════════════════ */}
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2 pointer-events-none hidden lg:block">
        <div className="relative">
          <div
            className="absolute -inset-20 bg-gold-500/5 rounded-full blur-[100px] animate-pulse-glow"
            style={{ animationDuration: "5s" }}
          />
          <span
            className="text-[180px] font-serif text-gold-500/6 select-none"
            style={{ animation: "rune-breathe 8s ease-in-out infinite" }}
            aria-hidden="true"
          >
            ᚱ
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
           LAYER 3: Content
           ═══════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex w-full h-full">
        {/* ────────── LEFT PANEL: Brand Hero ────────── */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 xl:p-16 relative">
          <div className="relative flex flex-col h-full">
            {/* Brand */}
            <div
              className="animate-slide-in-up opacity-0"
              style={{ animation: "slide-in-up 0.7s ease-out 0.1s forwards" }}
            >
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/AppIcon.svg"
                  alt="STᚱ VTT"
                  className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-[0_0_24px_rgba(234,179,8,0.3)]"
                />
                <div>
                  <h1 className="text-[28px] font-black tracking-tight text-white leading-none">
                    ST<span className="text-gold-400">ᚱ</span> VTT
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-surface-500 font-medium mt-1.5">
                    Virtual Tabletop
                  </p>
                </div>
              </div>

              {/* Hero Typography */}
              <div className="mt-10">
                <p className="text-[32px] xl:text-[40px] font-light text-white/90 leading-[1.1] tracking-tight">
                  Forge your
                </p>
                <p className="text-[32px] xl:text-[40px] font-bold leading-[1.1] tracking-tight">
                  <span className="text-gold-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]">legend</span>
                  <span className="text-white/40 font-light">.</span>
                </p>
              </div>

              <p className="text-sm sm:text-base text-surface-500 mt-6 leading-relaxed max-w-sm">
                A premium virtual tabletop for Dungeon Masters and adventurers. Build worlds, command encounters, and tell epic stories.
              </p>

              {/* Feature highlights — clean data visualization */}
              <div className="mt-10 space-y-[14px]">
                {[
                  { icon: "🗺", label: "Interactive Maps", desc: "Dynamic lighting & fog of war" },
                  { icon: "📜", label: "Character Compendium", desc: "Full SRD + homebrew management" },
                  { icon: "🖥", label: "Dual-Screen Display", desc: "Player-facing theatric view" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 group cursor-default"
                  >
                    <span className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-lg shrink-0 group-hover:border-gold-500/20 group-hover:bg-gold-500/5 transition-all duration-300">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white/80 group-hover:text-gold-400 transition-colors duration-300">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-surface-600 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="mt-auto pt-8 animate-slide-in-up opacity-0"
              style={{ animation: "slide-in-up 0.7s ease-out 0.8s forwards" }}
            >
              <div className="flex items-center gap-3 opacity-30">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-gold-500/40" />
                <span className="text-[8px] text-gold-500/40 uppercase tracking-[0.25em] font-mono">✦ ✦ ✦</span>
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-gold-500/40" />
              </div>
              <p className="text-[9px] text-surface-700 uppercase tracking-[0.2em] mt-4 font-medium">
                Arkla Campaign &mdash; Premium VTT
              </p>
            </div>
          </div>
        </div>

        {/* ────────── RIGHT PANEL: Login Form ────────── */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 xl:p-16">
          <div className="w-full max-w-sm">
            {/* Mobile brand (visible only on < lg) */}
            <div className="lg:hidden text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
                <img
                  src="/AppIcon.svg"
                  alt="STᚱ VTT"
                  className="w-10 h-10 drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                />
              </div>
              <h1 className="text-[22px] font-black text-white tracking-tight">
                ST<span className="text-gold-400">ᚱ</span> VTT
              </h1>
              <p className="text-[10px] text-surface-600 mt-1.5 uppercase tracking-[0.2em] font-medium">
                Premium Virtual Tabletop
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="w-6 h-px bg-gradient-to-r from-transparent to-gold-500/30" />
                <span className="text-[7px] text-gold-500/30 font-mono tracking-[0.25em]">✦</span>
                <span className="w-6 h-px bg-gradient-to-l from-transparent to-gold-500/30" />
              </div>
            </div>

            {/* Login Card — layered glass depth */}
            <div
              className="animate-slide-in-up opacity-0"
              style={{ animation: "slide-in-up 0.7s ease-out 0.2s forwards" }}
            >
              <div className="relative">
                {/* Depth layer 1: Outer shadow halo */}
                <div className="absolute -inset-4 bg-gold-500/3 rounded-[20px] blur-[40px] opacity-60" />

                {/* Depth layer 2: The card */}
                <div className="relative bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f101a]/[0.95] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 sm:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,215,0,0.03)_inset,0_1px_0_rgba(255,255,255,0.03)_inset]">
                  {/* Subtle gold edge light */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

                  {/* Card Header */}
                  <div className="mb-8">
                    <h2 className="text-[20px] font-bold text-white tracking-tight leading-none">
                      Welcome back
                    </h2>
                    <p className="text-sm text-surface-500 mt-2 leading-relaxed">
                      Sign in to resume your campaign
                    </p>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none z-10 transition-all duration-200"
                        style={{ color: isFloating("username") ? "rgba(250,204,21,0.6)" : undefined }}
                      >
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
                        className="peer w-full h-[52px] pl-10 pr-4 pt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-transparent focus:outline-none focus:border-gold-500/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(234,179,8,0.12),0_0_24px_rgba(234,179,8,0.03)] transition-all duration-200"
                        placeholder="Username"
                        autoComplete="username"
                      />
                      <label
                        htmlFor="login-username"
                        className={`absolute left-10 pointer-events-none transition-all duration-200 ${
                          isFloating("username")
                            ? "top-[10px] text-[9px] text-gold-400/60 font-medium uppercase tracking-[0.12em]"
                            : "top-1/2 -translate-y-1/2 text-sm text-surface-500"
                        }`}
                      >
                        Username
                      </label>
                    </div>

                    {/* Password */}
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none z-10 transition-all duration-200"
                        style={{ color: isFloating("password") ? "rgba(250,204,21,0.6)" : undefined }}
                      >
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
                        className="peer w-full h-[52px] pl-10 pr-4 pt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-transparent focus:outline-none focus:border-gold-500/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(234,179,8,0.12),0_0_24px_rgba(234,179,8,0.03)] transition-all duration-200"
                        placeholder="Password"
                        autoComplete="current-password"
                      />
                      <label
                        htmlFor="login-password"
                        className={`absolute left-10 pointer-events-none transition-all duration-200 ${
                          isFloating("password")
                            ? "top-[10px] text-[9px] text-gold-400/60 font-medium uppercase tracking-[0.12em]"
                            : "top-1/2 -translate-y-1/2 text-sm text-surface-500"
                        }`}
                      >
                        Password
                      </label>
                    </div>

                    {/* Error banner */}
                    {error && (
                      <div className="flex items-center gap-2.5 text-amber-400 text-sm bg-amber-500/8 border border-amber-500/12 rounded-xl px-4 py-3 animate-slide-in-up">
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
                      className="relative w-full h-[52px] rounded-xl font-semibold text-[13px] transition-all duration-200 overflow-hidden group cursor-pointer
                        bg-gradient-to-r from-gold-600 via-gold-500 to-amber-500
                        hover:from-gold-500 hover:via-gold-400 hover:to-amber-400
                        text-[#0a0b12] shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/25
                        disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none
                        active:scale-[0.98]"
                    >
                      {/* Shimmer sweep */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

                      <span className="relative z-10 flex items-center justify-center gap-2.5">
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

                    {/* Subtle credential hint */}
                    <p className="text-center text-[9px] text-surface-600 uppercase tracking-[0.2em] mt-6 font-medium">
                      DM Access &middot; Arkla Campaign
                    </p>
                  </form>
                </div>
              </div>
            </div>

            {/* Mobile footer */}
            <p className="text-center mt-8 text-surface-700 text-[9px] uppercase tracking-[0.2em] lg:hidden font-medium">
              Premium Virtual Tabletop &mdash; Arkla Campaign
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
           Keyframe Injections
           ═══════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes aurora-drift {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(2%, 1%) rotate(0.5deg) scale(1.02); }
          100% { transform: translate(-1%, -1%) rotate(-0.5deg) scale(0.98); }
        }
        @keyframes rune-breathe {
          0%, 100% { opacity: 0.04; transform: scale(1); }
          50% { opacity: 0.08; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
