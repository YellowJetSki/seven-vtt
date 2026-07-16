/* ── Ambient Sound Mixer ────────────────────────────────────────
 * A simple ambient sound player using Web Audio API oscillators
 * and noise generation. No external files needed — all sounds are
 * synthesized. Three channels: Rain, Wind, Fire.
 * ──────────────────────────────────────────────────────────────── */
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface SoundChannel {
  id: string;
  label: string;
  icon: string;
  volume: number;
  active: boolean;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  noiseNode: AudioBufferSourceNode | null;
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function AmbientSoundMixer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [channels, setChannels] = useState<SoundChannel[]>([
    { id: "rain", label: "Rain", icon: "🌧️", volume: 0.3, active: false, oscillator: null, gainNode: null, noiseNode: null },
    { id: "wind", label: "Wind", icon: "💨", volume: 0.2, active: false, oscillator: null, gainNode: null, noiseNode: null },
    { id: "fire", label: "Fire", icon: "🔥", volume: 0.25, active: false, oscillator: null, gainNode: null, noiseNode: null },
  ]);
  const [expanded, setExpanded] = useState(false);

  const getOrCreateContext = useCallback(() => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    return ctxRef.current;
  }, []);

  const startRain = useCallback((ctx: AudioContext) => {
    // Rain = filtered noise
    const gain = ctx.createGain();
    gain.gain.value = 0.3;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = createNoiseBuffer(ctx, 4);
    noiseSrc.loop = true;

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSrc.start();

    return { oscillator: null, gainNode: gain, noiseNode: noiseSrc };
  }, []);

  const startWind = useCallback((ctx: AudioContext) => {
    // Wind = high-passed noise + low oscillator
    const gain = ctx.createGain();
    gain.gain.value = 0.2;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 1000;

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = createNoiseBuffer(ctx, 4);
    noiseSrc.loop = true;

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSrc.start();

    return { oscillator: null, gainNode: gain, noiseNode: noiseSrc };
  }, []);

  const startFire = useCallback((ctx: AudioContext) => {
    // Fire = crackling noise with low oscillator
    const gain = ctx.createGain();
    gain.gain.value = 0.25;

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = createNoiseBuffer(ctx, 2);
    noiseSrc.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSrc.start();

    return { oscillator: null, gainNode: gain, noiseNode: noiseSrc };
  }, []);

  const toggleChannel = useCallback((channelId: string) => {
    const ctx = getOrCreateContext();

    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;

        if (ch.active) {
          // Stop
          try { ch.gainNode?.disconnect(); } catch {}
          try { ch.noiseNode?.stop(); } catch {}
          try { ch.oscillator?.stop(); } catch {}
          return { ...ch, active: false, oscillator: null, gainNode: null, noiseNode: null };
        }

        // Start
        let result: { oscillator: OscillatorNode | null; gainNode: GainNode | null; noiseNode: AudioBufferSourceNode | null };
        if (channelId === "rain") result = startRain(ctx);
        else if (channelId === "wind") result = startWind(ctx);
        else result = startFire(ctx);

        return { ...ch, active: true, ...result };
      })
    );
  }, [getOrCreateContext, startRain, startWind, startFire]);

  const setVolume = useCallback((channelId: string, volume: number) => {
    setChannels((prev) =>
      prev.map((ch) => {
        if (ch.id !== channelId) return ch;
        if (ch.gainNode) {
          ch.gainNode.gain.value = volume;
        }
        return { ...ch, volume };
      })
    );
  }, []);

  const stopAll = useCallback(() => {
    channels.forEach((ch) => {
      try { ch.gainNode?.disconnect(); } catch {}
      try { ch.noiseNode?.stop(); } catch {}
      try { ch.oscillator?.stop(); } catch {}
    });
    setChannels((prev) =>
      prev.map((ch) => ({ ...ch, active: false, oscillator: null, gainNode: null, noiseNode: null }))
    );
  }, [channels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channels.forEach((ch) => {
        try { ch.gainNode?.disconnect(); } catch {}
        try { ch.noiseNode?.stop(); } catch {}
        try { ch.oscillator?.stop(); } catch {}
      });
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
            <div key={ch.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
                    ch.active
                      ? "bg-accent-500/20 text-accent-300"
                      : "bg-surface-800 text-surface-400 hover:text-surface-200"
                  }`}
                >
                  <span>{ch.icon}</span>
                  <span>{ch.label}</span>
                  <span>{ch.active ? "🔊" : "🔇"}</span>
                </button>
                <span className="text-[10px] text-surface-500 w-8 text-right">
                  {Math.round(ch.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ch.volume}
                onChange={(e) => setVolume(ch.id, parseFloat(e.target.value))}
                className="w-full h-1.5 cursor-pointer accent-accent-500"
              />
            </div>
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
