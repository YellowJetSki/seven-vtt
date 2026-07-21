/**
 * STᚱ VTT — LoginForm (Overrrides-Grade Premium)
 *
 * Premium glass card login form with:
 * - Overrrides-style staggered field entrance animations
 * - Floating labels with gold accent on focus
 * - Password visibility toggle (eye icon)
 * - "Remember me" checkbox with custom gold styling
 * - Shimmer submit button with depth layers
 * - Sync exhaustion banner with retry
 * - Connection status indicator
 * - Premium error animation with gold icon container
 */

import { useState } from "react";

interface LoginFormProps {
  firebaseConnected: boolean;
  syncExhausted: boolean;
  onLogin: (username: string, password: string) => Promise<void>;
}

export default function LoginForm({ firebaseConnected, syncExhausted, onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<"username" | "password" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isFloating = (field: "username" | "password") =>
    focusedField === field || (field === "username" ? username : password).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Depth layer 1: Outer shadow halo */}
      <div className="absolute -inset-4 bg-gold-500/3 rounded-[20px] blur-[40px] opacity-60" />

      {/* Depth layer 2: The card */}
      <div
        className="relative bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f101a]/[0.95] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-8 sm:p-10 shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,215,0,0.03)_inset,0_1px_0_rgba(255,255,255,0.03)_inset] overflow-hidden"
        style={{ animation: "slide-in-up 0.7s ease-out 0.2s forwards" }}
      >
        {/* Subtle decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(234,179,8,0.4) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Gold edge light */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        {/* Bottom edge glow */}
        <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/8 to-transparent" />

        {/* Connection status */}
        <div className="relative flex items-center justify-start gap-2 mb-3">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              syncExhausted
                ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)]"
                : firebaseConnected
                  ? "bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.3)]"
                  : "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.3)] animate-pulse"
            }`}
          />
          <span className={`text-[9px] uppercase tracking-wider ${
            syncExhausted
              ? "text-amber-400/50"
              : firebaseConnected
                ? "text-emerald-400/50"
                : "text-amber-400/50"
          }`}>
            {syncExhausted
              ? "Campaign Unavailable"
              : firebaseConnected
                ? "Campaign Online"
                : "Connecting to campaign..."}
          </span>
        </div>

        {/* Sync exhaustion banner */}
        {syncExhausted && (
          <div
            className="relative mb-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15"
            style={{ animation: "slide-in-up 0.4s ease-out forwards" }}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-amber-300">Campaign data unavailable</p>
                <p className="text-[9px] text-amber-400/50 mt-0.5">Character data won't sync until connection is restored.</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-[9px] font-semibold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all duration-150"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Card header — staggered entrance */}
        <div className="relative mb-8" style={{ animation: "slide-in-up 0.5s ease-out 0.3s forwards", opacity: 0 }}>
          <h2 className="text-[20px] font-bold text-white tracking-tight leading-none">
            Welcome back
          </h2>
          <p className="text-sm text-surface-500 mt-2 leading-relaxed">
            Sign in to resume your campaign
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username field — staggered entrance */}
          <div
            className="relative"
            style={{ animation: "slide-in-up 0.5s ease-out 0.4s forwards", opacity: 0 }}
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-200"
              style={{ color: isFloating("username") ? "rgba(250,204,21,0.6)" : "var(--color-surface-500)" }}
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

          {/* Password field — staggered entrance */}
          <div
            className="relative"
            style={{ animation: "slide-in-up 0.5s ease-out 0.5s forwards", opacity: 0 }}
          >
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-200"
              style={{ color: isFloating("password") ? "rgba(250,204,21,0.6)" : "var(--color-surface-500)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="peer w-full h-[52px] pl-10 pr-10 pt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-transparent focus:outline-none focus:border-gold-500/35 focus:bg-white/[0.05] focus:shadow-[0_0_0_1px_rgba(234,179,8,0.12),0_0_24px_rgba(234,179,8,0.03)] transition-all duration-200"
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

            {/* Password visibility toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 p-1 rounded-lg text-surface-500 hover:text-gold-400/60 transition-colors duration-200 focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Remember me checkbox — staggered entrance */}
          <div
            className="flex items-center justify-between"
            style={{ animation: "slide-in-up 0.5s ease-out 0.55s forwards", opacity: 0 }}
          >
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border transition-all duration-200 ${
                    rememberMe
                      ? "bg-gold-500/20 border-gold-500/40 shadow-[0_0_6px_rgba(234,179,8,0.08)]"
                      : "bg-white/[0.03] border-white/[0.08] group-hover:border-white/[0.15]"
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-full h-full text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-surface-500 group-hover:text-surface-400 transition-colors duration-200">
                Remember me
              </span>
            </label>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-2.5 text-amber-400 text-sm bg-amber-500/8 border border-amber-500/12 rounded-xl px-4 py-3"
              style={{ animation: "slide-in-up 0.3s ease-out forwards" }}
            >
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </span>
              <span className="text-[11px] text-amber-300">{error}</span>
            </div>
          )}

          {/* Submit button — staggered entrance */}
          <div
            style={{ animation: "slide-in-up 0.5s ease-out 0.6s forwards", opacity: 0 }}
          >
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
          </div>

          {/* Footer — staggered entrance */}
          <p
            className="text-center text-[9px] text-surface-600 uppercase tracking-[0.2em] mt-6 font-medium"
            style={{ animation: "slide-in-up 0.5s ease-out 0.7s forwards", opacity: 0 }}
          >
            DM Access &middot; Arkla Campaign
          </p>
        </form>
      </div>
    </div>
  );
}
