/* ── Live Session View ───────────────────────────────────────── */

import { useState, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { Button } from "@/components/ui/Button";

/* ═══════════════════════════════════════════════════════════════
 * LIVE SESSION VIEW — DM's Session Control Center
 *
 * The DM controls what players see in real-time during the session.
 * Features:
 *  • Session start / end with timer
 *  • Phase toggles (Exploration, Combat, Rest, Downtime)
 *  • Scene description that players see
 *  • Current map image push
 *  • DM announcements (quest updates, lore drops)
 *  • Rest tracking (short/long)
 *  • "Push to Players" — broadcast current state
 * ═══════════════════════════════════════════════════════════════ */

export function LiveSessionView() {
  const liveSession = useCombatStore((s) => s.liveSession);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const setSessionPhase = useCombatStore((s) => s.setSessionPhase);
  const setCurrentScene = useCombatStore((s) => s.setCurrentScene);
  const setCurrentMapUrl = useCombatStore((s) => s.setCurrentMapUrl);
  const setDmAnnouncement = useCombatStore((s) => s.setDmAnnouncement);
  const startSession = useCombatStore((s) => s.startSession);
  const recordRest = useCombatStore((s) => s.recordRest);
  const endSession = useCombatStore((s) => s.endSession);

  const [sceneInput, setSceneInput] = useState(liveSession.currentScene ?? "");
  const [announcementInput, setAnnouncementInput] = useState(liveSession.dmAnnouncement ?? "");
  const [mapUrlInput, setMapUrlInput] = useState(liveSession.currentMapUrl ?? "");
  const [showPushConfirmation, setShowPushConfirmation] = useState(false);

  const phaseColors: Record<string, string> = {
    exploration: "border-l-mage-500",
    combat: "border-l-warrior-500",
    rest: "border-l-divine-500",
    downtime: "border-l-surface-500",
  };

  const sessionStarted = liveSession.sessionStartedAt !== null;

  /* ── Session Timer ── */
  const elapsedSeconds = sessionStarted
    ? Math.floor((Date.now() - liveSession.sessionStartedAt!) / 1000)
    : 0;
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;

  const handlePushToPlayers = useCallback(() => {
    setCurrentScene(sceneInput || undefined);
    setCurrentMapUrl(mapUrlInput || undefined);
    setDmAnnouncement(announcementInput || undefined);
    setShowPushConfirmation(true);
    setTimeout(() => setShowPushConfirmation(false), 2500);
  }, [sceneInput, mapUrlInput, announcementInput, setCurrentScene, setCurrentMapUrl, setDmAnnouncement]);

  /* ── Rest timers ── */
  const lastShortRest = liveSession.lastShortRestAt
    ? new Date(liveSession.lastShortRestAt).toLocaleTimeString()
    : null;
  const lastLongRest = liveSession.lastLongRestAt
    ? new Date(liveSession.lastLongRestAt).toLocaleTimeString()
    : null;

  return (
    <div className="space-y-4">
      {/* Header — Session Control */}
      <div className={`rounded-xl border border-surface-700 bg-surface-850 p-4 ${
        sessionStarted ? phaseColors[liveSession.phase] : ""
      } border-l-4`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-lg">
              🎙️
            </span>
            <div>
              <h3 className="font-bold text-surface-100">
                {sessionStarted ? "Session Active" : "No Active Session"}
              </h3>
              <p className="text-xs text-surface-400">
                {sessionStarted
                  ? `Phase: ${liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}`
                  : "Start a session to broadcast to players"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Timer */}
            {sessionStarted && (
              <div className="rounded-md bg-surface-800 px-3 py-1.5 text-center">
                <p className="text-xs text-surface-500">
                  {hours > 0 ? `${hours}h ` : ""}{minutes}m {secs.toString().padStart(2, "0")}s
                </p>
              </div>
            )}
            {!sessionStarted ? (
              <Button size="sm" onClick={startSession}>
                ▶ Start Session
              </Button>
            ) : (
              <Button variant="danger" size="sm" onClick={endSession}>
                ■ End Session
              </Button>
            )}
          </div>
        </div>
      </div>

      {sessionStarted && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* ── Left Column: Controls ── */}
          <div className="space-y-4">
            {/* Phase Selector */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                Session Phase
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {(["exploration", "combat", "rest", "downtime"] as const).map((phase) => {
                  const icons: Record<string, string> = {
                    exploration: "🧭",
                    combat: "⚔️",
                    rest: "🛏️",
                    downtime: "🏙️",
                  };
                  return (
                    <button
                      key={phase}
                      onClick={() => setSessionPhase(phase)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                        liveSession.phase === phase
                          ? "border-accent-500 bg-accent-500/10 text-accent-300"
                          : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200"
                      }`}
                    >
                      <span className="mr-2">{icons[phase]}</span>
                      <span className="font-medium capitalize">{phase}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scene Description */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
                Scene Description
              </h4>
              <textarea
                value={sceneInput}
                onChange={(e) => setSceneInput(e.target.value)}
                placeholder="Describe what the players see, hear, and smell..."
                rows={4}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none"
              />
            </div>

            {/* Map URL */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
                Battle Map
              </h4>
              <input
                type="text"
                value={mapUrlInput}
                onChange={(e) => setMapUrlInput(e.target.value)}
                placeholder="Paste map image URL..."
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
              />
              {mapUrlInput && (
                <div className="mt-2 overflow-hidden rounded-lg border border-surface-700">
                  <img
                    src={mapUrlInput}
                    alt="Map preview"
                    className="max-h-48 w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* DM Announcement */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">
                DM Announcement
              </h4>
              <textarea
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                placeholder="Quest update, lore drop, or important message for players..."
                rows={3}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none"
              />
            </div>

            {/* Push to Players */}
            <div className="flex items-center gap-3">
              <Button onClick={handlePushToPlayers} className="flex-1">
                📡 Push to Players
              </Button>
              {showPushConfirmation && (
                <span className="text-sm text-divine-400 animate-pulse">
                  ✓ Broadcasted!
                </span>
              )}
            </div>
          </div>

          {/* ── Right Column: Preview & Info ── */}
          <div className="space-y-4">
            {/* Player Preview Card */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                Player View Preview
              </h4>
              <div className="rounded-lg border border-surface-700 bg-surface-900 p-4">
                {/* Phase badge */}
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    liveSession.phase === "combat"
                      ? "bg-warrior-500/20 text-warrior-400"
                      : liveSession.phase === "rest"
                        ? "bg-divine-500/20 text-divine-400"
                        : "bg-mage-500/20 text-mage-400"
                  }`}>
                    {liveSession.phase === "combat" ? "⚔️" : liveSession.phase === "rest" ? "🛏️" : "🧭"}{" "}
                    {liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}
                  </span>
                  <span className="text-[11px] text-surface-500">
                    {hours > 0 ? `${hours}:` : ""}{minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
                  </span>
                </div>

                {/* Scene */}
                {(sceneInput || liveSession.currentScene) && (
                  <div className="mb-3">
                    <p className="text-sm text-surface-300 leading-relaxed">
                      {liveSession.currentScene || sceneInput}
                    </p>
                  </div>
                )}

                {/* Map */}
                {(mapUrlInput || liveSession.currentMapUrl) && (
                  <div className="mb-3 overflow-hidden rounded-lg border border-surface-700">
                    <img
                      src={liveSession.currentMapUrl || mapUrlInput}
                      alt="Current map"
                      className="w-full object-cover"
                      style={{ maxHeight: "200px" }}
                    />
                  </div>
                )}

                {/* Announcement */}
                {(announcementInput || liveSession.dmAnnouncement) && (
                  <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-accent-400">📢 DM</span>
                    </div>
                    <p className="text-sm text-accent-200">
                      {liveSession.dmAnnouncement || announcementInput}
                    </p>
                  </div>
                )}

                {/* Empty state */}
                {!sceneInput && !mapUrlInput && !announcementInput && (
                  <p className="text-sm text-surface-500 italic">
                    Players will see your scene description, map, and announcements here once you push them.
                  </p>
                )}
              </div>
            </div>

            {/* Rest Tracker */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">
                Rest Tracker
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-surface-200">Short Rest</span>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => recordRest("short")}
                    >
                      Record
                    </Button>
                  </div>
                  {lastShortRest && (
                    <p className="mt-1 text-[11px] text-surface-500">
                      Last: {lastShortRest}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-surface-200">Long Rest</span>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => recordRest("long")}
                    >
                      Record
                    </Button>
                  </div>
                  {lastLongRest && (
                    <p className="mt-1 text-[11px] text-surface-500">
                      Last: {lastLongRest}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Active Combat Summary */}
            {activeEncounter && activeEncounter.phase === "active" && (
              <div className="rounded-xl border border-warrior-500/30 bg-warrior-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚔️</span>
                  <h4 className="text-sm font-semibold text-surface-100">
                    Active Combat: {activeEncounter.name}
                  </h4>
                  <span className="rounded bg-warrior-500/20 px-2 py-0.5 text-[11px] font-medium text-warrior-400">
                    R{activeEncounter.round}
                  </span>
                </div>
                <p className="text-xs text-surface-400">
                  {activeEncounter.combatants.filter((c) => !c.isDead).length} combatants remaining
                  · {activeEncounter.combatants.filter((c) => c.isDead).length} defeated
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
