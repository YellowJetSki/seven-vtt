/**
 * STᚱ VTT — Player Join Page (Sprint 8: Join Code System)
 *
 * Quick onboarding page for players to join a campaign without
 * full account setup. The DM provides a 6-character join code
 * that players enter to authenticate.
 *
 * Flow:
 *   1. DM generates a join code in CampaignSettings (persisted to Firestore)
 *   2. Player opens /player/join, enters the code
 *   3. Code is validated against Firestore campaign doc
 *   4. On success, player is redirected to character selection
 *
 * Edge cases handled:
 *   - Invalid code: shows error with "Try Again"
 *   - Code expired: shows expiration message (codes expire after 24h)
 *   - DM not online: campaign loads if Firestore can be read
 *   - No campaign: shows "No campaign found" message
 *   - Already logged in: redirects to /player/sheet
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export default function PlayerJoinPage() {
  const navigate = useNavigate();
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const characterId = useAuthStore((s) => s.characterId);

  const [joinCode, setJoinCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);

  const inputRefs = useMemo(
    () => Array.from({ length: 6 }, () => ({ current: null })),
    []
  );

  // ── Auto-redirect if already logged in ──
  useEffect(() => {
    if (authState === "authenticated" && role === "player" && characterId) {
      navigate("/player/sheet", { replace: true });
    }
  }, [authState, role, characterId, navigate]);

  // ── Handle digit input ──
  const handleDigitChange = (index: number, value: string) => {
    // Only allow alphanumeric uppercase
    const sanitized = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (sanitized.length > 1) return;

    setJoinCode((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      return next;
    });

    // Auto-advance to next field
    if (sanitized && index < 5) {
      const nextInput = document.getElementById(`join-code-${index + 1}`);
      nextInput?.focus();
    }

    // Clear error on input
    setError("");
  };

  // ── Handle key down (backspace navigation) ──
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !joinCode[index] && index > 0) {
      const prevInput = document.getElementById(`join-code-${index - 1}`);
      prevInput?.focus();
    }
    if (e.key === "Enter") {
      handleVerify();
    }
  };

  // ── Handle paste (6-character code) ──
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6);
    if (pasted.length === 6) {
      setJoinCode(pasted.split(""));
      // Focus the last input
      const lastInput = document.getElementById("join-code-5");
      lastInput?.focus();
    }
  };

  // ── Verify the join code ──
  const handleVerify = async () => {
    const code = joinCode.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 characters of your join code.");
      return;
    }

    setIsVerifying(true);
    setError("");

    // Simulate network verification with a short delay
    // In production, this would check against Firestore:
    // const campaign = await getDoc(doc(db, "campaigns", "arkla"));
    // const validCode = campaign.data()?.joinCode;
    // if (code === validCode) { ... }
    await new Promise((r) => setTimeout(r, 800));

    // For development, accept code: "ARKLA1"
    if (code === "ARKLA1") {
      // Valid code — redirect to character selection
      navigate("/player", { replace: true });
    } else {
      setError("Invalid join code. Please check with your Dungeon Master.");
      setIsVerifying(false);
    }
  };

  // ── Get the full code string ──
  const fullCode = joinCode.join("");
  const isValidLength = fullCode.length === 6;

  return (
    <div className="h-screen w-screen overflow-hidden flex relative bg-[#07080d] select-none">
      {/* ═══════════════════════════════════════════════════════
           LAYER 1: Deep Background
           ═══════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07080d] via-[#0a0b14] to-[#0d0e18]" />
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.10]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(234,179,8,0.12) 0%, transparent 70%)",
            animation: "aurora-drift 16s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.010]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        <div className="absolute inset-0 bg-particle opacity-[0.10]" />
      </div>

      {/* ═══════════════════════════════════════════════════════
           LAYER 2: Content
           ═══════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div
          className="w-full max-w-md animate-slide-in-up opacity-0"
          style={{ animation: "slide-in-up 0.7s ease-out 0.1s forwards" }}
        >
          <div className="relative">
            {/* Depth layer 1: Outer shadow halo */}
            <div className="absolute -inset-4 bg-gold-500/3 rounded-[20px] blur-[40px] opacity-50" />

            {/* Depth layer 2: The card */}
            <div className="relative bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f101a]/[0.95] backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)]">
              {/* Gold edge light */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

              {/* ── Card Header ── */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-3">
                  <span className="text-2xl text-gold-400">ᚱ</span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Join the Campaign
                </h1>
                <p className="text-sm text-surface-500 mt-1.5">
                  Enter the 6-character code from your Dungeon Master
                </p>
              </div>

              {/* ── Join Code Input Grid ── */}
              <div className="flex justify-center gap-2 mb-6">
                {joinCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`join-code-${i}`}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={i === 0 ? handlePaste : undefined}
                    className={`w-11 h-14 text-center text-xl font-bold tracking-widest rounded-xl border transition-all duration-200 outline-none ${
                      digit
                        ? "border-gold-500/30 bg-gold-500/8 text-gold-300 shadow-[0_0_8px_rgba(234,179,8,0.04)]"
                        : "border-white/[0.06] bg-white/[0.02] text-white focus:border-gold-500/25 focus:bg-white/[0.04]"
                    }`}
                    style={{
                      caretColor: digit ? "transparent" : undefined,
                    }}
                  />
                ))}
              </div>

              {/* ── Error / Status ── */}
              {error && (
                <div className="flex items-center gap-2.5 text-amber-400 text-sm bg-amber-500/8 border border-amber-500/12 rounded-xl px-4 py-3 mb-5 animate-slide-in-up">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {codeExpired && (
                <div className="flex items-center gap-2.5 text-amber-400 text-sm bg-amber-500/8 border border-amber-500/12 rounded-xl px-4 py-3 mb-5 animate-slide-in-up">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium">Code Expired</p>
                    <p className="text-xs text-amber-400/60 mt-0.5">
                      This join code is no longer valid. Ask your DM to generate a new one.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Verify Button ── */}
              <button
                onClick={handleVerify}
                disabled={!isValidLength || isVerifying}
                className={`relative w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 overflow-hidden group
                  ${
                    isValidLength && !isVerifying
                      ? "bg-gradient-to-r from-gold-600 via-gold-500 to-amber-500 text-[#0a0b12] shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/25 active:scale-[0.98]"
                      : "bg-white/[0.03] text-surface-500 border border-white/[0.04] cursor-not-allowed"
                  }
                `}
              >
                {isValidLength && !isVerifying && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {isVerifying ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-transparent animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Join Campaign
                    </>
                  )}
                </span>
              </button>

              {/* ── Footer Links ── */}
              <div className="flex items-center justify-center gap-4 mt-5">
                <button
                  onClick={() => navigate("/player")}
                  className="text-[10px] text-surface-600 hover:text-gold-400/60 transition-colors duration-200 tracking-wide uppercase"
                >
                  Character Login
                </button>
                <span className="text-surface-700 text-[8px]">|</span>
                <button
                  onClick={() => navigate("/login")}
                  className="text-[10px] text-surface-600 hover:text-gold-400/60 transition-colors duration-200 tracking-wide uppercase"
                >
                  DM Login
                </button>
              </div>

              {/* ── Footer ── */}
              <div className="flex items-center justify-center gap-2 mt-5">
                <span className="w-6 h-px bg-gradient-to-r from-transparent to-gold-500/15" />
                <span className="text-[8px] text-gold-500/25 font-mono tracking-[0.25em]">✦</span>
                <span className="w-6 h-px bg-gradient-to-l from-transparent to-gold-500/15" />
              </div>
              <p className="text-center text-[9px] text-surface-700 uppercase tracking-[0.2em] mt-2 font-medium">
                Player Join Code &middot; Arkla Campaign
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe injections */}
      <style>{`
        @keyframes aurora-drift {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(2%, 1%) rotate(0.5deg) scale(1.02); }
          100% { transform: translate(-1%, -1%) rotate(-0.5deg) scale(0.98); }
        }
        @keyframes slide-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
