/* ── Ambient Sound Mixer ────────────────────────────────────────
 * A simple ambient sound player using Web Audio API oscillators
 * and noise generation. Three channels: Rain, Wind, Fire.
 * Orchestrates: AmbientSoundChannel
 * Helpers: ambient-sound-helpers
 * ─────────────────────────────────────────────────────────────── */

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AmbientSoundChannel } from "./AmbientSoundChannel";
import type { SoundChannel } from "./ambient-sound-helpers";
import { createChannelSound, stopChannelNodes } from "./ambient-sound-helpers";

const INITIAL_CHANNELS: Pick<SoundChannel, "id" | "label" | "icon" | "volume" | "active">[] = [
  { id: "rain", label: "Rain", icon: "🌧️", volume: 0.3, active: false },
  { id: "wind", label: "Wind", icon: "💨", volume: 0.2, active: false },
  { id: "fire", label: "Fire", icon: "🔥", volume: 0.25, active: false },
];

export function AmbientSoundMixer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [channels, setChannels] = useState<SoundChannel[]>(
    INITIAL_CHANNELS.map((ch) => ({ ...ch, oscillator: null, gainNode: null, noiseNode: null }))
  );
  const [expanded, setExpanded] = useState(false);

  const getOrCreateContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const toggleChannel = useCallback((channelId: string) => {
    const ctx = getOrCreateContext();
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;

        if (ch.active) {
          stopChannelNodes(ch);
          return { ...ch, active: false, oscillator: null, gainNode: null, noiseNode: null };
        }

        const nodes = createChannelSound(ctx, channelId);
        return { ...ch, active: true, ...nodes };
      })
    );
  }, [getOrCreateContext]);

  const setVolume = useCallback((channelId: string, volume: number) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        if (ch.gainNode) ch.gainNode.gain.value = volume;
        return { ...ch, volume };
      })
    );
  }, []);

  const stopAll = useCallback(() => {
    channels.forEach(stopChannelNodes);
    setChannels((prev) =>
      prev.map((ch) => ({ ...ch, active: false, oscillator: null, gainNode: null, noiseNode: null }))
    );
  }, [channels]);

  useEffect(() => {
    return () => {
      channels.forEach(stopChannelNodes);
      ctxRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border border-surface-700/50 bg-surface-850/80 backdrop-blur-sm overflow-hidden shadow-lg shadow-accent-500/5">
      {/* ── Collapsible Header ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-center justify-between px-4 py-3 transition-all hover:bg-surface-800/50"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">🎵</span>
          <span className="text-xs font-semibold text-surface-300 group-hover:text-surface-100 transition-colors">Ambient Sound</span>
          {channels.some((c) => c.active) && (
            <span className="flex items-center gap-1 rounded-full bg-accent-500/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse" />
              <span className="text-[9px] font-medium text-accent-400">Live</span>
            </span>
          )}
        </div>
        <span className={`text-surface-500 text-xs transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* ── Expanded Controls ── */}
      {expanded && (
        <div className="border-t border-surface-700/40 px-4 pb-4 pt-3 space-y-3">
          {channels.map((ch) => (
            <AmbientSoundChannel
              key={ch.id}
              icon={ch.icon}
              label={ch.label}
              active={ch.active}
              volume={ch.volume}
              onToggle={() => toggleChannel(ch.id)}
              onVolumeChange={(v) => setVolume(ch.id, v)}
            />
          ))}

          <div className="flex gap-2 pt-2">
            <Button size="xs" variant="ghost" onClick={stopAll} className="flex-1 rounded-lg border border-surface-700/30 bg-surface-800/40 hover:bg-warrior-500/10 hover:text-warrior-400 hover:border-warrior-500/20 transition-all">
              ⏹ Silence All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
