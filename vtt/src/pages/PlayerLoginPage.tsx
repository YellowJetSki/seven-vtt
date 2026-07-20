/**
 * STᚱ VTT — Player Login Page (Premium — Sprint 7: Retry UX + Persistence)
 *
 * Players select their character from the campaign roster and enter
 * their name. Designed for mobile and desktop — fast touch targets,
 * clear visual hierarchy, connection-aware UI.
 *
 * Sprint 7 Upgrades:
 * - Retry button when syncExhausted = true
 * - `forceReconnect` button to manually re-trigger sync
 * - Connection indicator shows retry count and "Sync Unavailable" state
 * - Auto-fill from persisted `playerIdentifiers` on revisit
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";

export default function PlayerLoginPage() {
  const navigate = useNavigate();
  const characters = useCampaignStore((s) => s.characters);
  const loginAsPlayer = useAuthStore((s) => s.loginAsPlayer);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);
  const firebaseAuthLoading = useAuthStore((s) => s.firebaseAuthLoading);
  const syncExhausted = useAuthStore((s) => s.syncExhausted);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);

  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");

  // ── Auto-fill from persisted playerIdentifiers on first mount ──
  useEffect(() => {
    const stored = useAuthStore.getState().playerIdentifiers;
    const lastIdent = stored.length > 0 ? stored[stored.length - 1] : null;
    if (lastIdent) {
      setSelectedCharId(lastIdent.characterId);
      setPlayerName(lastIdent.label);
    }
  }, []);

  // ── Derived ──
  const canSignIn = Boolean(
    selectedCharId && playerName.trim() && (firebaseConnected || syncExhausted)
  );
  const isConnected = firebaseConnected;
  const isExhausted = syncExhausted && !firebaseConnected;

  // ── Handlers ──
  const handleSignIn = () => {
    if (!selectedCharId || !playerName.trim()) return;
    loginAsPlayer(selectedCharId, playerName);
    navigate("/player/sheet", { replace: true });
  };

  const handleRetry = () => {
    // Reset exhausted flag — the Firestore listener will re-subscribe
    // and try to connect on the next render cycle
    setFirebaseConnected(false);
    // Force a page-level reload to re-trigger Firebase initialization
    window.location.reload();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex relative bg-[#07080d] select-none">
      {/* ═══════════════════════════════════════════════════════
           LAYER 1: Deep Background
           ═══════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07080d] via-[#0a0b14] to-[#0d0e18]" />

        {/* Aurora wave layers */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] opacity-[0.12]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(234,179,8,0.10) 0%, transparent 70%)",
            animation: "aurora-drift 14s ease-in-out infinite alternate",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%] opacity-[0.06]"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 60% 60%, rgba(234,179,8,0.06) 0%, transparent 70%)",
            animation: "aurora-drift 18s ease-in-out infinite alternate reverse",
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.010]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />

        {/* Floating particles */}
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
              <div className="text-center mb-5">
                {/* Brand icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-3">
                  <img
                    src="/AppIcon.svg"
                    alt="STᚱ VTT"
                    className="w-9 h-9 drop-shadow-[0_0_12px_rgba(234,179,8,0.2)]"
                  />
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">
                  Choose Your Hero
                </h1>
                <p className="text-sm text-surface-500 mt-1.5">
                  Select your character to enter the adventure
                </p>
              </div>

              {/* Connection status indicator */}
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isExhausted
                        ? "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)]"
                        : isConnected
                          ? "bg-emerald-500 shadow-[0_0_4px_rgba(52,211,153,0.4)]"
                          : "bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)] animate-pulse"
                    }`}
                  />
                  <span className={`text-[10px] uppercase tracking-wider ${
                    isExhausted
                      ? "text-amber-400/60"
                      : isConnected
                        ? "text-emerald-400/60"
                        : "text-amber-400/60"
                  }`}>
                    {isExhausted
                      ? "Sync Unavailable"
                      : isConnected
                        ? "Connected"
                        : "Connecting..."
                    }
                  </span>
                </div>
                <span className="text-surface-700 text-[10px]">·</span>
                <span className="text-[10px] text-surface-600 uppercase tracking-wider">
                  Arkla Campaign
                </span>
              </div>

              {/* Sync exhaustion banner */}
              {isExhausted && (
                <div className="mb-5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15 animate-slide-in-up">
                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0">
                      <svg className="w-5 h-5 text-amber-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-amber-300">
                        Campaign data unavailable
                      </p>
                      <p className="text-[10px] text-amber-400/50 mt-0.5">
                        You can still sign in, but character data won't load until the connection is restored.
                      </p>
                    </div>
                    <button
                      onClick={handleRetry}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all duration-150"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-gold-500/20" />
                <span className="text-[9px] text-gold-500/30 font-mono tracking-[0.2em]">✦ ✦ ✦</span>
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-gold-500/20" />
              </div>

              {/* ── Character Selection ── */}
              {characters.length === 0 && !isExhausted ? (
                <div className="text-center py-10">
                  {/* Empty state icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-900/60 border border-white/[0.04] mb-4">
                    <svg className="w-8 h-8 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-surface-400 text-sm font-medium">
                    No characters available yet
                  </p>
                  <p className="text-surface-600 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                    Ask your Dungeon Master to create your character in the Campaign Roster.
                  </p>
                </div>
              ) : characters.length === 0 && isExhausted ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-950/40 border border-amber-500/15 mb-4">
                    <svg className="w-8 h-8 text-amber-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                  </div>
                  <p className="text-amber-300/80 text-sm font-medium">
                    Character data loading...
                  </p>
                  <p className="text-amber-400/40 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                    Please wait while we connect to the campaign. Tap Retry above to try again.
                  </p>
                </div>
              ) : (
                <>
                  {/* Character count */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">
                      Adventurers
                    </span>
                    <span className="text-[10px] text-gold-400/60 font-mono">
                      {characters.length} ready
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-6 max-h-[340px] overflow-y-auto scrollbar-gold pr-1.5">
                    {characters.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => {
                          setSelectedCharId(char.id);
                          if (!playerName) setPlayerName(char.playerName || "");
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group ${
                          selectedCharId === char.id
                            ? "border-gold-500/25 bg-gold-500/8 shadow-[0_0_12px_rgba(234,179,8,0.04)]"
                            : "border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar circle */}
                          <div
                            className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-200 ${
                              selectedCharId === char.id
                                ? "bg-gold-500/15 text-gold-400 ring-2 ring-gold-500/20"
                                : "bg-surface-800 text-surface-400 group-hover:bg-surface-700"
                            }`}
                          >
                            {char.imageUrl ? (
                              <img src={char.imageUrl} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              char.name.charAt(0)
                            )}
                          </div>

                          {/* Character info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold text-sm truncate transition-colors duration-200 ${
                                selectedCharId === char.id ? "text-gold-200" : "text-surface-200"
                              }`}>
                                {char.name}
                              </span>
                              <span className="text-[10px] font-mono text-surface-500 shrink-0">
                                Lv{char.level}
                              </span>
                            </div>
                            <p className="text-xs text-surface-500 truncate mt-0.5">
                              {char.race} · {char.class}
                              {char.subClass ? ` · ${char.subClass}` : ""}
                            </p>
                          </div>

                          {/* Selected check */}
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                              selectedCharId === char.id
                                ? "border-gold-400 bg-gold-400"
                                : "border-surface-600 group-hover:border-surface-500"
                            }`}
                          >
                            {selectedCharId === char.id && (
                              <svg className="w-3 h-3 text-[#0a0b12]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Player Name Input (shown after selection) ── */}
              {selectedCharId && (
                <div className="space-y-1.5 mb-5 animate-slide-in-up">
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-400/60">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 pointer-events-none">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your name for this session"
                      className="w-full h-11 pl-9 pr-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:border-gold-500/25 focus:bg-white/[0.05] transition-all duration-200"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter" && canSignIn) handleSignIn(); }}
                    />
                  </div>
                </div>
              )}

              {/* ── Sign In Button ── */}
              <button
                onClick={handleSignIn}
                disabled={!canSignIn}
                className={`relative w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 overflow-hidden group
                  ${
                    canSignIn
                      ? "bg-gradient-to-r from-gold-600 via-gold-500 to-amber-500 text-[#0a0b12] shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/25 active:scale-[0.98]"
                      : "bg-white/[0.03] text-surface-500 border border-white/[0.04] cursor-not-allowed"
                  }
                `}
              >
                {canSignIn && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {!isConnected && !syncExhausted ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-transparent animate-spin" />
                      Connecting to campaign...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      Enter the Adventure
                    </>
                  )}
                </span>
              </button>

              {/* ── Footer Links ── */}
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => navigate("/player/join")}
                  className="text-[10px] text-surface-600 hover:text-gold-400/60 transition-colors duration-200 tracking-wide uppercase"
                >
                  Join with Code
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
              <p className="text-center text-[9px] text-surface-700 uppercase tracking-[0.2em] mt-3 font-medium">
                Player Access · Arkla Campaign
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframe injection */}
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
