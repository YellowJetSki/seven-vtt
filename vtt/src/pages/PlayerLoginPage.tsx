/**
 * STᚱ VTT — Player Login Page
 *
 * Players can select their character from the campaign roster.
 * Characters are created by the DM. Players just pick their name.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";

export default function PlayerLoginPage() {
  const navigate = useNavigate();
  const characters = useCampaignStore((s) => s.characters);
  const loginAsPlayer = useAuthStore((s) => s.loginAsPlayer);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");

  const handleSignIn = () => {
    if (!selectedCharId || !playerName.trim()) return;
    loginAsPlayer(selectedCharId, playerName);
    navigate("/player/sheet", { replace: true });
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex relative bg-[#07080d]">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#07080d] via-[#0a0b14] to-[#0d0e18]" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 40%, rgba(234,179,8,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
        <div className="w-full max-w-lg glass-gold rounded-2xl p-8 shadow-obsidian-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-4xl text-gold-400 drop-shadow-[0_0_16px_rgba(234,179,8,0.3)] inline-block mb-2">
              ⚔
            </span>
            <h1 className="text-xl font-black text-white">Choose Your Hero</h1>
            <p className="text-sm text-surface-500 mt-1">
              Select your character to enter the adventure
            </p>
          </div>

          <div className="rune-gold justify-center mb-6">✦ ✦ ✦</div>

          {/* Character Selection */}
          {characters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-surface-400 text-sm">
                No characters available yet.
              </p>
              <p className="text-surface-600 text-xs mt-2">
                Ask your Dungeon Master to create your character.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6 max-h-[320px] overflow-y-auto scrollbar-gold pr-2">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => setSelectedCharId(char.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                    selectedCharId === char.id
                      ? "border-gold/40 bg-gold-500/10 shadow-[0_0_12px_rgba(234,179,8,0.06)]"
                      : "border-surface-700/30 bg-surface-900/30 hover:border-surface-600/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedCharId === char.id
                          ? "bg-gold-500/20 text-gold-400"
                          : "bg-surface-800 text-surface-400"
                      }`}
                    >
                      {char.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-surface-200 truncate">
                          {char.name}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-surface-500 shrink-0">
                          Lv{char.level}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 truncate">
                        {char.race} · {char.class}
                        {char.subClass ? ` · ${char.subClass}` : ""}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedCharId === char.id
                          ? "border-gold-400 bg-gold-400"
                          : "border-surface-600"
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
          )}

          {/* Player Name Input */}
          {selectedCharId && (
            <div className="space-y-1.5 mb-6 animate-slide-in-up">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gold-400/70">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name for this session"
                className="input-gold"
                autoFocus
              />
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={!selectedCharId || !playerName.trim()}
            className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-rogue-600/90 via-rogue-500/90 to-emerald-500/90 hover:from-rogue-500 hover:via-rogue-400 hover:to-emerald-400 text-white shadow-lg shadow-rogue-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Enter the Adventure
            </span>
          </button>

          {/* Footer */}
          <p className="text-center text-[10px] text-surface-700 uppercase tracking-widest mt-6">
            Player Access · Arkla Campaign
          </p>
        </div>
      </div>
    </div>
  );
}
