/* ── Player Dashboard ──────────────────────────────────────────
 * Player-facing view with real-time DM updates synced via Firebase.
 *
 * FIREBASE SYNC: This page uses usePlayerFirebaseSync to subscribe
 * to Firestore. All data (campaign state, live session, combat)
 * is delivered in real-time via onSnapshot listeners. No localStorage
 * caching — the DM's changes reflect instantly across all devices.
 *
 * UPGRADED FEATURES:
 *  • Live session status bar (phase, timer, scene)
 *  • DM announcement marquee
 *  • Current battle map display
 *  • Initiative tracker preview (in combat phase)
 *  • Character sheet with full stats
 *  • Party overview card
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { usePlayerFirebaseSync } from "@/hooks/usePlayerFirebaseSync";
import { PlayerCharacterSheet } from "@/components/player/PlayerCharacterSheet";
import { Button } from "@/components/ui/Button";

export function PlayerDashboard() {
  const characterId = useAuthStore((s) => s.characterId);
  const characterName = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const campaign = meta ? { id: meta.id, name: meta.name, playerCharacters: characters } : null;

  // Subscribe to real-time updates from the DM via Firebase
  usePlayerFirebaseSync();

  // Live session state from combatStore (hydrated by Firebase listener)
  const liveSession = useCombatStore((s) => s.liveSession);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  // Find the player's character by matching the characterId from auth
  const character = characters.find((c) => {
    // Match by characterId (exact match from the auth store)
    if (characterId && c.id === characterId) return true;
    // Fallback: match by first name
    const firstName = c.name.split(" ")[0];
    return firstName.toLowerCase() === (characterName ?? characterId ?? "").toLowerCase();
  });

  const sessionActive = liveSession.sessionStartedAt !== null;

  // Loading state: wait for Firebase + campaign store to hydrate
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for campaign data to arrive from Firebase (via onSnapshot)
    if (campaign) {
      setIsLoading(false);
      return;
    }

    // Fallback: wait up to 5 seconds for first data from Firebase
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [campaign]);

  // Session timer
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    if (!sessionActive) { setTimer(0); return; }
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - liveSession.sessionStartedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionActive, liveSession.sessionStartedAt]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const phaseMeta: Record<string, { icon: string; label: string; color: string }> = {
    combat: { icon: "⚔️", label: "Combat", color: "text-warrior-400" },
    exploration: { icon: "🧭", label: "Exploration", color: "text-rogue-400" },
    rest: { icon: "🏕️", label: "Rest", color: "text-divine-400" },
    downtime: { icon: "🏙️", label: "Downtime", color: "text-surface-400" },
  };
  const phaseInfo = phaseMeta[liveSession.phase] ?? { icon: "❓", label: "Unknown", color: "text-surface-400" };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
        <p className="text-sm text-surface-400">Connecting to DM's session...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <span className="text-5xl">📡</span>
        <h2 className="text-lg font-semibold text-surface-200">Waiting for DM...</h2>
        <p className="max-w-sm text-sm text-surface-500">
          The DM hasn't started a campaign session yet. Check back when the game begins!
        </p>
        <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-surface-700 bg-surface-850 p-6 text-center">
          <span className="text-4xl">👤</span>
          <h2 className="mt-2 text-lg font-semibold text-surface-200">Character Not Found</h2>
          <p className="mt-1 text-sm text-surface-500">
            No character named "{characterName}" found in the campaign.
          </p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={logout}>Logout</Button>
        </div>
      </div>
    );
  }

  const currentCombatant = activeEncounter?.combatants[activeEncounter.currentCombatantIndex ?? 0];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Live Session Status Bar */}
      {sessionActive && (
        <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-divine-400 animate-pulse" />
              <span className="text-sm font-medium text-surface-200">
                Session Active
              </span>
              <span className={`text-sm font-semibold ${phaseInfo.color}`}>
                {phaseInfo.icon} {phaseInfo.label}
              </span>
              <span className="text-xs text-surface-500">
                ⏱️ {formatTime(timer)}
              </span>
            </div>
            <span className="text-xs text-surface-500">
              {liveSession.currentScene && `📍 ${liveSession.currentScene}`}
            </span>
          </div>
        </div>
      )}

      {/* DM Announcement */}
      {liveSession.dmAnnouncement && (
        <div className="animate-slide-up rounded-xl border border-rogue-500/20 bg-rogue-500/5 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-rogue-300">
            <span>📢</span>
            <span>{liveSession.dmAnnouncement}</span>
          </p>
        </div>
      )}

      {/* Current Battle Map (if DM has one open) */}
      {liveSession.currentMapUrl && (
        <div className="overflow-hidden rounded-xl border border-surface-700">
          <div className="flex items-center justify-between bg-surface-850 px-4 py-2">
            <span className="text-xs font-medium text-surface-400">Current Battle Map</span>
            <span className="text-[10px] text-surface-500">🗺️</span>
          </div>
          <div className="relative">
            <img src={liveSession.currentMapUrl} alt="Battle Map"
              className="h-48 w-full object-cover" />
          </div>
        </div>
      )}

      {/* Initiative Tracker (during combat phase) */}
      {sessionActive && liveSession.phase === "combat" && activeEncounter && (
        <div className="rounded-xl border border-surface-700 bg-surface-850">
          <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
              ⚔️ Initiative — Round {activeEncounter.round}
            </span>
            {currentCombatant && (
              <span className="text-xs text-accent-400">
                Current: {currentCombatant.name}
              </span>
            )}
          </div>
          <div className="divide-y divide-surface-700">
            {activeEncounter.combatants.slice(0, 10).map((c, i) => {
              const isCurrent = i === (activeEncounter.currentCombatantIndex ?? 0);
              return (
                <div key={c.id}
                  className={`flex items-center justify-between px-4 py-2.5 ${
                    isCurrent ? "bg-accent-500/10" : ""
                  }`}>
                  <div className="flex items-center gap-2">
                    {isCurrent && <span className="text-xs text-accent-400">▶</span>}
                    <span className="text-sm text-surface-200">{c.name}</span>
                    <span className="text-[10px] text-surface-500">{c.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.initiative != null && (
                      <span className="rounded bg-surface-800 px-1.5 py-0.5 text-[11px] font-mono text-surface-300">
                        {c.initiative}
                      </span>
                    )}
                    {c.hitPoints && (
                      <span className={`text-xs ${
                        c.hitPoints.current > 0 ? 'text-surface-400' : 'text-warrior-400'
                      }`}>
                        {c.hitPoints.current}/{c.hitPoints.max}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Character Sheet */}
      <PlayerCharacterSheet character={character} />
    </div>
  );
}
