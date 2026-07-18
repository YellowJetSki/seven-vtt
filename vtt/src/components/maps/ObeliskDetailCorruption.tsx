/* ── Obelisk Detail: Corruption Section ────────────────────────
 * Extracted from ObeliskDetailPanel.tsx to maintain <150 line limit.
 * Provides corruption meter display, slider, numeric input, and
 * rate-based increment button.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { Obelisk } from "@/types/obelisks";
import { corruptionColor } from "@/types/obelisks";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskDetailCorruptionProps {
  obelisk: Obelisk;
  onSetCorruption: (id: string, level: number) => void;
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskDetailCorruption({
  obelisk,
  onSetCorruption,
}: ObeliskDetailCorruptionProps) {
  const [corruptionInput, setCorruptionInput] = useState(String(obelisk.corruption));
  const corrColor = corruptionColor(obelisk.corruption);

  const handleSliderChange = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setCorruptionInput(String(clamped));
    onSetCorruption(obelisk.id, clamped);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-wider text-surface-500">Corruption</p>
        <span className="text-xs font-bold" style={{ color: corrColor }}>
          {obelisk.corruption}%
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        value={obelisk.corruption}
        onChange={(e) => handleSliderChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-surface-700 cursor-pointer accent-current"
        style={{ accentColor: corrColor }}
      />

      {/* Controls row */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={corruptionInput}
          onChange={(e) => setCorruptionInput(e.target.value)}
          onBlur={() => handleSliderChange(Number(corruptionInput))}
          className="w-16 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-[10px] text-surface-200 text-center focus:border-accent-500 focus:outline-none"
        />
        <span className="text-[9px] text-surface-500">Rate: +{obelisk.corruptionRate}/session</span>
        <button
          onClick={() => handleSliderChange(Math.min(100, obelisk.corruption + obelisk.corruptionRate))}
          className="ml-auto rounded bg-warrior-500/20 px-2 py-1 text-[9px] text-warrior-300 hover:bg-warrior-500/30 transition-all"
        >
          +Rate
        </button>
      </div>
    </section>
  );
}
