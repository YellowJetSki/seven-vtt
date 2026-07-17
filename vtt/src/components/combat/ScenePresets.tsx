/* ── ScenePresets ──────────────────────────────────────────────
 * Save/load/delete scene presets in localStorage.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";

interface ScenePreset {
  name: string;
  scene: string;
  mapUrl: string;
  phase: string;
}

const PRESETS_KEY = "vtt-scene-presets";
const PHASE_ICONS: Record<string, string> = { exploration: "🧭", combat: "⚔️", rest: "🛏️", downtime: "🏙️" };

function loadPresets(): ScenePreset[] {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || "[]"); } catch { return []; }
}

function savePresets(presets: ScenePreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

interface Props {
  sceneInput: string;
  mapUrlInput: string;
  currentPhase: string;
  onLoadPreset: (preset: ScenePreset) => void;
}

export function ScenePresets({ sceneInput, mapUrlInput, currentPhase, onLoadPreset }: Props) {
  const [presets, setPresets] = useState<ScenePreset[]>(loadPresets);
  const [presetNameInput, setPresetNameInput] = useState("");

  const savePreset = useCallback(() => {
    const name = presetNameInput.trim();
    if (!name) return;
    const preset: ScenePreset = { name, scene: sceneInput, mapUrl: mapUrlInput, phase: currentPhase };
    const updated = [...presets.filter((p) => p.name !== name), preset];
    setPresets(updated);
    savePresets(updated);
    setPresetNameInput("");
  }, [presetNameInput, sceneInput, mapUrlInput, currentPhase, presets]);

  const deletePreset = useCallback((name: string) => {
    const updated = presets.filter((p) => p.name !== name);
    setPresets(updated);
    savePresets(updated);
  }, [presets]);

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Scene Presets</h4>
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
              <button onClick={() => onLoadPreset(p)}
                className="flex items-center gap-2 text-xs text-surface-300 hover:text-surface-100 transition-colors">
                <span className="text-surface-500">{PHASE_ICONS[p.phase] ?? "•"}</span>
                <span>{p.name}</span>
              </button>
              <button onClick={() => deletePreset(p.name)}
                className="text-surface-500 hover:text-warrior-400 opacity-0 group-hover:opacity-100 transition-all text-[10px]">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
