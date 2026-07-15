/* ── Player Dashboard ──────────────────────────────────────────
 * Player-facing view with real-time DM updates.
 *
 * UPGRADED FEATURES:
 *  • Live session status bar (phase, timer, scene)
 *  • DM announcement marquee
 *  • Current battle map display
 *  • Initiative tracker preview (in combat phase)
 *  • Character sheet with full stats
 *  • Party overview card
 *  • Loading state to prevent "character not found" flash
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
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);
  const campaign = useCampaignStore((s) => s.campaign);

  // Subscribe to real-time updates from the DM
  usePlayerFirebaseSync();

  // Live session state from combatStore (hydrated by Firebase listener)
  const liveSession = useCombatStore((s) => s.liveSession);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  // Find the player's character
  const character = characters.find((c) => {
    const firstName = c.name.split(" ")[0];
    return firstName.toLowerCase() === characterId?.toLowerCase();
  });

  const sessionActive = liveSession.sessionStartedAt !== null;

  // Loading state: campaign may not have loaded yet from Firebase
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to let Firebase hydrate; after 3 seconds, show whatever we have
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // If campaign data loads, we're done loading
  useEffect(() => {
    if (campaign) {
      setIsLoading(false);
    }
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

  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);

  // Phase styling
  const phaseMeta: Record<string, { icon: string; bg: string; text: string }> = {
    exploration: { icon: "🧭", bg: "bg-mage-500/20", text: "text-mage-400" },
    combat: { icon: "⚔️", bg: "bg-warrior-500/20", text: "text-warrior-400" },
    rest: { icon: "🛏️", bg: "bg-divine-500/20", text: "text-divine-400" },
    downtime: { icon: "🏙️", bg: "bg-surface-800", text: "text-surface-400" },
  };

  const phaseStyle = phaseMeta[liveSession.phase] ?? phaseMeta.downtime;

  // Combat data
  const combatants = activeEncounter?.combatants ?? [];
  const aliveCombatants = combatants.filter((c) => !c.isDead);
  const currentCombatantIdx = activeEncounter?.currentCombatantIndex ?? 0;
  const currentCombatant = combatants[currentCombatantIdx];
  const isInCombat = activeEncounter?.phase === "active";

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-900">
        <div className="flex flex-col items-center gap-3">
          <span className="animate-pulse text-3xl text-accent-400">Sᚱ</span>
          <p className="text-sm text-surface-500">Loading your character...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-10 border-b border-surface-700/50 bg-surface-900/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-accent-400">Sᚱ</span>
            <span className="text-xs text-surface-500">{campaign?.name ?? "Campaign"}</span>
            {sessionActive && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${phaseStyle.bg} ${phaseStyle.text}`}>
                {phaseStyle.icon} {liveSession.phase}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {characterName && (
              <span className="text-xs text-surface-400">
                <span className="font-medium text-surface-200">{characterName}</span>
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* ── Live Session Banner ── */}
      {sessionActive && (
        <div className="border-b border-surface-700/30 bg-surface-850/50">
          <div className="mx-auto max-w-4xl px-4 py-3">
            <div className="flex items-start gap-4">
              {/* Phase + Timer */}
              <div className="flex shrink-0 items-center gap-2">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${phaseStyle.bg}`}>
                  <span className={phaseStyle.text}>{phaseStyle.icon}</span>
                </span>
                <div className="text-center">
                  <p className="text-[10px] text-surface-500">{liveSession.phase}</p>
                  <p className="font-mono text-xs font-bold text-surface-300">
                    {hours > 0 ? `${hours}h ` : ""}{minutes}m
                  </p>
                </div>
              </div>

              {/* Scene Description */}
              <div className="min-w-0 flex-1">
                {liveSession.currentScene ? (
                  <p className="line-clamp-2 text-sm leading-relaxed text-surface-200">{liveSession.currentScene}</p>
                ) : (
                  <p className="text-sm italic text-surface-500">Awaiting DM's scene description...</p>
                )}
              </div>

              {/* Battle Map Thumbnail */}
              {liveSession.currentMapUrl && (
                <div className="hidden shrink-0 sm:block">
                  <img src={liveSession.currentMapUrl} alt="Map"
                    className="h-14 w-20 rounded-lg border border-surface-700 object-cover" />
                </div>
              )}
            </div>

            {/* DM Announcement */}
            {liveSession.dmAnnouncement && (
              <div className="mt-2 rounded-lg border border-accent-500/20 bg-accent-500/10 p-3">
                <p className="mb-0.5 text-xs font-medium text-accent-400">📢 DM Announcement</p>
                <p className="text-sm text-accent-200">{liveSession.dmAnnouncement}</p>
              </div>
            )}

            {/* Environmental Conditions */}
            {liveSession.conditions && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-surface-400">
                {liveSession.conditions.weather !== "clear" && (
                  <span>{liveSession.conditions.weather}</span>
                )}
                {liveSession.conditions.lighting !== "bright" && (
                  <span>{liveSession.conditions.lighting}</span>
                )}
                {liveSession.conditions.terrain !== "normal" && (
                  <span>{liveSession.conditions.terrain}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Combat Status Bar ── */}
      {isInCombat && (
        <div className="border-b border-warrior-500/20 bg-warrior-500/5">
          <div className="mx-auto max-w-4xl px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="rounded bg-warrior-500/20 px-2 py-0.5 text-[11px] font-bold text-warrior-400">
                  R{activeEncounter?.round}
                </span>
                <span className="text-sm font-medium text-surface-200">
                  ⚔️ {activeEncounter?.name}
                </span>
                <span className="text-xs text-surface-500">
                  {aliveCombatants.length} alive
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-[9px] font-bold text-white">▶</span>
                <span className="text-xs font-medium text-accent-400">
                  {currentCombatant?.name}'s Turn
                </span>
              </div>
            </div>

            {/* Initiative Order (compact) */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {combatants.slice(0, 10).map((c, i) => (
                <span key={c.id}
                  className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                    i === currentCombatantIdx
                      ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                      : c.isDead
                        ? "bg-surface-800 text-surface-600 line-through"
                        : i < currentCombatantIdx
                          ? "bg-surface-800 text-surface-500"
                          : "bg-surface-800 text-surface-300"
                  }`}>
                  {c.isDead ? "💀" : c.type === "player" ? "⚔" : "👹"} {c.name.split(" ")[0]}
                </span>
              ))}
              {combatants.length > 10 && (
                <span className="text-[10px] text-surface-500">+{combatants.length - 10} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        {character ? (
          <div className="space-y-6">
            {/* Party Overview */}
            {characters.length > 1 && (
              <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                  🏰 Party ({characters.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {characters.map((pc) => {
                    const isMe = pc.id === character.id;
                    return (
                      <div key={pc.id}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                          isMe
                            ? "border-accent-500/50 bg-accent-500/10"
                            : "border-surface-700 bg-surface-800"
                        }`}>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          isMe ? "bg-accent-500/20 text-accent-400" : "bg-surface-700 text-surface-400"
                        }`}>
                          {pc.level}
                        </span>
                        <div>
                          <p className="font-medium text-surface-200">{pc.name}</p>
                          <p className="text-[10px] text-surface-500">{pc.class} · HP {pc.hitPoints.current}/{pc.hitPoints.max}</p>
                        </div>
                        {isMe && <span className="rounded bg-accent-500/20 px-1.5 py-0.5 text-[9px] text-accent-400">You</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Character Sheet */}
            <PlayerCharacterSheet character={character} />
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-surface-700 bg-surface-850 py-20 text-center">
            <span className="mb-4 text-5xl text-surface-600">🔍</span>
            <h2 className="mb-2 text-lg font-semibold text-surface-200">
              Character Not Found
            </h2>
            <p className="mb-6 max-w-sm text-sm text-surface-500">
              Your character "{characterName}" hasn't been added to this
              campaign yet. Please ask your DM to create your character card.
            </p>
            <Button variant="secondary" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-800 py-4 text-center">
        <p className="text-[10px] text-surface-600">
          STᚱ VTT · Player View · {sessionActive ? "🎙️ Session Live" : "⏸️ Offline"}
        </p>
      </footer>
    </div>
  );
}
