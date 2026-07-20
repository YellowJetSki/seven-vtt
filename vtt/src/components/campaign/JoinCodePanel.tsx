/**
 * STᚱ VTT — Join Code Panel (Sprint 9: Firebase & Login Phase)
 *
 * DM-facing panel to generate, refresh, and reset the campaign
 * join code. Codes are 6-character alphanumeric uppercase strings.
 *
 * Features:
 * - Generate new code (auto-expires in 24 hours)
 * - Refresh existing code (extends expiry)
 * - Clear/reset code (disables join code login)
 * - Copy code to clipboard with visual feedback
 * - Live expiration countdown
 *
 * Data flow: writes to campaign meta settings via updateMetaSettings,
 * persists to Firestore via existing campaign sync hooks.
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import type { CampaignSettings } from "@/types";

interface JoinCodePanelProps {
  settings: CampaignSettings;
  onSave: (updates: Partial<CampaignSettings>) => void;
}

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getExpiresIn(expiresAt: number | undefined): string {
  if (!expiresAt) return "";
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "Expired";
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export default function JoinCodePanel({ settings, onSave }: JoinCodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update countdown every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const isExpired = useMemo(() => {
    if (!settings.joinCodeExpiresAt) return false;
    return settings.joinCodeExpiresAt < now;
  }, [settings.joinCodeExpiresAt, now]);

  const expiresLabel = useMemo(() => {
    return getExpiresIn(settings.joinCodeExpiresAt);
  }, [settings.joinCodeExpiresAt, now]);

  const handleGenerate = useCallback(() => {
    const code = generateJoinCode();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    onSave({ joinCode: code, joinCodeExpiresAt: expiresAt });
    setCopied(false);
  }, [onSave]);

  const handleRefresh = useCallback(() => {
    if (!settings.joinCode) return;
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    onSave({ joinCodeExpiresAt: expiresAt });
    setCopied(false);
  }, [onSave, settings.joinCode]);

  const handleClear = useCallback(() => {
    onSave({ joinCode: "", joinCodeExpiresAt: undefined });
    setCopied(false);
  }, [onSave]);

  const handleCopy = useCallback(async () => {
    if (!settings.joinCode) return;
    try {
      await navigator.clipboard.writeText(settings.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text manually
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [settings.joinCode]);

  const hasValidCode = settings.joinCode && settings.joinCode.length === 6 && !isExpired;

  return (
    <div className="relative bg-gradient-to-b from-[#14151f]/85 to-[#0f1019]/90 border border-white/[0.04] rounded-xl overflow-hidden group">
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 group-hover:via-gold-500/35 to-transparent transition-all duration-500" />
      {/* Ambient glow */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-gold-500/[0.04] rounded-full blur-[60px] pointer-events-none" />

      <div className="relative z-10 p-5">
        {/* ── Section Header ── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
            <span className="absolute inset-0 flex items-center justify-center text-sm">🔑</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white tracking-tight">Join Code</h3>
            <p className="text-[10px] text-surface-500 mt-0.5">
              Players can join the campaign with a 6-character code
            </p>
          </div>

          {/* Status badge */}
          {hasValidCode ? (
            <span className="shrink-0 flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-emerald-400/60 bg-emerald-500/10 border border-emerald-500/15 px-2 py-1 rounded font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
              Active
            </span>
          ) : settings.joinCode ? (
            <span className="shrink-0 flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-amber-400/60 bg-amber-500/10 border border-amber-500/15 px-2 py-1 rounded font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Expired
            </span>
          ) : null}
        </div>

        {/* ── Code Display ── */}
        {settings.joinCode ? (
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#07080d]/60 border border-white/[0.06] font-mono">
              {settings.joinCode.split("").map((char, i) => (
                <span
                  key={i}
                  className={`w-8 h-10 flex items-center justify-center text-lg font-bold tracking-widest rounded-lg ${
                    isExpired
                      ? "text-surface-600 bg-surface-900/30"
                      : "text-gold-300 bg-gold-500/10 border border-gold-500/20 shadow-[0_0_4px_rgba(234,179,8,0.04)]"
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              disabled={isExpired || !settings.joinCode}
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                copied
                  ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
                  : "bg-white/[0.04] border border-white/[0.06] text-surface-500 hover:border-gold-500/20 hover:text-gold-400 hover:bg-gold-500/8"
              } active:scale-95`}
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          <div className="mb-5 py-4 px-5 rounded-xl bg-[#07080d]/40 border border-dashed border-white/[0.04]">
            <p className="text-sm text-surface-600 text-center">
              No join code set. Generate one to let players join your campaign instantly.
            </p>
          </div>
        )}

        {/* ── Expiry Info ── */}
        {hasValidCode && (
          <p className="text-[10px] text-surface-600 mb-4 text-center">
            Code expires in <span className="text-gold-400/70 font-medium">{expiresLabel}</span>
            {" · "}Players enter this code at <span className="text-gold-400/50 font-mono">/player/join</span>
          </p>
        )}

        {isExpired && settings.joinCode && (
          <p className="text-[10px] text-amber-400/60 mb-4 text-center">
            This join code has expired. Refresh or generate a new one.
          </p>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex items-center gap-3">
          {!settings.joinCode || isExpired ? (
            <button
              onClick={handleGenerate}
              className="flex-1 h-10 rounded-xl text-xs font-semibold transition-all duration-200
                bg-gradient-to-r from-gold-600 via-gold-500 to-amber-500
                hover:from-gold-500 hover:via-gold-400 hover:to-amber-400
                text-[#0a0b12] shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/25
                active:scale-[0.98]"
            >
              Generate New Code
            </button>
          ) : (
            <>
              <button
                onClick={handleRefresh}
                className="flex-1 h-10 rounded-xl text-xs font-semibold transition-all duration-200
                  bg-gradient-to-r from-gold-600 via-gold-500 to-amber-500
                  hover:from-gold-500 hover:via-gold-400 hover:to-amber-400
                  text-[#0a0b12] shadow-lg shadow-gold-500/20 hover:shadow-xl hover:shadow-gold-500/25
                  active:scale-[0.98]"
              >
                Refresh (24h)
              </button>
              <button
                onClick={handleClear}
                className="h-10 px-4 rounded-xl text-[10px] font-semibold transition-all duration-200
                  bg-rose-500/10 border border-rose-500/20 text-rose-400/80
                  hover:bg-rose-500/15 hover:border-rose-500/25
                  active:scale-[0.98]"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
