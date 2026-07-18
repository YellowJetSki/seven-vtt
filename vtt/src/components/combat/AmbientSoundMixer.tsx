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
    <div className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm text-surface-300 hover:text-surface-100 transition-colors"
      >
        <span>🎵 Ambient Sound</span>
        <span className="text-surface-500 text-xs">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
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

          <div className="flex gap-2 pt-1">
            <Button size="xs" variant="ghost" onClick={stopAll} className="flex-1">
              ⏹ Stop All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
