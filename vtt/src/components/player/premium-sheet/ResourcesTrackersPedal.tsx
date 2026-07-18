/* ══════════════════════════════════════════════════════════════
   Resources & Trackers — Pedal-Sheet Style
   Dual-mode resource trackers: pool (numeric ±) and per-use
   (clickable dots). Mirrors DMPlayerCard's Resource system.
   ══════════════════════════════════════════════════════════════ */
import { getThemeForClass } from "./character-theme";

interface Props {
  resources: Array<{ name: string; current: number; max: number; isPool?: boolean; recharge?: string }>;
  className?: string;
}

export function ResourcesTrackersPedal({ resources, className = "" }: Props) {
  if (!resources || resources.length === 0) return null;

  return (
    <div className={`pedal-card bg-surface-900 p-3 ${className}`}>
      <span className="pedal-label flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        Resources
        <span className="text-surface-500 font-normal">({resources.length})</span>
      </span>
      <div className="space-y-2 max-h-48 overflow-y-auto pedal-scrollbar pr-1">
        {resources.map((res, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-surface-950 px-3 py-2 rounded-xl border-2 border-surface-900 shadow-inner"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate block">
                {res.name}
              </span>
              {res.recharge && (
                <span className="text-[7px] font-bold text-surface-500 uppercase tracking-wider">
                  {res.recharge === "short" ? "SR" : res.recharge === "long" ? "LR" : res.recharge}
                </span>
              )}
            </div>

            {res.isPool ? (
              /* Pool mode: numeric ± buttons */
              <div className="flex items-center gap-2">
                <button className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 w-6 h-6 flex items-center justify-center p-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                  </svg>
                </button>
                <span className="text-xs font-black text-accent-400 w-5 text-center">{res.current}</span>
                <button className="pedal-btn bg-surface-800 text-surface-300 hover:bg-surface-700 w-6 h-6 flex items-center justify-center p-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                  </svg>
                </button>
              </div>
            ) : (
              /* Per-use mode: clickable dots */
              <div className="flex gap-1">
                {Array.from({ length: res.max }).map((_, slotIdx) => (
                  <button
                    key={slotIdx}
                    className={`w-4 h-4 rounded-md border-2 border-surface-950 transition-all shadow-sm ${
                      slotIdx < res.current
                        ? "bg-accent-500 shadow-[0_0_4px_rgba(139,48,255,0.3)]"
                        : "bg-surface-900 hover:bg-surface-800"
                    }`}
                    aria-label={`${slotIdx < res.current ? "Deactivate" : "Activate"} ${res.name}`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
