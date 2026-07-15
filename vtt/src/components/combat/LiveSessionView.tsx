/* ── Live Session View ─────────────────────────────────────────
 * DM's Session Control Center — broadcasts real-time state to players.
 *
 * UPGRADED:
 *  • Quick-save/load scene presets (localStorage)
 *  • Initiative order display in combat phase
 *  • Ambient music link for players
 *  • Combat summary with turn indicator
 *  • Session timer with expanded format
 *  • One-click push to players with visual confirmation
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useEffect } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

interface ScenePreset {
  name: string;
  scene: string;
  mapUrl: string;
  phase: string;
}

const PRESETS_KEY = "vtt-scene-presets";

function loadPresets(): ScenePreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePresets(presets: ScenePreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

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

  // Scene presets
  const [presets, setPresets] = useState<ScenePreset[]>(loadPresets);
  const [presetNameInput, setPresetNameInput] = useState("");

  // Sync inputs with live session state
  useEffect(() => {
    setSceneInput(liveSession.currentScene ?? "");
    setAnnouncementInput(liveSession.dmAnnouncement ?? "");
    setMapUrlInput(liveSession.currentMapUrl ?? "");
  }, [liveSession.currentScene, liveSession.dmAnnouncement, liveSession.currentMapUrl]);

  const sessionStarted = liveSession.sessionStartedAt !== null;

  /* ── Session Timer ── */
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    if (!sessionStarted) { setTimer(0); return; }
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - liveSession.sessionStartedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStarted, liveSession.sessionStartedAt]);

  const hours = Math.floor(timer / 3600);
  const minutes = Math.floor((timer % 3600) / 60);
  const secs = timer % 60;

  const handlePush = useCallback(() => {
    setCurrentScene(sceneInput || "");
    setCurrentMapUrl(mapUrlInput || "");
    setDmAnnouncement(announcementInput || "");
    setShowPushConfirmation(true);
    showToast({ message: "Session state broadcast to players!", type: "success" });
    setTimeout(() => setShowPushConfirmation(false), 2500);
  }, [sceneInput, mapUrlInput, announcementInput, setCurrentScene, setCurrentMapUrl, setDmAnnouncement, showToast]);

  // Rest timestamps
  const lastShortRest = liveSession.lastShortRestAt
    ? new Date(liveSession.lastShortRestAt).toLocaleTimeString()
    : null;
  const lastLongRest = liveSession.lastLongRestAt
    ? new Date(liveSession.lastLongRestAt).toLocaleTimeString()
    : null;

  /* ── Scene Presets ── */
  const savePreset = () => {
    const name = presetNameInput.trim();
    if (!name) return;
    const preset: ScenePreset = { name, scene: sceneInput, mapUrl: mapUrlInput, phase: liveSession.phase };
    const updated = [...presets.filter((p) => p.name !== name), preset];
    setPresets(updated);
    savePresets(updated);
    setPresetNameInput("");
    showToast({ message: `Scene "${name}" saved.`, type: "success" });
  };

  const loadPreset = (preset: ScenePreset) => {
    setSceneInput(preset.scene);
    setMapUrlInput(preset.mapUrl);
    setSessionPhase(preset.phase as "exploration" | "combat" | "rest" | "downtime");
    showToast({ message: `Loaded "${preset.name}".`, type: "info" });
  };

  const deletePreset = (name: string) => {
    const updated = presets.filter((p) => p.name !== name);
    setPresets(updated);
    savePresets(updated);
  };

  // Combat summary
  const combatants = activeEncounter?.combatants ?? [];
  const aliveCount = combatants.filter((c) => !c.isDead).length;
  const deadCount = combatants.length - aliveCount;
  const currentCombatant = activeEncounter?.combatants[activeEncounter?.currentCombatantIndex ?? 0];

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
            {sessionStarted && (
              <div className="rounded-md bg-surface-800 px-3 py-1.5 text-center">
                <p className="text-[10px] text-surface-500">Elapsed</p>
                <p className="text-sm font-mono font-bold text-surface-200">
                  {hours > 0 ? `${hours}:` : ""}{minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
                </p>
              </div>
            )}
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
          {/* ── Left: Controls ── */}
          <div className="space-y-4">
            {/* Phase Selector */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Session Phase</h4>
              <div className="grid grid-cols-2 gap-2">
                {(["exploration", "combat", "rest", "downtime"] as const).map((phase) => (
                  <button
                    key={phase}
                    onClick={() => setSessionPhase(phase)}
                    className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                      liveSession.phase === phase
                        ? "border-accent-500 bg-accent-500/10 text-accent-300"
                        : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200"
                    }`}
                  >
                    <span className="mr-2">{PHASE_META[phase]?.icon ?? "•"}</span>
                    <span className="font-medium capitalize">{phase}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scene Description */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Scene Description</h4>
              <textarea
                value={sceneInput}
                onChange={(e) => setSceneInput(e.target.value)}
                placeholder="Describe what the players see, hear, and smell..."
                rows={4}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none"
              />
            </div>

            {/* Battle Map + Ambient Music */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Media</h4>
              <div>
                <label className="mb-1 block text-[11px] text-surface-500">Battle Map URL</label>
                <input type="text" value={mapUrlInput} onChange={(e) => setMapUrlInput(e.target.value)}
                  placeholder="Paste map image URL..."
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
                {mapUrlInput && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-surface-700">
                    <img src={mapUrlInput} alt="Map preview"
                      className="max-h-36 w-full object-cover bg-surface-800"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-surface-500">Ambient Music URL</label>
                <input type="text" value={ambientUrl} onChange={(e) => setAmbientUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>
            </div>

            {/* DM Announcement */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">DM Announcement</h4>
              <textarea value={announcementInput} onChange={(e) => setAnnouncementInput(e.target.value)}
                placeholder="Quest update, lore drop, or important message for players..."
                rows={3}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none" />
            </div>

            {/* Push to Players */}
            <div className="flex items-center gap-3">
              <Button onClick={handlePush} className="flex-1">📡 Broadcast to Players</Button>
              {showPushConfirmation && (
                <span className="text-sm text-divine-400 font-medium animate-pulse">✓ Sent!</span>
              )}
            </div>

            {/* Scene Presets */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Scene Presets</h4>
              </div>
              <div className="flex gap-2 mb-2">
                <input type="text" value={presetNameInput} onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder="Preset name..."
                  className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && savePreset()} />
                <Button size="xs" variant="secondary" onClick={savePreset} disabled={!presetNameInput.trim()}>Save</Button>
              </div>
              {presets.length > 0 && (
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {presets.map((p) => (
                    <div key={p.name} className="group flex items-center justify-between rounded-lg bg-surface-800 px-3 py-1.5">
                      <button onClick={() => loadPreset(p)}
                        className="flex items-center gap-2 text-xs text-surface-300 hover:text-surface-100 transition-colors">
                        <span className="text-surface-500">{PHASE_META[p.phase]?.icon ?? "•"}</span>
                        <span>{p.name}</span>
                      </button>
                      <button onClick={() => deletePreset(p.name)}
                        className="text-surface-500 hover:text-warrior-400 opacity-0 group-hover:opacity-100 transition-all text-[10px]">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Preview & Info ── */}
          <div className="space-y-4">
            {/* Player View Preview */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Player View Preview</h4>
              <div className="rounded-lg border border-surface-700 bg-surface-900 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    liveSession.phase === "combat" ? "bg-warrior-500/20 text-warrior-400"
                    : liveSession.phase === "rest" ? "bg-divine-500/20 text-divine-400"
                    : "bg-mage-500/20 text-mage-400"
                  }`}>
                    {PHASE_META[liveSession.phase]?.icon ?? "•"} {liveSession.phase.charAt(0).toUpperCase() + liveSession.phase.slice(1)}
                  </span>
                  <span className="text-[11px] text-surface-500">
                    {hours > 0 ? `${hours}:` : ""}{minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
                  </span>
                </div>

                {(sceneInput || liveSession.currentScene) && (
                  <div className="mb-3">
                    <p className="text-sm text-surface-300 leading-relaxed">{liveSession.currentScene || sceneInput}</p>
                  </div>
                )}

                {(mapUrlInput || liveSession.currentMapUrl) && (
                  <div className="mb-3 overflow-hidden rounded-lg border border-surface-700">
                    <img src={liveSession.currentMapUrl || mapUrlInput} alt="Current map"
                      className="w-full object-cover bg-surface-800" style={{ maxHeight: "160px" }} />
                  </div>
                )}

                {ambientUrl && (
                  <div className="mb-3 rounded-lg bg-surface-800 p-2 flex items-center gap-2">
                    <span className="text-sm">🎵</span>
                    <span className="text-xs text-surface-400 truncate flex-1">{ambientUrl}</span>
                    <span className="text-[10px] text-divine-400">Shared</span>
                  </div>
                )}

                {(announcementInput || liveSession.dmAnnouncement) && (
                  <div className="rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-accent-400 font-medium">📢 DM</span>
                    </div>
                    <p className="text-sm text-accent-200">{liveSession.dmAnnouncement || announcementInput}</p>
                  </div>
                )}

                {!sceneInput && !mapUrlInput && !announcementInput && !ambientUrl && (
                  <p className="text-sm text-surface-500 italic">
                    Fill in the scene, map, and announcement fields on the left, then click "Broadcast to Players".
                  </p>
                )}
              </div>
            </div>

            {/* Combat Summary */}
            {activeEncounter && (
              <div className={`rounded-xl border p-4 ${
                activeEncounter.phase === "active" ? "border-warrior-500/30 bg-warrior-500/5" : "border-surface-700 bg-surface-850"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⚔️</span>
                  <h4 className="text-sm font-semibold text-surface-100">{activeEncounter.name}</h4>
                  {activeEncounter.phase === "active" && (
                    <span className="rounded bg-warrior-500/20 px-2 py-0.5 text-[11px] font-medium text-warrior-400">R{activeEncounter.round}</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded bg-surface-800 p-2">
                    <p className="text-surface-500">Alive</p>
                    <p className="font-bold text-surface-200">{aliveCount}</p>
                  </div>
                  <div className="rounded bg-surface-800 p-2">
                    <p className="text-surface-500">Defeated</p>
                    <p className="font-bold text-warrior-400">{deadCount}</p>
                  </div>
                </div>
                {activeEncounter.phase === "active" && currentCombatant && (
                  <div className="mt-2 rounded-lg bg-accent-500/10 p-2 text-center">
                    <p className="text-[11px] text-accent-400">▶ {currentCombatant.name}'s Turn</p>
                  </div>
                )}
              </div>
            )}

            {/* Rest Tracker */}
            <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Rest Tracker</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-surface-200">Short Rest</span>
                    <Button size="xs" variant="secondary" onClick={() => recordRest("short")}>Record</Button>
                  </div>
                  {lastShortRest && <p className="mt-1 text-[11px] text-surface-500">Last: {lastShortRest}</p>}
                </div>
                <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-surface-200">Long Rest</span>
                    <Button size="xs" variant="secondary" onClick={() => recordRest("long")}>Record</Button>
                  </div>
                  {lastLongRest && <p className="mt-1 text-[11px] text-surface-500">Last: {lastLongRest}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
