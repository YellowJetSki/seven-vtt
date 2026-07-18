/* ── Ambient Sound Helpers ──────────────────────────────────────
 * AudioContext utilities and sound channel state management.
 * Extracted from AmbientSoundMixer.tsx to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

export interface SoundChannel {
  id: string;
  label: string;
  icon: string;
  volume: number;
  active: boolean;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  noiseNode: AudioBufferSourceNode | null;
}

export type SoundGenerator = {
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
  noiseNode: AudioBufferSourceNode | null;
};

/** Create a white noise buffer for a given duration */
export function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Create rain sound: low-pass filtered white noise */
export function createRainSound(ctx: AudioContext): SoundGenerator {
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
}

/** Create wind sound: high-passed noise */
export function createWindSound(ctx: AudioContext): SoundGenerator {
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
}

/** Create fire sound: band-passed noise (crackling) */
export function createFireSound(ctx: AudioContext): SoundGenerator {
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
}

/** Disconnect and stop all nodes in a sound generator */
export function stopChannelNodes(gen: SoundGenerator): void {
  try { gen.gainNode?.disconnect(); } catch { /* noop */ }
  try { gen.noiseNode?.stop(); } catch { /* noop */ }
  try { gen.oscillator?.stop(); } catch { /* noop */ }
}

/** Map channel ID to its sound creator function */
export function createChannelSound(ctx: AudioContext, channelId: string): SoundGenerator {
  switch (channelId) {
    case "rain": return createRainSound(ctx);
    case "wind": return createWindSound(ctx);
    case "fire": return createFireSound(ctx);
    default: return { oscillator: null, gainNode: null, noiseNode: null };
  }
}
