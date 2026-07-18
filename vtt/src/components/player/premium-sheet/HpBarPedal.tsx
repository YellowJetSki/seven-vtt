/* ══════════════════════════════════════════════════════════════
   HP Bar — Pedal-Sheet Style
   Chunky HP bar with inline +/- buttons, color-coded fill,
   temp HP overlay, and press-animated controls.
   ══════════════════════════════════════════════════════════════ */
import type { PlayerCharacter } from "@/types";
import { getThemeForClass } from "./character-theme";

interface Props {
  character: PlayerCharacter;
  hpPercent: number;
  onHpChange: (delta: number) => void;
}

export function HpBarPedal({ character, hpPercent, onHpChange }: Props) {
  const theme = getThemeForClass(character.classes?.[0]?.name || character.class || "");
  const barColor = hpPercent > 50 ? "#27ae60" : hpPercent > 25 ? "#f39c12" : "#e74c3c";
  const deadly = hpPercent <= 0;
  
  return (
    <div className="pedal-card bg-surface-900 p-3 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none opacity-20"
        style={{ background: theme.hexAccent }}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <span className="pedal-label flex items-center gap-1.5" style={{ color: theme.hexAccent }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          Hit Points
        </span>
        <div className="flex items-center gap-1">
          {/* Quick HP adjustments */}
          <button
            onClick={() => onHpChange(-5)}
            className="pedal-btn bg-warrior-600 text-slate-950 hover:bg-warrior-500 px-1.5 py-0.5 flex items-center gap-0.5 disabled:opacity-30"
            disabled={deadly}
            aria-label="Damage 5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
            5
          </button>
          <button
            onClick={() => onHpChange(-1)}
            className="pedal-btn bg-warrior-600 text-slate-950 hover:bg-warrior-500 px-1.5 py-0.5 disabled:opacity-30"
            disabled={deadly}
            aria-label="Damage 1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
          </button>
          <span className={`text-lg font-black px-2 ${deadly ? "text-warrior-500 animate-pulse" : "text-white"} pedal-text-shadow`}>
            {character.hitPoints.current}
            <span className="text-[10px] text-surface-500 font-bold"> / {character.hitPoints.max}</span>
          </span>
          <button
            onClick={() => onHpChange(1)}
            className="pedal-btn bg-rogue-600 text-slate-950 hover:bg-rogue-500 px-1.5 py-0.5 disabled:opacity-30"
            disabled={deadly}
            aria-label="Heal 1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
          </button>
          <button
            onClick={() => onHpChange(5)}
            className="pedal-btn bg-rogue-600 text-slate-950 hover:bg-rogue-500 px-1.5 py-0.5 disabled:opacity-30"
            disabled={deadly}
            aria-label="Heal 5"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
            5
          </button>
        </div>
      </div>

      {/* HP Bar */}
      <div className="pedal-hp-bar h-8 relative z-10">
        <div
          className="pedal-hp-fill"
          style={{
            width: `${Math.max(0, Math.min(100, hpPercent))}%`,
            background: `linear-gradient(90deg, ${barColor}, ${barColor}bb)`,
            boxShadow: `0 0 12px ${barColor}66`,
          }}
        />
        {/* Temp HP overlay */}
        {character.hitPoints.temporary > 0 && (
          <div
            className="absolute inset-y-0 right-0 rounded-lg"
            style={{
              width: `${Math.min(100, (character.hitPoints.temporary / character.hitPoints.max) * 100)}%`,
              background: "rgba(251,191,36,0.15)",
              borderLeft: "2px solid rgba(251,191,36,0.3)",
            }}
          />
        )}
        {/* Label on bar */}
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white/80 tracking-wider pedal-text-shadow">
          {deadly ? (
            character.hitPoints.current <= 0 ? "⚰️ DYING" : "💀 DEAD"
          ) : (
            `${character.hitPoints.current} / ${character.hitPoints.max} HP`
          )}
        </span>
      </div>
      
      {/* Temp HP indicator */}
      {character.hitPoints.temporary > 0 && (
        <div className="flex items-center justify-between mt-1.5 relative z-10">
          <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            Temp HP: +{character.hitPoints.temporary}
          </span>
        </div>
      )}
    </div>
  );
}
