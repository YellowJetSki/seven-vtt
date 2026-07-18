/* ══════════════════════════════════════════════════════════════
   XP Progress Bar — Pedal-Sheet Style
   Chunky XP bar with level progression, XP count, and
   "XP to next level" display. Matches pedal-sheet's XP row.
   ══════════════════════════════════════════════════════════════ */
import type { PlayerCharacter } from "@/types";

interface Props {
  character: PlayerCharacter;
}

const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000,
  305000, 355000,
];

export function XpBarPedal({ character }: Props) {
  const xp = character.experiencePoints ?? 0;
  const lvl = character.level;
  const currentThreshold = XP_THRESHOLDS[lvl - 1] || 0;
  const nextThreshold = XP_THRESHOLDS[lvl] || currentThreshold + 1000;
  const progress = nextThreshold > currentThreshold
    ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 0;
  const toNext = Math.max(0, nextThreshold - xp);

  return (
    <div className="pedal-card bg-surface-900 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="pedal-label flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          Experience
        </span>
        <div className="flex items-center gap-2">
          <button className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 px-1.5 py-0.5" aria-label="Decrease XP">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
          </button>
          <span className="text-sm font-black text-white pedal-text-shadow">{xp.toLocaleString()}</span>
          <button className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 px-1.5 py-0.5" aria-label="Increase XP">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="pedal-hp-bar h-4 mb-1.5">
        <div
          className="pedal-hp-fill"
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: "linear-gradient(90deg, #8b30ff, #3b82f6)",
            boxShadow: "0 0 8px rgba(139,48,255,0.3)",
          }}
        />
      </div>

      <div className="flex justify-between text-[9px]">
        <span className="text-surface-500 font-bold">Lv {lvl}</span>
        <span className="text-surface-400">{toNext > 0 ? `${toNext.toLocaleString()} XP to Lv ${lvl + 1}` : "Ready to level up! ⬆️"}</span>
      </div>
    </div>
  );
}
