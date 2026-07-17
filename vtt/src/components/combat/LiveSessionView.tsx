/* ── Live Session View ─────────────────────────────────────────
 * DM's Session Control Center — broadcasts real-time state to players.
 * Orchestrates phase selector, scene/map/announcement inputs,
 * scene presets, player preview, combat summary, rest tracker.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useEffect } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { SessionTimer } from "./SessionTimer";
import { ScenePresets } from "./ScenePresets";
import { PlayerViewPreview } from "./PlayerViewPreview";
import { CombatSummary } from "./CombatSummary";
import { RestTracker } from "./RestTracker";
import type { ScenePreset } from "./ScenePresets"; // eslint-disable-line

const PHASE_META: Record<string, { icon: string; color: string }> = {
  exploration: { icon: "🧭", color: "border-l-mage-500" },
  combat: { icon: "⚔️", color: "border-l-warrior-500" },
  rest: { icon: "🛏️", color: "border-l-divine-500" },
  downtime: { icon: "🏙️", color: "border-l-surface-500" },
};

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
  const showToast = useUiStore((s) => s.showToast);

  const [sceneInput, setSceneInput] = useState(liveSession.currentScene ?? "");
  const [announcementInput, setAnnouncementInput] = useState(liveSession.dmAnnouncement ?? "");
  const [mapUrlInput, setMapUrlInput] = useState(liveSession.currentMapUrl ?? "");
  const [ambientUrl, setAmbientUrl] = useState("");
  const [showPushConfirmation, setShowPushConfirmation] = useState(false);

  useEffect(() => {
    setSceneInput(liveSession.currentScene ?? "");
    setAnnouncementInput(liveSession.dmAnnouncement ?? "");
    setMapUrlInput(liveSession.currentMapUrl ?? "");
  }, [liveSession.currentScene, liveSession.dmAnnouncement, liveSession.currentMapUrl]);

  const sessionStarted = liveSession.sessionStartedAt !== null;

  const handlePush = useCallback(() => {
    setCurrentScene(sceneInput);
    setCurrentMapUrl(mapUrlInput);
    setDmAnnouncement(announcementInput);
    setShowPushConfirmation(true);
    showToast({ message: "Session state broadcast to players!", type: "success" });
    setTimeout(() => setShowPushConfirmation(false), 2500);
  }, [sceneInput, mapUrlInput, announcementInput, setCurrentScene, setCurrentMapUrl, setDmAnnouncement, showToast]);

  const handleLoadPreset = useCallback((preset: ScenePreset) => {
    setSceneInput(preset.scene);
    setMapUrlInput(preset.mapUrl);
    setSessionPhase(preset.phase as any);
    showToast({ message: `Loaded "${preset.name}".`, type: "info" });
  }, [setSessionPhase, showToast]);

  const hours = sessionStarted ? Math.floor((Date.now() - liveSession.sessionStartedAt!) / 3600000) : 0;
  const minutes = sessionStarted ? Math.floor(((Date.now() - liveSession.sessionStartedAt!) % 3600000) / 60000) : 0;
  const secs = sessionStarted ? Math.floor(((Date.now() - liveSession.sessionStartedAt!) % 60000) / 1000) : 0;

  const phaseColor = sessionStarted
    ? (PHASE_META[liveSession.phase]?.color ?? "border-l-surface-500")
    : "border-l-surface-500";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl border border-surface-700 bg-surface-850 p-4 border-l-4 ${phaseColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/10 text-lg">🎙️</span>
            <div>
              <h3 className="font-bold text-surface-100">{sessionStarted ? "Session Active" : "No Active Session"}</h3>
              <p className="text-xs text-surface-400">
                {sessionStarted ? `Phase: ${liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}` : "Start a session to broadcast"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {sessionStarted && <SessionTimer sessionStartedAt={liveSession.sessionStartedAt} sessionStarted={sessionStarted} />}
            {!sessionStarted ? (
              <Button size="sm" onClick={startSession}>▶ Start Session</Button>
            ) : (
              <Button variant="danger" size="sm" onClick={endSession}>■ End Session</Button>
            )}
          </div>
        </div>
      </div>

      {sessionStarted && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Phase Selector */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Session Phase</h4>
              <div className="grid grid-cols-2 gap-2">
                {(["exploration", "combat", "rest", "downtime"] as const).map((phase) => (
                  <button key={phase} onClick={() => setSessionPhase(phase)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                      liveSession.phase === phase
                        ? "border-accent-500 bg-accent-500/10 text-accent-300"
                        : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200"
                    }`}>
                    <span className="mr-2">{PHASE_META[phase]?.icon ?? "•"}</span>
                    <span className="font-medium capitalize">{phase}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scene Description */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Scene Description</h4>
              <textarea value={sceneInput} onChange={(e) => setSceneInput(e.target.value)}
                placeholder="Describe what the players see, hear, and smell..." rows={4}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none" />
            </div>

            {/* Media */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Media</h4>
              <div>
                <label className="mb-1 block text-[11px] text-surface-500">Battle Map URL</label>
                <input type="text" value={mapUrlInput} onChange={(e) => setMapUrlInput(e.target.value)} placeholder="Paste map image URL..."
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
                {mapUrlInput && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-surface-700">
                    <img src={mapUrlInput} alt="Map preview" className="max-h-36 w-full object-cover bg-surface-800"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-surface-500">Ambient Music URL</label>
                <input type="text" value={ambientUrl} onChange={(e) => setAmbientUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>
            </div>

            {/* DM Announcement */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">DM Announcement</h4>
              <textarea value={announcementInput} onChange={(e) => setAnnouncementInput(e.target.value)}
                placeholder="Quest update, lore drop, or important message for players..." rows={3}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none" />
            </div>

            {/* Broadcast */}
            <div className="flex items-center gap-3">
              <Button onClick={handlePush} className="flex-1">📡 Broadcast to Players</Button>
              {showPushConfirmation && <span className="text-sm text-divine-400 font-medium animate-pulse">✓ Sent!</span>}
            </div>

            {/* Scene Presets */}
            <ScenePresets sceneInput={sceneInput} mapUrlInput={mapUrlInput} currentPhase={liveSession.phase} onLoadPreset={handleLoadPreset} />
          </div>

          {/* Right: Preview & Info */}
          <div className="space-y-4">
            <PlayerViewPreview liveSession={liveSession} sceneInput={sceneInput} mapUrlInput={mapUrlInput}
              announcementInput={announcementInput} ambientUrl={ambientUrl} hours={hours} minutes={minutes} secs={secs} />
            <CombatSummary activeEncounter={activeEncounter} />
            <RestTracker lastShortRestAt={liveSession.lastShortRestAt} lastLongRestAt={liveSession.lastLongRestAt} onRecordRest={recordRest} />
          </div>
        </div>
      )}
    </div>
  );
}
